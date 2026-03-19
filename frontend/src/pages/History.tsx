import { useState, useEffect } from 'react';
import { Badge } from '../components/ui/Badge';
import { MarkdownMessage } from '../components/chat/MarkdownMessage';
import { useWorkspaceStore } from '../lib/stores/workspaceStore';
import { type Issue, type IssueStatus } from '../lib/stores/issueStore';
import { api } from '../lib/api';

const statusBadge: Record<IssueStatus, 'open' | 'resolved' | 'archived'> = {
  open: 'open',
  resolved: 'resolved',
  archived: 'archived',
};

const tabs = ['all', 'resolved', 'archived'] as const;

export function History() {
  const { activeWorkspace } = useWorkspaceStore();
  const slug = activeWorkspace?.slug;

  const [allIssues, setAllIssues] = useState<Issue[]>([]);
  const [filter, setFilter] = useState<(typeof tabs)[number]>('all');
  const [loading, setLoading] = useState(false);
  const [detail, setDetail] = useState<Issue | null>(null);

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    api.get(`/workspaces/${slug}/issues/`).then((res) => {
      setAllIssues(res.data.results ?? res.data);
    }).catch(() => {}).finally(() => setLoading(false));
  }, [slug]);

  const filtered = filter === 'all' ? allIssues : allIssues.filter((i) => i.status === filter);

  const handleViewThread = async (issue: Issue) => {
    if (!slug) return;
    try {
      const { data } = await api.get(`/workspaces/${slug}/issues/${issue.id}/`);
      setDetail(data);
    } catch {
      setDetail(issue);
    }
  };

  if (!slug) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-text-dim text-sm">Select a workspace to view issue history.</p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[var(--text)]">Issue History</h1>
        <p className="text-sm text-text-muted mt-1">
          Resolved and archived issues are used as context for future debugging.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 border-b border-[var(--border)]">
        {tabs.map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setFilter(tab)}
            className={`px-4 py-2.5 text-sm font-medium transition-colors capitalize cursor-pointer ${
              filter === tab
                ? 'text-primary-bright border-b-2 border-primary'
                : 'text-text-dim hover:text-[var(--text)]'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Detail drawer */}
      {detail && (
        <div className="mb-6 rounded-xl border border-[var(--border)] bg-surface-2 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3 border-b border-[var(--border)]">
            <h3 className="text-sm font-semibold text-[var(--text)]">{detail.title}</h3>
            <button type="button" onClick={() => setDetail(null)} className="text-text-dim hover:text-[var(--text)] text-lg cursor-pointer">&times;</button>
          </div>
          <div className="p-5 max-h-80 overflow-y-auto space-y-3">
            {(detail.messages ?? []).length === 0 ? (
              <p className="text-text-dim text-sm">No messages in this thread.</p>
            ) : (
              (detail.messages ?? []).map((msg) => (
                <div key={msg.id} className={`flex gap-2.5 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                  <div className={`max-w-[80%] rounded-lg px-3.5 py-2.5 text-sm ${
                    msg.role === 'user'
                      ? 'bg-primary/10 border border-primary/20 text-[var(--text)] whitespace-pre-wrap'
                      : 'bg-surface border border-[var(--border)] text-text-muted'
                  }`}>
                    {msg.role === 'assistant' ? (
                      <MarkdownMessage content={msg.content} />
                    ) : msg.content}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {loading ? (
        <div className="text-center py-12 text-text-dim text-sm">Loading issues...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-text-dim">
          <p className="text-sm">No {filter === 'all' ? '' : filter} issues found.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((issue) => (
            <div
              key={issue.id}
              className="rounded-xl border border-[var(--border)] bg-surface p-4 flex items-center justify-between gap-4 hover:border-primary/20 transition-colors"
            >
              <div className="min-w-0 flex-1">
                <h3 className="font-medium text-sm text-[var(--text)] truncate">{issue.title || 'Untitled'}</h3>
                <div className="flex items-center gap-3 mt-1.5">
                  <Badge status={statusBadge[issue.status]} dot>{issue.status}</Badge>
                  <span className="text-[11px] text-text-dim">
                    {issue.resolved_at
                      ? `Resolved ${new Date(issue.resolved_at).toLocaleDateString()}`
                      : `Created ${new Date(issue.created_at).toLocaleDateString()}`}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleViewThread(issue)}
                className="text-sm text-primary-bright hover:underline flex-shrink-0 cursor-pointer"
              >
                View thread
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
