import { useRef, useMemo, useEffect } from 'react';
import { useTimerStore } from '../store/timerStore';
import {
  calcPaceSnapshot,
  calcProjectedFinish,
  calcRecoveryGuidance,
  TrendTracker,
  type PaceSnapshot,
  type ProjectedFinish,
  type RecoveryGuidance,
  type TrendResult,
} from '../utils/paceEngine';

export interface PaceEngineResult {
  pace: PaceSnapshot;
  projection: ProjectedFinish;
  recovery: RecoveryGuidance;
  trend: TrendResult;
}

/**
 * Central hook for all pace-related data.
 * Reads from timerStore, manages TrendTracker lifecycle.
 */
export function usePaceEngine(): PaceEngineResult {
  const sections = useTimerStore(s => s.sections);
  const totalDurationSec = useTimerStore(s => s.totalDurationSec);
  const totalElapsedSec = useTimerStore(s => s.totalElapsedSec);
  const activeSectionIndex = useTimerStore(s => s.activeSectionIndex);
  const status = useTimerStore(s => s.status);
  const targetFinishTime = useTimerStore(s => s.targetFinishTime);
  const startedAtEpochMs = useTimerStore(s => s.startedAtEpochMs);

  // When a finish time target is set, use wall-clock remaining as the
  // effective "time budget" so pace/projections reflect the real deadline.
  const effectiveDuration = useMemo(() => {
    if (targetFinishTime && startedAtEpochMs) {
      return Math.max(0, (targetFinishTime - startedAtEpochMs) / 1000);
    }
    return totalDurationSec;
  }, [targetFinishTime, startedAtEpochMs, totalDurationSec]);

  const trackerRef = useRef(new TrendTracker());

  // Reset tracker when timer goes back to idle
  useEffect(() => {
    if (status === 'idle') {
      trackerRef.current.reset();
    }
  }, [status]);

  const pace = useMemo(
    () => calcPaceSnapshot(sections, effectiveDuration, totalElapsedSec),
    [sections, effectiveDuration, totalElapsedSec]
  );

  // Record sample for trend tracking
  useEffect(() => {
    if (status === 'running') {
      trackerRef.current.record(pace.offsetSec);
    }
  }, [status, pace.offsetSec]);

  const projection = useMemo(
    () => calcProjectedFinish(sections, effectiveDuration, totalElapsedSec),
    [sections, effectiveDuration, totalElapsedSec]
  );

  const recovery = useMemo(
    () => calcRecoveryGuidance(sections, effectiveDuration, totalElapsedSec, activeSectionIndex),
    [sections, effectiveDuration, totalElapsedSec, activeSectionIndex]
  );

  const trend = useMemo(
    () => trackerRef.current.getTrend(),
    // Re-evaluate trend whenever pace offset changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [pace.offsetSec]
  );

  return { pace, projection, recovery, trend };
}
