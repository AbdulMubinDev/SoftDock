import { Link } from 'react-router-dom';
import { Button } from '../ui/Button';

type Feature = { text: string; included: boolean };

type Plan = {
  name: string;
  price: string;
  period: string;
  note: string;
  features: Feature[];
  cta: string;
  primary?: boolean;
  featured?: boolean;
  badge?: string;
};

const PLANS: Plan[] = [
  {
    name: 'Starter',
    price: '$9',
    period: '/mo',
    note: '+ your own API costs',
    features: [
      { text: '2 workspaces', included: true },
      { text: '10 knowledge documents', included: true },
      { text: 'BYOK (Anthropic + OpenAI)', included: true },
      { text: 'Streaming responses', included: true },
      { text: 'Issue history (30 days)', included: true },
      { text: 'Resolution memory', included: false },
    ],
    cta: 'Get started',
  },
  {
    name: 'Pro',
    price: '$19',
    period: '/mo',
    note: '+ your own API costs',
    features: [
      { text: 'Unlimited workspaces', included: true },
      { text: 'Unlimited knowledge docs', included: true },
      { text: 'BYOK (any provider)', included: true },
      { text: 'Screenshot & terminal input', included: true },
      { text: 'Resolution memory', included: true },
      { text: 'Unlimited issue history', included: true },
    ],
    cta: 'Start Pro',
    primary: true,
    featured: true,
    badge: 'Most popular',
  },
  {
    name: 'Founding Member',
    price: '$29',
    period: ' once',
    note: 'Lifetime access — limited spots',
    features: [
      { text: 'Everything in Pro, forever', included: true },
      { text: 'One-time payment', included: true },
      { text: 'Early access to new features', included: true },
      { text: 'Direct founder support', included: true },
      { text: 'Shape the roadmap', included: true },
    ],
    cta: 'Claim your spot',
    badge: 'Limited',
  },
];

export function Pricing() {
  return (
    <section id="pricing" className="py-24 md:py-32 relative z-10">
      <div className="container max-w-5xl mx-auto px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-[var(--border)] bg-primary/10 text-[11px] font-semibold text-primary-bright uppercase tracking-wider mb-5">
            Pricing
          </span>
          <h2 className="text-3xl md:text-[2.75rem] font-extrabold leading-tight tracking-tight mb-4">
            Simple, honest pricing
          </h2>
          <p className="text-base text-text-muted font-light max-w-[480px] mx-auto">
            No per-token markup. Bring your own API key — you pay for the platform, not inflated AI credits.
          </p>
        </div>

        {/* Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {PLANS.map((plan) => (
            <div
              key={plan.name}
              className={`relative rounded-2xl border overflow-hidden flex flex-col transition-all duration-300 hover:-translate-y-1 ${
                plan.featured
                  ? 'border-primary/50'
                  : 'border-[var(--border)] hover:border-[var(--border-hover)]'
              }`}
              style={{
                background: plan.featured
                  ? 'linear-gradient(180deg, rgba(26,107,204,0.08) 0%, rgba(5,5,13,0.98) 100%)'
                  : 'linear-gradient(180deg, rgba(13,13,26,0.6) 0%, rgba(5,5,13,0.95) 100%)',
                boxShadow: plan.featured
                  ? '0 0 0 1px rgba(26,107,204,0.15), 0 24px 64px rgba(0,0,0,0.4)'
                  : '0 0 0 1px rgba(26,107,204,0.04), 0 16px 48px rgba(0,0,0,0.25)',
              }}
            >
              {/* Badge */}
              {plan.badge && (
                <div className="absolute top-0 right-0">
                  <span
                    className={`inline-block text-[10px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-bl-xl ${
                      plan.featured
                        ? 'bg-primary text-white'
                        : 'bg-[rgba(26,107,204,0.1)] text-primary-bright border-l border-b border-primary/20'
                    }`}
                  >
                    {plan.badge}
                  </span>
                </div>
              )}

              <div className="p-7 md:p-8 flex flex-col flex-1">
                {/* Plan name */}
                <div className="text-sm font-semibold text-text-muted mb-4">{plan.name}</div>

                {/* Price */}
                <div className="mb-1">
                  <span className="text-4xl font-extrabold text-[var(--text)]">{plan.price}</span>
                  <span className="text-base text-text-dim font-normal">{plan.period}</span>
                </div>
                <div className="text-[12px] text-text-dim mb-7">{plan.note}</div>

                {/* Divider */}
                <div className="h-px bg-[var(--border)] mb-6" />

                {/* Features */}
                <ul className="space-y-3.5 mb-8 flex-1 list-none p-0 m-0">
                  {plan.features.map((f) => (
                    <li key={f.text} className="flex items-start gap-3 text-[13px]">
                      {f.included ? (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-green-400 flex-shrink-0 mt-0.5">
                          <path d="M20 6L9 17l-5-5" />
                        </svg>
                      ) : (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-text-dim/40 flex-shrink-0 mt-0.5">
                          <path d="M18 6L6 18M6 6l12 12" />
                        </svg>
                      )}
                      <span className={f.included ? 'text-[var(--text-muted)]' : 'text-text-dim/60'}>{f.text}</span>
                    </li>
                  ))}
                </ul>

                {/* CTA */}
                <Link to="/register" className="block no-underline">
                  {plan.primary ? (
                    <Button className="w-full !py-3.5 !text-sm !font-semibold !shadow-[0_0_24px_rgba(26,107,204,0.25)]">
                      {plan.cta} →
                    </Button>
                  ) : (
                    <button
                      type="button"
                      className="w-full py-3.5 rounded-xl border border-[var(--border)] bg-transparent text-sm font-medium text-text-muted hover:border-primary/40 hover:text-[var(--text)] transition-colors cursor-pointer"
                    >
                      {plan.cta}
                    </button>
                  )}
                </Link>
              </div>
            </div>
          ))}
        </div>

        {/* Bottom note */}
        <div className="text-center mt-12">
          <p className="text-sm text-text-dim">
            All plans include streaming responses and full BYOK support.{' '}
            <Link to="/" className="text-primary-bright no-underline hover:underline">
              Back to home
            </Link>
          </p>
        </div>
      </div>
    </section>
  );
}
