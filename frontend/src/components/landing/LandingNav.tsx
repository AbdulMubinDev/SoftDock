import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '../ui/Button';
import { useAuthStore } from '../../lib/stores/authStore';

const NAV_LINKS = [
  { href: '#features', label: 'Features' },
  { href: '#howitworks', label: 'How it works' },
  { href: '/use-cases', label: 'Use cases', external: true },
  { href: '/pricing', label: 'Pricing', external: true },
  { href: '/reviews', label: 'Reviews', external: true },
];

const SCROLL_THRESHOLD = 32;

export function LandingNav() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated());

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > SCROLL_THRESHOLD);
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    if (!profileOpen) return;
    const handleClick = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) setProfileOpen(false);
    };
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, [profileOpen]);

  return (
    <>
      {/* Nav: always full width; only top moves. Container margin animates so bar (100% width) grows smoothly. */}
      <nav
        className={`fixed left-0 right-0 z-50 nav-bar-wrapper ${
          scrolled ? 'top-0' : 'top-6'
        }`}
      >
        <div
          className={`nav-bar-container px-4 md:px-8 ${
            scrolled ? 'mx-0' : 'mx-[4vw]'
          }`}
        >
          <div
            className={`nav-bar-inner flex w-full items-center justify-between gap-4 border px-5 py-3 md:px-6 md:py-3 backdrop-blur-2xl ${
              scrolled
                ? 'rounded-none bg-[rgba(5,5,13,0.82)] shadow-[0_4px_24px_rgba(0,0,0,0.5)]'
                : 'rounded-2xl bg-[rgba(5,5,13,0.6)] shadow-[0_0_0_1px_rgba(26,107,204,0.06),0_8px_32px_rgba(0,0,0,0.4)] hover:shadow-[0_0_0_1px_rgba(26,107,204,0.12),0_12px_40px_rgba(0,0,0,0.5)]'
            }`}
            style={{
              borderTopColor: scrolled ? 'transparent' : 'rgba(26,107,204,0.15)',
              borderLeftColor: scrolled ? 'transparent' : 'rgba(26,107,204,0.15)',
              borderRightColor: scrolled ? 'transparent' : 'rgba(26,107,204,0.15)',
              borderBottomColor: scrolled ? 'rgba(26,107,204,0.2)' : 'rgba(26,107,204,0.15)',
            }}
          >
          <Link
            to="/"
            className="flex items-center gap-2.5 font-bold text-lg text-[var(--text)] no-underline shrink-0 transition-opacity hover:opacity-90"
          >
            <img src="/logo.png" alt="SoftDock" className="h-9 w-9 rounded-xl object-contain flex-shrink-0" />
            <span className="hidden sm:inline">SoftDock</span>
          </Link>

          <div className="hidden md:flex items-center gap-1">
            {NAV_LINKS.map(({ href, label, external }) =>
              external ? (
                <Link
                  key={href}
                  to={href}
                  className="rounded-lg px-4 py-2 text-sm text-[var(--text-muted)] no-underline transition-colors hover:bg-[rgba(26,107,204,0.08)] hover:text-[var(--text)]"
                >
                  {label}
                </Link>
              ) : (
                <a
                  key={href}
                  href={href}
                  className="rounded-lg px-4 py-2 text-sm text-[var(--text-muted)] no-underline transition-colors hover:bg-[rgba(26,107,204,0.08)] hover:text-[var(--text)]"
                >
                  {label}
                </a>
              )
            )}
          </div>

          <div className="flex items-center gap-2" ref={profileRef}>
            {isAuthenticated ? (
              <div className="relative hidden sm:block">
                <button
                  type="button"
                  onClick={() => setProfileOpen((o) => !o)}
                  className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-text-muted hover:text-[var(--text)] hover:bg-[rgba(26,107,204,0.08)] transition-colors cursor-pointer border border-transparent hover:border-[var(--border)]"
                  title={user?.email}
                >
                  <div className="w-8 h-8 rounded-full bg-primary/10 border border-primary/25 flex items-center justify-center text-xs font-bold text-primary-bright flex-shrink-0">
                    {user?.full_name?.[0]?.toUpperCase() ?? user?.email?.[0]?.toUpperCase() ?? 'U'}
                  </div>
                  <div className="min-w-0 max-w-[120px] text-left hidden md:block">
                    <div className="text-sm text-[var(--text)] truncate">{user?.full_name || 'Account'}</div>
                    <div className="text-[11px] text-text-dim truncate">{user?.email}</div>
                  </div>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={`flex-shrink-0 text-text-dim transition-transform ${profileOpen ? 'rotate-180' : ''}`}>
                    <path d="M6 9l6 6 6-6" />
                  </svg>
                </button>
                {profileOpen && (
                  <div className="absolute top-full right-0 mt-1 rounded-xl border border-[var(--border)] bg-surface shadow-xl z-50 overflow-hidden min-w-[200px]">
                    <Link
                      to="/dashboard"
                      onClick={() => setProfileOpen(false)}
                      className="flex items-center gap-2.5 px-3 py-2.5 text-sm text-[var(--text)] hover:bg-surface-2 no-underline"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
                      </svg>
                      Dashboard
                    </Link>
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
                    <Link
                      to="/reviews"
                      onClick={() => setProfileOpen(false)}
                      className="flex items-center gap-2.5 px-3 py-2.5 text-sm text-[var(--text)] hover:bg-surface-2 no-underline"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z" />
                      </svg>
                      Reviews
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
            ) : (
              <>
                <Link to="/login" className="hidden sm:block">
                  <Button variant="ghost" size="sm" className="!rounded-lg">
                    Sign in
                  </Button>
                </Link>
                <Link to="/register">
                  <Button size="sm" className="!rounded-lg shadow-[0_0_20px_rgba(26,107,204,0.25)]">
                    Start free →
                  </Button>
                </Link>
              </>
            )}
            <button
              type="button"
              onClick={() => setMobileOpen((o) => !o)}
              className="md:hidden flex h-10 w-10 items-center justify-center rounded-xl border border-[var(--border)] bg-[rgba(26,107,204,0.06)] text-[var(--text)] transition-colors hover:border-[#1A6BCC]/40 hover:bg-[rgba(26,107,204,0.1)]"
              aria-label="Toggle menu"
            >
              {mobileOpen ? (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              ) : (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M3 12h18M3 6h18M3 18h18" />
                </svg>
              )}
            </button>
          </div>
          </div>
        </div>
      </nav>

      {/* Mobile menu — position under nav (floating or attached) */}
      <div
        className={`fixed left-4 right-4 z-40 md:hidden transition-[top,opacity,transform,visibility] duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] ${
          scrolled ? 'top-[4.25rem]' : 'top-[5.5rem]'
        } ${mobileOpen ? 'opacity-100 visible translate-y-0' : 'opacity-0 invisible -translate-y-2 pointer-events-none'}`}
      >
        <div className="rounded-2xl border border-[rgba(26,107,204,0.15)] bg-[rgba(5,5,13,0.92)] backdrop-blur-2xl shadow-xl overflow-hidden">
          <div className="flex flex-col py-2">
            {NAV_LINKS.map(({ href, label, external }) =>
              external ? (
                <Link
                  key={href}
                  to={href}
                  onClick={() => setMobileOpen(false)}
                  className="px-5 py-3 text-sm text-[var(--text-muted)] no-underline transition-colors hover:bg-[rgba(26,107,204,0.08)] hover:text-[var(--text)]"
                >
                  {label}
                </Link>
              ) : (
                <a
                  key={href}
                  href={href}
                  onClick={() => setMobileOpen(false)}
                  className="px-5 py-3 text-sm text-[var(--text-muted)] no-underline transition-colors hover:bg-[rgba(26,107,204,0.08)] hover:text-[var(--text)]"
                >
                  {label}
                </a>
              )
            )}
            <div className="my-2 border-t border-[var(--border)]" />
            {isAuthenticated ? (
              <>
                <Link
                  to="/dashboard"
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-2.5 px-5 py-3 text-sm text-[var(--text)] no-underline hover:bg-[rgba(26,107,204,0.08)]"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
                  </svg>
                  Dashboard
                </Link>
                <Link
                  to="/settings"
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-2.5 px-5 py-3 text-sm text-[var(--text)] no-underline hover:bg-[rgba(26,107,204,0.08)]"
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
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-2.5 px-5 py-3 text-sm text-[var(--text)] no-underline hover:bg-[rgba(26,107,204,0.08)]"
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
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-2.5 px-5 py-3 text-sm text-[var(--text)] no-underline hover:bg-[rgba(26,107,204,0.08)]"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" />
                  </svg>
                  Upgrade plan
                </Link>
                <Link
                  to="/reviews"
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-2.5 px-5 py-3 text-sm text-[var(--text)] no-underline hover:bg-[rgba(26,107,204,0.08)]"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z" />
                  </svg>
                  Reviews
                </Link>
                <div className="my-2 border-t border-[var(--border)]" />
                <button
                  type="button"
                  onClick={() => { logout(); setMobileOpen(false); navigate('/login'); }}
                  className="w-full flex items-center gap-2.5 px-5 py-3 text-sm text-red-400 hover:bg-red-400/10 cursor-pointer text-left"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
                    <polyline points="16 17 21 12 16 7" />
                    <line x1="21" y1="12" x2="9" y2="12" />
                  </svg>
                  Log out
                </button>
              </>
            ) : (
              <Link
                to="/login"
                onClick={() => setMobileOpen(false)}
                className="px-5 py-3 text-sm text-[var(--text-muted)] no-underline hover:bg-[rgba(26,107,204,0.08)] hover:text-[var(--text)] sm:hidden"
              >
                Sign in
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Backdrop when mobile menu open */}
      <div
        className={`fixed inset-0 z-30 bg-black/20 backdrop-blur-sm md:hidden transition-opacity duration-300 ${
          mobileOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => setMobileOpen(false)}
        aria-hidden
      />
    </>
  );
}
