import uuid
from django.db import models
from workspaces.models import Workspace


class KnowledgeDocument(models.Model):
    class SourceType(models.TextChoices):
        UPLOAD = "upload"
        GITHUB_ISSUE = "github_issue"
        URL = "url"
        MANUAL = "manual"

    class ProcessingStatus(models.TextChoices):
        PENDING = "pending"
        PROCESSING = "processing"
        READY = "ready"
        FAILED = "failed"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    workspace = models.ForeignKey(Workspace, on_delete=models.CASCADE, related_name="documents")
    title = models.CharField(max_length=500)
    source_type = models.CharField(max_length=20, choices=SourceType.choices, default=SourceType.MANUAL)
    source_url = models.URLField(blank=True, default="")
    raw_content = models.TextField(blank=True, default="")
    processed_chunks = models.JSONField(default=list, blank=True)
    is_active = models.BooleanField(default=True)
    processing_status = models.CharField(
        max_length=20,
        choices=ProcessingStatus.choices,
        default=ProcessingStatus.PENDING,
    )
    char_count = models.PositiveIntegerField(default=0)
    chunk_count = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.title} ({self.workspace.name})"
