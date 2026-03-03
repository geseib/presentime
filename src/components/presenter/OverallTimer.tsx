import { useTimerStore } from '../../store/timerStore';
import { useWarningState } from '../../hooks/useWarningState';
import { formatTime } from '../../utils/timeUtils';
import { WARNING_COLORS } from '../../utils/constants';
import { ProgressArc } from '../shared/ProgressArc';
import styles from './OverallTimer.module.css';

export function OverallTimer() {
  const totalElapsedSec = useTimerStore(s => s.totalElapsedSec);
  const totalDurationSec = useTimerStore(s => s.totalDurationSec);

  const remaining = totalDurationSec - totalElapsedSec;
  const progress = totalDurationSec > 0 ? Math.max(0, remaining / totalDurationSec) : 1;
  const warningLevel = useWarningState(remaining, totalDurationSec);

  return (
    <div className={styles.wrapper}>
      <ProgressArc
        progress={progress}
        size={280}
        strokeWidth={8}
        warningLevel={warningLevel}
      >
        <span
          className={styles.time}
          style={{ color: WARNING_COLORS[warningLevel] }}
        >
          {formatTime(remaining)}
        </span>
        <span className={styles.label}>Total</span>
      </ProgressArc>
    </div>
  );
}
