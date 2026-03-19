import { useEffect, useState } from 'react';
import { useWorkspaceStore } from '../../lib/stores/workspaceStore';
import { useAuthStore } from '../../lib/stores/authStore';
import { api } from '../../lib/api';
import { Badge } from '../ui/Badge';

export function TopBar() {
  const { activeWorkspace } = useWorkspaceStore();
  const { user } = useAuthStore();
  const [hasApiKey, setHasApiKey] = useState<boolean | null>(null);

  useEffect(() => {
    api
      .get<unknown[]>('/auth/api-keys/')
      .then((res) => setHasApiKey(Array.isArray(res.data) && res.data.length > 0))
      .catch(() => setHasApiKey(false));
  }, []);

  return (
    <header className="h-14 flex items-center justify-between px-6 border-b border-[var(--border)] bg-surface/80 backdrop-blur">
      <div className="flex items-center gap-4">
        <h1 className="font-semibold text-[var(--text)]">
          {activeWorkspace?.name ?? 'No workspace selected'}
        </h1>
        {hasApiKey !== null && (
          hasApiKey ? (
            <Badge status="success" dot>API key connected</Badge>
          ) : (
            <Badge status="error" dot>API key not connected</Badge>
          )
        )}
        {user?.preferred_ai_model_display && (
          <span className="text-xs text-text-dim bg-surface-2 border border-[var(--border)] rounded-md px-2 py-0.5">
            {user.preferred_ai_model_display}
          </span>
        )}
      </div>
    </header>
  );
}
