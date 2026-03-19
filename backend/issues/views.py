from pathlib import Path

from django.http import FileResponse
from django.utils import timezone
from rest_framework import generics, status
from rest_framework.exceptions import APIException, NotFound
from rest_framework.response import Response
from rest_framework.views import APIView

from core.plans import get_history_cutoff, has_attachments
from workspaces.models import Workspace, WorkspaceMember
from workspaces.permissions import IsWorkspaceMember
from .models import Issue, Message, MessageAttachment
from .serializers import (
    IssueSerializer,
    IssueDetailSerializer,
    IssueCreateSerializer,
    SendMessageSerializer,
    MessageSerializer,
)


import re as _re


def _is_code_or_data(line: str) -> bool:
    """Return True if a line looks like code, JSON, XML, or machine output."""
    s = line.strip()
    if not s:
        return True
    if s.startswith(("{", "[", "<", "(", "//", "#", "/*", "```")):
        return True
    bracket_count = s.count("{") + s.count("[") + s.count("(")
    if bracket_count > 2:
        return True
    if len(s) > 100:
        return True
    non_alpha = sum(1 for c in s if not c.isalpha() and c != " ")
    if len(s) > 10 and non_alpha / len(s) > 0.5:
        return True
    return False


def _suggest_issue_title(content: str, max_len: int = 80) -> str:
    """Extract the most meaningful natural-language line from the first message.
    Scans all lines (bottom-up) looking for a short, human-readable sentence
    like a question or description. Falls back to 'New issue'."""
    if not content or not content.strip():
        return "New issue"

    lines = [ln.strip() for ln in content.strip().splitlines() if ln.strip()]

    best = None
    for line in reversed(lines):
        if _is_code_or_data(line):
            continue
        best = line
        break

    if not best:
        for line in lines:
            if not _is_code_or_data(line):
                best = line
                break

    if not best:
        return "New issue"

    if len(best) > max_len:
        best = best[: max_len - 1] + "…"
    return best


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
        qs = Issue.objects.filter(
            workspace__slug=self.kwargs["workspace_slug"],
        ).prefetch_related("messages")
        plan_name = getattr(self.request.user, "subscription_plan_name", None) or "Free"
        cutoff = get_history_cutoff(plan_name)
        if cutoff is not None:
            qs = qs.filter(created_at__gte=cutoff)
        return qs

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
        qs = Issue.objects.filter(
            workspace__slug=self.kwargs["workspace_slug"],
        ).prefetch_related("messages", "messages__attachments")
        plan_name = getattr(self.request.user, "subscription_plan_name", None) or "Free"
        cutoff = get_history_cutoff(plan_name)
        if cutoff is not None:
            qs = qs.filter(created_at__gte=cutoff)
        return qs

    def perform_update(self, serializer):
        instance = serializer.save()
        if instance.status == Issue.Status.RESOLVED and not instance.resolved_at:
            instance.resolved_at = timezone.now()
            instance.save(update_fields=["resolved_at"])


class IssueTransferView(APIView):
    """POST with { workspace_slug: "target-slug" } to move issue to another workspace (user must be member)."""
    permission_classes = [IsWorkspaceMember]

    def post(self, request, workspace_slug, pk):
        try:
            issue = Issue.objects.get(pk=pk, workspace__slug=workspace_slug)
        except Issue.DoesNotExist:
            return Response({"detail": "Issue not found."}, status=status.HTTP_404_NOT_FOUND)

        target_slug = request.data.get("workspace_slug")
        if not target_slug or not isinstance(target_slug, str):
            return Response(
                {"detail": "workspace_slug is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        target_slug = target_slug.strip()
        if target_slug == workspace_slug:
            return Response(
                {"detail": "Issue is already in this workspace."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if not WorkspaceMember.objects.filter(
            workspace__slug=target_slug,
            user=request.user,
        ).exists():
            return Response(
                {"detail": "You are not a member of the target workspace."},
                status=status.HTTP_403_FORBIDDEN,
            )

        target = Workspace.objects.get(slug=target_slug)
        issue.workspace = target
        issue.save(update_fields=["workspace"])

        serializer = IssueDetailSerializer(issue)
        return Response({
            **serializer.data,
            "workspace_slug": target_slug,
            "workspace_name": target.name,
        }, status=status.HTTP_200_OK)


class SendMessageView(APIView):
    """
    POST a user message to an issue. Supports multipart with optional file attachments.
    The AI response is streamed via WebSocket (see streaming app).
    """
    permission_classes = [IsWorkspaceMember]

    def post(self, request, workspace_slug, pk):
        from .file_handling import (
            validate_and_save_attachment,
            MAX_ATTACHMENTS_PER_MESSAGE,
            MAX_TOTAL_ATTACHMENTS_BYTES,
        )

        try:
            issue = Issue.objects.get(pk=pk, workspace__slug=workspace_slug)
        except Issue.DoesNotExist:
            return Response({"detail": "Issue not found."}, status=status.HTTP_404_NOT_FOUND)

        plan_name = getattr(request.user, "subscription_plan_name", None) or "Free"
        cutoff = get_history_cutoff(plan_name)
        if cutoff is not None and issue.created_at < cutoff:
            return Response(
                {"detail": "This issue is outside your plan's history window. Upgrade to access older issues."},
                status=status.HTTP_404_NOT_FOUND,
            )

        try:
            serializer = SendMessageSerializer(data=request.data)
            serializer.is_valid(raise_exception=True)
            content = (serializer.validated_data.get("content") or "").strip()

            # Handle file attachments (multipart)
            files = request.FILES.getlist("files") if request.FILES else []
            if files and not has_attachments(plan_name):
                return Response(
                    {"detail": "File attachments are available on Pro and Founding Member plans. Upgrade to attach images and logs."},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            if not content and len(files) == 0:
                return Response(
                    {"detail": "Provide a message or at least one attachment."},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            if len(files) > MAX_ATTACHMENTS_PER_MESSAGE:
                return Response(
                    {"detail": f"Maximum {MAX_ATTACHMENTS_PER_MESSAGE} attachments per message."},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            total_size = sum(f.size for f in files)
            if total_size > MAX_TOTAL_ATTACHMENTS_BYTES:
                return Response(
                    {"detail": "Total attachment size exceeds 15 MB. Please attach fewer or smaller files."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            # Auto-title from first message (avoid using JSON/code as title)
            if not issue.title:
                issue.title = _suggest_issue_title(content) if content else "Attachment"
                issue.save(update_fields=["title"])

            msg = Message.objects.create(
                issue=issue,
                role=Message.Role.USER,
                content=content or "",
            )

            for uploaded in files:
                att, err = validate_and_save_attachment(uploaded, msg)
                if err:
                    msg.delete()
                    return Response({"detail": err}, status=status.HTTP_400_BAD_REQUEST)

            return Response(MessageSerializer(msg).data, status=status.HTTP_201_CREATED)
        except APIException:
            raise
        except Exception:
            return Response(
                {"detail": "Something went wrong. Please try again."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


class AttachmentServeView(APIView):
    """Serve an attachment file for display in chat (e.g. image thumbnails). Permission: workspace member."""
    permission_classes = [IsWorkspaceMember]

    def get(self, request, workspace_slug, pk, attachment_id):
        try:
            issue = Issue.objects.get(pk=pk, workspace__slug=workspace_slug)
        except Issue.DoesNotExist:
            raise NotFound("Issue not found.")
        try:
            att = MessageAttachment.objects.select_related("message").get(
                id=attachment_id,
                message__issue_id=issue.id,
            )
        except MessageAttachment.DoesNotExist:
            raise NotFound("Attachment not found.")

        from .file_handling import _get_attachment_path
        path = _get_attachment_path(att)
        if not path or not path.exists():
            raise NotFound("File not found.")

        response = FileResponse(
            open(path, "rb"),
            content_type=att.content_type or "application/octet-stream",
            as_attachment=False,
        )
        # Safe filename for download fallback
        from urllib.parse import quote
        response["Content-Disposition"] = f'inline; filename="{quote(att.original_name)}"'
        return response
