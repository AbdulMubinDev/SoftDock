import { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '../components/ui/Button';
import { useIssueStore, type Issue } from '../lib/stores/issueStore';
import { useWorkspaceStore } from '../lib/stores/workspaceStore';
import { api, getWsUrl } from '../lib/api';

export function Dashboard() {
  const { issues, setIssues, activeIssue, setActiveIssue, appendMessage, updateStreamingContent } =
    useIssueStore();
  const { activeWorkspace } = useWorkspaceStore();

  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [streaming, setStreaming] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const streamBuffer = useRef('');

  const slug = activeWorkspace?.slug;

  useEffect(() => {
    if (!slug) return;
    api.get(`/workspaces/${slug}/issues/`).then((res) => {
      setIssues(res.data.results ?? res.data);
    }).catch(() => {});
  }, [slug, setIssues]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeIssue?.messages]);

  useEffect(() => {
    return () => {
      wsRef.current?.close();
    };
  }, []);

  const connectAndStream = useCallback(
    (issueId: string) => {
      wsRef.current?.close();
      streamBuffer.current = '';
      const token = localStorage.getItem('access_token');
      const ws = new WebSocket(getWsUrl(`/issues/${issueId}/?token=${token}`));

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
          setStreaming(false);
          ws.close();
        } else if (data.type === 'error') {
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

      ws.onerror = () => setStreaming(false);
      ws.onclose = () => setStreaming(false);

      wsRef.current = ws;
    },
    [appendMessage, updateStreamingContent],
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

  const handleSend = async () => {
    if (!input.trim() || !slug || !activeIssue || sending || streaming) return;
    const content = input.trim();
    setInput('');
    setSending(true);

    try {
      // 1. Save user message via REST (single source of truth)
      const { data } = await api.post(
        `/workspaces/${slug}/issues/${activeIssue.id}/messages/`,
        { content },
      );
      appendMessage(activeIssue.id, data);

      // Update title in sidebar if it was empty
      if (!activeIssue.title && data.content) {
        const updatedTitle = data.content.slice(0, 120);
        setActiveIssue({ ...activeIssue, title: updatedTitle, messages: [...(activeIssue.messages ?? []), data] });
        setIssues(issues.map((i) => (i.id === activeIssue.id ? { ...i, title: updatedTitle } : i)));
      }

      // 2. Open WS and send "stream" to trigger AI response
      connectAndStream(activeIssue.id);
    } catch {
      appendMessage(activeIssue.id, {
        id: `error-${Date.now()}`,
        role: 'assistant',
        content: 'Failed to send message. Check your connection and try again.',
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

  const handleResolve = async () => {
    if (!slug || !activeIssue) return;
    try {
      await api.patch(`/workspaces/${slug}/issues/${activeIssue.id}/`, { status: 'resolved' });
      setActiveIssue({ ...activeIssue, status: 'resolved' });
      setIssues(issues.map((i) => (i.id === activeIssue.id ? { ...i, status: 'resolved' } : i)));
    } catch {}
  };

  const messages = activeIssue?.messages ?? [];

  return (
    <div className="h-[calc(100vh-3.5rem)] flex min-w-0">
      {/* Issue sidebar */}
      <div className="w-72 flex-shrink-0 border-r border-[var(--border)] bg-surface flex flex-col">
        <div className="p-3 border-b border-[var(--border)]">
          <Button size="sm" className="w-full !text-sm" onClick={handleNewIssue} disabled={!slug}>
            + New issue
          </Button>
        </div>
        <div className="flex-1 overflow-y-auto">
          {!slug ? (
            <div className="p-4 text-sm text-text-dim text-center">Select a workspace first</div>
          ) : issues.length === 0 ? (
            <div className="p-4 text-sm text-text-dim text-center">No issues yet</div>
          ) : (
            issues.map((issue) => (
              <button
                key={issue.id}
                type="button"
                onClick={() => handleSelectIssue(issue)}
                className={`w-full text-left px-4 py-3 border-b border-[var(--border)] transition-colors cursor-pointer ${
                  activeIssue?.id === issue.id
                    ? 'bg-primary/10 border-l-2 border-l-primary'
                    : 'hover:bg-surface-2'
                }`}
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
            ))
          )}
        </div>
      </div>

      {/* Chat area */}
      <div className="flex-1 flex flex-col min-w-0">
        {activeIssue ? (
          <>
            {/* Issue header */}
            <div className="flex items-center justify-between px-5 py-3 border-b border-[var(--border)] bg-surface flex-shrink-0">
              <div className="flex items-center gap-3 min-w-0">
                <span
                  className={`w-2 h-2 rounded-full flex-shrink-0 ${
                    activeIssue.status === 'resolved' ? 'bg-green-400' : 'bg-primary-bright'
                  }`}
                />
                <h2 className="text-sm font-semibold text-[var(--text)] truncate">
                  {activeIssue.title || 'New issue'}
                </h2>
                <span className="text-[11px] text-text-dim capitalize px-2 py-0.5 rounded-full border border-[var(--border)]">
                  {activeIssue.status}
                </span>
              </div>
              {activeIssue.status === 'open' && (
                <Button variant="ghost" size="sm" onClick={handleResolve}>
                  Mark resolved
                </Button>
              )}
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
                messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
                  >
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                        msg.role === 'user'
                          ? 'bg-primary text-white'
                          : 'bg-surface-2 border border-[var(--border)] text-primary-bright'
                      }`}
                    >
                      {msg.role === 'user' ? 'U' : (
                        <img src="/logo.png" alt="" className="w-5 h-5 rounded object-contain" />
                      )}
                    </div>
                    <div
                      className={`max-w-[75%] rounded-xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${
                        msg.role === 'user'
                          ? 'bg-primary/10 border border-primary/25 text-[var(--text)]'
                          : 'bg-surface-2 border border-[var(--border)] text-[var(--text-muted)]'
                      }`}
                    >
                      {msg.content}
                      {streaming && msg === messages[messages.length - 1] && msg.role === 'assistant' && (
                        <span className="inline-block w-0.5 h-4 bg-primary-bright ml-0.5 align-middle animate-blink" />
                      )}
                    </div>
                  </div>
                ))
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Input bar */}
            <div className="p-4 border-t border-[var(--border)] bg-surface flex-shrink-0">
              <div className="flex items-end gap-3 bg-surface-2 border border-[var(--border)] rounded-xl px-4 py-3 focus-within:border-primary/50 transition-colors">
                <textarea
                  ref={textareaRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Describe your error or paste terminal output..."
                  rows={2}
                  className="flex-1 bg-transparent border-0 resize-none text-sm text-[var(--text)] placeholder:text-text-dim focus:outline-none min-h-[40px] max-h-[200px]"
                />
                <button
                  type="button"
                  onClick={handleSend}
                  disabled={!input.trim() || sending || streaming}
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
              {streaming && (
                <div className="mt-2 flex items-center gap-2 text-xs text-text-dim">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary-bright animate-pulse" />
                  SoftDock is thinking...
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center max-w-md">
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
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
