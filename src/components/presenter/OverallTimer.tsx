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

interface OverallTimerProps {
  onClick?: () => void;
}

export function OverallTimer({ onClick }: OverallTimerProps) {
  const totalElapsedSec = useTimerStore(s => s.totalElapsedSec);
  const totalDurationSec = useTimerStore(s => s.totalDurationSec);
  const status = useTimerStore(s => s.status);
  const theme = useThemeStore(s => s.theme);
  const config = THEME_CONFIGS[theme];
  const { overallSize, overallStroke } = useResponsiveSize(config);

  const remaining = totalDurationSec - totalElapsedSec;
  const progress = totalDurationSec > 0 ? Math.max(0, remaining / totalDurationSec) : 1;
  const timeWarning = useWarningState(remaining, totalDurationSec);

  const { pace } = usePaceEngine();
  const paceWarning = (status === 'running' || status === 'paused') ? pace.paceWarning : 'ok';

  const warningLevel = worstWarning(timeWarning, paceWarning);

  return (
    <div className={styles.wrapper} onClick={onClick} style={onClick ? { cursor: 'pointer' } : undefined}>
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
      </ProgressArc>
    </div>
  );
}
