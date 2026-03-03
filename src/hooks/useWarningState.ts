import { useMemo } from 'react';
import type { WarningLevel } from '../types';
import { WARNING_THRESHOLDS } from '../utils/constants';

/**
 * Derive warning level from remaining time ratio.
 */
export function useWarningState(
  remainingSec: number,
  totalSec: number
): WarningLevel {
  return useMemo(() => {
    if (totalSec <= 0) return 'ok';
    if (remainingSec < 0) return 'overtime';

    const ratio = remainingSec / totalSec;
    if (ratio <= WARNING_THRESHOLDS.danger) return 'danger';
    if (ratio <= WARNING_THRESHOLDS.caution) return 'caution';
    return 'ok';
  }, [remainingSec, totalSec]);
}
