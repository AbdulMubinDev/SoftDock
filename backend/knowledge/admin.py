from django.contrib import admin
from .models import KnowledgeDocument


@admin.register(KnowledgeDocument)
class KnowledgeDocumentAdmin(admin.ModelAdmin):
    list_display = ("title", "workspace", "source_type", "processing_status", "chunk_count", "is_active", "created_at")
    list_filter = ("source_type", "processing_status", "is_active")
    search_fields = ("title",)
