import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { useAuthStore } from '../lib/stores/authStore';
import { api } from '../lib/api';
import { getGoogleLoginUrl, getGithubLoginUrl, isGoogleLoginEnabled, isGithubLoginEnabled } from '../lib/authUrls';

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
  );
}

function GithubIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
    </svg>
  );
}

export function Register() {
  const navigate = useNavigate();
  const setTokens = useAuthStore((s) => s.setTokens);
  const setUser = useAuthStore((s) => s.setUser);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await api.post('/auth/register/', { email, password, full_name: fullName });
      const { data } = await api.post('/auth/login/', { email, password });
      setTokens(data.access, data.refresh);
      const me = await api.get('/auth/me/');
      setUser(me.data);
      navigate('/dashboard');
    } catch (err: unknown) {
      const res = err && typeof err === 'object' && 'response' in err ? (err as { response?: { data?: Record<string, unknown> } }).response?.data : null;
      const msg = res && typeof res === 'object' && 'email' in res
        ? (Array.isArray((res as { email?: string[] }).email) ? (res as { email: string[] }).email[0] : 'Invalid input')
        : res && typeof res === 'object' && 'detail' in res
          ? String((res as { detail: string }).detail)
          : 'Registration failed';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="min-h-screen flex relative overflow-hidden"
      style={{ background: 'var(--bg, #05050D)' }}
    >
      {/* Background glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse 60% 50% at 50% 40%, rgba(26,107,204,0.08) 0%, transparent 70%)',
        }}
      />

      {/* Left branding panel — hidden on mobile */}
      <div className="hidden lg:flex flex-col justify-between w-[45%] p-12 relative border-r border-[var(--border)]">
        <Link to="/" className="flex items-center gap-3 no-underline group">
          <img src="/logo.png" alt="SoftDock" className="w-10 h-10 rounded-xl object-contain flex-shrink-0" />
          <span className="font-bold text-xl text-[var(--text)] group-hover:text-primary-bright transition-colors">
            SoftDock
          </span>
        </Link>

        <div>
          <h2 className="text-3xl font-extrabold leading-tight tracking-tight mb-4 text-[var(--text)]">
            Your debugging
            <br />
            co-pilot awaits.
          </h2>
          <p className="text-base text-text-muted font-light max-w-[360px] leading-relaxed mb-6">
            Create your account, set up a workspace, and resolve your first issue — all in under two minutes.
          </p>
          <div className="flex flex-col gap-3">
            {['Bring your own API key — no markup', 'Resolution memory from day one', 'Cancel anytime, no lock-in'].map((item) => (
              <div key={item} className="flex items-center gap-2.5 text-[13px] text-text-muted">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-green-400 flex-shrink-0">
                  <path d="M20 6L9 17l-5-5" />
                </svg>
                {item}
              </div>
            ))}
          </div>
        </div>

        <p className="text-[13px] text-text-dim">
          &copy; {new Date().getFullYear()} SoftDock by{' '}
          <a href="https://kybernode.com" target="_blank" rel="noopener noreferrer" className="text-primary-bright no-underline hover:underline">
            Kybernode
          </a>
        </p>
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex items-center justify-center p-6 md:p-12 relative">
        <div className="w-full max-w-[400px]">
          {/* Mobile logo */}
          <div className="lg:hidden mb-10 flex justify-center">
            <Link to="/" className="flex items-center gap-3 no-underline">
              <img src="/logo.png" alt="SoftDock" className="w-9 h-9 rounded-xl object-contain flex-shrink-0" />
              <span className="font-bold text-lg text-[var(--text)]">SoftDock</span>
            </Link>
          </div>

          <h1 className="text-2xl font-bold text-[var(--text)] mb-1">Create your account</h1>
          <p className="text-sm text-text-muted mb-8">Start debugging at the speed of thought</p>

          <form onSubmit={handleSubmit} className="space-y-5">
            <Input
              label="Full name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Jane Doe"
            />
            <Input
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
            />
            <Input
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
            {error && (
              <div className="flex items-center gap-2 px-4 py-3 rounded-xl border border-red-500/20 bg-red-500/5 text-sm text-red-400">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="flex-shrink-0">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M12 8v4M12 16h.01" />
                </svg>
                {error}
              </div>
            )}
            <Button type="submit" className="w-full !py-3.5 !text-sm !font-semibold" disabled={loading}>
              {loading ? 'Creating account...' : 'Create account →'}
            </Button>

            {(isGoogleLoginEnabled() || isGithubLoginEnabled()) && (
              <>
                <div className="flex items-center gap-3 my-4">
                  <div className="h-px flex-1 bg-[var(--border)]" />
                  <span className="text-[12px] text-text-dim uppercase tracking-wider">or sign up with</span>
                  <div className="h-px flex-1 bg-[var(--border)]" />
                </div>
                <div className="flex gap-3">
                  {isGoogleLoginEnabled() && (
                    <a
                      href={getGoogleLoginUrl()}
                      className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border border-[var(--border)] bg-surface text-[var(--text)] text-sm font-medium no-underline hover:border-primary/40 hover:bg-[rgba(26,107,204,0.04)] transition-colors"
                    >
                      <GoogleIcon className="w-5 h-5" />
                      Google
                    </a>
                  )}
                  {isGithubLoginEnabled() && (
                    <a
                      href={getGithubLoginUrl()}
                      className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border border-[var(--border)] bg-surface text-[var(--text)] text-sm font-medium no-underline hover:border-primary/40 hover:bg-[rgba(26,107,204,0.04)] transition-colors"
                    >
                      <GithubIcon className="w-5 h-5" />
                      GitHub
                    </a>
                  )}
                </div>
              </>
            )}
          </form>

          <p className="mt-6 text-center text-sm text-text-muted">
            Already have an account?{' '}
            <Link to="/login" className="text-primary-bright no-underline hover:underline font-medium">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
