import { useState, useEffect } from 'react';
import { useTimerStore } from '../../store/timerStore';
import { useThemeStore } from '../../store/themeStore';
import { useWarningState } from '../../hooks/useWarningState';
import { usePaceEngine } from '../../hooks/usePaceEngine';
import { useResponsiveSize } from '../../hooks/useResponsiveSize';
import { formatTime } from '../../utils/timeUtils';
import { WARNING_COLORS } from '../../utils/constants';
import { worstWarning } from '../../utils/paceEngine';
import { THEME_CONFIGS } from './themeConfig';
import { ProgressArc } from '../shared/ProgressArc';
import styles from './OverallTimer.module.css';

export function OverallTimer() {
  const totalElapsedSec = useTimerStore(s => s.totalElapsedSec);
  const totalDurationSec = useTimerStore(s => s.totalDurationSec);
  const status = useTimerStore(s => s.status);
  const start = useTimerStore(s => s.start);
  const pause = useTimerStore(s => s.pause);
  const resume = useTimerStore(s => s.resume);
  const targetFinishTime = useTimerStore(s => s.targetFinishTime);
  const theme = useThemeStore(s => s.theme);
  const config = THEME_CONFIGS[theme];
  const { overallSize, overallStroke } = useResponsiveSize(config);

  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    if (status !== 'running') return;
    const interval = setInterval(() => setNow(Date.now()), 200);
    return () => clearInterval(interval);
  }, [status]);

  // When a target finish time is set, show wall-clock remaining to that target.
  // Otherwise fall back to content-based remaining.
  const contentRemaining = totalDurationSec - totalElapsedSec;
  const remaining = targetFinishTime
    ? (targetFinishTime - now) / 1000
    : contentRemaining;

  const effectiveDuration = targetFinishTime
    ? Math.max(remaining, totalDurationSec) // use whichever is larger for progress arc scale
    : totalDurationSec;
  const progress = effectiveDuration > 0 ? Math.max(0, remaining / effectiveDuration) : 1;
  const timeWarning = useWarningState(remaining, effectiveDuration);

  const { pace } = usePaceEngine();
  const paceWarning = (status === 'running' || status === 'paused') ? pace.paceWarning : 'ok';

  const warningLevel = worstWarning(timeWarning, paceWarning);

  const handleControl = () => {
    if (status === 'idle') start();
    else if (status === 'running') pause();
    else if (status === 'paused') resume();
  };

  return (
    <div className={styles.wrapper}>
      <ProgressArc
        progress={progress}
        size={overallSize}
        strokeWidth={overallStroke}
        warningLevel={warningLevel}
        trackColor={config.trackColor}
      >
        <span
          className={styles.time}
          style={{
            color: WARNING_COLORS[warningLevel],
            ...(config.timeGlow ? { textShadow: config.timeGlow } : {}),
          }}
        >
          {formatTime(remaining)}
        </span>
        <span className={styles.label}>Total</span>
        <button
          className={styles.controlBtn}
          onClick={handleControl}
          aria-label={
            status === 'idle' ? 'Start' :
            status === 'running' ? 'Pause' : 'Resume'
          }
        >
          {status === 'idle' && '▶'}
          {status === 'running' && '⏸'}
          {status === 'paused' && '▶'}
        </button>
      </ProgressArc>
    </div>
  );
}
