from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import User, UserFeedback


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    list_display = ("email", "full_name", "is_staff", "created_at")
    search_fields = ("email", "full_name")
    ordering = ("-created_at",)
    fieldsets = (
        (None, {"fields": ("email", "password")}),
        ("Profile", {"fields": ("full_name",)}),
        ("Permissions", {"fields": ("is_active", "is_staff", "is_superuser", "groups", "user_permissions")}),
    )
    add_fieldsets = (
        (None, {"classes": ("wide",), "fields": ("email", "password1", "password2")}),
    )


@admin.register(UserFeedback)
class UserFeedbackAdmin(admin.ModelAdmin):
    list_display = ("user", "rating", "created_at")
    list_filter = ("rating", "created_at")
    search_fields = ("user__email", "review")
    readonly_fields = ("id", "created_at")
