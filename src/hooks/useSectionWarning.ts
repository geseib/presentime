import { useMemo } from 'react';
import type { WarningLevel } from '../types';
import { calcSectionWarning } from '../utils/paceEngine';

/**
 * Hybrid section warning using absolute floors + percentage thresholds.
 * Use this for section-level ring colors and section battery bars.
 * For overall timer ring / total battery, use useWarningState instead.
 */
export function useSectionWarning(
  remainingSec: number,
  adjustedDuration: number
): WarningLevel {
  return useMemo(
    () => calcSectionWarning(remainingSec, adjustedDuration),
    [remainingSec, adjustedDuration]
  );
}
