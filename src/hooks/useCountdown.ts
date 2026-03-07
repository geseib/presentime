import { useEffect, useRef } from 'react';
import { useTimerStore } from '../store/timerStore';

/**
 * setInterval-based timer loop.
 * Uses performance.now() deltas to avoid drift.
 * Keeps ticking even when the window is backgrounded (e.g., popup focused).
 */
export function useCountdown() {
  const status = useTimerStore(s => s.status);
  const tick = useTimerStore(s => s.tick);
  const lastTimeRef = useRef<number | null>(null);

  useEffect(() => {
    if (status !== 'running') {
      lastTimeRef.current = null;
      return;
    }

    // In test mode, tests use tickTimer() for deterministic time control
    if ((window as any).__PRESENTIME_TEST_MODE) return;

    lastTimeRef.current = performance.now();

    const interval = setInterval(() => {
      const now = performance.now();
      if (lastTimeRef.current !== null) {
        const deltaSec = (now - lastTimeRef.current) / 1000;
        tick(deltaSec);
      }
      lastTimeRef.current = now;
    }, 100);

    return () => {
      clearInterval(interval);
      lastTimeRef.current = null;
    };
  }, [status, tick]);
}
