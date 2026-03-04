import { useTimerStore } from '../../store/timerStore';
import { usePresentationStore } from '../../store/presentationStore';
import { useThemeStore } from '../../store/themeStore';
import { useWarningState } from '../../hooks/useWarningState';
import { formatTime } from '../../utils/timeUtils';
import { WARNING_COLORS } from '../../utils/constants';
import { THEME_CONFIGS } from './themeConfig';
import { ProgressArc } from '../shared/ProgressArc';
import styles from './SectionTimer.module.css';

export function SectionTimer() {
  const activeSection = useTimerStore(s => s.getActiveSection());
  const activeSectionIndex = useTimerStore(s => s.activeSectionIndex);
  const sections = useTimerStore(s => s.sections);
  const presentation = usePresentationStore(s => s.getActivePresentation());
  const status = useTimerStore(s => s.status);
  const theme = useThemeStore(s => s.theme);
  const config = THEME_CONFIGS[theme];

  const remaining = activeSection
    ? activeSection.adjustedDurationSec - activeSection.elapsedSec
    : 0;
  const totalForWarning = activeSection?.adjustedDurationSec ?? 0;
  const warningLevel = useWarningState(remaining, totalForWarning);

  if (status === 'idle') {
    return (
      <div className={styles.wrapper}>
        <div
          className={styles.idle}
          style={config.timersHorizontal ? { width: config.sectionSize, height: config.sectionSize } : undefined}
        >
          Press Start or Space to begin
        </div>
      </div>
    );
  }

  if (!activeSection) return null;

  const progress =
    activeSection.adjustedDurationSec > 0
      ? Math.max(0, remaining / activeSection.adjustedDurationSec)
      : 1;

  const sectionData = presentation?.sections.find(
    s => s.id === activeSection.sectionId
  );
  const sectionName = sectionData?.name ?? 'Section';
  const sectionInfo = `Section ${activeSectionIndex + 1} of ${sections.length}`;

  return (
    <div className={styles.wrapper}>
      <ProgressArc
        progress={progress}
        size={config.sectionSize}
        strokeWidth={config.sectionStroke}
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
        {config.labelInRing && (
          <>
            <div className={styles.compactLabel}>{sectionName}</div>
            <div className={styles.compactInfo}>{sectionInfo}</div>
          </>
        )}
      </ProgressArc>
      {!config.labelInRing && (
        <>
          <div className={styles.sectionName}>{sectionName}</div>
          <div className={styles.sectionInfo}>{sectionInfo}</div>
        </>
      )}
    </div>
  );
}
