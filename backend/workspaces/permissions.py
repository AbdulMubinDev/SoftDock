from rest_framework import permissions

from core.plans import is_workspace_locked
from .models import WorkspaceMember


class IsWorkspaceMember(permissions.BasePermission):
    """Allow access only if the user is a member and the workspace is unlocked for their plan."""

    def has_permission(self, request, view):
        slug = view.kwargs.get("workspace_slug") or view.kwargs.get("slug")
        if not slug:
            return False
        row = WorkspaceMember.objects.filter(
            workspace__slug=slug,
            user=request.user,
        ).values_list("workspace_id", flat=True).first()
        if row is None:
            return False
        if is_workspace_locked(request.user, row):
            return False
        return True


class IsWorkspaceOwner(permissions.BasePermission):
    """Allow destructive ops only for workspace owner."""

    def has_object_permission(self, request, view, obj):
        return obj.owner == request.user
