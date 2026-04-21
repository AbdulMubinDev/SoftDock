import axios from 'axios';

const baseURL =
  import.meta.env.VITE_API_URL?.replace(/\/$/, '') || 'http://127.0.0.1:8000/api';

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

/** WebSocket base, e.g. `ws://127.0.0.1:8000/ws` — must match `VITE_WS_URL` in `.env`. */
export function getWsUrl(path: string): string {
  const base =
    import.meta.env.VITE_WS_URL?.replace(/\/$/, '') || 'ws://127.0.0.1:8000/ws';
  const p = path.startsWith('/') ? path : `/${path}`;
  return `${base}${p}`;
}
