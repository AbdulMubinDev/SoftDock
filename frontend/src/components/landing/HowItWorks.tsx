import { useState, useEffect, useRef, useCallback } from 'react';

const STEP_DURATION = 6000;
const TICK = 60;

const STEPS = [
  {
    num: '01',
    title: 'Set up your workspace',
    desc: 'Name your project, plug in your API key, and you\'re live. One workspace per project — context never leaks.',
    visual: {
      heading: 'New workspace',
      lines: [
        { icon: '□', text: 'fintech-api', accent: false },
        { icon: '●', text: 'API key connected', accent: true },
        { icon: '●', text: 'Ready to debug', accent: false },
      ],
      footer: 'Ready in ~30 seconds',
    },
  },
  {
    num: '02',
    title: 'Drop your problem in',
    desc: 'Paste a stack trace, a log dump, CLI output — or just describe what broke in plain words. No templates, no formatting.',
    visual: {
      heading: 'Issue input',
      lines: [
        { icon: '>', text: 'error[E0277]: the trait bound', accent: false },
        { icon: '>', text: '`Vec<u8>: Serialize` is not satisfied', accent: false },
        { icon: '⚡', text: 'Detected: Rust / serde v1.0', accent: true },
      ],
      footer: 'Auto-detected language & framework',
    },
  },
  {
    num: '03',
    title: 'Get a sourced, working fix',
    desc: 'SoftDock streams back the answer with the exact doc reference, a code fix, and reasoning. Mark it resolved to save it forever.',
    visual: {
      heading: 'Resolution',
      lines: [
        { icon: '→', text: 'Source: serde.rs/derive.html', accent: true },
        { icon: '→', text: 'Add #[derive(Serialize)] to struct', accent: false },
        { icon: '✓', text: 'Resolved — saved to workspace', accent: true },
      ],
      footer: 'Avg. resolution: ~1.2 seconds',
    },
  },
];

export function HowItWorks() {
  const [active, setActive] = useState(0);
  const [progress, setProgress] = useState(0);
  const elapsed = useRef(0);
  const interval = useRef<ReturnType<typeof setInterval> | null>(null);

  const clearTimer = useCallback(() => {
    if (interval.current) {
      clearInterval(interval.current);
      interval.current = null;
    }
  }, []);

  const startTimer = useCallback(
    (step: number) => {
      clearTimer();
      elapsed.current = 0;
      setProgress(0);
      setActive(step);

      interval.current = setInterval(() => {
        elapsed.current += TICK;
        const pct = Math.min((elapsed.current / STEP_DURATION) * 100, 100);
        setProgress(pct);

        if (pct >= 100) {
          clearTimer();
          const next = (step + 1) % STEPS.length;
          setTimeout(() => startTimer(next), 200);
        }
      }, TICK);
    },
    [clearTimer],
  );

  useEffect(() => {
    startTimer(0);
    return clearTimer;
  }, [startTimer, clearTimer]);

  const handleStepClick = (i: number) => {
    startTimer(i);
  };

  const step = STEPS[active];

  return (
    <section
      id="howitworks"
      className="min-h-screen flex items-center py-20 md:py-28 relative z-10"
      style={{
        background:
          'linear-gradient(180deg, var(--surface) 0%, var(--bg) 40%, var(--bg) 60%, var(--surface) 100%)',
      }}
    >
      <div className="container max-w-6xl mx-auto px-8 w-full">
        {/* Header */}
        <div className="text-center mb-16">
          <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-[var(--border)] bg-primary/10 text-[11px] font-semibold text-primary-bright uppercase tracking-wider mb-4">
            How it works
          </span>
          <h2 className="text-3xl md:text-[2.75rem] font-extrabold leading-tight tracking-tight mb-4">
            Three steps. No friction.
          </h2>
          <p className="text-sm md:text-base text-text-muted font-light max-w-[440px] mx-auto">
            From the moment you paste an error to the moment you have a working fix — here's exactly what happens.
          </p>
        </div>

        {/* Step indicators */}
        <div className="grid grid-cols-3 gap-3 md:gap-5 mb-10 max-w-3xl mx-auto">
          {STEPS.map((s, i) => (
            <button
              key={i}
              type="button"
              onClick={() => handleStepClick(i)}
              className="text-left group"
            >
              {/* Progress bar */}
              <div className="h-[3px] rounded-full bg-[var(--border)] mb-3 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-100 ease-linear"
                  style={{
                    width:
                      i < active
                        ? '100%'
                        : i === active
                          ? `${progress}%`
                          : '0%',
                    background:
                      i <= active
                        ? 'linear-gradient(90deg, #1A6BCC, #4D9FFF)'
                        : 'transparent',
                  }}
                />
              </div>
              <div className="flex items-baseline gap-2">
                <span
                  className={`text-xs font-bold font-mono transition-colors ${
                    i === active ? 'text-primary-bright' : 'text-text-dim'
                  }`}
                >
                  {s.num}
                </span>
                <span
                  className={`text-sm font-semibold transition-colors ${
                    i === active ? 'text-[var(--text)]' : 'text-text-dim'
                  }`}
                >
                  {s.title}
                </span>
              </div>
            </button>
          ))}
        </div>

        {/* Active step content */}
        <div
          className="rounded-2xl border border-[var(--border)] overflow-hidden max-w-3xl mx-auto"
          style={{
            background:
              'linear-gradient(135deg, rgba(13,13,26,0.95) 0%, rgba(5,5,13,0.98) 100%)',
            boxShadow:
              '0 0 0 1px rgba(26,107,204,0.06), 0 32px 80px rgba(0,0,0,0.45)',
          }}
        >
          <div className="grid grid-cols-1 md:grid-cols-2">
            {/* Left — description */}
            <div className="p-7 md:p-9 flex flex-col justify-center border-b md:border-b-0 md:border-r border-[var(--border)]">
              <div
                className="w-10 h-10 rounded-xl bg-primary/15 border border-primary/25 flex items-center justify-center text-primary-bright text-sm font-bold mb-5"
              >
                {step.num}
              </div>
              <h3 className="text-lg md:text-xl font-bold mb-3 text-[var(--text)]">
                {step.title}
              </h3>
              <p className="text-[14px] text-[var(--text-muted)] leading-relaxed">
                {step.desc}
              </p>
            </div>

            {/* Right — visual */}
            <div className="p-7 md:p-9 flex items-center bg-[rgba(26,107,204,0.02)]">
              <div className="w-full">
                <div className="flex items-center gap-2 mb-5">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                  <span className="text-[10px] font-bold uppercase tracking-wider text-primary-bright">
                    {step.visual.heading}
                  </span>
                </div>
                <div className="space-y-3 font-mono text-[13px]">
                  {step.visual.lines.map((line, li) => (
                    <div
                      key={li}
                      className={`flex items-start gap-2.5 ${
                        line.accent ? 'text-primary-bright' : 'text-[var(--text-muted)]'
                      }`}
                    >
                      <span className="flex-shrink-0 opacity-60">{line.icon}</span>
                      <span>{line.text}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-5 pt-4 border-t border-[var(--border)] text-[11px] text-text-dim flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded bg-primary/10 text-primary-bright font-medium">
                    {step.visual.footer.split(':')[0]}
                  </span>
                  {step.visual.footer.includes(':') && (
                    <span>{step.visual.footer.split(':').slice(1).join(':')}</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
