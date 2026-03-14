const LOGOS = [
  'Django', 'FastAPI', 'React', 'Next.js', 'Node.js', 'PostgreSQL', 'Docker', 'AWS',
  'Firebase', 'Stripe API', 'Supabase', 'Nginx', 'Redis', 'Celery', 'GraphQL', 'Prisma',
];

export function LogosStripContent() {
  return (
    <div className="py-6">
      <p className="text-center text-[11px] font-medium text-text-dim uppercase tracking-widest mb-4">
        SoftDock autonomously finds and reads documentation for
      </p>
      <div className="overflow-hidden relative mask-[linear-gradient(90deg,transparent_0%,black_8%,black_92%,transparent_100%)]">
        <div className="flex animate-marquee w-max gap-0">
          {[...LOGOS, ...LOGOS].map((name, i) => (
            <span
              key={`${name}-${i}`}
              className="inline-flex items-center gap-2 px-8 py-0 border-r border-[var(--border)] whitespace-nowrap text-sm font-semibold text-text-dim hover:text-primary-bright transition-colors"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-primary opacity-50" />
              {name}
            </span>
          ))}
        </div>
      </div>
      <p className="text-center text-xs text-text-dim mt-4 opacity-60">
        + any framework, library, or platform with public documentation
      </p>
    </div>
  );
}

export function LogosStrip() {
  return (
    <section id="logos" className="relative z-10 bg-surface border-y border-[var(--border)] overflow-hidden">
      <LogosStripContent />
    </section>
  );
}
