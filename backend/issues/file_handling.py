"""
Secure attachment handling for chat messages.

- Only whitelisted MIME types (images + safe text formats).
- Never execute; treat all content as data, not code.
- Store files outside web root, sanitize filenames.
"""

import base64
import os
import re
import uuid
from pathlib import Path

from django.conf import settings
from django.core.files.uploadedfile import UploadedFile

# Limits
MAX_ATTACHMENTS_PER_MESSAGE = 5
MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024  # 5 MB
MAX_TOTAL_ATTACHMENTS_BYTES = 15 * 1024 * 1024  # 15 MB
MAX_TEXT_ATTACHMENT_CHARS = 100_000  # truncate text files

# Safe MIME types (images for screenshots, text for logs)
ALLOWED_MIME_TYPES = frozenset({
    "image/png",
    "image/jpeg",
    "image/gif",
    "image/webp",
    "text/plain",
    "text/x-log",
    "application/json",
    "text/json",
    "application/xml",
    "text/xml",
})

# Blocked extensions (double-check; MIME is primary)
BLOCKED_EXTENSIONS = frozenset({
    "exe", "bat", "cmd", "sh", "bash", "ps1", "psm1",
    "py", "pyw", "pyc", "js", "ts", "mjs", "cjs",
    "php", "rb", "pl", "vbs", "wsf", "jar", "dll",
    "so", "dylib", "bin", "app", "deb", "rpm", "msi",
})

# Log/file extensions allowed with application/octet-stream (browsers often send this for .evtx, .cvtx, etc.)
SAFE_LOG_EXTENSIONS = frozenset({"evtx", "cvtx", "etl", "log", "txt"})

# MIME → safe read (text files get content extracted)
TEXT_MIME_PREFIXES = ("text/", "application/json", "text/json", "application/xml", "text/xml")

# Magic bytes for allowed image types (imghdr was removed in Python 3.13)
_IMAGE_SIGNATURES = (
    (b"\x89PNG\r\n\x1a\n", "image/png"),
    (b"\xff\xd8\xff", "image/jpeg"),
    (b"GIF87a", "image/gif"),
    (b"GIF89a", "image/gif"),
    (b"RIFF", "image/webp"),  # WebP starts with RIFF....WEBP
)


def _is_allowed_image_data(data: bytes) -> str | None:
    """Return MIME type if data is an allowed image, else None."""
    if len(data) < 12:
        return None
    for sig, mime in _IMAGE_SIGNATURES:
        if sig == b"RIFF":
            if data.startswith(b"RIFF") and data[8:12] == b"WEBP":
                return mime
        elif data.startswith(sig):
            return mime
    return None


def _sanitize_filename(name: str, max_len: int = 120) -> str:
    """Strip path components, dangerous chars; limit length."""
    base = os.path.basename(name).strip()
    base = re.sub(r"[^\w\-\.]", "_", base)
    if len(base) > max_len:
        ext = Path(base).suffix
        base = base[: max_len - len(ext)] + ext
    return base or "attachment"


def _get_extension(name: str) -> str:
    ext = Path(name).suffix.lstrip(".").lower()
    return ext


def validate_and_save_attachment(
    uploaded: UploadedFile,
    message,
) -> tuple[object | None, str | None]:
    """
    Validate uploaded file and save to secure storage.
    Returns (MessageAttachment, None) on success, or (None, error_message).
    """
    from .models import MessageAttachment

    ext = _get_extension(uploaded.name)
    if ext in BLOCKED_EXTENSIONS:
        return None, f"File type '.{ext}' is not allowed for security reasons."

    content_type = (uploaded.content_type or "").split(";")[0].strip().lower()
    allowed = content_type in ALLOWED_MIME_TYPES or (
        content_type in ("application/octet-stream", "") and ext in SAFE_LOG_EXTENSIONS
    )
    if not allowed:
        return None, f"File type not allowed. Use images (PNG, JPEG, etc.) or text/log files (TXT, LOG, JSON, XML, EVTX, CVTX)."

    if uploaded.size > MAX_FILE_SIZE_BYTES:
        return None, f"File too large (max {MAX_FILE_SIZE_BYTES // (1024 * 1024)} MB per file)."

    safe_name = _sanitize_filename(uploaded.name)
    issue_id = message.issue_id
    message_id = message.id
    rel_dir = Path("attachments") / str(issue_id) / str(message_id)
    base_dir = Path(settings.MEDIA_ROOT) / rel_dir
    base_dir.mkdir(parents=True, exist_ok=True)

    unique_name = f"{uuid.uuid4().hex}_{safe_name}"
    file_path = base_dir / unique_name
    rel_path = str(rel_dir / unique_name).replace("\\", "/")

    with open(file_path, "wb") as f:
        for chunk in uploaded.chunks():
            f.write(chunk)

    att = MessageAttachment.objects.create(
        message_id=message_id,
        original_name=safe_name,
        file_path=rel_path,
        content_type=content_type,
        file_size=uploaded.size,
    )
    return att, None


def _get_attachment_path(att):
    """Return Path to attachment file (supports file_path or file field)."""
    if getattr(att, "file_path", None) and att.file_path:
        return Path(settings.MEDIA_ROOT) / att.file_path
    if getattr(att, "file", None) and att.file:
        return Path(att.file.path)
    return None


def read_attachment_content(att) -> str | None:
    """
    Read attachment content safely. For text files, return decoded text.
    For images, return None (handled separately as base64 for vision).
    """
    if att.content_type.startswith("image/"):
        return None
    allowed_text = any(att.content_type.startswith(p) for p in TEXT_MIME_PREFIXES)
    if not allowed_text and att.content_type not in ("application/octet-stream", ""):
        return None
    ext = _get_extension(att.original_name or "")
    if not allowed_text and ext not in SAFE_LOG_EXTENSIONS:
        return None

    full_path = _get_attachment_path(att)
    if not full_path or not full_path.exists():
        return None

    try:
        with open(full_path, "r", encoding="utf-8", errors="replace") as f:
            content = f.read(MAX_TEXT_ATTACHMENT_CHARS * 2)
        if len(content) > MAX_TEXT_ATTACHMENT_CHARS:
            content = content[:MAX_TEXT_ATTACHMENT_CHARS] + "\n\n[... truncated for length ...]"
        return content
    except Exception:
        return None


def read_image_base64(att) -> str | None:
    """Read image file and return base64 data URL for vision APIs."""
    if not att.content_type.startswith("image/"):
        return None

    full_path = _get_attachment_path(att)
    if not full_path or not full_path.exists():
        return None

    try:
        with open(full_path, "rb") as f:
            data = f.read()
        mime = _is_allowed_image_data(data)
        if not mime:
            return None
        b64 = base64.standard_b64encode(data).decode("ascii")
        return f"data:{mime};base64,{b64}"
    except Exception:
        return None
