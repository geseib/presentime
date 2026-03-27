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

export function SectionTimer() {
  const activeSection = useTimerStore(s => s.getActiveSection());
  const activeSectionIndex = useTimerStore(s => s.activeSectionIndex);
  const sections = useTimerStore(s => s.sections);
  const status = useTimerStore(s => s.status);
  const completeCurrentSection = useTimerStore(s => s.completeCurrentSection);
  const goToPreviousSection = useTimerStore(s => s.goToPreviousSection);
  const presentation = usePresentationStore(s => s.getActivePresentation());
  const theme = useThemeStore(s => s.theme);
  const config = THEME_CONFIGS[theme];
  const { sectionSize, sectionStroke } = useResponsiveSize(config);

  const remaining = activeSection
    ? activeSection.adjustedDurationSec - activeSection.elapsedSec
    : 0;
  const totalForWarning = activeSection?.adjustedDurationSec ?? 0;
  const warningLevel = useSectionWarning(remaining, totalForWarning);

  const isActive = status === 'running' || status === 'paused';
  const canGoBack = isActive && activeSectionIndex > 0;
  const canGoForward = isActive && activeSectionIndex >= 0;

  if (status === 'idle') {
    return (
      <div className={styles.wrapper}>
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

  // Resolve section name: dynamic breaks have name on runtime state, otherwise look up from presentation
  const sectionName = activeSection.name
    ?? presentation?.sections.find(s => s.id === activeSection.sectionId)?.name
    ?? 'Section';
  const sectionInfo = `Section ${activeSectionIndex + 1} of ${sections.length}`;

  const resolveName = (idx: number) => {
    const s = sections[idx];
    if (!s) return '';
    return s.name
      ?? presentation?.sections.find(p => p.id === s.sectionId)?.name
      ?? `Section ${idx + 1}`;
  };
  const prevName = activeSectionIndex > 0 ? resolveName(activeSectionIndex - 1) : '';
  const nextIdx = sections.findIndex((s, i) => i > activeSectionIndex && s.status === 'pending');
  const nextName = nextIdx >= 0 ? resolveName(nextIdx) : '';

  return (
    <div className={styles.wrapper}>
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
        <div className={styles.navButtons}>
          <button
            className={styles.navBtn}
            onClick={goToPreviousSection}
            disabled={!canGoBack}
            aria-label="Previous section"
            title={prevName ? `Back to: ${prevName}` : undefined}
          >
            ⏮
          </button>
          <button
            className={styles.navBtn}
            onClick={completeCurrentSection}
            disabled={!canGoForward}
            aria-label="Next section"
            title={nextName ? `Next: ${nextName}` : undefined}
          >
            ⏭
          </button>
        </div>
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
