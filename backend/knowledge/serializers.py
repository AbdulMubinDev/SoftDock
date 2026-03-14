from rest_framework import serializers
from .models import KnowledgeDocument


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

    def validate(self, data):
        if not data.get("raw_content") and not data.get("source_url"):
            raise serializers.ValidationError("Provide either raw_content or source_url.")
        return data
