import { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { AssistantMessage } from '../components/chat/AssistantMessage';
import { useIssueStore, type Issue, type MessageAttachment } from '../lib/stores/issueStore';
import { useWorkspaceStore } from '../lib/stores/workspaceStore';
import { useAuthStore } from '../lib/stores/authStore';
import { canUseProvider, hasAttachments } from '../lib/planLimits';
import { api, getWsUrl } from '../lib/api';

/** Fetches attachment with auth and shows image or filename. */
function ChatAttachment({
  att,
  workspaceSlug,
  issueId,
}: { att: MessageAttachment; workspaceSlug: string; issueId: string }) {
  const [objectUrl, setObjectUrl] = useState<string | null>(null);
  const urlRef = useRef<string | null>(null);
  const isImage = att.content_type.startsWith('image/');

  useEffect(() => {
    if (!isImage) return;
    const path = `/workspaces/${workspaceSlug}/issues/${issueId}/attachments/${att.id}/`;
    api.get(path, { responseType: 'blob' })
      .then((res) => {
        if (urlRef.current) URL.revokeObjectURL(urlRef.current);
        urlRef.current = URL.createObjectURL(res.data);
        setObjectUrl(urlRef.current);
      })
      .catch(() => {});
    return () => {
      if (urlRef.current) {
        URL.revokeObjectURL(urlRef.current);
        urlRef.current = null;
      }
      setObjectUrl(null);
    };
  }, [workspaceSlug, issueId, att.id, isImage]);

  if (isImage && objectUrl) {
    return (
      <span className="inline-block rounded-lg overflow-hidden border border-[var(--border)] bg-surface-2 max-w-[200px] max-h-[120px]">
        <img src={objectUrl} alt={att.original_name} className="max-w-full max-h-[120px] object-contain" />
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-surface-2/80 border border-[var(--border)] text-xs text-[var(--text)]">
      <span className="truncate max-w-[140px]">{att.original_name}</span>
      <span className="text-text-dim shrink-0">{(att.file_size / 1024).toFixed(1)} KB</span>
    </span>
  );
}

interface ModelOption { id: string; name: string; tier: string }
interface CatalogEntry { provider: string; provider_display: string; models: ModelOption[] }
interface ApiKeyEntry { id: string; provider: string }

function isCodeOrData(line: string): boolean {
  const s = line.trim();
  if (!s) return true;
  if (/^[{[<(\/\/#/*`]/.test(s) || s.startsWith('```')) return true;
  if ((s.match(/[{[(]/g)?.length ?? 0) > 2) return true;
  if (s.length > 100) return true;
  const nonAlpha = [...s].filter((c) => !/[a-zA-Z ]/.test(c)).length;
  if (s.length > 10 && nonAlpha / s.length > 0.5) return true;
  return false;
}

const MAX_INPUT_CHARS = 50_000;
const MAX_ATTACHMENTS = 5;
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB
const MAX_TOTAL_ATTACHMENTS_BYTES = 15 * 1024 * 1024; // 15 MB
const PASTE_BLOCK_THRESHOLD = 1500; // chars - pasted content above this becomes a "pasted block" (Claude-style)
const ACCEPT_ATTACHMENTS = 'image/*,.txt,.log,.json,.xml,.evtx,.cvtx,.etl';

// Must match backend: only these types are accepted. Others show a warning and are not added.
const ALLOWED_ATTACHMENT_EXTENSIONS = new Set([
  'png', 'jpeg', 'jpg', 'gif', 'webp',
  'txt', 'log', 'json', 'xml', 'evtx', 'cvtx', 'etl',
]);
const BLOCKED_ATTACHMENT_EXTENSIONS = new Set([
  'exe', 'bat', 'cmd', 'sh', 'bash', 'ps1', 'psm1',
  'py', 'pyw', 'pyc', 'js', 'ts', 'mjs', 'cjs',
  'php', 'rb', 'pl', 'vbs', 'wsf', 'jar', 'dll',
  'so', 'dylib', 'bin', 'app', 'deb', 'rpm', 'msi',
]);

function getFileExtension(name: string): string {
  const i = name.lastIndexOf('.');
  return i >= 0 ? name.slice(i + 1).toLowerCase() : '';
}

function isAttachmentAllowed(fileName: string): { allowed: boolean; reason?: string } {
  const ext = getFileExtension(fileName);
  if (!ext) return { allowed: false, reason: 'File has no extension' };
  if (BLOCKED_ATTACHMENT_EXTENSIONS.has(ext)) {
    return { allowed: false, reason: `".${ext}" files are not allowed for security reasons` };
  }
  if (!ALLOWED_ATTACHMENT_EXTENSIONS.has(ext)) {
    return { allowed: false, reason: `".${ext}" is not supported. Use images (PNG, JPEG, etc.) or text/log files (TXT, LOG, JSON, XML, EVTX, CVTX)` };
  }
  return { allowed: true };
}

function suggestIssueTitle(content: string, maxLen = 80): string {
  if (!content?.trim()) return 'New issue';
  const lines = content.trim().split('\n').map((l) => l.trim()).filter(Boolean);
  let best: string | null = null;
  for (let i = lines.length - 1; i >= 0; i--) {
    if (!isCodeOrData(lines[i])) { best = lines[i]; break; }
  }
  if (!best) {
    for (const line of lines) {
      if (!isCodeOrData(line)) { best = line; break; }
    }
  }
  if (!best) return 'New issue';
  return best.length <= maxLen ? best : best.slice(0, maxLen - 1) + '…';
}

export function Dashboard() {
  const { issues, setIssues, activeIssue, setActiveIssue, appendMessage, updateStreamingContent } =
    useIssueStore();
  const { activeWorkspace, setActiveWorkspace, workspaces, setWorkspaces } = useWorkspaceStore();
  const currentWorkspace = workspaces.find((w) => w.slug === activeWorkspace?.slug);
  const isWorkspaceLocked = currentWorkspace?.is_locked === true;
  const { user, setUser } = useAuthStore();

  const [input, setInput] = useState('');
  const [attachments, setAttachments] = useState<File[]>([]);
  const [attachmentWarning, setAttachmentWarning] = useState<string | null>(null);
  const [pastedBlock, setPastedBlock] = useState<string | null>(null);
  const [pastedBlockExpanded, setPastedBlockExpanded] = useState(false);
  const [sending, setSending] = useState(false);
  const [streaming, setStreaming] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const streamBuffer = useRef('');

  const [catalog, setCatalog] = useState<CatalogEntry[]>([]);
  const [userKeys, setUserKeys] = useState<ApiKeyEntry[]>([]);
  const [selProvider, setSelProvider] = useState(user?.preferred_ai_provider ?? '');
  const [selModel, setSelModel] = useState(user?.preferred_ai_model_id ?? '');

  const [renameId, setRenameId] = useState<string | null>(null);
  const [renameTitle, setRenameTitle] = useState('');
  const [menuIssueId, setMenuIssueId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const headerRenameInputRef = useRef<HTMLInputElement>(null);
  const renameBlurReadyRef = useRef(false);

  const slug = activeWorkspace?.slug;

  useEffect(() => {
    if (workspaces.length === 0) {
      api.get('/workspaces/').then((res) => {
        const list = res.data.results ?? res.data;
        setWorkspaces(list);
        if (list.length && !activeWorkspace) setActiveWorkspace(list[0]);
      }).catch(() => {});
    }
  }, [workspaces.length, setWorkspaces, setActiveWorkspace, activeWorkspace]);

  const ACTIVE_ISSUE_KEY = 'softdock_active_issue';
  const hasMountedRef = useRef(false);

  useEffect(() => {
    hasMountedRef.current = false;
  }, [slug]);

  useEffect(() => {
    if (!slug || isWorkspaceLocked) return;
    api.get(`/workspaces/${slug}/issues/`).then((res) => {
      setIssues(res.data.results ?? res.data);
    }).catch(() => {});
  }, [slug, isWorkspaceLocked, setIssues]);

  useEffect(() => {
    if (slug && activeIssue?.id) {
      try {
        localStorage.setItem(ACTIVE_ISSUE_KEY, JSON.stringify({
          workspaceSlug: slug,
          issueId: activeIssue.id,
        }));
      } catch {}
    }
  }, [slug, activeIssue?.id]);

  useEffect(() => {
    if (!slug || issues.length === 0) return;
    if (hasMountedRef.current) return;
    hasMountedRef.current = true;

    const issueIdFromStore = activeIssue?.id ?? null;
    const issueIdFromStorage = (() => {
      try {
        const raw = localStorage.getItem(ACTIVE_ISSUE_KEY);
        if (!raw) return null;
        const { workspaceSlug, issueId } = JSON.parse(raw);
        return workspaceSlug === slug ? issueId : null;
      } catch { return null; }
    })();

    const issueIdToRestore = issueIdFromStore ?? issueIdFromStorage;
    if (!issueIdToRestore) return;
    if (!issues.some((i) => i.id === issueIdToRestore)) return;

    api.get(`/workspaces/${slug}/issues/${issueIdToRestore}/`).then(({ data }) => {
      setActiveIssue(data);
    }).catch(() => {});
  }, [slug, issues]);

  useEffect(() => {
    api.get<CatalogEntry[]>('/auth/models/').then((r) => setCatalog(Array.isArray(r.data) ? r.data : [])).catch(() => {});
    api.get<ApiKeyEntry[]>('/auth/api-keys/').then((r) => setUserKeys(Array.isArray(r.data) ? r.data : [])).catch(() => {});
  }, []);

  // Derived state: must be defined before any useEffect that depends on it
  const planName = user?.subscription_plan_name ?? 'Free';
  const keyProviders = [...new Set(userKeys.map((k) => k.provider))];
  const availableCatalog = catalog.filter(
    (e) => keyProviders.includes(e.provider) && canUseProvider(planName, e.provider)
  );
  const providerModels = availableCatalog.find((e) => e.provider === selProvider)?.models ?? [];
  const attachmentsAllowed = hasAttachments(planName);

  useEffect(() => {
    setSelProvider(user?.preferred_ai_provider ?? '');
    setSelModel(user?.preferred_ai_model_id ?? '');
  }, [user]);

  // When plan limits filter out the current provider, switch to first allowed
  useEffect(() => {
    if (availableCatalog.length === 0) return;
    const allowedProviders = availableCatalog.map((e) => e.provider);
    if (selProvider && !allowedProviders.includes(selProvider)) {
      const first = availableCatalog[0];
      if (first) {
        const firstModelId = first.models?.[0]?.id ?? '';
        setSelProvider(first.provider);
        setSelModel(firstModelId);
        api.put('/auth/me/', { preferred_ai_provider: first.provider, preferred_ai_model_id: firstModelId }).then(({ data }) => setUser(data)).catch(() => {});
      }
    }
  }, [availableCatalog, selProvider]);

  const saveModelPref = useCallback(async (provider: string, modelId: string) => {
    setSelProvider(provider);
    setSelModel(modelId);
    try {
      const { data } = await api.put('/auth/me/', {
        preferred_ai_provider: provider,
        preferred_ai_model_id: modelId,
      });
      setUser(data);
    } catch {}
  }, [setUser]);

  const handleProviderChange = (provider: string) => {
    const entry = availableCatalog.find((e) => e.provider === provider);
    const firstModelId = entry?.models?.[0]?.id ?? '';
    saveModelPref(provider, firstModelId);
  };

  const handleModelSelectChange = (modelId: string) => {
    saveModelPref(selProvider, modelId);
  };

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeIssue?.messages]);

  useEffect(() => {
    return () => {
      wsRef.current?.close();
    };
  }, []);

  const refreshIssueFromApi = useCallback(
    (issueId: string) => {
      if (!slug) return;
      api.get(`/workspaces/${slug}/issues/${issueId}/`).then(({ data }) => {
        setActiveIssue(data);
      }).catch(() => {});
    },
    [slug, setActiveIssue],
  );

  const connectAndStream = useCallback(
    (issueId: string) => {
      wsRef.current?.close();
      streamBuffer.current = '';
      const token = localStorage.getItem('access_token');
      const wsUrl = getWsUrl(`/issues/${issueId}/?token=${token}`);
      const ws = new WebSocket(wsUrl);
      let gotStreamEnd = false;

      ws.addEventListener('open', () => {
        ws.send(JSON.stringify({ type: 'stream' }));
      }, { once: true });

      ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.type === 'stream_start') {
          setStreaming(true);
          streamBuffer.current = '';
          appendMessage(issueId, {
            id: `streaming-${Date.now()}`,
            role: 'assistant',
            content: '',
            created_at: new Date().toISOString(),
          });
        } else if (data.type === 'token') {
          streamBuffer.current += data.content;
          updateStreamingContent(issueId, streamBuffer.current);
        } else if (data.type === 'stream_end') {
          gotStreamEnd = true;
          setStreaming(false);
          ws.close();
        } else if (data.type === 'error') {
          gotStreamEnd = true;
          setStreaming(false);
          appendMessage(issueId, {
            id: `error-${Date.now()}`,
            role: 'assistant',
            content: data.content,
            created_at: new Date().toISOString(),
          });
          ws.close();
        }
      };

      ws.onerror = () => {
        console.warn('[SoftDock] WS error for issue', issueId);
        setStreaming(false);
      };

      ws.onclose = (ev) => {
        setStreaming(false);
        if (!gotStreamEnd) {
          console.warn('[SoftDock] WS closed before stream_end, code:', ev.code, 'reason:', ev.reason);
        }
        const delay = gotStreamEnd ? 300 : 2500;
        setTimeout(() => refreshIssueFromApi(issueId), delay);
      };

      wsRef.current = ws;
    },
    [appendMessage, updateStreamingContent, refreshIssueFromApi],
  );

  const handleNewIssue = async () => {
    if (!slug) return;
    try {
      const { data } = await api.post(`/workspaces/${slug}/issues/`, { title: '' });
      const newIssue: Issue = { ...data, messages: [] };
      setIssues([newIssue, ...issues]);
      setActiveIssue(newIssue);
    } catch {}
  };

  const handleSelectIssue = async (issue: Issue) => {
    if (!slug) return;
    try {
      const { data } = await api.get(`/workspaces/${slug}/issues/${issue.id}/`);
      setActiveIssue(data);
    } catch {
      setActiveIssue(issue);
    }
  };

  const hasContent = input.trim() || (pastedBlock && pastedBlock.length > 0) || attachments.length > 0;
  const canSend = hasContent && !sending && !streaming;

  const handleSend = async () => {
    if (!hasContent || !slug || !activeIssue || sending || streaming) return;
    const textPart = input.trim();
    const pastedPart = pastedBlock ? pastedBlock.trim() : '';
    const content = pastedPart ? (textPart ? `${textPart}\n\n${pastedPart}` : pastedPart) : textPart;
    const filesToSend = attachmentsAllowed ? [...attachments] : [];
    if (!content && filesToSend.length === 0) return;

    setInput('');
    setPastedBlock(null);
    setPastedBlockExpanded(false);
    setAttachments([]);
    setSending(true);

    try {
      let resp;
      if (filesToSend.length > 0) {
        const form = new FormData();
        form.append('content', content || '');
        filesToSend.forEach((f) => form.append('files', f));
        resp = await api.post(
          `/workspaces/${slug}/issues/${activeIssue.id}/messages/`,
          form,
        );
      } else {
        resp = await api.post(
          `/workspaces/${slug}/issues/${activeIssue.id}/messages/`,
          { content },
        );
      }
      const data = resp.data;
      appendMessage(activeIssue.id, data);

      if (!activeIssue.title) {
        const updatedTitle = data.content?.trim()
          ? suggestIssueTitle(data.content)
          : (data.attachments?.length ? 'Attachment' : 'New issue');
        setActiveIssue({ ...activeIssue, title: updatedTitle, messages: [...(activeIssue.messages ?? []), data] });
        setIssues(issues.map((i) => (i.id === activeIssue.id ? { ...i, title: updatedTitle } : i)));
      }

      connectAndStream(activeIssue.id);
    } catch (err: unknown) {
      const msg = err && typeof err === 'object' && 'response' in err
        ? (err as { response?: { data?: { detail?: string; content?: string[] } } }).response?.data
        : null;
      const errText = (msg && typeof msg === 'object' && Array.isArray(msg.content))
        ? msg.content[0]
        : (msg && typeof msg === 'object' && typeof msg.detail === 'string')
          ? msg.detail
          : 'Failed to send message. Check your connection and try again.';
      appendMessage(activeIssue.id, {
        id: `error-${Date.now()}`,
        role: 'assistant',
        content: errText,
        created_at: new Date().toISOString(),
      });
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const totalAttachmentBytes = attachments.reduce((sum, f) => sum + f.size, 0);
  const MAX_FILE_SIZE_MB = 5;
  const MAX_TOTAL_MB = 15;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files?.length) return;
    setAttachmentWarning(null);
    const next = [...attachments];
    let runningTotal = totalAttachmentBytes;
    const tooLarge: string[] = [];
    const wouldExceedTotal: string[] = [];
    const atLimit: string[] = [];
    const notAllowed: string[] = []; // filename with reason (e.g. "file.exe (not allowed)")

    for (let i = 0; i < files.length; i++) {
      const f = files[i];
      const { allowed, reason } = isAttachmentAllowed(f.name);
      if (!allowed) {
        notAllowed.push(`${f.name} — ${reason ?? 'not allowed'}`);
        continue;
      }
      if (next.length >= MAX_ATTACHMENTS) {
        atLimit.push(f.name);
        continue;
      }
      if (f.size > MAX_FILE_SIZE_BYTES) {
        tooLarge.push(`${f.name} (${(f.size / 1024 / 1024).toFixed(1)} MB)`);
        continue;
      }
      if (runningTotal + f.size > MAX_TOTAL_ATTACHMENTS_BYTES) {
        wouldExceedTotal.push(f.name);
        continue;
      }
      next.push(f);
      runningTotal += f.size;
    }

    const parts: string[] = [];
    if (notAllowed.length) parts.push(`Not allowed: ${notAllowed.join('. ')}`);
    if (tooLarge.length) parts.push(`File too large: ${tooLarge.join(', ')}. Maximum ${MAX_FILE_SIZE_MB} MB per file.`);
    if (wouldExceedTotal.length) parts.push(`Would exceed total size: ${wouldExceedTotal.join(', ')}. Total attachments cannot exceed ${MAX_TOTAL_MB} MB.`);
    if (atLimit.length) parts.push(`Maximum ${MAX_ATTACHMENTS} files. Skipped: ${atLimit.join(', ')}.`);
    if (parts.length) setAttachmentWarning(parts.join(' '));

    setAttachments(next);
    e.target.value = '';
  };

  const removeAttachment = (idx: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== idx));
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const pasted = e.clipboardData?.getData('text');
    if (!pasted || pasted.length < PASTE_BLOCK_THRESHOLD || attachments.length > 0) return;
    e.preventDefault();
    setPastedBlock(pasted);
    setPastedBlockExpanded(true);
  };

  const handleResolve = async () => {
    if (!slug || !activeIssue) return;
    try {
      await api.patch(`/workspaces/${slug}/issues/${activeIssue.id}/`, { status: 'resolved' });
      setActiveIssue({ ...activeIssue, status: 'resolved' });
      setIssues(issues.map((i) => (i.id === activeIssue.id ? { ...i, status: 'resolved' } : i)));
    } catch {}
  };

  const handleArchive = async () => {
    if (!slug || !activeIssue) return;
    try {
      await api.patch(`/workspaces/${slug}/issues/${activeIssue.id}/`, { status: 'archived' });
      setActiveIssue({ ...activeIssue, status: 'archived' });
      setIssues(issues.map((i) => (i.id === activeIssue.id ? { ...i, status: 'archived' } : i)));
    } catch {}
  };

  const startRename = (issue: Issue) => {
    renameBlurReadyRef.current = false;
    setRenameId(issue.id);
    setRenameTitle(issue.title || '');
  };

  const cancelRename = () => {
    setRenameId(null);
    setRenameTitle('');
  };

  const saveRename = async () => {
    if (!slug || !renameId) return;
    const title = renameTitle.trim();
    try {
      const { data } = await api.patch(`/workspaces/${slug}/issues/${renameId}/`, { title: title || '' });
      setIssues(issues.map((i) => (i.id === renameId ? { ...i, title: data.title } : i)));
      if (activeIssue?.id === renameId) setActiveIssue({ ...activeIssue, title: data.title });
      cancelRename();
    } catch {}
  };

  useEffect(() => {
    if (renameId && activeIssue?.id === renameId) {
      const t = setTimeout(() => {
        renameBlurReadyRef.current = true;
        headerRenameInputRef.current?.focus();
      }, 50);
      return () => clearTimeout(t);
    }
  }, [renameId, activeIssue?.id]);

  const handleDeleteIssue = async (issueId: string) => {
    if (!slug) return;
    try {
      await api.delete(`/workspaces/${slug}/issues/${issueId}/`);
      setIssues(issues.filter((i) => i.id !== issueId));
      if (activeIssue?.id === issueId) setActiveIssue(issues.find((i) => i.id !== issueId) ?? null);
      setDeleteConfirmId(null);
    } catch {}
  };

  const messages = activeIssue?.messages ?? [];

  return (
    <div className="h-[calc(100vh-3.5rem)] flex min-w-0">
      {/* Issue sidebar */}
      <div className="w-72 flex-shrink-0 border-r border-[var(--border)] bg-surface flex flex-col">
        <div className="p-3 border-b border-[var(--border)]">
          <Button size="sm" className="w-full !text-sm" onClick={handleNewIssue} disabled={!slug || isWorkspaceLocked}>
            + New issue
          </Button>
        </div>
        <div className="flex-1 overflow-y-auto">
          {!slug ? (
            <div className="p-4 text-sm text-text-dim text-center">Select a workspace first</div>
          ) : isWorkspaceLocked ? (
            <div className="p-4 text-sm text-text-dim text-center">This workspace is locked. Upgrade or renew your plan to unlock.</div>
          ) : issues.length === 0 ? (
            <div className="p-4 text-sm text-text-dim text-center">No issues yet</div>
          ) : (
            issues.map((issue) => (
              <div
                key={issue.id}
                className={`group border-b border-[var(--border)] ${
                  activeIssue?.id === issue.id
                    ? 'bg-primary/10 border-l-2 border-l-primary'
                    : 'hover:bg-surface-2'
                }`}
              >
                {renameId === issue.id ? (
                  <div className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                    <input
                      type="text"
                      value={renameTitle}
                      onChange={(e) => setRenameTitle(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') saveRename();
                        if (e.key === 'Escape') cancelRename();
                      }}
                      onBlur={() => saveRename()}
                      autoFocus
                      className="w-full bg-surface-2 border border-[var(--border)] rounded px-2 py-1.5 text-sm text-[var(--text)] focus:outline-none focus:border-primary/50"
                    />
                  </div>
                ) : (
                  <div className="flex items-start gap-1">
                    <button
                      type="button"
                      onClick={() => handleSelectIssue(issue)}
                      className="flex-1 min-w-0 text-left px-4 py-3 cursor-pointer"
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span
                          className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                            issue.status === 'resolved' ? 'bg-green-400' : issue.status === 'archived' ? 'bg-text-dim' : 'bg-primary-bright'
                          }`}
                        />
                        <span className="text-sm font-medium text-[var(--text)] truncate">
                          {issue.title || 'New issue'}
                        </span>
                      </div>
                      <div className="text-[11px] text-text-dim pl-3.5">
                        {new Date(issue.created_at).toLocaleDateString()}
                      </div>
                    </button>
                    <div className="relative flex items-center pr-2 pt-2">
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); setMenuIssueId(menuIssueId === issue.id ? null : issue.id); }}
                        className="p-1.5 rounded hover:bg-surface-3 text-text-dim hover:text-[var(--text)]"
                        aria-label="Issue menu"
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="6" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="12" cy="18" r="1.5"/></svg>
                      </button>
                      {menuIssueId === issue.id && (
                        <>
                          <div className="fixed inset-0 z-10" onClick={() => setMenuIssueId(null)} />
                          <div className="absolute right-0 top-full mt-0.5 z-20 min-w-[140px] bg-surface border border-[var(--border)] rounded-lg shadow-lg py-1">
                            <button type="button" onClick={() => { startRename(issue); setMenuIssueId(null); }} className="w-full text-left px-3 py-2 text-sm text-[var(--text)] hover:bg-surface-2">Rename</button>
                            <button type="button" onClick={() => { setDeleteConfirmId(issue.id); setMenuIssueId(null); }} className="w-full text-left px-3 py-2 text-sm text-red-400 hover:bg-surface-2">Delete</button>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Chat area */}
      <div className="flex-1 flex flex-col min-w-0">
        {activeIssue && !isWorkspaceLocked ? (
          <>
            {/* Issue header */}
            <div className="flex items-center justify-between px-5 py-3 border-b border-[var(--border)] bg-surface flex-shrink-0">
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <span
                  className={`w-2 h-2 rounded-full flex-shrink-0 ${
                    activeIssue.status === 'resolved' ? 'bg-green-400' : activeIssue.status === 'archived' ? 'bg-text-dim' : 'bg-primary-bright'
                  }`}
                />
                {renameId === activeIssue.id ? (
                  <input
                    ref={headerRenameInputRef}
                    type="text"
                    value={renameTitle}
                    onChange={(e) => setRenameTitle(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') saveRename();
                      if (e.key === 'Escape') cancelRename();
                    }}
                    onBlur={() => {
                      if (renameBlurReadyRef.current) saveRename();
                    }}
                    className="flex-1 min-w-[8rem] bg-surface-2 border border-[var(--border)] rounded px-2 py-1 text-sm text-[var(--text)] focus:outline-none focus:border-primary/50"
                  />
                ) : (
                  <h2 className="text-sm font-semibold text-[var(--text)] truncate">
                    {activeIssue.title || 'New issue'}
                  </h2>
                )}
                <span className="text-[11px] text-text-dim capitalize px-2 py-0.5 rounded-full border border-[var(--border)] shrink-0">
                  {activeIssue.status}
                </span>
              </div>
              <div className="flex items-center gap-2">
                {activeIssue.status === 'open' && (
                  <Button variant="ghost" size="sm" onClick={handleResolve}>
                    Mark resolved
                  </Button>
                )}
                {(activeIssue.status === 'open' || activeIssue.status === 'resolved') && (
                  <Button variant="ghost" size="sm" onClick={handleArchive}>
                    Archive
                  </Button>
                )}
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-5 space-y-5">
              {messages.length === 0 ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center max-w-sm">
                    <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/25 flex items-center justify-center text-primary-bright mx-auto mb-4">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
                      </svg>
                    </div>
                    <p className="text-sm font-medium text-[var(--text)] mb-1">Describe your problem</p>
                    <p className="text-[13px] text-text-dim">Paste a stack trace, terminal output, or describe the issue in plain English.</p>
                  </div>
                </div>
              ) : (
                messages.map((msg) => {
                  const isStreamingThis = streaming && msg === messages[messages.length - 1] && msg.role === 'assistant';
                  return (
                    <div
                      key={msg.id}
                      className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
                    >
                      <div
                        className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5 ${
                          msg.role === 'user'
                            ? 'bg-primary text-white'
                            : 'bg-surface-2 border border-[var(--border)] text-primary-bright'
                        }`}
                      >
                        {msg.role === 'user' ? 'U' : (
                          <img src="/logo.png" alt="" className="w-5 h-5 rounded object-contain" />
                        )}
                      </div>
                      {msg.role === 'user' ? (
                        <div className="max-w-[75%] rounded-xl px-4 py-3 text-sm leading-relaxed bg-primary/10 border border-primary/25 text-[var(--text)] space-y-2">
                          {msg.content ? <div className="whitespace-pre-wrap">{msg.content}</div> : null}
                          {msg.attachments && msg.attachments.length > 0 ? (
                            <div className="flex flex-wrap gap-2 pt-1">
                              {msg.attachments.map((att) => (
                                <ChatAttachment
                                  key={att.id}
                                  att={att}
                                  workspaceSlug={slug ?? ''}
                                  issueId={activeIssue?.id ?? ''}
                                />
                              ))}
                            </div>
                          ) : null}
                        </div>
                      ) : (
                        <div className="max-w-[75%] rounded-xl px-4 py-3 bg-surface-2 border border-[var(--border)] text-[var(--text-muted)]">
                          <AssistantMessage content={msg.content} isStreaming={isStreamingThis} />
                        </div>
                      )}
                    </div>
                  );
                })
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Input bar */}
            <div className="p-4 border-t border-[var(--border)] bg-surface flex-shrink-0">
              {/* Model selector */}
              {availableCatalog.length > 0 && (
                <div className="flex items-center gap-2 mb-2 px-1">
                  <select
                    value={selProvider}
                    onChange={(e) => handleProviderChange(e.target.value)}
                    className="border border-[var(--border)] rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:border-primary/50 cursor-pointer"
                    style={{ backgroundColor: '#0f172a', color: '#ffffff' }}
                  >
                    {!selProvider && <option value="" style={{ backgroundColor: '#0f172a', color: '#ffffff' }}>Select provider</option>}
                    {availableCatalog.map((e) => (
                      <option key={e.provider} value={e.provider} style={{ backgroundColor: '#0f172a', color: '#ffffff' }}>{e.provider_display}</option>
                    ))}
                  </select>
                  {selProvider && providerModels.length > 0 && (
                    <>
                      <span className="text-text-dim text-xs">/</span>
                      <select
                        value={selModel}
                        onChange={(e) => handleModelSelectChange(e.target.value)}
                        className="border border-[var(--border)] rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:border-primary/50 cursor-pointer"
                        style={{ backgroundColor: '#0f172a', color: '#ffffff' }}
                      >
                        {providerModels.map((m) => (
                          <option key={m.id} value={m.id} style={{ backgroundColor: '#0f172a', color: '#ffffff' }}>{m.name} ({m.tier})</option>
                        ))}
                      </select>
                    </>
                  )}
                </div>
              )}
              {availableCatalog.length === 0 && userKeys.length === 0 && (
                <p className="text-xs text-amber-400/80 mb-2 px-1">Add an API key in Settings to start chatting.</p>
              )}
              {/* Pasted block (Claude-style) */}
              {pastedBlock && (
                <div className="mb-2 rounded-lg border border-[var(--border)] bg-surface-2 overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setPastedBlockExpanded((b) => !b)}
                    className="w-full flex items-center justify-between px-4 py-2 text-left text-sm text-[var(--text)] hover:bg-black/10"
                  >
                    <span className="font-medium">Pasted content</span>
                    <span className="text-text-dim text-xs">{pastedBlock.length.toLocaleString()} chars</span>
                  </button>
                  {pastedBlockExpanded && (
                    <pre className="px-4 py-3 text-xs text-[var(--text-muted)] overflow-auto max-h-48 whitespace-pre-wrap break-words border-t border-[var(--border)]">
                      {pastedBlock}
                    </pre>
                  )}
                  <div className="flex justify-end px-4 py-2 border-t border-[var(--border)]">
                    <button
                      type="button"
                      onClick={() => { setPastedBlock(null); setPastedBlockExpanded(false); }}
                      className="text-xs text-text-dim hover:text-[var(--text)]"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              )}
              {/* Attachment size/limit warning */}
              {attachmentWarning && (
                <div className="mb-2 flex items-start gap-2 rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-sm text-amber-200">
                  <span className="flex-1">{attachmentWarning}</span>
                  <button
                    type="button"
                    onClick={() => setAttachmentWarning(null)}
                    className="text-amber-300 hover:text-amber-100 shrink-0"
                    aria-label="Dismiss"
                  >
                    ×
                  </button>
                </div>
              )}
              {/* Composer: attachments + input (Claude-style: attachments visible inside the box) */}
              <div className="rounded-xl border border-[var(--border)] bg-surface-2 focus-within:border-primary/50 transition-colors overflow-hidden">
                {/* Attached files row - always visible when there are attachments */}
                {attachments.length > 0 && (
                  <div className="flex flex-wrap gap-2 px-3 pt-3 pb-1 border-b border-[var(--border)]">
                    {attachments.map((f, idx) => (
                      <span
                        key={`${f.name}-${idx}`}
                        className="inline-flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-primary/10 border border-primary/25 text-xs text-[var(--text)]"
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0">
                          <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
                        </svg>
                        <span className="truncate max-w-[140px]" title={f.name}>{f.name}</span>
                        <span className="text-text-dim shrink-0">{(f.size / 1024).toFixed(1)} KB</span>
                        <button
                          type="button"
                          onClick={() => removeAttachment(idx)}
                          className="text-text-dim hover:text-red-400 shrink-0 p-0.5"
                          aria-label="Remove"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                )}
                <div className="flex items-end gap-2 px-4 py-3">
                  {attachmentsAllowed ? (
                    <>
                      <input
                        type="file"
                        id="attachment-input"
                        accept={ACCEPT_ATTACHMENTS}
                        multiple
                        className="hidden"
                        onChange={handleFileChange}
                      />
                      <label
                        htmlFor="attachment-input"
                        className="w-9 h-9 rounded-lg flex items-center justify-center text-text-dim hover:text-[var(--text)] hover:bg-black/10 cursor-pointer flex-shrink-0"
                        title={`Attach images or logs (max ${MAX_ATTACHMENTS} files, 5 MB each)`}
                      >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
                        </svg>
                      </label>
                    </>
                  ) : (
                    <span
                      className="w-9 h-9 rounded-lg flex items-center justify-center text-text-dim flex-shrink-0 cursor-help"
                      title="File attachments are available on Pro and Founding Member plans"
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
                      </svg>
                    </span>
                  )}
                  <textarea
                    ref={textareaRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value.slice(0, MAX_INPUT_CHARS))}
                    onPaste={handlePaste}
                    onKeyDown={handleKeyDown}
                    maxLength={MAX_INPUT_CHARS}
                    placeholder={attachments.length > 0 ? "Add a message (optional) or send to analyze attachments..." : "Describe your error, paste output, or attach files..."}
                    rows={2}
                    className="flex-1 bg-transparent border-0 resize-none text-sm text-[var(--text)] placeholder:text-text-dim focus:outline-none min-h-[40px] max-h-[200px]"
                  />
                  <button
                    type="button"
                    onClick={handleSend}
                    disabled={!canSend}
                    className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center text-white hover:bg-primary-bright transition-colors disabled:opacity-40 disabled:pointer-events-none flex-shrink-0"
                    title="Send"
                  >
                    {sending ? (
                      <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="31.4" strokeLinecap="round" />
                      </svg>
                    ) : (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <line x1="22" y1="2" x2="11" y2="13" />
                        <polygon points="22,2 15,22 11,13 2,9" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center max-w-md">
              {isWorkspaceLocked ? (
                <>
                  <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mx-auto mb-5">
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-amber-500">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                      <path d="M7 11V7a5 5 0 0110 0v4" />
                    </svg>
                  </div>
                  <h2 className="text-xl font-bold text-[var(--text)] mb-2">Workspace locked</h2>
                  <p className="text-sm text-text-dim mb-6">
                    This workspace is locked because your plan allows fewer workspaces. Renew your plan or upgrade to unlock it. You can also delete a workspace to free a slot.
                  </p>
                  <Link to="/pricing" className="inline-flex items-center justify-center px-4 py-2 rounded-lg bg-primary text-white text-sm font-medium hover:bg-primary-bright transition-colors">
                    View plans
                  </Link>
                </>
              ) : (
                <>
                  <img src="/logo.png" alt="" className="w-14 h-14 rounded-2xl object-contain mx-auto mb-5 opacity-50" />
                  <h2 className="text-xl font-bold text-[var(--text)] mb-2">
                    {slug ? 'Ready to debug' : 'Select a workspace'}
                  </h2>
                  <p className="text-sm text-text-dim mb-6">
                    {slug
                      ? 'Create a new issue or select one from the sidebar to start a conversation.'
                      : 'Pick a workspace from the sidebar to see your issues.'}
                  </p>
                  {slug && (
                    <Button onClick={handleNewIssue}>+ New issue</Button>
                  )}
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Delete confirmation */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50" onClick={() => setDeleteConfirmId(null)}>
          <div className="bg-surface border border-[var(--border)] rounded-xl shadow-xl w-full max-w-sm mx-4 p-5" onClick={(e) => e.stopPropagation()}>
            <p className="text-sm text-[var(--text)] mb-4">Delete this issue? Messages will be permanently removed. This cannot be undone.</p>
            <div className="flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setDeleteConfirmId(null)}>Cancel</Button>
              <Button variant="destructive" onClick={() => handleDeleteIssue(deleteConfirmId)}>Delete</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
