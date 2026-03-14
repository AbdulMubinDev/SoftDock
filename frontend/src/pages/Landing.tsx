import { Hero } from '../components/landing/Hero';
import { DemoAndLogos } from '../components/landing/DemoAndLogos';
import { Features } from '../components/landing/Features';
import { HowItWorks } from '../components/landing/HowItWorks';
import { Why } from '../components/landing/Why';
import { CTA } from '../components/landing/CTA';
import { Footer } from '../components/landing/Footer';
import { LandingNav } from '../components/landing/LandingNav';
import { LandingBackground } from '../components/landing/LandingBackground';

export function Landing() {
  return (
    <div className="min-h-screen text-[var(--text)] relative z-10" style={{ background: 'var(--bg, #05050D)' }}>
      <LandingBackground />
      <LandingNav />
      <Hero />
      <DemoAndLogos />
      <Features />
      <HowItWorks />
      <Why />
      <CTA />
      <Footer />
    </div>
  );
}
