import { useState } from 'react';

const FEATURES = [
  {
    id: 'input',
    label: 'Any input',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M4 17l6-6-6-6M12 19h8" />
      </svg>
    ),
    title: 'Paste your mess. Get a clean answer.',
    body: 'Throw in a stack trace, a cryptic log, raw CLI output, or just type what went wrong in plain English. SoftDock figures out the tool, version, and root cause — you don\'t need to format anything.',
    visual: (
      <div className="space-y-3 font-mono text-xs">
        <div className="flex gap-2 items-start">
          <span className="text-red-400 flex-shrink-0">{'>'}</span>
          <span className="text-red-400/80">{'ECONNREFUSED 127.0.0.1:5432 — connection refused'}</span>
        </div>
        <div className="flex gap-2 items-start">
          <span className="text-red-400 flex-shrink-0">{'>'}</span>
          <span className="text-red-400/80">{'at TCPConnectWrap.afterConnect (net.js:1141:16)'}</span>
        </div>
        <div className="h-px bg-[var(--border)] my-2" />
        <div className="flex gap-2 items-start">
          <span className="text-green-400 flex-shrink-0">{'✓'}</span>
          <span className="text-green-400/90">PostgreSQL not running on port 5432. Start the service or check your connection string.</span>
        </div>
      </div>
    ),
  },
  {
    id: 'streaming',
    label: 'Streaming',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
      </svg>
    ),
    title: 'Watch the fix write itself.',
    body: 'No loading screens. SoftDock streams reasoning, code blocks, and source references token by token as the model generates them. You can start reading and acting before the full answer is even complete.',
    visual: (
      <div className="space-y-2 font-mono text-xs">
        <div className="text-[var(--text-muted)]">The issue is that <span className="text-[#89DCEB]">ctx</span> expires before the goroutine finishes...</div>
        <div className="text-[var(--text-muted)] opacity-70">Wrapping the call in a detached context preserves the</div>
        <div className="text-[var(--text-muted)] opacity-40">lifecycle without leaking...</div>
        <div className="inline-block w-0.5 h-3.5 bg-[#1A6BCC] ml-0.5 align-middle animate-blink" />
      </div>
    ),
  },
  {
    id: 'memory',
    label: 'Memory',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <circle cx="12" cy="12" r="10" />
        <path d="M12 6v6l4 2" />
      </svg>
    ),
    title: 'Fixes that stick around.',
    body: 'When you resolve an issue, SoftDock saves the full thread — the error, the context, and the working solution. Next time a similar pattern shows up in the same workspace, it pulls from what already worked.',
    visual: (
      <div className="space-y-2.5 text-xs">
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
          <span className="text-[var(--text-muted)]">CORS preflight failing on PUT requests</span>
          <span className="ml-auto text-text-dim">2d ago</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
          <span className="text-[var(--text-muted)]">WebSocket auth token expiry mid-session</span>
          <span className="ml-auto text-text-dim">5d ago</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
          <span className="text-[var(--text-muted)]">Terraform state lock stuck after crash</span>
          <span className="ml-auto text-text-dim">1w ago</span>
        </div>
        <div className="h-px bg-[var(--border)] my-1" />
        <div className="text-text-dim">3 resolved issues available as context</div>
      </div>
    ),
  },
  {
    id: 'isolation',
    label: 'Isolation',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <rect x="3" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" />
        <rect x="14" y="14" width="7" height="7" rx="1" />
      </svg>
    ),
    title: 'One workspace per world.',
    body: 'Every project, client, or environment gets a sealed workspace. Docs, issue history, API keys, and resolved solutions never bleed across. Switch between them without worrying about context pollution.',
    visual: (
      <div className="grid grid-cols-2 gap-2 text-xs">
        {['fintech-api', 'mobile-app', 'infra-prod', 'client-xyz'].map((name) => (
          <div
            key={name}
            className="px-3 py-2 rounded-lg bg-[rgba(26,107,204,0.06)] border border-[var(--border)] text-text-dim font-mono text-center"
          >
            {name}
          </div>
        ))}
      </div>
    ),
  },
  {
    id: 'docs',
    label: 'Doc search',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <circle cx="11" cy="11" r="8" />
        <path d="M21 21l-4.35-4.35" />
      </svg>
    ),
    title: 'It reads the docs so you don\'t have to.',
    body: 'SoftDock crawls official documentation, open GitHub issues, migration guides, and changelogs autonomously. You describe the problem — it finds, reads, and cites the exact section that contains the answer.',
    visual: (
      <div className="space-y-2 text-xs">
        {[
          { src: 'stripe-api-v2024.md', match: 'PaymentIntent lifecycle' },
          { src: 'github/fastify#4821', match: 'Breaking: hook signature changed' },
          { src: 'k8s-changelog-1.29', match: 'Deprecation: PodSecurityPolicy' },
        ].map((item) => (
          <div key={item.src} className="flex items-start gap-2">
            <span className="text-primary-bright flex-shrink-0 mt-0.5">→</span>
            <div>
              <span className="text-[var(--text-muted)]">{item.match}</span>
              <span className="text-text-dim ml-2 text-[10px]">{item.src}</span>
            </div>
          </div>
        ))}
      </div>
    ),
  },
];

export function Features() {
  const [activeId, setActiveId] = useState('input');
  const active = FEATURES.find((f) => f.id === activeId) ?? FEATURES[0];

  return (
    <section id="features" className="py-20 md:py-28 relative z-10">
      <div className="container max-w-6xl mx-auto px-8">
        {/* Header */}
        <div className="text-center mb-14">
          <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-[var(--border)] bg-primary/10 text-[11px] font-semibold text-primary-bright uppercase tracking-wider mb-4">
            Features
          </span>
          <h2 className="text-3xl md:text-[2.75rem] font-extrabold leading-tight tracking-tight mb-4">
            Everything you need,
            <br />
            nothing you don't.
          </h2>
          <p className="text-sm md:text-base text-text-muted font-light max-w-[480px] mx-auto">
            Five capabilities designed around how debugging actually works — messy inputs, scattered docs, and solutions worth remembering.
          </p>
        </div>

        {/* Feature selector tabs */}
        <div className="flex justify-center mb-10">
          <div className="inline-flex items-center gap-1 p-1 rounded-xl border border-[var(--border)] bg-surface">
            {FEATURES.map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setActiveId(f.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                  activeId === f.id
                    ? 'bg-primary/15 text-primary-bright shadow-sm'
                    : 'text-text-dim hover:text-[var(--text-muted)] hover:bg-[rgba(26,107,204,0.04)]'
                }`}
              >
                <span className={activeId === f.id ? 'text-primary-bright' : 'text-text-dim'}>
                  {f.icon}
                </span>
                <span className="hidden sm:inline">{f.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Active feature panel */}
        <div
          className="rounded-2xl border border-[var(--border)] overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, rgba(13,13,26,0.95) 0%, rgba(5,5,13,0.98) 100%)',
            boxShadow: '0 0 0 1px rgba(26,107,204,0.06), 0 24px 80px rgba(0,0,0,0.4)',
          }}
        >
          <div className="grid grid-cols-1 lg:grid-cols-2 min-h-[340px]">
            {/* Left: text */}
            <div className="p-8 md:p-10 flex flex-col justify-center">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 rounded-xl bg-primary/10 border border-[var(--border)] flex items-center justify-center text-primary-bright">
                  {active.icon}
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-primary-bright bg-primary/10 border border-primary/25 px-2.5 py-1 rounded-full">
                  {active.label}
                </span>
              </div>
              <h3 className="text-xl md:text-2xl font-bold leading-snug mb-4 whitespace-pre-line text-[var(--text)]">
                {active.title}
              </h3>
              <p className="text-[14px] text-[var(--text-muted)] leading-relaxed">
                {active.body}
              </p>
            </div>

            {/* Right: visual */}
            <div className="p-8 md:p-10 flex items-center border-t lg:border-t-0 lg:border-l border-[var(--border)] bg-[rgba(26,107,204,0.02)]">
              <div className="w-full rounded-xl border border-[var(--border)] bg-surface p-5 md:p-6">
                {active.visual}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
