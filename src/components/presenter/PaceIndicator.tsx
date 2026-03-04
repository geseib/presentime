import { useTimerStore } from '../../store/timerStore';
import { usePresentationStore } from '../../store/presentationStore';
import { useThemeStore } from '../../store/themeStore';
import { formatTime } from '../../utils/timeUtils';
import styles from './PaceIndicator.module.css';

const DEAD_ZONE = 2; // seconds — suppress jitter around zero
const COLOR_AHEAD = '#00E676';
const COLOR_ON_PACE = '#00E676';
const COLOR_SLIGHTLY_BEHIND = '#FFD600';
const COLOR_FAR_BEHIND = '#FF1744';

export function PaceIndicator() {
  const sections = useTimerStore(s => s.sections);
  const status = useTimerStore(s => s.status);
  const totalElapsedSec = useTimerStore(s => s.totalElapsedSec);
  const totalDurationSec = useTimerStore(s => s.totalDurationSec);
  const presentation = usePresentationStore(s => s.getActivePresentation());
  const theme = useThemeStore(s => s.theme);

  if (status === 'idle' || status === 'finished') return null;

  // Compare time remaining vs ORIGINAL planned content still to cover.
  // Uses originalDurationSec so redistribution doesn't mask overruns.
  const timeRemaining = totalDurationSec - totalElapsedSec;
  let contentRemaining = 0;
  let activeSectionId: string | null = null;
  for (const s of sections) {
    if (s.status === 'active') {
      contentRemaining += s.originalDurationSec - s.elapsedSec;
      activeSectionId = s.sectionId;
    } else if (s.status === 'pending') {
      contentRemaining += s.originalDurationSec;
    }
  }
  const offsetSec = timeRemaining - contentRemaining;

  const sectionName = activeSectionId
    ? presentation?.sections.find(s => s.id === activeSectionId)?.name
    : null;

  const isOnPace = Math.abs(offsetSec) <= DEAD_ZONE;

  const color = isOnPace
    ? COLOR_ON_PACE
    : offsetSec > 0
      ? COLOR_AHEAD
      : offsetSec > -120
        ? COLOR_SLIGHTLY_BEHIND
        : COLOR_FAR_BEHIND;

  let timeDisplay: string;
  let label: string;

  if (isOnPace) {
    timeDisplay = '';
    label = 'ON PACE';
  } else {
    const prefix = offsetSec > 0 ? '+' : '-';
    timeDisplay = `${prefix}${formatTime(Math.abs(offsetSec))}`;
    label = offsetSec > 0 ? 'AHEAD' : 'BEHIND';
  }

  return (
    <div
      className={styles.wrapper}
      style={{ color, textShadow: theme === 'light' ? 'none' : `0 0 12px ${color}40` }}
    >
      {timeDisplay && <span>{timeDisplay}</span>}
      <span className={styles.label}>{label}</span>
      {sectionName && (
        <span className={styles.section}>into {sectionName}</span>
      )}
    </div>
  );
}
