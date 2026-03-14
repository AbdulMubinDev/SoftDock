"""
OAuth 2.0 login views for Google and GitHub.

Flow:
1. User clicks "Continue with Google/GitHub" → GET /api/auth/{provider}/login/
2. Backend redirects to provider's OAuth consent screen
3. Provider redirects back to /api/auth/{provider}/callback/?code=...&state=...
4. Backend exchanges code for tokens, fetches user profile
5. Creates or finds user, issues JWT, redirects to frontend with tokens in hash
"""

import logging
import os
import secrets
from urllib.parse import urlencode

import httpx
from django.conf import settings
from django.contrib.auth import get_user_model
from django.http import HttpResponseRedirect
from django.utils.text import slugify
from rest_framework.permissions import AllowAny
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken

logger = logging.getLogger(__name__)
User = get_user_model()

FRONTEND_CALLBACK = f"{settings.FRONTEND_URL}/login/callback"

# ─── Google OAuth config ─────────────────────────────────────────────────────

GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth"
GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token"
GOOGLE_USERINFO_URL = "https://www.googleapis.com/oauth2/v2/userinfo"

# ─── GitHub OAuth config ─────────────────────────────────────────────────────

GITHUB_AUTH_URL = "https://github.com/login/oauth/authorize"
GITHUB_TOKEN_URL = "https://github.com/login/oauth/access_token"
GITHUB_USER_URL = "https://api.github.com/user"
GITHUB_EMAILS_URL = "https://api.github.com/user/emails"


def _build_callback_uri(provider: str) -> str:
    """Use BACKEND_URL from settings so the URI always matches what's in the OAuth console."""
    return f"{settings.BACKEND_URL}/api/auth/{provider}/callback/"


def _redirect_error(message: str) -> HttpResponseRedirect:
    return HttpResponseRedirect(f"{FRONTEND_CALLBACK}?error={message}")


def _issue_jwt_and_redirect(user) -> HttpResponseRedirect:
    refresh = RefreshToken.for_user(user)
    access = str(refresh.access_token)
    return HttpResponseRedirect(
        f"{FRONTEND_CALLBACK}#access_token={access}&refresh_token={str(refresh)}"
    )


def _get_or_create_user(email: str, full_name: str = ""):
    """Find existing user by email, or create a new one with unusable password."""
    user, created = User.objects.get_or_create(
        email=email,
        defaults={"full_name": full_name},
    )
    if created:
        user.set_unusable_password()
        user.save()
        _create_default_workspace(user)
    return user, created


def _create_default_workspace(user):
    """Create a starter workspace for a brand-new user."""
    from workspaces.models import Workspace, WorkspaceMember

    base_slug = slugify(user.full_name or user.email.split("@")[0]) or "my-project"
    slug = base_slug
    counter = 1
    while Workspace.objects.filter(slug=slug).exists():
        slug = f"{base_slug}-{counter}"
        counter += 1

    ws = Workspace.objects.create(name="My Project", slug=slug, owner=user)
    WorkspaceMember.objects.create(workspace=ws, user=user, role="owner")
    return ws


# ═════════════════════════════════════════════════════════════════════════════
#  Google
# ═════════════════════════════════════════════════════════════════════════════

class GoogleLoginView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        client_id = os.environ.get("GOOGLE_CLIENT_ID", "")
        if not client_id:
            return _redirect_error("google_not_configured")

        state = secrets.token_urlsafe(32)
        request.session["oauth_state"] = state

        params = {
            "client_id": client_id,
            "redirect_uri": _build_callback_uri("google"),
            "response_type": "code",
            "scope": "openid email profile",
            "access_type": "online",
            "state": state,
            "prompt": "select_account",
        }
        return HttpResponseRedirect(f"{GOOGLE_AUTH_URL}?{urlencode(params)}")


class GoogleCallbackView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        if request.query_params.get("error"):
            return _redirect_error(request.query_params["error"])

        code = request.query_params.get("code")
        state = request.query_params.get("state")
        if not code:
            return _redirect_error("no_code")

        expected_state = request.session.pop("oauth_state", None)
        if not expected_state or state != expected_state:
            logger.warning("OAuth state mismatch: expected=%s got=%s", expected_state, state)
            return _redirect_error("invalid_state")

        # Exchange authorization code for tokens
        try:
            resp = httpx.post(GOOGLE_TOKEN_URL, data={
                "code": code,
                "client_id": os.environ.get("GOOGLE_CLIENT_ID"),
                "client_secret": os.environ.get("GOOGLE_CLIENT_SECRET"),
                "redirect_uri": _build_callback_uri("google"),
                "grant_type": "authorization_code",
            }, timeout=15)
            resp.raise_for_status()
            tokens = resp.json()
        except Exception:
            logger.exception("Google token exchange failed")
            return _redirect_error("token_exchange_failed")

        # Fetch user profile
        try:
            resp = httpx.get(GOOGLE_USERINFO_URL, headers={
                "Authorization": f"Bearer {tokens['access_token']}",
            }, timeout=10)
            resp.raise_for_status()
            profile = resp.json()
        except Exception:
            logger.exception("Google user info fetch failed")
            return _redirect_error("userinfo_failed")

        email = profile.get("email")
        if not email:
            return _redirect_error("no_email")

        user, _ = _get_or_create_user(email, profile.get("name", ""))
        return _issue_jwt_and_redirect(user)


# ═════════════════════════════════════════════════════════════════════════════
#  GitHub
# ═════════════════════════════════════════════════════════════════════════════

class GithubLoginView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        client_id = os.environ.get("GITHUB_CLIENT_ID", "")
        if not client_id:
            return _redirect_error("github_not_configured")

        state = secrets.token_urlsafe(32)
        request.session["oauth_state"] = state

        params = {
            "client_id": client_id,
            "redirect_uri": _build_callback_uri("github"),
            "scope": "read:user user:email",
            "state": state,
        }
        return HttpResponseRedirect(f"{GITHUB_AUTH_URL}?{urlencode(params)}")


class GithubCallbackView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        if request.query_params.get("error"):
            return _redirect_error(request.query_params["error"])

        code = request.query_params.get("code")
        state = request.query_params.get("state")
        if not code:
            return _redirect_error("no_code")

        expected_state = request.session.pop("oauth_state", None)
        if not expected_state or state != expected_state:
            logger.warning("OAuth state mismatch: expected=%s got=%s", expected_state, state)
            return _redirect_error("invalid_state")

        # Exchange code for access token
        try:
            resp = httpx.post(GITHUB_TOKEN_URL, data={
                "client_id": os.environ.get("GITHUB_CLIENT_ID"),
                "client_secret": os.environ.get("GITHUB_CLIENT_SECRET"),
                "code": code,
                "redirect_uri": _build_callback_uri("github"),
            }, headers={
                "Accept": "application/json",
            }, timeout=15)
            resp.raise_for_status()
            tokens = resp.json()
        except Exception:
            logger.exception("GitHub token exchange failed")
            return _redirect_error("token_exchange_failed")

        access_token = tokens.get("access_token")
        if not access_token:
            return _redirect_error("no_access_token")

        gh_headers = {
            "Authorization": f"Bearer {access_token}",
            "Accept": "application/json",
        }

        # Fetch user profile
        try:
            resp = httpx.get(GITHUB_USER_URL, headers=gh_headers, timeout=10)
            resp.raise_for_status()
            profile = resp.json()
        except Exception:
            logger.exception("GitHub user info fetch failed")
            return _redirect_error("userinfo_failed")

        email = profile.get("email")

        # GitHub may hide the email — fetch from /user/emails endpoint
        if not email:
            try:
                resp = httpx.get(GITHUB_EMAILS_URL, headers=gh_headers, timeout=10)
                resp.raise_for_status()
                emails = resp.json()
                primary = next((e for e in emails if e.get("primary") and e.get("verified")), None)
                if primary:
                    email = primary["email"]
            except Exception:
                logger.exception("GitHub emails fetch failed")

        if not email:
            return _redirect_error("no_email")

        full_name = profile.get("name") or profile.get("login", "")
        user, _ = _get_or_create_user(email, full_name)
        return _issue_jwt_and_redirect(user)
