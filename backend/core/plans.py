"""
Plan-based limits for Free, Starter, Pro, and Founding Member.
Used to enforce workspace count, issue history, resolution memory, attachments, and providers.
"""

from datetime import timedelta
from django.utils import timezone

# Plan names as stored in User.subscription_plan_name
PLAN_FREE = "Free"
PLAN_STARTER = "Starter"
PLAN_PRO = "Pro"
PLAN_FOUNDING = "Founding Member"

# Unlimited workspaces / history
UNLIMITED = None

# Max workspaces (None = unlimited)
MAX_WORKSPACES = {
    PLAN_FREE: 1,
    PLAN_STARTER: 2,
    PLAN_PRO: UNLIMITED,
    PLAN_FOUNDING: UNLIMITED,
}

# Issue history: only show/issues created within the last N days (None = unlimited)
HISTORY_DAYS = {
    PLAN_FREE: 7,
    PLAN_STARTER: 30,
    PLAN_PRO: UNLIMITED,
    PLAN_FOUNDING: UNLIMITED,
}

# Resolution memory: inject resolved issues into AI context
RESOLUTION_MEMORY = {
    PLAN_FREE: False,
    PLAN_STARTER: False,
    PLAN_PRO: True,
    PLAN_FOUNDING: True,
}

# File attachments (images, logs) allowed
ATTACHMENTS_ALLOWED = {
    PLAN_FREE: False,
    PLAN_STARTER: False,
    PLAN_PRO: True,
    PLAN_FOUNDING: True,
}

# Allowed AI providers (None = all). Free/Starter: Anthropic + OpenAI only.
ALLOWED_PROVIDERS = {
    PLAN_FREE: frozenset({"anthropic", "openai"}),
    PLAN_STARTER: frozenset({"anthropic", "openai"}),
    PLAN_PRO: None,  # all
    PLAN_FOUNDING: None,
}


def _normalize_plan(plan_name: str | None) -> str:
    if not plan_name or not plan_name.strip():
        return PLAN_FREE
    return (plan_name or "").strip()


def get_plan_limits(plan_name: str | None) -> dict:
    """Return limits for the given plan. Unknown plans default to Free."""
    plan = _normalize_plan(plan_name)
    return {
        "max_workspaces": MAX_WORKSPACES.get(plan, MAX_WORKSPACES[PLAN_FREE]),
        "history_days": HISTORY_DAYS.get(plan, HISTORY_DAYS[PLAN_FREE]),
        "resolution_memory": RESOLUTION_MEMORY.get(plan, False),
        "attachments_allowed": ATTACHMENTS_ALLOWED.get(plan, False),
        "allowed_providers": ALLOWED_PROVIDERS.get(plan, ALLOWED_PROVIDERS[PLAN_FREE]),
    }


def has_resolution_memory(plan_name: str | None) -> bool:
    return get_plan_limits(plan_name)["resolution_memory"]


def has_attachments(plan_name: str | None) -> bool:
    return get_plan_limits(plan_name)["attachments_allowed"]


def get_history_cutoff(plan_name: str | None):
    """
    Return the datetime before which issues are hidden for this plan.
    Returns None if unlimited history.
    """
    days = get_plan_limits(plan_name)["history_days"]
    if days is None:
        return None
    return timezone.now() - timedelta(days=days)


def can_use_provider(plan_name: str | None, provider: str) -> bool:
    """True if this plan can use the given provider (e.g. 'anthropic', 'openai')."""
    allowed = get_plan_limits(plan_name)["allowed_providers"]
    if allowed is None:
        return True
    return (provider or "").lower() in allowed


def is_workspace_count_at_limit(plan_name: str | None, current_count: int) -> bool:
    """True if the user cannot create more workspaces."""
    max_ws = get_plan_limits(plan_name)["max_workspaces"]
    if max_ws is None:
        return False
    return current_count >= max_ws


def get_unlocked_workspace_ids(user) -> set:
    """
    Workspace IDs this user can use (first N by joined_at, N = plan max).
    When plan allows unlimited, returns all workspace IDs the user is a member of.
    Used to lock workspaces when the user downgrades or plan expires.
    """
    from workspaces.models import WorkspaceMember

    plan_name = getattr(user, "subscription_plan_name", None) or "Free"
    max_ws = get_plan_limits(plan_name)["max_workspaces"]
    qs = WorkspaceMember.objects.filter(user=user).order_by("joined_at")
    if max_ws is None:
        return set(qs.values_list("workspace_id", flat=True))
    ids = list(qs.values_list("workspace_id", flat=True)[:max_ws])
    return set(ids)


def is_workspace_locked(user, workspace_id) -> bool:
    """True if this workspace is locked for the user (over plan limit / plan expired)."""
    return workspace_id not in get_unlocked_workspace_ids(user)
