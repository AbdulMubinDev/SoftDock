import os
from pathlib import Path
from datetime import timedelta
from urllib.parse import urlparse, unquote

from dotenv import load_dotenv

load_dotenv()

BASE_DIR = Path(__file__).resolve().parent.parent

SECRET_KEY = os.getenv("SECRET_KEY", "insecure-dev-key-change-me")
DEBUG = os.getenv("DEBUG", "True").lower() in ("true", "1", "yes")
ALLOWED_HOSTS = [h.strip() for h in os.getenv("ALLOWED_HOSTS", "localhost,127.0.0.1").split(",") if h.strip()]

FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")
BACKEND_URL = os.getenv("BACKEND_URL", "http://localhost:8000")

INSTALLED_APPS = [
    "daphne",
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    # Third-party
    "rest_framework",
    "rest_framework_simplejwt",
    "corsheaders",
    "django_filters",
    # Local apps
    "accounts",
    "workspaces",
    "knowledge",
    "issues",
    "streaming",
]

MIDDLEWARE = [
    "corsheaders.middleware.CorsMiddleware",
    "django.middleware.security.SecurityMiddleware",
    "whitenoise.middleware.WhiteNoiseMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]

ROOT_URLCONF = "core.urls"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.debug",
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]

WSGI_APPLICATION = "core.wsgi.application"
ASGI_APPLICATION = "core.asgi.application"

# Database — PostgreSQL in production, SQLite fallback for local dev
DATABASE_URL = os.getenv("DATABASE_URL", "")
if DATABASE_URL:
    parsed = urlparse(DATABASE_URL)
    if parsed.scheme in ("postgres", "postgresql"):
        path = (parsed.path or "").lstrip("/")
        db_name = path.split("?")[0] if path else ""
        DATABASES = {
            "default": {
                "ENGINE": "django.db.backends.postgresql",
                "NAME": unquote(db_name),
                "USER": unquote(parsed.username) if parsed.username else "",
                "PASSWORD": unquote(parsed.password) if parsed.password else "",
                "HOST": parsed.hostname or "",
                "PORT": str(parsed.port or 5432),
            }
        }
    else:
        DATABASES = {"default": {"ENGINE": "django.db.backends.sqlite3", "NAME": BASE_DIR / "db.sqlite3"}}
else:
    DATABASES = {"default": {"ENGINE": "django.db.backends.sqlite3", "NAME": BASE_DIR / "db.sqlite3"}}

AUTH_USER_MODEL = "accounts.User"

AUTH_PASSWORD_VALIDATORS = [
    {"NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator"},
    {"NAME": "django.contrib.auth.password_validation.MinimumLengthValidator"},
    {"NAME": "django.contrib.auth.password_validation.CommonPasswordValidator"},
    {"NAME": "django.contrib.auth.password_validation.NumericPasswordValidator"},
]

LANGUAGE_CODE = "en-us"
TIME_ZONE = "UTC"
USE_I18N = True
USE_TZ = True

STATIC_URL = "static/"
STATIC_ROOT = BASE_DIR / "staticfiles"

MEDIA_URL = "media/"
MEDIA_ROOT = BASE_DIR / "media"

DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

# REST Framework
REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": (
        "rest_framework_simplejwt.authentication.JWTAuthentication",
    ),
    "DEFAULT_PERMISSION_CLASSES": (
        "rest_framework.permissions.IsAuthenticated",
    ),
    "DEFAULT_PAGINATION_CLASS": "rest_framework.pagination.PageNumberPagination",
    "PAGE_SIZE": 25,
    "DEFAULT_FILTER_BACKENDS": (
        "django_filters.rest_framework.DjangoFilterBackend",
        "rest_framework.filters.SearchFilter",
        "rest_framework.filters.OrderingFilter",
    ),
}

# JWT — access token short-lived; refresh token keeps user logged in for 30 days unless they logout
SIMPLE_JWT = {
    "ACCESS_TOKEN_LIFETIME": timedelta(minutes=30),
    "REFRESH_TOKEN_LIFETIME": timedelta(days=30),
    "ROTATE_REFRESH_TOKENS": True,
    "BLACKLIST_AFTER_ROTATION": False,
    "AUTH_HEADER_TYPES": ("Bearer",),
}

# CORS — comma-separated list, or single FRONTEND_URL
_cors_raw = os.getenv("CORS_ALLOWED_ORIGINS", "").strip()
if _cors_raw:
    CORS_ALLOWED_ORIGINS = [o.strip().rstrip("/") for o in _cors_raw.split(",") if o.strip()]
else:
    CORS_ALLOWED_ORIGINS = [FRONTEND_URL.rstrip("/")]
CORS_ALLOW_CREDENTIALS = True
if DEBUG:
    CORS_ALLOW_ALL_ORIGINS = True

# HTTPS / cookies (when DEBUG=False; place behind TLS-terminating reverse proxy)
if not DEBUG:
    SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")
    SECURE_SSL_REDIRECT = os.getenv("SECURE_SSL_REDIRECT", "true").lower() in ("true", "1", "yes")
    SESSION_COOKIE_SECURE = True
    CSRF_COOKIE_SECURE = True
    SECURE_BROWSER_XSS_FILTER = True
    SECURE_CONTENT_TYPE_NOSNIFF = True
    X_FRAME_OPTIONS = "DENY"
CSRF_TRUSTED_ORIGINS = list(CORS_ALLOWED_ORIGINS)

# Channels — prefer Redis, fall back to in-memory if Redis is unreachable
REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")


def _redis_is_reachable(url: str) -> bool:
    try:
        import redis as _redis
        conn = _redis.Redis.from_url(url, socket_connect_timeout=1)
        conn.ping()
        conn.close()
        return True
    except Exception:
        return False


_use_redis_channels = os.getenv("USE_REDIS_CHANNELS", "").lower() in ("true", "1", "yes")
if _use_redis_channels or _redis_is_reachable(REDIS_URL):
    CHANNEL_LAYERS = {
        "default": {
            "BACKEND": "channels_redis.core.RedisChannelLayer",
            "CONFIG": {"hosts": [REDIS_URL]},
        }
    }
    _channel_backend = "Redis"
else:
    CHANNEL_LAYERS = {
        "default": {
            "BACKEND": "channels.layers.InMemoryChannelLayer",
        }
    }
    _channel_backend = "InMemory (Redis unavailable)"

import logging as _logging
_logging.getLogger("django").info("Channel layer: %s", _channel_backend)

# Celery
CELERY_BROKER_URL = REDIS_URL
CELERY_RESULT_BACKEND = REDIS_URL
CELERY_ACCEPT_CONTENT = ["json"]
CELERY_TASK_SERIALIZER = "json"
CELERY_RESULT_SERIALIZER = "json"
CELERY_TIMEZONE = "UTC"

# Encryption key for BYOK (user API keys)
ENCRYPTION_KEY = os.getenv("ENCRYPTION_KEY", "")

# Fail fast on unsafe production configuration
if not DEBUG:
    from django.core.exceptions import ImproperlyConfigured

    if not SECRET_KEY or SECRET_KEY == "insecure-dev-key-change-me":
        raise ImproperlyConfigured(
            "Set a strong, unique SECRET_KEY in the environment when DEBUG is False."
        )
    if not ENCRYPTION_KEY:
        raise ImproperlyConfigured(
            "ENCRYPTION_KEY is required when DEBUG is False (required for encrypted API keys)."
        )
