from rest_framework import generics, status, permissions
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

from .models import UserAPIKey, UserFeedback
from issues.ai_client import PROVIDER_MODELS
from .serializers import (
    RegisterSerializer,
    UserSerializer,
    UpdateProfileSerializer,
    ChangePasswordSerializer,
    UserAPIKeySerializer,
    CreateUserAPIKeySerializer,
    UserFeedbackSerializer,
)


class RegisterView(generics.CreateAPIView):
    serializer_class = RegisterSerializer
    permission_classes = [permissions.AllowAny]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        from .oauth import _create_default_workspace
        _create_default_workspace(user)
        return Response(
            UserSerializer(user).data,
            status=status.HTTP_201_CREATED,
        )


class MeView(APIView):
    """GET current user / PUT to update profile + API keys."""

    def get(self, request):
        return Response(UserSerializer(request.user).data)

    def put(self, request):
        serializer = UpdateProfileSerializer(request.user, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(UserSerializer(request.user).data)


class ChangePasswordView(APIView):
    def post(self, request):
        serializer = ChangePasswordSerializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)
        request.user.set_password(serializer.validated_data["new_password"])
        request.user.save()
        return Response({"detail": "Password updated."})


class CustomTokenObtainPairView(TokenObtainPairView):
    permission_classes = [permissions.AllowAny]


class CustomTokenRefreshView(TokenRefreshView):
    permission_classes = [permissions.AllowAny]


class UserAPIKeyListCreateView(APIView):
    def get(self, request):
        keys = UserAPIKey.objects.filter(user=request.user).order_by("order", "created_at")
        return Response(UserAPIKeySerializer(keys, many=True).data)

    def post(self, request):
        serializer = CreateUserAPIKeySerializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)
        instance = serializer.save()
        return Response(UserAPIKeySerializer(instance).data, status=status.HTTP_201_CREATED)


class UserAPIKeyDetailView(APIView):
    def get_queryset(self):
        return UserAPIKey.objects.filter(user=self.request.user)

    def patch(self, request, pk):
        instance = self.get_queryset().filter(pk=pk).first()
        if not instance:
            return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)
        set_primary = request.data.get("set_primary")
        new_order = request.data.get("order")
        keys = list(self.get_queryset().order_by("order", "created_at"))
        if set_primary or new_order is not None:
            target = 0 if set_primary else max(0, min(int(new_order), len(keys) - 1))
            keys_no_self = [k for k in keys if k.pk != pk]
            keys_no_self.insert(target, instance)
            for i, k in enumerate(keys_no_self):
                k.order = i
                k.save()
        return Response(UserAPIKeySerializer(instance).data)

    def delete(self, request, pk):
        instance = self.get_queryset().filter(pk=pk).first()
        if not instance:
            return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)
        instance.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class ModelsCatalogView(APIView):
    """GET: Return AI model catalog per provider for model selection UI."""

    def get(self, request):
        choices = dict(UserAPIKey.Provider.choices)
        catalog = []
        for provider, models in PROVIDER_MODELS.items():
            catalog.append({
                "provider": provider,
                "provider_display": choices.get(provider, provider),
                "models": [{"id": m["id"], "name": m["name"], "tier": m["tier"]} for m in models],
            })
        return Response(catalog)


class FeedbackListCreateView(APIView):
    """GET: List all feedbacks (public). POST: Submit feedback (authenticated only)."""

    def get_permissions(self):
        if self.request.method == "GET":
            return [AllowAny()]
        return [IsAuthenticated()]

    def get(self, request):
        feedbacks = UserFeedback.objects.all().order_by("-created_at")
        return Response(UserFeedbackSerializer(feedbacks, many=True).data)

    def post(self, request):
        serializer = UserFeedbackSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        instance = UserFeedback.objects.create(
            user=request.user,
            rating=serializer.validated_data["rating"],
            review=serializer.validated_data.get("review", "") or "",
        )
        return Response(
            UserFeedbackSerializer(instance).data,
            status=status.HTTP_201_CREATED,
        )
