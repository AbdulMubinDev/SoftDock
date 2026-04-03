from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from django.db.models import Max

from .models import UserAPIKey, UserFeedback

User = get_user_model()


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8, validators=[validate_password])

    class Meta:
        model = User
        fields = ("email", "password", "full_name")

    def create(self, validated_data):
        return User.objects.create_user(**validated_data)


class UserSerializer(serializers.ModelSerializer):
    has_anthropic_key = serializers.BooleanField(read_only=True)
    has_openai_key = serializers.BooleanField(read_only=True)
    preferred_ai_model_display = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = User
        fields = ("id", "email", "full_name", "bio", "email_notifications", "subscription_plan_name", "preferred_ai_provider", "preferred_ai_model_id", "preferred_ai_model_display", "has_anthropic_key", "has_openai_key", "created_at")
        read_only_fields = ("id", "email", "created_at")

    def get_preferred_ai_model_display(self, obj):
        from issues.ai_client import PROVIDER_MODELS
        provider = (obj.preferred_ai_provider or "").strip()
        model_id = (obj.preferred_ai_model_id or "").strip()
        if not provider or not model_id or provider not in PROVIDER_MODELS:
            return None
        for m in PROVIDER_MODELS[provider]:
            if m["id"] == model_id:
                return m["name"]
        return None


class UpdateProfileSerializer(serializers.ModelSerializer):
    anthropic_api_key = serializers.CharField(write_only=True, required=False, allow_blank=True)
    openai_api_key = serializers.CharField(write_only=True, required=False, allow_blank=True)
    has_anthropic_key = serializers.BooleanField(read_only=True)
    has_openai_key = serializers.BooleanField(read_only=True)

    class Meta:
        model = User
        fields = ("full_name", "bio", "email_notifications", "preferred_ai_provider", "preferred_ai_model_id", "anthropic_api_key", "openai_api_key", "has_anthropic_key", "has_openai_key")

    def validate_preferred_ai_model_id(self, value):
        from issues.ai_client import PROVIDER_MODELS
        provider = self.initial_data.get("preferred_ai_provider") or self.instance.preferred_ai_provider if self.instance else None
        if not value or not provider:
            return value or ""
        if provider not in PROVIDER_MODELS:
            return value
        valid_ids = [m["id"] for m in PROVIDER_MODELS[provider]]
        if value not in valid_ids:
            raise serializers.ValidationError(f"Model not in catalog for provider {provider}.")
        return value

    def validate_preferred_ai_provider(self, value):
        if not value:
            return ""
        from .models import UserAPIKey
        from core.plans import can_use_provider

        if value not in dict(UserAPIKey.Provider.choices):
            raise serializers.ValidationError(f"Unknown provider: {value}.")
        user = self.instance
        plan = getattr(user, "subscription_plan_name", None) or "Free"
        if not can_use_provider(plan, value):
            raise serializers.ValidationError(
                f"Your current plan ({plan}) only supports Anthropic and OpenAI. "
                "Upgrade to Pro or Founding Member to select other providers."
            )
        return value

    def update(self, instance, validated_data):
        if "anthropic_api_key" in validated_data:
            instance.anthropic_api_key = validated_data.pop("anthropic_api_key")
        if "openai_api_key" in validated_data:
            instance.openai_api_key = validated_data.pop("openai_api_key")
        if "preferred_ai_provider" in validated_data and not validated_data.get("preferred_ai_provider"):
            validated_data["preferred_ai_model_id"] = ""
        if "preferred_ai_provider" in validated_data and validated_data.get("preferred_ai_provider") and not validated_data.get("preferred_ai_model_id"):
            validated_data["preferred_ai_model_id"] = ""
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        return instance


class ChangePasswordSerializer(serializers.Serializer):
    old_password = serializers.CharField(required=True)
    new_password = serializers.CharField(required=True, min_length=8, validators=[validate_password])

    def validate_old_password(self, value):
        if not self.context["request"].user.check_password(value):
            raise serializers.ValidationError("Current password is incorrect.")
        return value


class UserAPIKeySerializer(serializers.ModelSerializer):
    provider_display = serializers.CharField(source="get_provider_display", read_only=True)

    class Meta:
        model = UserAPIKey
        fields = ("id", "name", "provider", "provider_display", "order", "created_at")
        read_only_fields = ("id", "order", "created_at")


class CreateUserAPIKeySerializer(serializers.ModelSerializer):
    api_key = serializers.CharField(write_only=True, min_length=1)

    class Meta:
        model = UserAPIKey
        fields = ("name", "provider", "api_key")

    def validate(self, attrs):
        from core.plans import can_use_provider

        user = self.context["request"].user
        plan = getattr(user, "subscription_plan_name", None) or "Free"
        provider = attrs.get("provider")
        if provider and not can_use_provider(plan, provider):
            raise serializers.ValidationError(
                {
                    "provider": [
                        f"Your current plan ({plan}) only supports API keys for Anthropic and OpenAI. "
                        "Upgrade to Pro or Founding Member to use Groq, Google, xAI, OpenRouter, and other providers."
                    ]
                }
            )
        return attrs

    def create(self, validated_data):
        api_key = validated_data.pop("api_key")
        user = self.context["request"].user
        max_order = (
            UserAPIKey.objects.filter(user=user).aggregate(max_order=Max("order"))["max_order"]
            or -1
        )
        instance = UserAPIKey.objects.create(
            user=user,
            order=max_order + 1,
            **validated_data,
        )
        instance.set_key(api_key)
        instance.save()
        return instance


class UserFeedbackSerializer(serializers.ModelSerializer):
    user_display_name = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = UserFeedback
        fields = ("id", "rating", "review", "created_at", "user_display_name")
        read_only_fields = ("id", "created_at", "user_display_name")

    def get_user_display_name(self, obj):
        name = (obj.user.full_name or "").strip()
        return name if name else "User"

    def validate_rating(self, value):
        if value < 1 or value > 5:
            raise serializers.ValidationError("Rating must be between 1 and 5.")
        return value

    def validate_review(self, value):
        if value and len(value) > 5000:
            raise serializers.ValidationError("Review must be at most 5000 characters.")
        return (value or "").strip()
