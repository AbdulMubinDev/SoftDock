from django.utils import timezone
from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.views import APIView

from workspaces.models import Workspace
from workspaces.permissions import IsWorkspaceMember
from .models import Issue, Message
from .serializers import (
    IssueSerializer,
    IssueDetailSerializer,
    IssueCreateSerializer,
    SendMessageSerializer,
    MessageSerializer,
)


class IssueListCreateView(generics.ListCreateAPIView):
    permission_classes = [IsWorkspaceMember]
    filterset_fields = ["status"]
    search_fields = ["title"]
    ordering_fields = ["created_at", "resolved_at"]

    def get_serializer_class(self):
        if self.request.method == "POST":
            return IssueCreateSerializer
        return IssueSerializer

    def get_queryset(self):
        return Issue.objects.filter(
            workspace__slug=self.kwargs["workspace_slug"],
        ).prefetch_related("messages")

    def perform_create(self, serializer):
        workspace = Workspace.objects.get(slug=self.kwargs["workspace_slug"])
        serializer.save(workspace=workspace, user=self.request.user)

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        return Response(
            IssueSerializer(serializer.instance).data,
            status=status.HTTP_201_CREATED,
        )


class IssueDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = IssueDetailSerializer
    permission_classes = [IsWorkspaceMember]
    lookup_field = "pk"

    def get_queryset(self):
        return Issue.objects.filter(
            workspace__slug=self.kwargs["workspace_slug"],
        ).prefetch_related("messages")

    def perform_update(self, serializer):
        instance = serializer.save()
        if instance.status == Issue.Status.RESOLVED and not instance.resolved_at:
            instance.resolved_at = timezone.now()
            instance.save(update_fields=["resolved_at"])


class SendMessageView(APIView):
    """
    POST a user message to an issue.
    The AI response is streamed via WebSocket (see streaming app).
    This endpoint saves the user message and returns it.
    """
    permission_classes = [IsWorkspaceMember]

    def post(self, request, workspace_slug, pk):
        try:
            issue = Issue.objects.get(pk=pk, workspace__slug=workspace_slug)
        except Issue.DoesNotExist:
            return Response({"detail": "Issue not found."}, status=status.HTTP_404_NOT_FOUND)

        serializer = SendMessageSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        # Auto-title from first message
        if not issue.title:
            issue.title = serializer.validated_data["content"][:120]
            issue.save(update_fields=["title"])

        msg = Message.objects.create(
            issue=issue,
            role=Message.Role.USER,
            content=serializer.validated_data["content"],
        )
        return Response(MessageSerializer(msg).data, status=status.HTTP_201_CREATED)
