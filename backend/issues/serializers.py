from rest_framework import serializers
from .models import Issue, Message


class MessageSerializer(serializers.ModelSerializer):
    class Meta:
        model = Message
        fields = ("id", "role", "content", "tokens_used", "created_at")
        read_only_fields = ("id", "role", "tokens_used", "created_at")


class IssueSerializer(serializers.ModelSerializer):
    message_count = serializers.SerializerMethodField()
    last_message_at = serializers.SerializerMethodField()

    class Meta:
        model = Issue
        fields = ("id", "title", "status", "message_count", "last_message_at", "created_at", "resolved_at")
        read_only_fields = ("id", "created_at")

    def get_message_count(self, obj):
        return obj.messages.count()

    def get_last_message_at(self, obj):
        last = obj.messages.order_by("-created_at").first()
        return last.created_at if last else None


class IssueDetailSerializer(IssueSerializer):
    messages = MessageSerializer(many=True, read_only=True)

    class Meta(IssueSerializer.Meta):
        fields = IssueSerializer.Meta.fields + ("messages",)


class IssueCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Issue
        fields = ("title",)


class SendMessageSerializer(serializers.Serializer):
    content = serializers.CharField(min_length=1, max_length=20000)
