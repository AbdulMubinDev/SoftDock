import { api } from './api';

function apiBaseUrl(): string {
  const base = api.defaults.baseURL?.replace(/\/$/, '') || '';
  if (base) return base;
  return import.meta.env.VITE_API_URL?.replace(/\/$/, '') || 'http://127.0.0.1:8000/api';
}

export function getGoogleLoginUrl(): string {
  return `${apiBaseUrl()}/auth/google/login/`;
}

export function getGithubLoginUrl(): string {
  return `${apiBaseUrl()}/auth/github/login/`;
}

/** Hide OAuth buttons when env is explicitly `"false"`. */
export function isGoogleLoginEnabled(): boolean {
  return import.meta.env.VITE_GOOGLE_OAUTH_ENABLED !== 'false';
}

export function isGithubLoginEnabled(): boolean {
  return import.meta.env.VITE_GITHUB_OAUTH_ENABLED !== 'false';
}
