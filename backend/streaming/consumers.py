"""
WebSocket consumer for streaming AI responses.

Flow (preferred — no duplicate messages):
1. Frontend saves user message via REST POST
2. Frontend connects to ws://host/ws/issues/{issue_id}/?token=<jwt>
3. Frontend sends JSON: {"type": "stream"}
4. Consumer reads conversation from DB, streams AI response token by token
5. On completion, saves full assistant message to DB

Legacy flow (backward compat):
- Frontend sends {"type": "message", "content": "..."} — saves + streams in one step
"""

import json
import logging

from django.conf import settings
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.contrib.auth.models import AnonymousUser

from issues.models import Issue, Message
from issues.ai_client import get_ai_stream
from workspaces.models import WorkspaceMember

logger = logging.getLogger(__name__)


class IssueStreamConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.issue_id = self.scope["url_route"]["kwargs"]["issue_id"]
        self.user = self.scope.get("user", AnonymousUser())

        try:
            if isinstance(self.user, AnonymousUser) or not self.user.is_authenticated:
                logger.warning("WS rejected: unauthenticated user for issue %s", self.issue_id)
                await self.close(code=4001)
                return

            has_access = await self._check_access()
            if not has_access:
                logger.warning("WS rejected: no access for user %s to issue %s", self.user.id, self.issue_id)
                await self.close(code=4003)
                return

            await self.accept()
        except Exception as exc:
            logger.exception("WS connect() crashed for issue %s: %s", self.issue_id, exc)
            await self.close(code=4500)

    async def disconnect(self, code):
        pass

    async def receive(self, text_data=None, bytes_data=None):
        if not text_data:
            return

        try:
            data = json.loads(text_data)
        except json.JSONDecodeError:
            await self.send(text_data=json.dumps({"type": "error", "content": "Invalid JSON"}))
            return

        msg_type = data.get("type")

        try:
            if msg_type == "stream":
                await self._handle_stream()
            elif msg_type == "message":
                content = data.get("content", "").strip()
                if content:
                    await self._handle_user_message(content)
            elif msg_type == "resolve":
                await self._resolve_issue()
        except Exception as exc:
            logger.exception("WS receive handler crashed for issue %s: %s", self.issue_id, exc)
            try:
                msg = str(exc) if settings.DEBUG else "Something went wrong. Please try again."
                await self.send(text_data=json.dumps({"type": "error", "content": msg}))
            except Exception:
                pass

    async def _handle_stream(self):
        """
        Trigger AI streaming for the current conversation.
        The user message must already be saved via REST before calling this.
        """
        issue = await self._get_issue()
        if not issue:
            await self.send(text_data=json.dumps({"type": "error", "content": "Issue not found"}))
            return

        await self._stream_ai(issue)

    async def _handle_user_message(self, content: str):
        """Legacy: save user message AND stream AI response in one step."""
        issue = await self._get_issue()
        if not issue:
            await self.send(text_data=json.dumps({"type": "error", "content": "Issue not found"}))
            return

        await self._save_message(issue, Message.Role.USER, content)

        if not issue.title:
            await self._set_title(issue, content[:120])

        await self._stream_ai(issue)

    async def _stream_ai(self, issue):
        """Stream AI response token by token to the connected client.
        Always saves the assistant message to DB even if the client disconnects."""
        self._client_gone = False

        try:
            await self.send(text_data=json.dumps({"type": "stream_start"}))
        except Exception:
            self._client_gone = True

        full_response = ""
        try:
            async for token in get_ai_stream(self.user, issue):
                full_response += token
                if not self._client_gone:
                    try:
                        await self.send(text_data=json.dumps({"type": "token", "content": token}))
                    except Exception:
                        self._client_gone = True
        except Exception as exc:
            logger.exception("AI streaming error for issue %s", self.issue_id)
            if not full_response:
                full_response = (
                    f"AI error: {str(exc)}"
                    if settings.DEBUG
                    else "The assistant hit an error. Check your API keys in Settings or try again."
                )
            if not self._client_gone:
                try:
                    err_msg = str(exc) if settings.DEBUG else "The assistant hit an error. Please try again."
                    await self.send(text_data=json.dumps({"type": "error", "content": err_msg}))
                except Exception:
                    self._client_gone = True

        if full_response:
            await self._save_message(issue, Message.Role.ASSISTANT, full_response)

        if not self._client_gone:
            try:
                await self.send(text_data=json.dumps({"type": "stream_end"}))
            except Exception:
                pass

    async def _resolve_issue(self):
        issue = await self._get_issue()
        if issue:
            await self._mark_resolved(issue)
            await self.send(text_data=json.dumps({"type": "resolved"}))

    # --- Database helpers (sync → async) ---

    @database_sync_to_async
    def _check_access(self):
        try:
            issue = Issue.objects.select_related("workspace").get(id=self.issue_id)
            return WorkspaceMember.objects.filter(
                workspace=issue.workspace, user=self.user
            ).exists()
        except Issue.DoesNotExist:
            return False

    @database_sync_to_async
    def _get_issue(self):
        try:
            return Issue.objects.select_related("workspace").get(id=self.issue_id)
        except Issue.DoesNotExist:
            return None

    @database_sync_to_async
    def _save_message(self, issue, role, content):
        return Message.objects.create(issue=issue, role=role, content=content)

    @database_sync_to_async
    def _set_title(self, issue, title):
        issue.title = title
        issue.save(update_fields=["title"])

    @database_sync_to_async
    def _mark_resolved(self, issue):
        from django.utils import timezone
        issue.status = Issue.Status.RESOLVED
        issue.resolved_at = timezone.now()
        issue.save(update_fields=["status", "resolved_at"])
