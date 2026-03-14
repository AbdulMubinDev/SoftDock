from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from django.db.models import Max

from .models import UserAPIKey

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

    class Meta:
        model = User
        fields = ("id", "email", "full_name", "bio", "email_notifications", "has_anthropic_key", "has_openai_key", "created_at")
        read_only_fields = ("id", "email", "created_at")


class UpdateProfileSerializer(serializers.ModelSerializer):
    anthropic_api_key = serializers.CharField(write_only=True, required=False, allow_blank=True)
    openai_api_key = serializers.CharField(write_only=True, required=False, allow_blank=True)
    has_anthropic_key = serializers.BooleanField(read_only=True)
    has_openai_key = serializers.BooleanField(read_only=True)

    class Meta:
        model = User
        fields = ("full_name", "bio", "email_notifications", "anthropic_api_key", "openai_api_key", "has_anthropic_key", "has_openai_key")

    def update(self, instance, validated_data):
        if "anthropic_api_key" in validated_data:
            instance.anthropic_api_key = validated_data.pop("anthropic_api_key")
        if "openai_api_key" in validated_data:
            instance.openai_api_key = validated_data.pop("openai_api_key")
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
