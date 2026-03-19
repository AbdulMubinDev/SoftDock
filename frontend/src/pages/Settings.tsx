import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { useAuthStore } from '../lib/stores/authStore';
import { useWorkspaceStore, type Workspace } from '../lib/stores/workspaceStore';
import { api } from '../lib/api';

type ProviderSlug = 'anthropic' | 'openai' | 'google' | 'groq' | 'xai' | 'openrouter';

const PROVIDERS: { value: ProviderSlug; label: string }[] = [
  { value: 'anthropic', label: 'Anthropic (Claude)' },
  { value: 'openai', label: 'OpenAI (GPT)' },
  { value: 'google', label: 'Google (Gemini / Vertex AI)' },
  { value: 'groq', label: 'Groq' },
  { value: 'xai', label: 'xAI (Grok)' },
  { value: 'openrouter', label: 'OpenRouter' },
];

interface ApiKeyEntry {
  id: string;
  name: string;
  provider: string;
  provider_display: string;
  order: number;
  created_at: string;
}

export function Settings() {
  const { user, setUser } = useAuthStore();
  const { activeWorkspace, setActiveWorkspace, workspaces, setWorkspaces } = useWorkspaceStore();

  const [fullName, setFullName] = useState(user?.full_name ?? '');
  const [bio, setBio] = useState(user?.bio ?? '');
  const [emailNotifications, setEmailNotifications] = useState(user?.email_notifications ?? true);
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileMsg, setProfileMsg] = useState('');

  const [apiKeys, setApiKeys] = useState<ApiKeyEntry[]>([]);
  const [apiKeysLoading, setApiKeysLoading] = useState(true);
  const [addKeyOpen, setAddKeyOpen] = useState(false);
  const [addKeyName, setAddKeyName] = useState('');
  const [addKeyProvider, setAddKeyProvider] = useState<ProviderSlug>('anthropic');
  const [addKeyValue, setAddKeyValue] = useState('');
  const [addKeySubmitting, setAddKeySubmitting] = useState(false);
  const [addKeyError, setAddKeyError] = useState('');

  const [oldPw, setOldPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [pwMsg, setPwMsg] = useState('');

  const [newWsName, setNewWsName] = useState('');
  const [wsCreating, setWsCreating] = useState(false);
  const [deleteAccountConfirm, setDeleteAccountConfirm] = useState('');

  useEffect(() => {
    setFullName(user?.full_name ?? '');
    setBio(user?.bio ?? '');
    setEmailNotifications(user?.email_notifications ?? true);
  }, [user]);

  useEffect(() => {
    if (workspaces.length === 0) {
      api.get('/workspaces/').then((res) => {
        const list: Workspace[] = res.data.results ?? res.data;
        setWorkspaces(list);
        if (list.length && !activeWorkspace) setActiveWorkspace(list[0]);
      }).catch(() => {});
    }
  }, [workspaces.length, setWorkspaces, setActiveWorkspace, activeWorkspace]);

  const fetchApiKeys = useCallback(() => {
    setApiKeysLoading(true);
    api.get<ApiKeyEntry[]>('/auth/api-keys/').then((res) => setApiKeys(Array.isArray(res.data) ? res.data : [])).catch(() => {}).finally(() => setApiKeysLoading(false));
  }, []);

  useEffect(() => { fetchApiKeys(); }, [fetchApiKeys]);

  const handleSaveProfile = async () => {
    setProfileSaving(true);
    setProfileMsg('');
    try {
      const { data } = await api.put('/auth/me/', {
        full_name: fullName,
        bio: bio.slice(0, 2000),
        email_notifications: emailNotifications,
      });
      setUser(data);
      setProfileMsg('Profile saved.');
    } catch {
      setProfileMsg('Failed to save.');
    } finally {
      setProfileSaving(false);
    }
  };

  const handleAddKey = async () => {
    if (!addKeyName.trim() || !addKeyValue.trim() || addKeySubmitting) return;
    setAddKeyError('');
    setAddKeySubmitting(true);
    try {
      await api.post('/auth/api-keys/', { name: addKeyName.trim(), provider: addKeyProvider, api_key: addKeyValue });
      setAddKeyName('');
      setAddKeyValue('');
      setAddKeyOpen(false);
      fetchApiKeys();
    } catch (e: unknown) {
      const d = e && typeof e === 'object' && 'response' in e ? (e as { response?: { data?: Record<string, string[]> } }).response?.data : null;
      setAddKeyError(d?.name?.[0] ?? d?.api_key?.[0] ?? 'Failed to add key.');
    } finally {
      setAddKeySubmitting(false);
    }
  };

  const handleDeleteKey = async (id: string) => {
    try {
      await api.delete(`/auth/api-keys/${id}/`);
      fetchApiKeys();
    } catch {}
  };

  const [draggedKeyId, setDraggedKeyId] = useState<string | null>(null);
  const [dropIndex, setDropIndex] = useState<number | null>(null);

  const handleKeyDragStart = (e: React.DragEvent, id: string) => {
    setDraggedKeyId(id);
    e.dataTransfer.setData('text/plain', id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleKeyDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (draggedKeyId) setDropIndex(index);
  };

  const handleKeyDragLeave = () => {
    setDropIndex(null);
  };

  const handleKeyDrop = async (e: React.DragEvent, toIndex: number) => {
    e.preventDefault();
    setDropIndex(null);
    setDraggedKeyId(null);
    const id = e.dataTransfer.getData('text/plain');
    if (!id) return;
    const fromIndex = apiKeys.findIndex((k) => k.id === id);
    if (fromIndex < 0 || fromIndex === toIndex) return;
    try {
      await api.patch(`/auth/api-keys/${id}/`, { order: toIndex });
      fetchApiKeys();
    } catch {}
  };

  const handleKeyDragEnd = () => {
    setDraggedKeyId(null);
    setDropIndex(null);
  };

  const handleChangePassword = async () => {
    setPwMsg('');
    try {
      await api.post('/auth/change-password/', { old_password: oldPw, new_password: newPw });
      setOldPw('');
      setNewPw('');
      setPwMsg('Password updated.');
    } catch (err: unknown) {
      const res = err && typeof err === 'object' && 'response' in err ? (err as { response?: { data?: Record<string, string[]> } }).response?.data : null;
      setPwMsg(res?.old_password?.[0] ?? res?.new_password?.[0] ?? 'Failed.');
    }
  };

  const handleCreateWorkspace = async () => {
    if (!newWsName.trim() || wsCreating) return;
    setWsCreating(true);
    try {
      const { data } = await api.post('/workspaces/', { name: newWsName.trim() });
      setWorkspaces([data, ...workspaces]);
      setActiveWorkspace(data);
      setNewWsName('');
    } catch {} finally {
      setWsCreating(false);
    }
  };

  const handleRenameWorkspace = async (slug: string, name: string) => {
    try {
      const { data } = await api.patch(`/workspaces/${slug}/`, { name });
      setWorkspaces(workspaces.map((w) => (w.id === data.id ? data : w)));
      if (activeWorkspace?.slug === slug) setActiveWorkspace(data);
    } catch {}
  };

  const handleDeleteWorkspace = async (slug: string, name: string) => {
    if (!confirm(`Delete workspace "${name}"? This cannot be undone.`)) return;
    try {
      await api.delete(`/workspaces/${slug}/`);
      const remaining = workspaces.filter((w) => w.slug !== slug);
      setWorkspaces(remaining);
      if (activeWorkspace?.slug === slug) setActiveWorkspace(remaining[0] ?? null);
    } catch {}
  };

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[var(--text)]">Settings</h1>
        <p className="text-sm text-text-muted mt-1">
          Manage your profile, security, workspaces, and preferences.
        </p>
      </div>

      {/* Profile */}
      <Card className="mb-6">
        <CardHeader>
          <h2 className="font-semibold text-[var(--text)]">Profile</h2>
          <p className="text-sm text-text-muted mt-1">Update your name and about yourself.</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            label="Full name"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Your name"
          />
          <div>
            <label className="block text-sm font-medium text-[var(--text)] mb-1.5">About yourself</label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="A short bio (optional)"
              rows={3}
              maxLength={2000}
              className="w-full bg-surface-2 border border-[var(--border)] rounded-lg px-3 py-2.5 text-sm text-[var(--text)] placeholder:text-text-dim focus:outline-none focus:border-primary/50 resize-none"
            />
            <p className="text-[11px] text-text-dim mt-1">{bio.length}/2000</p>
          </div>
          <div className="flex items-center gap-3">
            <Button onClick={handleSaveProfile} disabled={profileSaving}>
              {profileSaving ? 'Saving...' : 'Save profile'}
            </Button>
            {profileMsg && <span className="text-sm text-text-muted">{profileMsg}</span>}
          </div>
        </CardContent>
      </Card>

      {/* Notifications */}
      <Card className="mb-6">
        <CardHeader>
          <h2 className="font-semibold text-[var(--text)]">Notifications</h2>
          <p className="text-sm text-text-muted mt-1">Choose how you receive updates.</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={emailNotifications}
              onChange={(e) => setEmailNotifications(e.target.checked)}
              className="w-4 h-4 rounded border-[var(--border)] text-primary focus:ring-primary/30"
            />
            <span className="text-sm text-[var(--text)]">Email notifications (product updates, tips)</span>
          </label>
          <p className="text-xs text-text-dim">Saving your profile also saves this preference.</p>
        </CardContent>
      </Card>

      {/* Security — Password */}
      <Card className="mb-6">
        <CardHeader>
          <h2 className="font-semibold text-[var(--text)]">Security</h2>
          <p className="text-sm text-text-muted mt-1">Change your password.</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            label="Current password"
            type="password"
            value={oldPw}
            onChange={(e) => setOldPw(e.target.value)}
          />
          <Input
            label="New password"
            type="password"
            value={newPw}
            onChange={(e) => setNewPw(e.target.value)}
          />
          <div className="flex items-center gap-3">
            <Button variant="secondary" onClick={handleChangePassword} disabled={!oldPw || !newPw}>
              Update password
            </Button>
            {pwMsg && <span className="text-sm text-text-muted">{pwMsg}</span>}
          </div>
        </CardContent>
      </Card>

      {/* Workspaces */}
      <Card className="mb-6">
        <CardHeader>
          <h2 className="font-semibold text-[var(--text)]">Workspaces</h2>
          <p className="text-sm text-text-muted mt-1">Create and manage your workspaces.</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <input
              type="text"
              value={newWsName}
              onChange={(e) => setNewWsName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCreateWorkspace()}
              placeholder="New workspace name"
              className="flex-1 bg-surface-2 border border-[var(--border)] rounded-lg px-3 py-2 text-sm text-[var(--text)] placeholder:text-text-dim focus:outline-none focus:border-primary/50"
            />
            <Button onClick={handleCreateWorkspace} disabled={!newWsName.trim() || wsCreating}>
              {wsCreating ? 'Creating...' : 'Create'}
            </Button>
          </div>
          <ul className="space-y-2">
            {workspaces.map((ws) => (
              <WorkspaceRow
                key={ws.id}
                workspace={ws}
                isActive={activeWorkspace?.id === ws.id}
                onRename={(name) => handleRenameWorkspace(ws.slug, name)}
                onDelete={() => handleDeleteWorkspace(ws.slug, ws.name)}
              />
            ))}
          </ul>
          {workspaces.length === 0 && (
            <p className="text-sm text-text-dim">No workspaces yet. Create one above.</p>
          )}
        </CardContent>
      </Card>

      {/* API keys — generic wording, no stack disclosure */}
      <Card className="mb-6">
        <CardHeader>
          <h2 className="font-semibold text-[var(--text)]">Keys</h2>
          <p className="text-sm text-text-muted mt-1">
            Add at least one key to use the assistant. Add more for fallback. Keys are stored encrypted.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button onClick={() => { setAddKeyOpen(true); setAddKeyError(''); }}>
            Add key
          </Button>

          {apiKeysLoading ? (
            <p className="text-sm text-text-dim">Loading…</p>
          ) : apiKeys.length === 0 ? (
            <p className="text-sm text-amber-500/90">Add at least one key to use the assistant.</p>
          ) : (
            <ul className="space-y-2">
              {apiKeys.map((key, idx) => (
                <li
                  key={key.id}
                  draggable={false}
                  onDragOver={(e) => handleKeyDragOver(e, idx)}
                  onDragLeave={handleKeyDragLeave}
                  onDrop={(e) => handleKeyDrop(e, idx)}
                  className={`flex items-center gap-2 rounded-lg border px-3 py-2.5 transition-colors ${
                    dropIndex === idx ? 'border-primary/50 bg-primary/5' : 'border-[var(--border)] bg-surface-2/50'
                  } ${draggedKeyId === key.id ? 'opacity-50' : ''}`}
                >
                  <div
                    draggable
                    onDragStart={(e) => handleKeyDragStart(e, key.id)}
                    onDragEnd={handleKeyDragEnd}
                    className="shrink-0 w-8 h-8 -ml-1 flex items-center justify-center rounded cursor-grab active:cursor-grabbing text-text-dim hover:text-[var(--text)] hover:bg-surface-3/50 touch-none"
                    title="Drag to reorder"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" className="pointer-events-none">
                      <circle cx="9" cy="6" r="1.5" />
                      <circle cx="15" cy="6" r="1.5" />
                      <circle cx="9" cy="12" r="1.5" />
                      <circle cx="15" cy="12" r="1.5" />
                      <circle cx="9" cy="18" r="1.5" />
                      <circle cx="15" cy="18" r="1.5" />
                    </svg>
                  </div>
                  <span className="flex-1 min-w-0">
                    <span className="font-medium text-sm text-[var(--text)]">{key.name}</span>
                    <span className="text-text-dim text-xs ml-2">({key.provider_display})</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => handleDeleteKey(key.id)}
                    className="text-xs text-red-400 hover:bg-red-400/10 px-1.5 py-0.5 rounded shrink-0 cursor-pointer"
                  >
                    Remove
                  </button>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      {/* Add key modal */}
      {addKeyOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50" onClick={() => !addKeySubmitting && setAddKeyOpen(false)}>
          <div
            className="bg-surface border border-[var(--border)] rounded-xl shadow-xl w-full max-w-md mx-4 p-5"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold text-[var(--text)] mb-4">Add key</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[var(--text)] mb-1">Name</label>
                <input
                  type="text"
                  value={addKeyName}
                  onChange={(e) => setAddKeyName(e.target.value)}
                  placeholder="e.g. Work account"
                  className="w-full bg-surface-2 border border-[var(--border)] rounded-lg px-3 py-2 text-sm text-[var(--text)] placeholder:text-text-dim focus:outline-none focus:border-primary/50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--text)] mb-1">Provider</label>
                <select
                  value={addKeyProvider}
                  onChange={(e) => setAddKeyProvider(e.target.value as ProviderSlug)}
                  className="w-full bg-surface-2 border border-[var(--border)] rounded-lg px-3 py-2 text-sm text-[var(--text)] focus:outline-none focus:border-primary/50"
                >
                  {PROVIDERS.map((p) => (
                    <option key={p.value} value={p.value}>{p.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--text)] mb-1">Key</label>
                <input
                  type="password"
                  value={addKeyValue}
                  onChange={(e) => setAddKeyValue(e.target.value)}
                  placeholder="Paste your key"
                  className="w-full bg-surface-2 border border-[var(--border)] rounded-lg px-3 py-2 text-sm text-[var(--text)] placeholder:text-text-dim focus:outline-none focus:border-primary/50"
                />
              </div>
              {addKeyError && <p className="text-sm text-red-400">{addKeyError}</p>}
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="secondary" onClick={() => !addKeySubmitting && setAddKeyOpen(false)} disabled={addKeySubmitting}>
                  Cancel
                </Button>
                <Button onClick={handleAddKey} disabled={!addKeyName.trim() || !addKeyValue.trim() || addKeySubmitting}>
                  {addKeySubmitting ? 'Adding…' : 'Add'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Billing */}
      <Card className="mb-6">
        <CardHeader>
          <h2 className="font-semibold text-[var(--text)]">Plan & billing</h2>
          <p className="text-sm text-text-muted mt-1">Manage your subscription.</p>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-[var(--text)]">
            Current plan: <span className="font-medium text-primary-bright">{user?.subscription_plan_name ?? 'Free'}</span>
          </p>
          <Link to="/pricing" className="text-sm text-primary-bright hover:underline">
            View plans and upgrade →
          </Link>
        </CardContent>
      </Card>

      {/* Danger zone — Delete account */}
      <Card className="border-red-400/20">
        <CardHeader>
          <h2 className="font-semibold text-red-400">Danger zone</h2>
          <p className="text-sm text-text-muted mt-1">Permanently delete your account and all data.</p>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-text-muted">
            Type <strong className="text-[var(--text)]">delete my account</strong> to confirm.
          </p>
          <input
            type="text"
            value={deleteAccountConfirm}
            onChange={(e) => setDeleteAccountConfirm(e.target.value)}
            placeholder="delete my account"
            className="w-full max-w-xs bg-surface-2 border border-[var(--border)] rounded-lg px-3 py-2 text-sm text-[var(--text)] placeholder:text-text-dim focus:outline-none focus:border-red-400/50"
          />
          <Button
            variant="destructive"
            disabled={deleteAccountConfirm.toLowerCase() !== 'delete my account'}
            onClick={() => alert('Account deletion is not implemented in this MVP. Contact support.')}
          >
            Delete my account
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

function WorkspaceRow({
  workspace,
  isActive,
  onRename,
  onDelete,
}: {
  workspace: Workspace;
  isActive: boolean;
  onRename: (name: string) => void;
  onDelete: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(workspace.name);

  useEffect(() => {
    setName(workspace.name);
  }, [workspace.name]);

  const save = () => {
    if (name.trim() && name !== workspace.name) onRename(name.trim());
    setEditing(false);
  };

  return (
    <li className="flex items-center gap-2 rounded-lg border border-[var(--border)] bg-surface-2/50 px-3 py-2">
      {editing ? (
        <>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && save()}
            className="flex-1 bg-surface border border-[var(--border)] rounded px-2 py-1 text-sm focus:outline-none focus:border-primary/50"
          />
          <button type="button" onClick={save} className="text-xs text-primary-bright hover:underline cursor-pointer">Save</button>
          <button type="button" onClick={() => { setName(workspace.name); setEditing(false); }} className="text-xs text-text-dim hover:underline cursor-pointer">Cancel</button>
        </>
      ) : (
        <>
          <span className="flex-1 text-sm font-medium text-[var(--text)] truncate">{workspace.name}</span>
          {isActive && <span className="text-[10px] text-primary-bright bg-primary/10 px-1.5 py-0.5 rounded">Current</span>}
          <button type="button" onClick={() => setEditing(true)} className="text-xs text-text-dim hover:text-[var(--text)] cursor-pointer">Rename</button>
          <button type="button" onClick={onDelete} className="text-xs text-red-400 hover:bg-red-400/10 px-1.5 py-0.5 rounded cursor-pointer">Delete</button>
        </>
      )}
    </li>
  );
}
