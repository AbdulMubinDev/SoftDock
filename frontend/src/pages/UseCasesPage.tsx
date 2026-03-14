import { LandingNav } from '../components/landing/LandingNav';
import { LandingBackground } from '../components/landing/LandingBackground';
import { UseCases } from '../components/landing/UseCases';
import { Footer } from '../components/landing/Footer';

export function UseCasesPage() {
  return (
    <div className="min-h-screen text-[var(--text)] relative z-10" style={{ background: 'var(--bg, #05050D)' }}>
      <LandingBackground />
      <LandingNav />
      <main className="relative z-10 pt-24">
        <UseCases />
      </main>
      <Footer />
    </div>
  );
}
