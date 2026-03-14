import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../lib/stores/authStore';
import { api } from '../lib/api';

/**
 * OAuth callback: backend redirects here with access_token (and optionally refresh_token)
 * in the URL hash or query. We store them and redirect to dashboard.
 * Example: /login/callback#access_token=...&refresh_token=...
 */
export function LoginCallback() {
  const navigate = useNavigate();
  const setTokens = useAuthStore((s) => s.setTokens);
  const setUser = useAuthStore((s) => s.setUser);
  const [error, setError] = useState('');

  useEffect(() => {
    const hash = window.location.hash.slice(1);
    const query = window.location.search.slice(1);
    const params = new URLSearchParams(hash || query);
    const access = params.get('access_token');
    const refresh = params.get('refresh_token');

    if (!access) {
      setError('No token received. Try signing in again.');
      return;
    }

    setTokens(access, refresh ?? '');
    api
      .get('/auth/me/')
      .then((res) => {
        setUser(res.data);
        navigate('/dashboard', { replace: true });
      })
      .catch(() => {
        setError('Session setup failed. Try signing in again.');
      });
  }, [navigate, setTokens, setUser]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6" style={{ background: 'var(--bg)' }}>
        <div className="text-center max-w-sm">
          <p className="text-red-400 mb-4">{error}</p>
          <a href="/login" className="text-primary-bright no-underline hover:underline">
            Back to sign in
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6" style={{ background: 'var(--bg)' }}>
      <div className="text-center text-text-muted">Signing you in...</div>
    </div>
  );
}
