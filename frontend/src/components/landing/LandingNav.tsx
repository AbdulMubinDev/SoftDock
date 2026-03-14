import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../ui/Button';

const NAV_LINKS = [
  { href: '#features', label: 'Features' },
  { href: '#howitworks', label: 'How it works' },
  { href: '/use-cases', label: 'Use cases', external: true },
  { href: '/pricing', label: 'Pricing', external: true },
];

const SCROLL_THRESHOLD = 32;

export function LandingNav() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > SCROLL_THRESHOLD);
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll(); // run once in case we're already scrolled
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

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

          <div className="flex items-center gap-2">
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
            <Link
              to="/login"
              onClick={() => setMobileOpen(false)}
              className="px-5 py-3 text-sm text-[var(--text-muted)] no-underline hover:bg-[rgba(26,107,204,0.08)] hover:text-[var(--text)] sm:hidden"
            >
              Sign in
            </Link>
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
