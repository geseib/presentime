import { useEffect, useRef } from 'react';

/**
 * Request a screen wake lock to prevent the display from sleeping
 * during a presentation. Releases automatically on unmount.
 */
export function useWakeLock(enabled: boolean) {
  const wakeLockRef = useRef<WakeLockSentinel | null>(null);

  useEffect(() => {
    if (!enabled || !('wakeLock' in navigator)) return;

    let released = false;

    const request = async () => {
      try {
        wakeLockRef.current = await navigator.wakeLock.request('screen');
        wakeLockRef.current.addEventListener('release', () => {
          wakeLockRef.current = null;
        });
      } catch {
        // Wake lock request failed (e.g., low battery)
      }
    };

    request();

    // Re-acquire on visibility change (tab comes back to foreground)
    const handleVisibility = () => {
      if (document.visibilityState === 'visible' && !released) {
        request();
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      released = true;
      document.removeEventListener('visibilitychange', handleVisibility);
      wakeLockRef.current?.release();
    };
  }, [enabled]);
}
