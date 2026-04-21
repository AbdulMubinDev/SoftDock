import { create } from 'zustand';

export interface Workspace {
  id: string;
  name: string;
  slug: string;
  description?: string;
  owner_email?: string;
  member_count?: number;
  is_locked?: boolean;
  created_at?: string;
  updated_at?: string;
}

interface WorkspaceState {
  workspaces: Workspace[];
  activeWorkspace: Workspace | null;
  setWorkspaces: (workspaces: Workspace[]) => void;
  setActiveWorkspace: (w: Workspace | null) => void;
}

export const useWorkspaceStore = create<WorkspaceState>((set) => ({
  workspaces: [],
  activeWorkspace: null,
  setWorkspaces: (workspaces) => set({ workspaces }),
  setActiveWorkspace: (activeWorkspace) => set({ activeWorkspace }),
}));
