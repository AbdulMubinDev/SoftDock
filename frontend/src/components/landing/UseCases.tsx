import { useState } from 'react';

type UseCase = {
  role: string;
  headline: string;
  description: string;
  bullets: string[];
  code: {
    comment: string;
    problem: string;
    fix: string;
  };
};

const CASES: UseCase[] = [
  {
    role: 'Backend Dev',
    headline: 'Resolve API errors without digging through docs',
    description:
      'You\'re integrating a payment gateway, hitting a 422 with a cryptic body. SoftDock reads the SDK docs, matches the error pattern, and returns the fix with the exact endpoint and payload shape.',
    bullets: [
      'Upload SDK docs once, query them forever',
      'Get version-specific fixes, not generic advice',
      'Source citations so you can verify before deploying',
    ],
    code: {
      comment: '// Stripe webhook signature mismatch',
      problem: 'error: No signatures found matching the expected signature for payload',
      fix: '✓ Use the raw request body (not parsed JSON) when verifying the signature. See: stripe.com/docs/webhooks/signatures',
    },
  },
  {
    role: 'Frontend Dev',
    headline: 'Fix rendering issues and build errors in seconds',
    description:
      'A component hydration mismatch in production, a bundler error after upgrading — paste the error and SoftDock traces it to the root cause with a working patch.',
    bullets: [
      'Handles bundler, SSR, and runtime errors equally',
      'Framework-aware — knows Vite vs Webpack vs Turbopack',
      'Resolution memory recalls similar fixes from your workspace',
    ],
    code: {
      comment: '// Hydration mismatch after SSR',
      problem: 'Warning: Text content did not match. Server: "12" Client: "0"',
      fix: '✓ Wrap the dynamic counter in a useEffect or use suppressHydrationWarning for clock-dependent values.',
    },
  },
  {
    role: 'DevOps',
    headline: 'Debug infrastructure without context-switching',
    description:
      'A Terraform apply fails, a container won\'t start, a pipeline is red. Paste the output and SoftDock identifies the misconfiguration, referencing the exact provider docs.',
    bullets: [
      'Understands Terraform, Docker, K8s, CI/CD configs',
      'Reads provider changelogs for breaking changes',
      'Saves infra fixes to workspace memory for your team',
    ],
    code: {
      comment: '# Terraform plan failed',
      problem: 'Error: Unsupported attribute "enable_dns_support" — did you mean "enable_dns_hostnames"?',
      fix: '✓ Attribute renamed in AWS provider v5.0. Update to enable_dns_hostnames. See: registry.terraform.io/providers/hashicorp/aws/latest/docs',
    },
  },
  {
    role: 'Technical PM',
    headline: 'Understand technical blockers without being a bottleneck',
    description:
      'Your team says "the migration broke the API." Paste the error thread into SoftDock and get a plain-language summary of what happened, why, and what the fix looks like — so you can unblock the sprint.',
    bullets: [
      'Translates stack traces into actionable summaries',
      'Helps you ask the right follow-up questions',
      'Share resolved issues as documentation for the team',
    ],
    code: {
      comment: '// Team reported: "API returns 500 after deploy"',
      problem: 'IntegrityError: null value in column "org_id" violates not-null constraint',
      fix: '✓ The migration added a non-nullable column without a default. Add a data migration to backfill existing rows.',
    },
  },
];

export function UseCases() {
  const [active, setActive] = useState(0);
  const current = CASES[active];

  return (
    <section id="usecases" className="py-24 md:py-32 relative z-10">
      <div className="container max-w-6xl mx-auto px-8">
        {/* Header */}
        <div className="text-center mb-14">
          <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-[var(--border)] bg-primary/10 text-[11px] font-semibold text-primary-bright uppercase tracking-wider mb-5">
            Use cases
          </span>
          <h2 className="text-3xl md:text-[2.75rem] font-extrabold leading-tight tracking-tight mb-4">
            Built for every technical role
          </h2>
          <p className="text-base text-text-muted font-light max-w-[480px] mx-auto">
            Whether you write code, ship infrastructure, or manage a team — SoftDock fits into your workflow.
          </p>
        </div>

        {/* Role tabs */}
        <div className="flex justify-center mb-10">
          <div className="inline-flex items-center gap-1 p-1 rounded-xl border border-[var(--border)] bg-surface">
            {CASES.map((c, i) => (
              <button
                key={c.role}
                type="button"
                onClick={() => setActive(i)}
                className={`px-5 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                  active === i
                    ? 'bg-primary/15 text-primary-bright shadow-sm'
                    : 'text-text-dim hover:text-[var(--text-muted)] hover:bg-[rgba(26,107,204,0.04)]'
                }`}
              >
                {c.role}
              </button>
            ))}
          </div>
        </div>

        {/* Active use case panel */}
        <div
          className="rounded-2xl border border-[var(--border)] overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, rgba(13,13,26,0.95) 0%, rgba(5,5,13,0.98) 100%)',
            boxShadow: '0 0 0 1px rgba(26,107,204,0.06), 0 24px 80px rgba(0,0,0,0.4)',
          }}
        >
          <div className="grid grid-cols-1 lg:grid-cols-2">
            {/* Left — description */}
            <div className="p-8 md:p-10 flex flex-col justify-center border-b lg:border-b-0 lg:border-r border-[var(--border)]">
              <h3 className="text-xl md:text-2xl font-bold leading-snug mb-4 text-[var(--text)]">
                {current.headline}
              </h3>
              <p className="text-[14px] text-[var(--text-muted)] leading-relaxed mb-6">
                {current.description}
              </p>
              <ul className="space-y-3 list-none p-0 m-0">
                {current.bullets.map((b) => (
                  <li key={b} className="flex items-start gap-2.5 text-[13px] text-text-muted">
                    <span className="text-primary-bright flex-shrink-0 mt-0.5">→</span>
                    {b}
                  </li>
                ))}
              </ul>
            </div>

            {/* Right — code example */}
            <div className="p-8 md:p-10 flex items-center bg-[rgba(26,107,204,0.02)]">
              <div className="w-full rounded-xl border border-[var(--border)] bg-surface overflow-hidden">
                {/* Mini title bar */}
                <div className="flex items-center gap-1.5 px-4 py-2.5 border-b border-[var(--border)]">
                  <span className="w-2 h-2 rounded-full bg-[#ff5f57]" />
                  <span className="w-2 h-2 rounded-full bg-[#febc2e]" />
                  <span className="w-2 h-2 rounded-full bg-[#28c840]" />
                  <span className="ml-3 text-[10px] text-text-dim font-mono">{current.role.toLowerCase().replace(' ', '-')}.log</span>
                </div>
                <div className="p-5 font-mono text-[13px] space-y-3">
                  <div className="text-text-dim">{current.code.comment}</div>
                  <div className="text-red-400/80 break-words">{current.code.problem}</div>
                  <div className="h-px bg-[var(--border)] my-1" />
                  <div className="text-green-400/90 break-words">{current.code.fix}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
