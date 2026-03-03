import { useTimerStore } from '../../store/timerStore';
import { formatTime } from '../../utils/timeUtils';
import styles from './PaceIndicator.module.css';

const COLOR_AHEAD = '#00E676';
const COLOR_SLIGHTLY_BEHIND = '#FFD600';
const COLOR_FAR_BEHIND = '#FF1744';

export function PaceIndicator() {
  const sections = useTimerStore(s => s.sections);
  const status = useTimerStore(s => s.status);

  if (status === 'idle' || status === 'finished') return null;

  let offsetSec = 0;
  for (const s of sections) {
    if (s.status === 'completed' || s.status === 'active') {
      offsetSec += s.adjustedDurationSec - s.elapsedSec;
    }
  }

  const color =
    offsetSec >= 0
      ? COLOR_AHEAD
      : offsetSec > -120
        ? COLOR_SLIGHTLY_BEHIND
        : COLOR_FAR_BEHIND;

  const prefix = offsetSec >= 0 ? '+' : '-';
  const label = offsetSec >= 0 ? 'AHEAD' : 'BEHIND';
  const display = formatTime(Math.abs(offsetSec));

  return (
    <div
      className={styles.wrapper}
      style={{ color, textShadow: `0 0 12px ${color}40` }}
    >
      <span>{prefix}{display}</span>
      <span className={styles.label}>{label}</span>
    </div>
  );
}
