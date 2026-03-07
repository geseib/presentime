import { useMemo } from 'react';
import type { WarningLevel } from '../types';

/**
 * Derive warning level from remaining time ratio (percentage-based).
 * Used for the overall timer ring and total battery bar.
 * For section-level warnings, use useSectionWarning instead — it adds
 * absolute floor thresholds for consistent reaction time.
 */
export function useWarningState(
  remainingSec: number,
  totalSec: number
): WarningLevel {
  return useMemo(() => {
    if (totalSec <= 0) return 'ok';
    if (remainingSec < 0) return 'overtime';

    const ratio = remainingSec / totalSec;
    if (ratio <= 0.10) return 'danger';
    if (ratio <= 0.25) return 'caution';
    return 'ok';
  }, [remainingSec, totalSec]);
}
