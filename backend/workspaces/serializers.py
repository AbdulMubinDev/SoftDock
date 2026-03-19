from rest_framework import serializers
from core.plans import get_plan_limits, is_workspace_count_at_limit
from .models import Workspace, WorkspaceMember


class WorkspaceSerializer(serializers.ModelSerializer):
    owner_email = serializers.EmailField(source="owner.email", read_only=True)
    member_count = serializers.SerializerMethodField()
    is_locked = serializers.SerializerMethodField()

    class Meta:
        model = Workspace
        fields = ("id", "name", "slug", "description", "owner_email", "member_count", "is_locked", "created_at", "updated_at")
        read_only_fields = ("id", "slug", "owner_email", "member_count", "is_locked", "created_at", "updated_at")

    def get_member_count(self, obj):
        return obj.members.count()

    def get_is_locked(self, obj):
        unlocked = self.context.get("unlocked_workspace_ids")
        if unlocked is None:
            return False
        return obj.id not in unlocked


class WorkspaceCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Workspace
        fields = ("name", "description")

    def create(self, validated_data):
        user = self.context["request"].user
        plan_name = getattr(user, "subscription_plan_name", None) or "Free"
        current_count = WorkspaceMember.objects.filter(user=user).values("workspace").distinct().count()
        if is_workspace_count_at_limit(plan_name, current_count):
            max_ws = get_plan_limits(plan_name)["max_workspaces"]
            raise serializers.ValidationError(
                {"detail": f"Your plan allows up to {max_ws} workspace(s). Upgrade to add more."}
            )
        workspace = Workspace.objects.create(owner=user, **validated_data)
        WorkspaceMember.objects.create(
            workspace=workspace,
            user=user,
            role=WorkspaceMember.Role.OWNER,
        )
        return workspace


class WorkspaceMemberSerializer(serializers.ModelSerializer):
    email = serializers.EmailField(source="user.email", read_only=True)
    full_name = serializers.CharField(source="user.full_name", read_only=True)

    class Meta:
        model = WorkspaceMember
        fields = ("id", "email", "full_name", "role", "joined_at")
        read_only_fields = ("id", "email", "full_name", "joined_at")
