import { useTimerStore } from '../../store/timerStore';
import { useThemeStore } from '../../store/themeStore';
import { usePaceEngine } from '../../hooks/usePaceEngine';
import { formatTime } from '../../utils/timeUtils';
import { WARNING_COLORS } from '../../utils/constants';
import { PACE_DEAD_ZONE_SEC } from '../../utils/paceEngine';
import styles from './PaceIndicator.module.css';

export function PaceIndicator() {
  const status = useTimerStore(s => s.status);
  const theme = useThemeStore(s => s.theme);
  const { pace, projection, recovery, trend } = usePaceEngine();

  if (status === 'idle' || status === 'finished') return null;

  const color = WARNING_COLORS[projection.warningLevel];
  const noGlow = theme === 'light';

  // Row 1: Projected finish
  let projectionText: string;
  if (Math.abs(projection.deltaSeconds) <= PACE_DEAD_ZONE_SEC) {
    projectionText = 'ON PACE';
  } else if (projection.deltaSeconds > 0) {
    projectionText = `Finishing ${formatTime(Math.abs(projection.deltaSeconds))} early`;
  } else {
    projectionText = `Finishing ${formatTime(Math.abs(projection.deltaSeconds))} over`;
  }

  // Trend arrow
  let trendArrow = '';
  if (trend.direction === 'improving') trendArrow = '\u2191';
  else if (trend.direction === 'worsening') trendArrow = '\u2193';

  // Row 2: Recovery guidance (only when behind)
  const showRecovery = !pace.isOnPace && pace.offsetSec < -PACE_DEAD_ZONE_SEC && recovery.savePerSectionSec > 0;

  return (
    <div
      className={styles.wrapper}
      style={{ color, textShadow: noGlow ? 'none' : `0 0 12px ${color}40` }}
    >
      <div className={styles.projection}>
        <span>{projectionText}</span>
        {trendArrow && <span className={styles.trend}>{trendArrow}</span>}
      </div>
      {showRecovery && (
        <div className={styles.recovery}>
          <span className={styles.recoveryItem}>
            Save {recovery.savePerSectionSec}s/section
          </span>
          <span className={styles.recoveryItem}>
            Wrap up by {formatTime(recovery.wrapUpByElapsedSec)}
          </span>
        </div>
      )}
    </div>
  );
}
