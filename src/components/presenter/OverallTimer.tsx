import { useTimerStore } from '../../store/timerStore';
import { useThemeStore } from '../../store/themeStore';
import { useWarningState } from '../../hooks/useWarningState';
import { formatTime } from '../../utils/timeUtils';
import { WARNING_COLORS } from '../../utils/constants';
import { THEME_CONFIGS } from './themeConfig';
import { ProgressArc } from '../shared/ProgressArc';
import styles from './OverallTimer.module.css';

export function OverallTimer() {
  const totalElapsedSec = useTimerStore(s => s.totalElapsedSec);
  const totalDurationSec = useTimerStore(s => s.totalDurationSec);
  const theme = useThemeStore(s => s.theme);
  const config = THEME_CONFIGS[theme];

  const remaining = totalDurationSec - totalElapsedSec;
  const progress = totalDurationSec > 0 ? Math.max(0, remaining / totalDurationSec) : 1;
  const warningLevel = useWarningState(remaining, totalDurationSec);

  return (
    <div className={styles.wrapper}>
      <ProgressArc
        progress={progress}
        size={config.overallSize}
        strokeWidth={config.overallStroke}
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
      </ProgressArc>
    </div>
  );
}
