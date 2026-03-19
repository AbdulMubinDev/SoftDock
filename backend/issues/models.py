import uuid
from django.conf import settings
from django.db import models
from workspaces.models import Workspace


class Issue(models.Model):
    class Status(models.TextChoices):
        OPEN = "open"
        RESOLVED = "resolved"
        ARCHIVED = "archived"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    workspace = models.ForeignKey(Workspace, on_delete=models.CASCADE, related_name="issues")
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="issues")
    title = models.CharField(max_length=500, blank=True)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.OPEN)
    created_at = models.DateTimeField(auto_now_add=True)
    resolved_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return self.title or f"Issue {str(self.id)[:8]}"


class Message(models.Model):
    class Role(models.TextChoices):
        USER = "user"
        ASSISTANT = "assistant"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    issue = models.ForeignKey(Issue, on_delete=models.CASCADE, related_name="messages")
    role = models.CharField(max_length=20, choices=Role.choices)
    content = models.TextField()
    tokens_used = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["created_at"]

    def __str__(self):
        return f"[{self.role}] {self.content[:80]}"


class MessageAttachment(models.Model):
    """Stores file attachments for user messages. Files are treated as read-only data, never executed."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    message = models.ForeignKey(Message, on_delete=models.CASCADE, related_name="attachments")
    file = models.FileField(upload_to="attachments/%Y/%m/%d/", max_length=500, blank=True)
    file_path = models.CharField(max_length=500, blank=True)  # custom storage path under MEDIA_ROOT
    original_name = models.CharField(max_length=255)
    content_type = models.CharField(max_length=100)
    file_size = models.PositiveIntegerField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["created_at"]

    def __str__(self):
        return f"{self.original_name} ({self.message_id})"
