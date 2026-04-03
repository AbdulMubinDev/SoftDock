from rest_framework import serializers

from .models import KnowledgeDocument
from .url_validation import is_safe_http_url_for_fetch


class KnowledgeDocumentSerializer(serializers.ModelSerializer):
    class Meta:
        model = KnowledgeDocument
        fields = (
            "id", "title", "source_type", "source_url",
            "is_active", "processing_status", "char_count", "chunk_count",
            "created_at", "updated_at",
        )
        read_only_fields = ("id", "processing_status", "char_count", "chunk_count", "created_at", "updated_at")


class KnowledgeDocumentCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = KnowledgeDocument
        fields = ("title", "source_type", "source_url", "raw_content")

    def validate_source_url(self, value):
        if not (value or "").strip():
            return value
        url = value.strip()
        if not is_safe_http_url_for_fetch(url):
            raise serializers.ValidationError(
                "URL must be public http(s); private networks, localhost, and internal hosts are not allowed."
            )
        return url

    def validate(self, data):
        if not data.get("raw_content") and not data.get("source_url"):
            raise serializers.ValidationError("Provide either raw_content or source_url.")
        return data
