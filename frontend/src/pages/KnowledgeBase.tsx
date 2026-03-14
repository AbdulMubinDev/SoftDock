import { useState, useEffect, useCallback } from 'react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { useWorkspaceStore } from '../lib/stores/workspaceStore';
import { api } from '../lib/api';

interface KnowledgeDoc {
  id: string;
  title: string;
  source_type: string;
  source_url: string;
  is_active: boolean;
  processing_status: string;
  char_count: number;
  chunk_count: number;
  created_at: string;
}

const sourceLabels: Record<string, string> = {
  upload: 'Upload',
  github_issue: 'GitHub',
  url: 'URL',
  manual: 'Manual',
};

const statusColors: Record<string, string> = {
  pending: 'text-amber-400 bg-amber-400/10',
  processing: 'text-blue-400 bg-blue-400/10',
  ready: 'text-green-400 bg-green-400/10',
  failed: 'text-red-400 bg-red-400/10',
};

export function KnowledgeBase() {
  const { activeWorkspace } = useWorkspaceStore();
  const slug = activeWorkspace?.slug;

  const [docs, setDocs] = useState<KnowledgeDoc[]>([]);
  const [loading, setLoading] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const [showAdd, setShowAdd] = useState(false);
  const [addTitle, setAddTitle] = useState('');
  const [addContent, setAddContent] = useState('');
  const [addUrl, setAddUrl] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchDocs = useCallback(() => {
    if (!slug) return;
    setLoading(true);
    api.get(`/workspaces/${slug}/knowledge/`).then((res) => {
      setDocs(res.data.results ?? res.data);
    }).catch(() => {}).finally(() => setLoading(false));
  }, [slug]);

  useEffect(() => { fetchDocs(); }, [fetchDocs]);

  const handleAdd = async () => {
    if (!slug || (!addContent.trim() && !addUrl.trim()) || !addTitle.trim()) return;
    setSubmitting(true);
    try {
      await api.post(`/workspaces/${slug}/knowledge/`, {
        title: addTitle.trim(),
        source_type: addUrl ? 'url' : 'manual',
        source_url: addUrl.trim() || undefined,
        raw_content: addContent.trim() || undefined,
      });
      setAddTitle('');
      setAddContent('');
      setAddUrl('');
      setShowAdd(false);
      fetchDocs();
    } catch {} finally {
      setSubmitting(false);
    }
  };

  const handleToggle = async (doc: KnowledgeDoc) => {
    try {
      await api.patch(`/workspaces/${slug}/knowledge/${doc.id}/`, { is_active: !doc.is_active });
      setDocs((prev) => prev.map((d) => d.id === doc.id ? { ...d, is_active: !d.is_active } : d));
    } catch {}
  };

  const handleDelete = async (id: string) => {
    try {
      await api.delete(`/workspaces/${slug}/knowledge/${id}/`);
      setDocs((prev) => prev.filter((d) => d.id !== id));
    } catch {}
  };

  if (!slug) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-text-dim text-sm">Select a workspace to manage knowledge documents.</p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text)]">Knowledge Base</h1>
          <p className="text-sm text-text-muted mt-1">
            Add documentation, GitHub issues, or raw text. SoftDock uses these as context.
          </p>
        </div>
        <Button onClick={() => setShowAdd(!showAdd)}>
          {showAdd ? 'Cancel' : '+ Add document'}
        </Button>
      </div>

      {showAdd && (
        <Card className="p-6 mb-6 space-y-4">
          <input
            type="text"
            value={addTitle}
            onChange={(e) => setAddTitle(e.target.value)}
            placeholder="Document title"
            className="w-full bg-surface-2 border border-[var(--border)] rounded-lg px-4 py-2.5 text-sm text-[var(--text)] placeholder:text-text-dim focus:outline-none focus:border-primary/50"
          />
          <input
            type="url"
            value={addUrl}
            onChange={(e) => setAddUrl(e.target.value)}
            placeholder="Source URL (optional) — paste a docs page or GitHub issue"
            className="w-full bg-surface-2 border border-[var(--border)] rounded-lg px-4 py-2.5 text-sm text-[var(--text)] placeholder:text-text-dim focus:outline-none focus:border-primary/50"
          />
          <div
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => { e.preventDefault(); setDragOver(false); }}
            className={`border-2 border-dashed rounded-xl transition-colors ${
              dragOver ? 'border-primary bg-primary/5' : 'border-[var(--border)]'
            }`}
          >
            <textarea
              value={addContent}
              onChange={(e) => setAddContent(e.target.value)}
              placeholder="Paste raw documentation content here..."
              rows={6}
              className="w-full bg-transparent rounded-xl px-4 py-3 text-sm text-[var(--text)] placeholder:text-text-dim focus:outline-none resize-none"
            />
          </div>
          <Button onClick={handleAdd} disabled={submitting || !addTitle.trim()}>
            {submitting ? 'Adding...' : 'Add document'}
          </Button>
        </Card>
      )}

      {loading ? (
        <div className="text-center py-12 text-text-dim text-sm">Loading documents...</div>
      ) : docs.length === 0 ? (
        <div className="text-center py-16 text-text-dim">
          <div className="w-14 h-14 rounded-2xl bg-surface-2 border border-[var(--border)] flex items-center justify-center mx-auto mb-4">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-text-dim">
              <path d="M4 19.5A2.5 2.5 0 016.5 17H20" />
              <path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" />
            </svg>
          </div>
          <p className="text-sm font-medium text-[var(--text)] mb-1">No documents yet</p>
          <p className="text-[13px]">Add documentation to give SoftDock context about your project.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {docs.map((doc) => (
            <Card key={doc.id} className="p-4 flex flex-col">
              <div className="flex items-start justify-between gap-2 mb-2">
                <span className="text-xs font-semibold text-primary-bright bg-primary/10 border border-primary/25 px-2 py-0.5 rounded-full">
                  {sourceLabels[doc.source_type] ?? doc.source_type}
                </span>
                <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${statusColors[doc.processing_status] ?? ''}`}>
                  {doc.processing_status}
                </span>
              </div>
              <h3 className="font-medium text-sm text-[var(--text)] truncate mb-1">{doc.title}</h3>
              <p className="text-xs text-text-dim mb-4">
                {doc.char_count.toLocaleString()} chars · {doc.chunk_count} chunks
              </p>
              <div className="mt-auto flex gap-2">
                <button
                  type="button"
                  onClick={() => handleToggle(doc)}
                  className={`flex-1 text-xs font-medium py-1.5 rounded-lg transition-colors cursor-pointer ${
                    doc.is_active
                      ? 'bg-green-400/10 text-green-400 hover:bg-green-400/20'
                      : 'bg-surface-2 text-text-dim hover:bg-surface-3'
                  }`}
                >
                  {doc.is_active ? 'Active' : 'Inactive'}
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(doc.id)}
                  className="text-xs text-red-400/70 hover:text-red-400 hover:bg-red-400/10 px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
                >
                  Delete
                </button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
