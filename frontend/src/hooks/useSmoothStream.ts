import { useState, useEffect, useRef } from 'react';

const CHARS_PER_TICK = 3;
const TICK_MS = 16;

/**
 * Reveals `fullText` character-by-character at a steady pace
 * so the output feels like fluid typing rather than sudden bursts.
 * When streaming is done, immediately show everything remaining.
 */
export function useSmoothStream(fullText: string, isStreaming: boolean): string {
  const [displayed, setDisplayed] = useState(isStreaming ? '' : fullText);
  const cursorRef = useRef(isStreaming ? 0 : fullText.length);
  const rafRef = useRef(0);
  const lastTickRef = useRef(0);

  useEffect(() => {
    if (!isStreaming && fullText) {
      cursorRef.current = fullText.length;
      setDisplayed(fullText);
      return;
    }

    if (!isStreaming) return;

    function tick(now: number) {
      if (now - lastTickRef.current >= TICK_MS) {
        lastTickRef.current = now;
        const target = fullText.length;
        if (cursorRef.current < target) {
          cursorRef.current = Math.min(cursorRef.current + CHARS_PER_TICK, target);
          setDisplayed(fullText.slice(0, cursorRef.current));
        }
      }
      rafRef.current = requestAnimationFrame(tick);
    }

    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [fullText, isStreaming]);

  return displayed;
}
