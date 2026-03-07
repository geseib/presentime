import type { SectionRuntimeState, WarningLevel } from '../types';

// --- Constants ---

export const PACE_DEAD_ZONE_SEC = 2;

export const SECTION_WARNING_FLOORS = {
  cautionSec: 45,
  dangerSec: 15,
} as const;

/** Percentage-based thresholds (same as old WARNING_THRESHOLDS) */
const SECTION_PERCENT = {
  caution: 0.25,
  danger: 0.10,
} as const;

/** Pace deficit thresholds as fraction of total duration */
export const PACE_THRESHOLDS = {
  cautionFraction: 0.03,
  dangerFraction: 0.10,
} as const;

/** Projected finish thresholds as fraction of total duration */
export const PROJECTION_THRESHOLDS = {
  okFraction: 0.05,
  cautionFraction: 0.15,
} as const;

// --- Pure calculation functions ---

/**
 * Calculate pace offset: how far ahead/behind the presenter is.
 * Positive = ahead, negative = behind.
 */
export function calcPaceOffset(
  sections: SectionRuntimeState[],
  totalDuration: number,
  totalElapsed: number
): number {
  const timeRemaining = totalDuration - totalElapsed;
  let contentRemaining = 0;
  for (const s of sections) {
    if (s.status === 'active') {
      contentRemaining += s.originalDurationSec - s.elapsedSec;
    } else if (s.status === 'pending') {
      contentRemaining += s.originalDurationSec;
    }
  }
  return timeRemaining - contentRemaining;
}

/**
 * Derive pace warning from offset. Thresholds scale to presentation length.
 */
export function calcPaceWarning(offsetSec: number, totalDuration: number): WarningLevel {
  if (offsetSec >= -PACE_DEAD_ZONE_SEC) return 'ok';
  const deficit = Math.abs(offsetSec);
  if (deficit >= totalDuration * PACE_THRESHOLDS.dangerFraction) return 'danger';
  if (deficit >= totalDuration * PACE_THRESHOLDS.cautionFraction) return 'caution';
  return 'ok';
}

/** Convenience snapshot of pace state */
export interface PaceSnapshot {
  offsetSec: number;
  isOnPace: boolean;
  paceWarning: WarningLevel;
}

export function calcPaceSnapshot(
  sections: SectionRuntimeState[],
  totalDuration: number,
  totalElapsed: number
): PaceSnapshot {
  const offsetSec = calcPaceOffset(sections, totalDuration, totalElapsed);
  const isOnPace = Math.abs(offsetSec) <= PACE_DEAD_ZONE_SEC;
  const paceWarning = calcPaceWarning(offsetSec, totalDuration);
  return { offsetSec, isOnPace, paceWarning };
}

/** Projected finish result */
export interface ProjectedFinish {
  /** Positive = finishing early, negative = finishing late */
  deltaSeconds: number;
  warningLevel: WarningLevel;
}

/**
 * Project how much over/under time the presenter will finish.
 * Uses pace offset to estimate.
 */
export function calcProjectedFinish(
  sections: SectionRuntimeState[],
  totalDuration: number,
  totalElapsed: number
): ProjectedFinish {
  const offsetSec = calcPaceOffset(sections, totalDuration, totalElapsed);
  const deltaSeconds = offsetSec; // positive = early, negative = late
  const absDelta = Math.abs(deltaSeconds);

  let warningLevel: WarningLevel;
  if (deltaSeconds >= -PACE_DEAD_ZONE_SEC) {
    // On pace or ahead
    warningLevel = 'ok';
  } else if (absDelta <= totalDuration * PROJECTION_THRESHOLDS.okFraction) {
    warningLevel = 'ok';
  } else if (absDelta <= totalDuration * PROJECTION_THRESHOLDS.cautionFraction) {
    warningLevel = 'caution';
  } else {
    warningLevel = 'danger';
  }

  return { deltaSeconds, warningLevel };
}

/** Recovery guidance for when behind pace */
export interface RecoveryGuidance {
  /** Total elapsed seconds at which to wrap up to finish on time */
  wrapUpByElapsedSec: number;
  /** Seconds to save per remaining section (including current) */
  savePerSectionSec: number;
  /** Number of remaining sections (active + pending) */
  remainingSectionCount: number;
}

/**
 * Calculate recovery guidance: how to distribute deficit across remaining sections.
 */
export function calcRecoveryGuidance(
  sections: SectionRuntimeState[],
  totalDuration: number,
  totalElapsed: number,
  activeIndex: number
): RecoveryGuidance {
  const offsetSec = calcPaceOffset(sections, totalDuration, totalElapsed);

  // Count remaining sections (active + pending)
  let remainingSectionCount = 0;
  const startIdx = Math.max(0, activeIndex);
  for (let i = startIdx; i < sections.length; i++) {
    if (sections[i].status === 'active' || sections[i].status === 'pending') {
      remainingSectionCount++;
    }
  }

  const deficit = Math.abs(Math.min(0, offsetSec));
  const savePerSectionSec = remainingSectionCount > 0
    ? Math.ceil(deficit / remainingSectionCount)
    : 0;

  // When should presenter wrap up to finish on time
  const wrapUpByElapsedSec = totalDuration;

  return { wrapUpByElapsedSec, savePerSectionSec, remainingSectionCount };
}

/**
 * Hybrid section warning: max(percentage-based, absolute floor).
 * Floors ensure consistent reaction time regardless of section length.
 * Thresholds are capped so they never exceed a fraction of section length.
 */
export function calcSectionWarning(
  remainingSec: number,
  adjustedDuration: number
): WarningLevel {
  if (adjustedDuration <= 0) return 'ok';
  if (remainingSec < 0) return 'overtime';

  // Percentage-based thresholds
  const percentCaution = adjustedDuration * SECTION_PERCENT.caution;
  const percentDanger = adjustedDuration * SECTION_PERCENT.danger;

  // Hybrid: max(percentage, floor), but cap so threshold doesn't exceed
  // half the section length (caution) or a quarter (danger)
  const cautionThreshold = Math.min(
    Math.max(percentCaution, SECTION_WARNING_FLOORS.cautionSec),
    adjustedDuration * 0.5
  );
  const dangerThreshold = Math.min(
    Math.max(percentDanger, SECTION_WARNING_FLOORS.dangerSec),
    adjustedDuration * 0.25
  );

  if (remainingSec <= dangerThreshold) return 'danger';
  if (remainingSec <= cautionThreshold) return 'caution';
  return 'ok';
}

/** Return the more urgent of two warning levels */
export function worstWarning(a: WarningLevel, b: WarningLevel): WarningLevel {
  const order: WarningLevel[] = ['ok', 'caution', 'danger', 'overtime'];
  return order[Math.max(order.indexOf(a), order.indexOf(b))];
}

// --- TrendTracker ---

interface TrendSample {
  time: number; // Date.now()
  offsetSec: number;
}

export type TrendDirection = 'improving' | 'worsening' | 'stable';

export interface TrendResult {
  direction: TrendDirection;
  deltaPerSecond: number;
}

const TREND_WINDOW_MS = 15_000;

/**
 * Rolling 15-second window tracker for pace trend.
 * Records offset samples and reports whether pace is improving or worsening.
 */
export class TrendTracker {
  private samples: TrendSample[] = [];

  reset(): void {
    this.samples = [];
  }

  record(offsetSec: number): void {
    const now = Date.now();
    this.samples.push({ time: now, offsetSec });
    // Prune samples older than window
    const cutoff = now - TREND_WINDOW_MS;
    this.samples = this.samples.filter(s => s.time >= cutoff);
  }

  getTrend(): TrendResult {
    if (this.samples.length < 2) {
      return { direction: 'stable', deltaPerSecond: 0 };
    }

    const first = this.samples[0];
    const last = this.samples[this.samples.length - 1];
    const timeDiffSec = (last.time - first.time) / 1000;

    if (timeDiffSec < 1) {
      return { direction: 'stable', deltaPerSecond: 0 };
    }

    const offsetDiff = last.offsetSec - first.offsetSec;
    const deltaPerSecond = offsetDiff / timeDiffSec;

    // Dead zone for trend stability
    if (Math.abs(deltaPerSecond) < 0.05) {
      return { direction: 'stable', deltaPerSecond: 0 };
    }

    return {
      direction: deltaPerSecond > 0 ? 'improving' : 'worsening',
      deltaPerSecond,
    };
  }
}
