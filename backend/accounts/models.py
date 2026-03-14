import uuid
from django.conf import settings
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from django.db import models

from .encryption import encrypt_value, decrypt_value


class UserAPIKey(models.Model):
    """Stored API keys with provider and priority. Keys are encrypted at rest."""

    class Provider(models.TextChoices):
        ANTHROPIC = "anthropic", "Anthropic (Claude)"
        OPENAI = "openai", "OpenAI (GPT)"
        GOOGLE = "google", "Google (Gemini / Vertex AI)"
        GROQ = "groq", "Groq"
        XAI = "xai", "xAI (Grok)"
        OPENROUTER = "openrouter", "OpenRouter"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="api_keys",
    )
    name = models.CharField(max_length=128)
    provider = models.CharField(max_length=32, choices=Provider.choices)
    _encrypted_key = models.TextField(db_column="encrypted_key")
    order = models.PositiveSmallIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["order", "created_at"]
        unique_together = [("user", "name")]

    def __str__(self):
        return f"{self.name} ({self.get_provider_display()})"

    @property
    def decrypted_key(self):
        return decrypt_value(self._encrypted_key) if self._encrypted_key else ""

    def set_key(self, value: str):
        self._encrypted_key = encrypt_value(value) if value else ""


class UserManager(BaseUserManager):
    def create_user(self, email, password=None, **extra):
        if not email:
            raise ValueError("Email is required")
        email = self.normalize_email(email)
        user = self.model(email=email, **extra)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra):
        extra.setdefault("is_staff", True)
        extra.setdefault("is_superuser", True)
        return self.create_user(email, password, **extra)


class User(AbstractBaseUser, PermissionsMixin):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    email = models.EmailField(unique=True, db_index=True)
    full_name = models.CharField(max_length=255, blank=True)
    bio = models.TextField(blank=True, default="", max_length=2000)
    email_notifications = models.BooleanField(default=True)
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)

    # BYOK — encrypted API keys
    _anthropic_api_key = models.TextField(blank=True, default="", db_column="anthropic_api_key")
    _openai_api_key = models.TextField(blank=True, default="", db_column="openai_api_key")

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    objects = UserManager()

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = []

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return self.email

    # Encrypted property helpers
    @property
    def anthropic_api_key(self):
        return decrypt_value(self._anthropic_api_key) if self._anthropic_api_key else ""

    @anthropic_api_key.setter
    def anthropic_api_key(self, value):
        self._anthropic_api_key = encrypt_value(value) if value else ""

    @property
    def openai_api_key(self):
        return decrypt_value(self._openai_api_key) if self._openai_api_key else ""

    @openai_api_key.setter
    def openai_api_key(self, value):
        self._openai_api_key = encrypt_value(value) if value else ""

    @property
    def has_anthropic_key(self):
        return bool(self._anthropic_api_key)

    @property
    def has_openai_key(self):
        return bool(self._openai_api_key)

    def get_ordered_api_keys(self):
        """Return UserAPIKey entries for this user, ordered by priority (primary first, then fallbacks)."""
        return list(self.api_keys.order_by("order", "created_at"))
