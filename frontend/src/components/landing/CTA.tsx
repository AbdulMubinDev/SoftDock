import { Link } from 'react-router-dom';
import { Button } from '../ui/Button';
import { useAuthStore } from '../../lib/stores/authStore';

export function CTA() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated());
  return (
    <section id="cta" className="min-h-screen flex items-center relative z-10 overflow-hidden">
      {/* Layered background glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse 70% 50% at 50% 55%, rgba(26,107,204,0.14) 0%, transparent 70%)',
        }}
      />
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(circle 400px at 30% 40%, rgba(123,79,224,0.06) 0%, transparent 100%)',
        }}
      />
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(circle 350px at 70% 60%, rgba(77,159,255,0.05) 0%, transparent 100%)',
        }}
      />

      <div className="container max-w-5xl mx-auto px-8 w-full relative">
        <div className="flex flex-col items-center text-center">
          {/* Pill */}
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-primary/25 bg-primary/10 text-[11px] font-semibold text-primary-bright uppercase tracking-wider mb-8">
            <span className="w-1.5 h-1.5 rounded-full bg-primary-bright animate-pulse" />
            Ready when you are
          </span>

          {/* Headline */}
          <h2 className="text-5xl md:text-7xl font-extrabold leading-[1.05] tracking-tight mb-6">
            Stop reading docs.
            <br />
            <span
              className="bg-clip-text text-transparent"
              style={{
                backgroundImage:
                  'linear-gradient(135deg, #4D9FFF 0%, #1A6BCC 40%, #7B4FE0 100%)',
              }}
            >
              Start solving.
            </span>
          </h2>

          {/* Subtitle */}
          <p className="text-lg md:text-xl text-text-muted font-light max-w-[520px] leading-relaxed mb-10">
            Join developers who resolved their last bug in under 60 seconds — not 2 hours of tab-hopping.
          </p>

          {/* Buttons */}
          <div className="flex flex-col sm:flex-row items-center gap-4 mb-8">
            <Link to={isAuthenticated ? "/dashboard" : "/register"}>
              <Button
                size="lg"
                className="!px-12 !py-5 !text-base !font-semibold !rounded-xl !shadow-[0_0_32px_rgba(26,107,204,0.3)]"
              >
                {isAuthenticated ? "Go to Dashboard →" : "Start debugging free →"}
              </Button>
            </Link>
            <Link
              to="/pricing"
              className="inline-flex items-center justify-center px-10 py-[18px] rounded-xl border border-[var(--border)] bg-transparent text-text-muted hover:border-primary/50 hover:text-[var(--text)] transition-all duration-200 text-base font-medium no-underline"
            >
              View pricing
            </Link>
          </div>

          {/* Trust signals */}
          <div className="flex flex-wrap items-center justify-center gap-6 text-[13px] text-text-dim">
            <span className="flex items-center gap-2">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-green-400">
                <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
                <path d="M22 4L12 14.01l-3-3" />
              </svg>
              No credit card required
            </span>
            <span className="w-px h-3.5 bg-[var(--border)]" />
            <span className="flex items-center gap-2">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-green-400">
                <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
                <path d="M22 4L12 14.01l-3-3" />
              </svg>
              Bring your own API key
            </span>
            <span className="w-px h-3.5 bg-[var(--border)]" />
            <span className="flex items-center gap-2">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-green-400">
                <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
                <path d="M22 4L12 14.01l-3-3" />
              </svg>
              Cancel anytime
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
