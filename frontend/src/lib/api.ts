import axios from 'axios';

function resolveApiBaseUrl(): string {
  const configured = import.meta.env.VITE_API_URL?.replace(/\/$/, '');
  if (configured) return configured;
  if (import.meta.env.PROD && typeof window !== 'undefined') {
    return '/api';
  }
  return 'http://127.0.0.1:8000/api';
}

const baseURL = resolveApiBaseUrl();

export const api = axios.create({
  baseURL,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

/** WebSocket base — same-origin `/ws` in Docker/nginx; override with `VITE_WS_URL`. */
export function getWsUrl(path: string): string {
  const configured = import.meta.env.VITE_WS_URL?.replace(/\/$/, '');
  let base = configured;
  if (!base && typeof window !== 'undefined') {
    const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    base = `${proto}//${window.location.host}/ws`;
  }
  if (!base) {
    base = 'ws://127.0.0.1:8000/ws';
  }
  const p = path.startsWith('/') ? path : `/${path}`;
  return `${base}${p}`;
}
