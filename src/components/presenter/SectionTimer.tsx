import { useTimerStore } from '../../store/timerStore';
import { usePresentationStore } from '../../store/presentationStore';
import { useThemeStore } from '../../store/themeStore';
import { useSectionWarning } from '../../hooks/useSectionWarning';
import { useResponsiveSize } from '../../hooks/useResponsiveSize';
import { formatTime } from '../../utils/timeUtils';
import { WARNING_COLORS } from '../../utils/constants';
import { THEME_CONFIGS } from './themeConfig';
import { ProgressArc } from '../shared/ProgressArc';
import styles from './SectionTimer.module.css';

interface SectionTimerProps {
  onClick?: () => void;
}

export function SectionTimer({ onClick }: SectionTimerProps) {
  const activeSection = useTimerStore(s => s.getActiveSection());
  const activeSectionIndex = useTimerStore(s => s.activeSectionIndex);
  const sections = useTimerStore(s => s.sections);
  const presentation = usePresentationStore(s => s.getActivePresentation());
  const status = useTimerStore(s => s.status);
  const theme = useThemeStore(s => s.theme);
  const config = THEME_CONFIGS[theme];
  const { sectionSize, sectionStroke } = useResponsiveSize(config);

  const remaining = activeSection
    ? activeSection.adjustedDurationSec - activeSection.elapsedSec
    : 0;
  const totalForWarning = activeSection?.adjustedDurationSec ?? 0;
  const warningLevel = useSectionWarning(remaining, totalForWarning);

  if (status === 'idle') {
    return (
      <div className={styles.wrapper} onClick={onClick} style={onClick ? { cursor: 'pointer' } : undefined}>
        <div
          className={styles.idle}
          style={config.timersHorizontal ? { width: sectionSize, height: sectionSize } : undefined}
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
    <div className={styles.wrapper} onClick={onClick} style={onClick ? { cursor: 'pointer' } : undefined}>
      <ProgressArc
        progress={progress}
        size={sectionSize}
        strokeWidth={sectionStroke}
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
