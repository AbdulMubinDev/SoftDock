from rest_framework import generics, status, permissions
from rest_framework.response import Response

from .models import Workspace, WorkspaceMember
from .serializers import WorkspaceSerializer, WorkspaceCreateSerializer, WorkspaceMemberSerializer
from .permissions import IsWorkspaceOwner


class WorkspaceListCreateView(generics.ListCreateAPIView):
    """List workspaces the user belongs to, or create a new one."""

    def get_serializer_class(self):
        if self.request.method == "POST":
            return WorkspaceCreateSerializer
        return WorkspaceSerializer

    def get_queryset(self):
        return Workspace.objects.filter(members__user=self.request.user)


class WorkspaceDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = WorkspaceSerializer
    lookup_field = "slug"

    def get_queryset(self):
        return Workspace.objects.filter(members__user=self.request.user)

    def get_permissions(self):
        if self.request.method == "DELETE":
            return [permissions.IsAuthenticated(), IsWorkspaceOwner()]
        return [permissions.IsAuthenticated()]

    def perform_update(self, serializer):
        serializer.save()


class WorkspaceMemberListView(generics.ListAPIView):
    serializer_class = WorkspaceMemberSerializer

    def get_queryset(self):
        slug = self.kwargs["slug"]
        return WorkspaceMember.objects.filter(
            workspace__slug=slug,
            workspace__members__user=self.request.user,
        ).select_related("user")
