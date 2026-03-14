import { useWorkspaceStore } from '../../lib/stores/workspaceStore';
import { Badge } from '../ui/Badge';

export function TopBar() {
  const { activeWorkspace } = useWorkspaceStore();

  return (
    <header className="h-14 flex items-center justify-between px-6 border-b border-[var(--border)] bg-surface/80 backdrop-blur">
      <div className="flex items-center gap-4">
        <h1 className="font-semibold text-[var(--text)]">
          {activeWorkspace?.name ?? 'No workspace selected'}
        </h1>
        <Badge status="info" dot>API key connected</Badge>
      </div>
      <div className="flex items-center gap-3">
        <input
          type="search"
          placeholder="Search issues..."
          className="w-64 bg-surface-2 border border-[var(--border)] rounded-lg px-3 py-2 text-sm text-[var(--text)] placeholder:text-text-dim focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>
    </header>
  );
}
