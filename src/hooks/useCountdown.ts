import { useEffect, useRef } from 'react';
import { useTimerStore } from '../store/timerStore';

/**
 * requestAnimationFrame-based timer loop.
 * Uses performance.now() deltas to avoid drift.
 * Automatically pauses when the tab is backgrounded (rAF stops firing).
 */
export function useCountdown() {
  const status = useTimerStore(s => s.status);
  const tick = useTimerStore(s => s.tick);
  const lastTimeRef = useRef<number | null>(null);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    if (status !== 'running') {
      lastTimeRef.current = null;
      return;
    }

    const loop = (now: number) => {
      if (lastTimeRef.current !== null) {
        const deltaSec = (now - lastTimeRef.current) / 1000;
        // Cap delta to 0.1s to handle tab-return gracefully
        // (prevents huge jumps when tab was backgrounded)
        const clampedDelta = Math.min(deltaSec, 0.1);
        tick(clampedDelta);
      }
      lastTimeRef.current = now;
      rafRef.current = requestAnimationFrame(loop);
    };

    rafRef.current = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(rafRef.current);
      lastTimeRef.current = null;
    };
  }, [status, tick]);
}
