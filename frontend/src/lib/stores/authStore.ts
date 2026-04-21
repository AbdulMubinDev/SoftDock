import { create } from 'zustand';
import { api } from '../api';

export interface AuthUser {
  id: string;
  email: string;
  full_name?: string;
  bio?: string;
  email_notifications?: boolean;
  subscription_plan_name?: string;
  preferred_ai_provider?: string;
  preferred_ai_model_id?: string;
  preferred_ai_model_display?: string;
  has_anthropic_key?: boolean;
  has_openai_key?: boolean;
  created_at?: string;
}

interface AuthState {
  user: AuthUser | null;
  setUser: (user: AuthUser | null) => void;
  setTokens: (access: string, refresh: string) => void;
  logout: () => void;
  isAuthenticated: () => boolean;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  setUser: (user) => set({ user }),
  setTokens: (access, refresh) => {
    localStorage.setItem('access_token', access);
    if (refresh) localStorage.setItem('refresh_token', refresh);
    else localStorage.removeItem('refresh_token');
  },
  logout: () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    set({ user: null });
  },
  isAuthenticated: () => !!localStorage.getItem('access_token'),
}));

if (typeof window !== 'undefined') {
  queueMicrotask(() => {
    if (!localStorage.getItem('access_token')) return;
    api
      .get<AuthUser>('/auth/me/')
      .then(({ data }) => useAuthStore.getState().setUser(data))
      .catch(() => {});
  });
}
