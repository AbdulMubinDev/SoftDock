import { useEffect, useState, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useWorkspaceStore, type Workspace } from '../../lib/stores/workspaceStore';
import { useAuthStore } from '../../lib/stores/authStore';
import { api } from '../../lib/api';

const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: 'chat' },
  { to: '/knowledge-base', label: 'Knowledge Base', icon: 'book' },
  { to: '/history', label: 'History', icon: 'clock' },
];

const icons: Record<string, React.ReactNode> = {
  chat: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
    </svg>
  ),
  book: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M4 19.5A2.5 2.5 0 016.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" />
    </svg>
  ),
  clock: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <circle cx="12" cy="12" r="10" />
      <path d="M12 6v6l4 2" />
    </svg>
  ),
};

const folderIcon = (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z" />
  </svg>
);

interface SidebarProps {
  width: number;
  collapsed: boolean;
  onToggleCollapse: () => void;
}

export function Sidebar({ width, collapsed, onToggleCollapse }: SidebarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { workspaces, activeWorkspace, setWorkspaces, setActiveWorkspace } = useWorkspaceStore();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const [wsOpen, setWsOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null);
  const [newWsName, setNewWsName] = useState('');
  const [renameValue, setRenameValue] = useState('');
  const [renameOpen, setRenameOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [savingRename, setSavingRename] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    api.get('/workspaces/').then((res) => {
      const list: Workspace[] = res.data.results ?? res.data;
      setWorkspaces(list);
      if (list.length && !activeWorkspace) setActiveWorkspace(list[0]);
    }).catch(() => {});
  }, [setWorkspaces, setActiveWorkspace, activeWorkspace]);

  useEffect(() => {
    if (!wsOpen) return;
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) setWsOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [wsOpen]);

  useEffect(() => {
    if (!profileOpen) return;
    const handler = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) setProfileOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [profileOpen]);

  useEffect(() => {
    const close = () => setContextMenu(null);
    document.addEventListener('click', close);
    document.addEventListener('scroll', close, true);
    return () => {
      document.removeEventListener('click', close);
      document.removeEventListener('scroll', close, true);
    };
  }, []);

  const handleCreateWorkspace = async () => {
    if (!newWsName.trim() || creating) return;
    setCreating(true);
    try {
      const { data } = await api.post('/workspaces/', { name: newWsName.trim() });
      setWorkspaces([data, ...workspaces]);
      setActiveWorkspace(data);
      setNewWsName('');
      setWsOpen(false);
    } catch {} finally {
      setCreating(false);
    }
  };

  const handleRename = async () => {
    if (!activeWorkspace?.slug || !renameValue.trim() || savingRename) return;
    setSavingRename(true);
    try {
      const { data } = await api.patch(`/workspaces/${activeWorkspace.slug}/`, { name: renameValue.trim() });
      setWorkspaces(workspaces.map((w) => (w.id === data.id ? data : w)));
      setActiveWorkspace(data);
      setRenameOpen(false);
      setContextMenu(null);
    } catch {} finally {
      setSavingRename(false);
    }
  };

  const handleDeleteWorkspace = async () => {
    if (!activeWorkspace?.slug || !confirm(`Delete workspace "${activeWorkspace.name}"? This cannot be undone.`)) return;
    try {
      await api.delete(`/workspaces/${activeWorkspace.slug}/`);
      const next = workspaces.filter((w) => w.slug !== activeWorkspace.slug);
      setWorkspaces(next);
      setActiveWorkspace(next[0] ?? null);
      setWsOpen(false);
      setContextMenu(null);
    } catch {}
  };

  const openRename = () => {
    setRenameValue(activeWorkspace?.name ?? '');
    setRenameOpen(true);
    setContextMenu(null);
  };

  const isIconOnly = collapsed;

  return (
    <aside
      className="fixed left-0 top-0 bottom-0 bg-surface border-r border-[var(--border)] flex flex-col z-40 transition-[width] duration-200"
      style={{ width }}
    >
      {/* Top: Logo + collapse when expanded; when collapsed just logo + chevron */}
      <div className="flex items-center flex-shrink-0 border-b border-[var(--border)]">
        <Link
          to="/"
          className={`flex items-center no-underline text-[var(--text)] ${isIconOnly ? 'justify-center w-full py-3' : 'gap-2.5 px-4 py-4 flex-1 min-w-0'}`}
        >
          <img src="/logo.png" alt="SoftDock" className="w-8 h-8 rounded-lg object-contain flex-shrink-0" />
          {!isIconOnly && <span className="font-bold text-lg truncate">SoftDock</span>}
        </Link>
        {!isIconOnly && (
          <button
            type="button"
            onClick={onToggleCollapse}
            className="p-2 text-text-dim hover:text-[var(--text)] hover:bg-surface-2 rounded-lg transition-colors cursor-pointer flex-shrink-0"
            title="Collapse sidebar"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>
        )}
      </div>

      {/* Workspace / Project row — Claude-style (ref wraps dropdown + context menu + modal so they don't close on inside click) */}
      <div className="relative flex-shrink-0 px-2 py-3 border-b border-[var(--border)]" ref={panelRef}>
        <button
          type="button"
          onClick={() => setWsOpen(!wsOpen)}
          className={`w-full flex items-center rounded-lg transition-colors cursor-pointer ${
            isIconOnly ? 'justify-center py-2 text-text-muted hover:bg-surface-2' : 'gap-2 px-3 py-2.5 text-left hover:bg-surface-2'
          }`}
          title={isIconOnly ? (activeWorkspace?.name ?? 'Workspace') : undefined}
        >
          <span className="text-[var(--text-muted)] flex-shrink-0">{folderIcon}</span>
          {!isIconOnly && (
            <>
              <span className="flex-1 min-w-0 truncate text-sm font-medium text-[var(--text)]">
                {activeWorkspace?.name ?? 'Select workspace'}
              </span>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="flex-shrink-0 text-text-dim">
                <path d="M6 9l6 6 6-6" />
              </svg>
            </>
          )}
        </button>

        {/* Dropdown panel — when expanded: inside sidebar; when collapsed: flyout to the right */}
        {wsOpen && (
          <div
            className="absolute rounded-xl border border-[var(--border)] bg-surface shadow-xl z-50 overflow-hidden min-w-[240px] mt-1"
            style={isIconOnly ? { left: '100%', top: 0, marginLeft: 4 } : { left: 8, right: 8, top: '100%' }}
          >
            <div className="max-h-52 overflow-y-auto py-1">
              {workspaces.map((ws) => (
                <button
                  key={ws.id}
                  type="button"
                  onClick={() => { setActiveWorkspace(ws); setWsOpen(false); }}
                  className={`w-full text-left px-3 py-2.5 text-sm flex items-center gap-2 cursor-pointer transition-colors ${
                    activeWorkspace?.id === ws.id ? 'bg-primary/10 text-primary-bright' : 'text-text-muted hover:bg-surface-2'
                  }`}
                >
                  <span className="text-[var(--text-muted)]">{folderIcon}</span>
                  <span className="truncate">{ws.name}</span>
                </button>
              ))}
            </div>
            <div className="border-t border-[var(--border)] p-2">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newWsName}
                  onChange={(e) => setNewWsName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleCreateWorkspace()}
                  placeholder="New workspace..."
                  className="flex-1 min-w-0 bg-surface-2 border border-[var(--border)] rounded-lg px-2.5 py-1.5 text-xs text-[var(--text)] placeholder:text-text-dim focus:outline-none focus:border-primary/40"
                />
                <button
                  type="button"
                  onClick={handleCreateWorkspace}
                  disabled={!newWsName.trim() || creating}
                  className="px-3 py-1.5 rounded-lg bg-primary text-white text-xs font-medium hover:bg-primary-bright transition-colors disabled:opacity-40 cursor-pointer flex-shrink-0"
                >
                  Create
                </button>
              </div>
            </div>
            {activeWorkspace && (
              <div className="border-t border-[var(--border)] py-1">
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); setContextMenu({ x: e.clientX, y: e.clientY }); }}
                  className="w-full text-left px-3 py-2 text-xs text-text-dim hover:bg-surface-2 hover:text-[var(--text)] flex items-center gap-2 cursor-pointer"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="1" />
                    <circle cx="12" cy="5" r="1" />
                    <circle cx="12" cy="19" r="1" />
                  </svg>
                  Workspace options
                </button>
              </div>
            )}
          </div>
        )}

        {/* Context menu */}
        {contextMenu && (
          <div
            className="fixed z-[100] rounded-lg border border-[var(--border)] bg-surface shadow-xl py-1 min-w-[160px]"
            style={{ left: contextMenu.x, top: contextMenu.y }}
          >
            <button
              type="button"
              onClick={openRename}
              className="w-full text-left px-3 py-2 text-sm text-[var(--text)] hover:bg-surface-2 flex items-center gap-2 cursor-pointer"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
              </svg>
              Rename
            </button>
            <button
              type="button"
              onClick={handleDeleteWorkspace}
              className="w-full text-left px-3 py-2 text-sm text-red-400 hover:bg-red-400/10 flex items-center gap-2 cursor-pointer"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="3 6 5 6 21 6" />
                <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                <line x1="10" y1="11" x2="10" y2="17" />
                <line x1="14" y1="11" x2="14" y2="17" />
              </svg>
              Delete
            </button>
          </div>
        )}

        {/* Rename modal */}
        {renameOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50" onClick={() => setRenameOpen(false)}>
            <div className="bg-surface border border-[var(--border)] rounded-xl p-4 shadow-xl w-[320px]" onClick={(e) => e.stopPropagation()}>
              <h3 className="text-sm font-semibold text-[var(--text)] mb-3">Rename workspace</h3>
              <input
                type="text"
                value={renameValue}
                onChange={(e) => setRenameValue(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleRename()}
                className="w-full bg-surface-2 border border-[var(--border)] rounded-lg px-3 py-2 text-sm text-[var(--text)] focus:outline-none focus:border-primary/50 mb-4"
                placeholder="Workspace name"
                autoFocus
              />
              <div className="flex justify-end gap-2">
                <button type="button" onClick={() => setRenameOpen(false)} className="px-3 py-1.5 text-sm text-text-muted hover:text-[var(--text)] cursor-pointer">
                  Cancel
                </button>
                <button type="button" onClick={handleRename} disabled={savingRename || !renameValue.trim()} className="px-3 py-1.5 text-sm bg-primary text-white rounded-lg hover:bg-primary-bright disabled:opacity-50 cursor-pointer">
                  {savingRename ? 'Saving...' : 'Save'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Nav — icon strip when collapsed, full when expanded */}
      <nav className="flex-1 overflow-y-auto min-h-0 py-2">
        <div className={isIconOnly ? 'flex flex-col items-center gap-0.5' : 'space-y-0.5 px-2'}>
          {navItems.map(({ to, label, icon }) => {
            const isActive = location.pathname === to || location.pathname.startsWith(to + '/');
            return (
              <Link
                key={to}
                to={to}
                title={label}
                className={`flex items-center no-underline transition-colors ${
                  isIconOnly
                    ? 'justify-center w-full py-2.5 rounded-lg text-text-muted hover:bg-surface-2 hover:text-[var(--text)]'
                    : 'gap-3 px-3 py-2.5 rounded-lg text-sm'
                } ${
                  isActive
                    ? 'bg-primary/15 text-primary-bright border border-primary/25'
                    : isIconOnly ? '' : 'text-text-muted hover:bg-surface-2 hover:text-[var(--text)]'
                }`}
              >
                <span className="flex-shrink-0 opacity-90">{icons[icon]}</span>
                {!isIconOnly && <span className="truncate">{label}</span>}
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Bottom: collapse when icon-only, profile button + dropdown */}
      <div className="flex-shrink-0 border-t border-[var(--border)] p-2 relative" ref={profileRef}>
        {isIconOnly ? (
          <button
            type="button"
            onClick={onToggleCollapse}
            className="w-full flex justify-center py-2 text-text-dim hover:text-[var(--text)] hover:bg-surface-2 rounded-lg transition-colors cursor-pointer"
            title="Expand sidebar"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 18l6-6-6-6" />
            </svg>
          </button>
        ) : null}
        <button
          type="button"
          onClick={() => setProfileOpen(!profileOpen)}
          className={`w-full flex items-center text-text-muted hover:text-[var(--text)] rounded-lg transition-colors cursor-pointer ${isIconOnly ? 'justify-center py-2 hover:bg-surface-2' : 'gap-3 px-3 py-2.5'}`}
          title={user?.email}
        >
          <div className="w-8 h-8 rounded-full bg-primary/10 border border-primary/25 flex items-center justify-center text-xs font-bold text-primary-bright flex-shrink-0">
            {user?.full_name?.[0]?.toUpperCase() ?? user?.email?.[0]?.toUpperCase() ?? 'U'}
          </div>
          {!isIconOnly && (
            <div className="min-w-0 flex-1 text-left">
              <div className="text-sm text-[var(--text)] truncate">{user?.full_name || 'Account'}</div>
              <div className="text-[11px] text-text-dim truncate">{user?.email}</div>
            </div>
          )}
          {!isIconOnly && (
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={`flex-shrink-0 text-text-dim transition-transform ${profileOpen ? 'rotate-180' : ''}`}>
              <path d="M6 9l6 6 6-6" />
            </svg>
          )}
        </button>

        {/* Profile dropdown */}
        {profileOpen && (
          <div
            className="absolute bottom-full left-2 right-2 mb-1 rounded-xl border border-[var(--border)] bg-surface shadow-xl z-50 overflow-hidden min-w-[200px]"
            style={isIconOnly ? { left: '100%', right: 'auto', bottom: 'auto', top: 0, marginLeft: 4, marginBottom: 0 } : {}}
          >
            <Link
              to="/settings"
              onClick={() => setProfileOpen(false)}
              className="flex items-center gap-2.5 px-3 py-2.5 text-sm text-[var(--text)] hover:bg-surface-2 no-underline"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <circle cx="12" cy="12" r="3" />
                <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 01-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" />
              </svg>
              Settings
            </Link>
            <a
              href="https://github.com/kybernode/softdock#readme"
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setProfileOpen(false)}
              className="flex items-center gap-2.5 px-3 py-2.5 text-sm text-[var(--text)] hover:bg-surface-2 no-underline"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <circle cx="12" cy="12" r="10" />
                <path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
              Get help
            </a>
            <Link
              to="/pricing"
              onClick={() => setProfileOpen(false)}
              className="flex items-center gap-2.5 px-3 py-2.5 text-sm text-[var(--text)] hover:bg-surface-2 no-underline"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" />
              </svg>
              Upgrade plan
            </Link>
            <div className="border-t border-[var(--border)]" />
            <button
              type="button"
              onClick={() => { logout(); setProfileOpen(false); navigate('/login'); }}
              className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm text-red-400 hover:bg-red-400/10 cursor-pointer"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
              Log out
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}
