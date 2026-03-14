import { Link } from 'react-router-dom';

type FooterLink = {
  label: string;
  href: string;
  internal?: boolean;
  external?: boolean;
};

const NAV_GROUPS: { title: string; links: FooterLink[] }[] = [
  {
    title: 'Product',
    links: [
      { label: 'Features', href: '/#features' },
      { label: 'How it works', href: '/#howitworks' },
      { label: 'Pricing', href: '/pricing', internal: true },
    ],
  },
  {
    title: 'Resources',
    links: [
      { label: 'Use cases', href: '/use-cases', internal: true },
    ],
  },
  {
    title: 'Company',
    links: [
      { label: 'Kybernode', href: 'https://kybernode.com', external: true },
      { label: 'Privacy', href: '#' },
      { label: 'Terms', href: '#' },
    ],
  },
];

export function Footer() {
  return (
    <footer className="relative z-10 border-t border-[var(--border)]">
      <div
        className="py-20 md:py-24"
        style={{
          background:
            'linear-gradient(180deg, rgba(13,13,26,0.5) 0%, rgba(5,5,13,0.98) 100%)',
        }}
      >
        <div className="container max-w-6xl mx-auto px-8">
          {/* Top: brand + nav */}
          <div className="grid grid-cols-1 lg:grid-cols-[1.8fr_1fr_1fr_1fr] gap-14 lg:gap-10 mb-16">
            {/* Brand */}
            <div>
              <Link to="/" className="flex items-center gap-3 no-underline mb-6 group">
                <img src="/logo.png" alt="SoftDock" className="w-10 h-10 rounded-xl object-contain flex-shrink-0" />
                <span className="font-bold text-xl text-[var(--text)] group-hover:text-primary-bright transition-colors">
                  SoftDock
                </span>
              </Link>
              <p className="text-sm text-text-dim leading-relaxed max-w-[320px] mb-8">
                The AI debugging platform that reads your docs, understands your stack, and remembers every fix.
              </p>
              <a
                href="https://kybernode.com"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-3 px-5 py-2.5 rounded-xl border border-[var(--border)] bg-surface hover:border-primary/30 transition-colors no-underline group"
              >
                <span className="text-[13px] text-text-dim group-hover:text-[var(--text-muted)] transition-colors">
                  A product by
                </span>
                <span className="text-[13px] font-bold text-primary-bright">Kybernode</span>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-text-dim group-hover:text-primary-bright transition-colors">
                  <path d="M7 17L17 7M17 7H7M17 7v10" />
                </svg>
              </a>
            </div>

            {/* Nav columns */}
            {NAV_GROUPS.map((group) => (
              <div key={group.title}>
                <h4 className="text-[12px] font-bold text-[var(--text-muted)] uppercase tracking-[0.14em] mb-6">
                  {group.title}
                </h4>
                <ul className="space-y-4 list-none p-0 m-0">
                  {group.links.map((link) => (
                    <li key={link.label}>
                      {link.internal ? (
                        <Link
                          to={link.href}
                          className="text-sm text-text-dim no-underline hover:text-[var(--text)] transition-colors"
                        >
                          {link.label}
                        </Link>
                      ) : (
                        <a
                          href={link.href}
                          {...(link.external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                          className="text-sm text-text-dim no-underline hover:text-[var(--text)] transition-colors inline-flex items-center gap-1.5"
                        >
                          {link.label}
                          {link.external && (
                            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="opacity-40">
                              <path d="M7 17L17 7M17 7H7M17 7v10" />
                            </svg>
                          )}
                        </a>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {/* Bottom bar */}
          <div className="pt-8 border-t border-[var(--border)] flex items-center justify-center">
            <span className="text-[13px] text-text-dim">
              &copy; {new Date().getFullYear()} SoftDock by{' '}
              <a
                href="https://kybernode.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary-bright no-underline hover:underline"
              >
                Kybernode
              </a>
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
