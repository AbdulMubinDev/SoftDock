const ROWS = [
  { label: 'Context', left: 'General knowledge', right: 'Your issues, your stack traces, your logs' },
  { label: 'Memory', left: 'Forgets every session', right: 'Remembers every resolved issue' },
  { label: 'Sources', left: 'Training data, often outdated', right: 'Your errors, your code, your history' },
  { label: 'Cost', left: 'Subscription with caps', right: 'Your API key — cost price, no markup' },
];

const DIFFERENTIATORS = [
  {
    num: '01',
    title: 'Tool-specific, never generic',
    body: 'SoftDock focuses on your stack traces, logs, and code — no generic fluff.',
  },
  {
    num: '02',
    title: 'Hours collapse to seconds',
    body: 'Replaces scattered docs, forums, and outdated threads with one sourced, working answer.',
  },
  {
    num: '03',
    title: 'Resolution memory',
    body: 'Every resolved issue is remembered. The assistant can reference past fixes in your workspace.',
  },
];

export function Why() {
  return (
    <section id="why" className="min-h-screen flex items-center py-16 md:py-20 relative z-10">
      <div className="container max-w-6xl mx-auto px-8 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left — headline + differentiators */}
          <div>
            <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-[var(--border)] bg-primary/10 text-[11px] font-semibold text-primary-bright uppercase tracking-wider mb-5">
              Why SoftDock
            </span>
            <h2 className="text-3xl md:text-[2.75rem] font-extrabold leading-[1.1] tracking-tight mb-5">
              A dedicated AI
              <br />
              outperforms a powerful
              <br />
              <span className="text-text-dim">general one.</span>
            </h2>
            <p className="text-base text-text-muted font-light max-w-[420px] mb-10">
              Even the best models give generic answers without the right context. SoftDock loads that context before you ask.
            </p>

            <div className="space-y-0">
              {DIFFERENTIATORS.map((d, i) => (
                <div
                  key={i}
                  className={`flex gap-5 py-5 ${
                    i < DIFFERENTIATORS.length - 1 ? 'border-b border-[var(--border)]' : ''
                  }`}
                >
                  <span className="text-sm font-bold font-mono text-primary-bright mt-0.5 flex-shrink-0 w-6">
                    {d.num}
                  </span>
                  <div>
                    <h3 className="text-[15px] font-bold text-[var(--text)] mb-1">{d.title}</h3>
                    <p className="text-sm text-text-muted leading-relaxed">{d.body}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right — comparison card */}
          <div
            className="rounded-2xl border border-[var(--border)] overflow-hidden"
            style={{
              background: 'linear-gradient(135deg, rgba(13,13,26,0.95) 0%, rgba(5,5,13,0.98) 100%)',
              boxShadow: '0 0 0 1px rgba(26,107,204,0.06), 0 32px 80px rgba(0,0,0,0.45)',
            }}
          >
            {/* Card header */}
            <div className="px-6 py-4 border-b border-[var(--border)] flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              <span className="text-[11px] font-bold uppercase tracking-wider text-primary-bright">
                Head-to-head
              </span>
            </div>

            {/* Column headers */}
            <div className="grid grid-cols-[1.2fr_1fr_1fr] border-b border-[var(--border)]">
              <div className="px-5 py-3" />
              <div className="px-5 py-3 text-center border-l border-[var(--border)]">
                <span className="text-[11px] font-bold text-text-dim uppercase tracking-wider">
                  Others
                </span>
              </div>
              <div className="px-5 py-3 text-center border-l border-[var(--border)] bg-primary/5">
                <span className="text-[11px] font-bold text-primary-bright uppercase tracking-wider">
                  SoftDock
                </span>
              </div>
            </div>

            {/* Rows */}
            {ROWS.map((row, i) => (
              <div
                key={i}
                className={`grid grid-cols-[1.2fr_1fr_1fr] ${
                  i < ROWS.length - 1 ? 'border-b border-[var(--border)]' : ''
                }`}
              >
                <div className="px-5 py-4 flex items-center">
                  <span className="text-sm font-semibold text-[var(--text)]">{row.label}</span>
                </div>
                <div className="px-5 py-4 border-l border-[var(--border)] flex items-center">
                  <div className="flex items-start gap-2">
                    <span className="text-red-400/70 flex-shrink-0 mt-0.5">✕</span>
                    <span className="text-[13px] text-text-dim leading-snug">{row.left}</span>
                  </div>
                </div>
                <div className="px-5 py-4 border-l border-[var(--border)] bg-primary/5 flex items-center">
                  <div className="flex items-start gap-2">
                    <span className="text-green-400 flex-shrink-0 mt-0.5">✓</span>
                    <span className="text-[13px] text-[var(--text-muted)] leading-snug">{row.right}</span>
                  </div>
                </div>
              </div>
            ))}

            {/* Card footer */}
            <div className="px-6 py-4 border-t border-[var(--border)] flex items-center justify-between">
              <span className="text-[12px] text-text-dim">Same model. Better context. Better answers.</span>
              <span className="text-[11px] font-bold text-primary-bright bg-primary/10 px-3 py-1 rounded-full">
                BYOK
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
