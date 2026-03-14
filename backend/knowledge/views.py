from rest_framework import generics, status
from rest_framework.response import Response

from workspaces.models import Workspace
from workspaces.permissions import IsWorkspaceMember
from .models import KnowledgeDocument
from .serializers import KnowledgeDocumentSerializer, KnowledgeDocumentCreateSerializer
from .tasks import process_document


class KnowledgeListCreateView(generics.ListCreateAPIView):
    permission_classes = [IsWorkspaceMember]

    def get_serializer_class(self):
        if self.request.method == "POST":
            return KnowledgeDocumentCreateSerializer
        return KnowledgeDocumentSerializer

    def get_queryset(self):
        return KnowledgeDocument.objects.filter(workspace__slug=self.kwargs["workspace_slug"])

    def perform_create(self, serializer):
        workspace = Workspace.objects.get(slug=self.kwargs["workspace_slug"])
        doc = serializer.save(workspace=workspace)
        process_document.delay(str(doc.id))


class KnowledgeDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = KnowledgeDocumentSerializer
    permission_classes = [IsWorkspaceMember]
    lookup_field = "pk"

    def get_queryset(self):
        return KnowledgeDocument.objects.filter(workspace__slug=self.kwargs["workspace_slug"])

    def perform_update(self, serializer):
        doc = serializer.save()
        if "raw_content" in self.request.data:
            doc.processing_status = KnowledgeDocument.ProcessingStatus.PENDING
            doc.save(update_fields=["processing_status"])
            process_document.delay(str(doc.id))
