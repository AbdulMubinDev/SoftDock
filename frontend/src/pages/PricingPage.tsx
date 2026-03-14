import { LandingNav } from '../components/landing/LandingNav';
import { LandingBackground } from '../components/landing/LandingBackground';
import { Pricing } from '../components/landing/Pricing';
import { Footer } from '../components/landing/Footer';

export function PricingPage() {
  return (
    <div className="min-h-screen text-[var(--text)] relative z-10" style={{ background: 'var(--bg, #05050D)' }}>
      <LandingBackground />
      <LandingNav />
      <main className="relative z-10 pt-24">
        <Pricing />
      </main>
      <Footer />
    </div>
  );
}
