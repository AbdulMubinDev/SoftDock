from django.urls import path
from .views import (
    RegisterView,
    MeView,
    ChangePasswordView,
    CustomTokenObtainPairView,
    CustomTokenRefreshView,
    UserAPIKeyListCreateView,
    UserAPIKeyDetailView,
    ModelsCatalogView,
    FeedbackListCreateView,
)
from .oauth import (
    GoogleLoginView,
    GoogleCallbackView,
    GithubLoginView,
    GithubCallbackView,
)

urlpatterns = [
    path("register/", RegisterView.as_view(), name="register"),
    path("login/", CustomTokenObtainPairView.as_view(), name="login"),
    path("token/refresh/", CustomTokenRefreshView.as_view(), name="token_refresh"),
    path("me/", MeView.as_view(), name="me"),
    path("change-password/", ChangePasswordView.as_view(), name="change_password"),
    path("api-keys/", UserAPIKeyListCreateView.as_view(), name="api_key_list_create"),
    path("api-keys/<uuid:pk>/", UserAPIKeyDetailView.as_view(), name="api_key_detail"),
    path("models/", ModelsCatalogView.as_view(), name="models_catalog"),
    path("feedback/", FeedbackListCreateView.as_view(), name="feedback_list_create"),
    # OAuth
    path("google/login/", GoogleLoginView.as_view(), name="google_login"),
    path("google/callback/", GoogleCallbackView.as_view(), name="google_callback"),
    path("github/login/", GithubLoginView.as_view(), name="github_login"),
    path("github/callback/", GithubCallbackView.as_view(), name="github_callback"),
]
