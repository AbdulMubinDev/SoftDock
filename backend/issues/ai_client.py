"""
AI integration: build context from knowledge base + resolved issues,
then stream a response through the user's configured API key chain.

Supports: Anthropic, OpenAI, Google Gemini, Groq, xAI (Grok), OpenRouter.
All providers except Anthropic use the OpenAI-compatible SDK with custom base_url.
"""

import logging
from typing import AsyncIterator

import anthropic
import openai
from asgiref.sync import sync_to_async

logger = logging.getLogger(__name__)

MAX_CONTEXT_CHARS = 60_000
MAX_RESOLVED_ISSUES = 5

PROVIDER_CONFIG = {
    "anthropic": {
        "sdk": "anthropic",
        "model": "claude-sonnet-4-20250514",
    },
    "openai": {
        "sdk": "openai",
        "base_url": None,
        "model": "gpt-4o",
    },
    "google": {
        "sdk": "openai",
        "base_url": "https://generativelanguage.googleapis.com/v1beta/openai/",
        "model": "gemini-2.0-flash",
    },
    "groq": {
        "sdk": "openai",
        "base_url": "https://api.groq.com/openai/v1",
        "model": "llama-3.3-70b-versatile",
    },
    "xai": {
        "sdk": "openai",
        "base_url": "https://api.x.ai/v1",
        "model": "grok-2",
    },
    "openrouter": {
        "sdk": "openai",
        "base_url": "https://openrouter.ai/api/v1",
        "model": "anthropic/claude-sonnet-4-20250514",
    },
}


def _build_system_prompt(workspace_id: str) -> str:
    """Assemble system prompt from active knowledge docs + recently resolved issues."""
    from knowledge.models import KnowledgeDocument
    from .models import Issue

    parts = [
        "You are SoftDock, an AI debugging assistant. "
        "You have access to the user's project documentation and previously resolved issues. "
        "Always cite your sources when referencing documentation. "
        "Provide precise, actionable fixes with code examples when appropriate. "
        "Format your responses with markdown for readability."
    ]

    docs = (
        KnowledgeDocument.objects
        .filter(workspace_id=workspace_id, is_active=True, processing_status="ready")
        .order_by("-updated_at")
    )
    char_budget = MAX_CONTEXT_CHARS
    for doc in docs:
        if char_budget <= 0:
            break
        for chunk in (doc.processed_chunks or []):
            if char_budget <= 0:
                break
            parts.append(f"\n--- Documentation: {doc.title} ---\n{chunk}")
            char_budget -= len(chunk)

    resolved = (
        Issue.objects
        .filter(workspace_id=workspace_id, status=Issue.Status.RESOLVED)
        .order_by("-resolved_at")[:MAX_RESOLVED_ISSUES]
    )
    for issue in resolved:
        msgs = list(issue.messages.all()[:10])
        thread = "\n".join(f"[{m.role}] {m.content[:500]}" for m in msgs)
        if thread:
            parts.append(f"\n--- Resolved issue: {issue.title} ---\n{thread}")

    return "\n".join(parts)


@sync_to_async
def _prepare_context(workspace_id: str, issue, user):
    """
    Gather everything needed for the AI call in a single synchronous DB hit.
    Returns (system_prompt, messages_list, ordered_keys).
    """
    system_prompt = _build_system_prompt(workspace_id)

    messages = [
        {"role": m.role, "content": m.content}
        for m in issue.messages.order_by("created_at")
    ]

    keys = []
    for k in user.api_keys.order_by("order", "created_at"):
        decrypted = k.decrypted_key
        if decrypted:
            keys.append({
                "provider": k.provider,
                "api_key": decrypted,
                "name": k.name,
            })

    if not keys:
        if getattr(user, "_anthropic_api_key", "") and user._anthropic_api_key:
            keys.append({"provider": "anthropic", "api_key": user.anthropic_api_key, "name": "Default"})
        if getattr(user, "_openai_api_key", "") and user._openai_api_key:
            keys.append({"provider": "openai", "api_key": user.openai_api_key, "name": "Default"})

    return system_prompt, messages, keys


async def _stream_anthropic(
    api_key: str,
    model: str,
    system_prompt: str,
    messages: list[dict],
) -> AsyncIterator[str]:
    client = anthropic.AsyncAnthropic(api_key=api_key)
    async with client.messages.stream(
        model=model,
        max_tokens=4096,
        system=system_prompt,
        messages=messages,
    ) as stream:
        async for text in stream.text_stream:
            yield text


async def _stream_openai_compat(
    api_key: str,
    base_url: str | None,
    model: str,
    system_prompt: str,
    messages: list[dict],
) -> AsyncIterator[str]:
    kwargs: dict = {"api_key": api_key}
    if base_url:
        kwargs["base_url"] = base_url
    client = openai.AsyncOpenAI(**kwargs)
    oai_messages = [{"role": "system", "content": system_prompt}] + messages
    stream = await client.chat.completions.create(
        model=model,
        max_tokens=4096,
        messages=oai_messages,
        stream=True,
    )
    async for chunk in stream:
        if chunk.choices and chunk.choices[0].delta.content:
            yield chunk.choices[0].delta.content


async def get_ai_stream(user, issue) -> AsyncIterator[str]:
    """
    Main entry point: prepare context, then try each API key in priority order.
    Falls back to the next key if one fails. Yields tokens for streaming.
    """
    system_prompt, messages, keys = await _prepare_context(
        str(issue.workspace_id), issue, user,
    )

    if not keys:
        yield "⚠ Add at least one API key in **Settings → Keys** to use the assistant."
        return

    if not messages:
        yield "Send a message to start the conversation."
        return

    errors: list[str] = []
    for key_info in keys:
        provider = key_info["provider"]
        api_key = key_info["api_key"]
        name = key_info["name"]
        config = PROVIDER_CONFIG.get(provider)

        if not config:
            errors.append(f"{name}: unsupported provider '{provider}'")
            continue

        try:
            if config["sdk"] == "anthropic":
                async for token in _stream_anthropic(
                    api_key, config["model"], system_prompt, messages,
                ):
                    yield token
            else:
                async for token in _stream_openai_compat(
                    api_key, config.get("base_url"), config["model"],
                    system_prompt, messages,
                ):
                    yield token
            return  # Success — don't try fallback keys
        except Exception as exc:
            logger.warning("Key '%s' (%s) failed: %s", name, provider, exc)
            errors.append(f"{name} ({provider}): {exc}")
            continue

    error_lines = "\n".join(f"- {e}" for e in errors)
    yield f"All API keys failed. Please check your keys in Settings.\n\n{error_lines}"
