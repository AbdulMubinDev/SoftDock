from django.contrib import admin
from .models import Issue, Message


class MessageInline(admin.TabularInline):
    model = Message
    extra = 0
    readonly_fields = ("role", "content", "tokens_used", "created_at")


@admin.register(Issue)
class IssueAdmin(admin.ModelAdmin):
    list_display = ("title", "workspace", "user", "status", "created_at", "resolved_at")
    list_filter = ("status",)
    search_fields = ("title",)
    inlines = [MessageInline]
