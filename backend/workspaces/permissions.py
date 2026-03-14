from rest_framework import permissions
from .models import WorkspaceMember


class IsWorkspaceMember(permissions.BasePermission):
    """Allow access only if the user is a member (or owner) of the workspace."""

    def has_permission(self, request, view):
        slug = view.kwargs.get("workspace_slug") or view.kwargs.get("slug")
        if not slug:
            return False
        return WorkspaceMember.objects.filter(
            workspace__slug=slug,
            user=request.user,
        ).exists()


class IsWorkspaceOwner(permissions.BasePermission):
    """Allow destructive ops only for workspace owner."""

    def has_object_permission(self, request, view, obj):
        return obj.owner == request.user
