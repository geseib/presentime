import { MIN_SECTION_DURATION_SEC } from './constants';
import type { SectionRuntimeState } from '../types';

/**
 * Proportionally redistribute overtime from a completed section across
 * remaining pending sections. Each remaining section loses the same
 * percentage of its adjusted duration. A floor of MIN_SECTION_DURATION_SEC
 * prevents any section from being reduced to nothing. A second pass
 * handles spillover from clamped sections.
 */
export function redistributeOvertime(
  sections: SectionRuntimeState[],
  completedSectionId: string
): SectionRuntimeState[] {
  const completedIdx = sections.findIndex(s => s.sectionId === completedSectionId);
  if (completedIdx === -1) return sections;

  const completed = sections[completedIdx];
  const overtime = completed.elapsedSec - completed.adjustedDurationSec;

  // No overtime to redistribute
  if (overtime <= 0) return sections;

  const remaining = sections.filter(
    s => s.status === 'pending' && s.sectionId !== completedSectionId
  );

  if (remaining.length === 0) return sections;

  const totalRemainingTime = remaining.reduce(
    (sum, s) => sum + s.adjustedDurationSec,
    0
  );

  if (totalRemainingTime <= 0) return sections;

  // Two-pass proportional redistribution with floor clamping
  let unallocated = overtime;
  const adjustments = new Map<string, number>();

  // Pass 1: Proportional reduction
  let clampedTotal = 0;
  let unclampedTotal = 0;

  for (const section of remaining) {
    const proportion = section.adjustedDurationSec / totalRemainingTime;
    const reduction = overtime * proportion;
    const newDuration = section.adjustedDurationSec - reduction;

    if (newDuration < MIN_SECTION_DURATION_SEC) {
      const actualReduction = section.adjustedDurationSec - MIN_SECTION_DURATION_SEC;
      adjustments.set(section.sectionId, MIN_SECTION_DURATION_SEC);
      clampedTotal += actualReduction;
    } else {
      adjustments.set(section.sectionId, newDuration);
      unclampedTotal += newDuration;
    }
  }

  // Pass 2: Redistribute spillover from clamped sections
  const spillover = unallocated - clampedTotal - (totalRemainingTime - unclampedTotal - remaining.filter(s => adjustments.get(s.sectionId) === MIN_SECTION_DURATION_SEC).reduce((sum, s) => sum + s.adjustedDurationSec, 0));

  if (spillover > 0 && unclampedTotal > 0) {
    for (const section of remaining) {
      const currentAdj = adjustments.get(section.sectionId) ?? section.adjustedDurationSec;
      if (currentAdj > MIN_SECTION_DURATION_SEC) {
        const proportion = currentAdj / unclampedTotal;
        const extraReduction = spillover * proportion;
        const newDuration = Math.max(MIN_SECTION_DURATION_SEC, currentAdj - extraReduction);
        adjustments.set(section.sectionId, newDuration);
      }
    }
  }

  return sections.map(s => {
    const adj = adjustments.get(s.sectionId);
    if (adj !== undefined) {
      return { ...s, adjustedDurationSec: Math.round(adj) };
    }
    return s;
  });
}
