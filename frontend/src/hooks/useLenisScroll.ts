import { useEffect } from 'react';
import Lenis from 'lenis';

/**
 * Initializes Lenis for document-level smooth scroll.
 * Call once at the root; it only affects pages that use the natural
 * document scroll (landing, pricing, reviews…).
 * Pages that rely on overflow containers (AppShell → main) are unaffected.
 */
export function useLenisScroll() {
  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.1,
      easing: (t: number) => 1 - Math.pow(1 - t, 4),
      smoothWheel: true,
      touchMultiplier: 1.5,
    });

    let raf: number;
    function tick(time: number) {
      lenis.raf(time);
      raf = requestAnimationFrame(tick);
    }
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      lenis.destroy();
    };
  }, []);
}
