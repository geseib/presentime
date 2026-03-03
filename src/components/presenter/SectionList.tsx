import { useTimerStore } from '../../store/timerStore';
import { usePresentationStore } from '../../store/presentationStore';
import { formatTime } from '../../utils/timeUtils';
import styles from './SectionList.module.css';

export function SectionList() {
  const sections = useTimerStore(s => s.sections);
  const activeSectionIndex = useTimerStore(s => s.activeSectionIndex);
  const completeCurrentSection = useTimerStore(s => s.completeCurrentSection);
  const status = useTimerStore(s => s.status);
  const totalElapsedSec = useTimerStore(s => s.totalElapsedSec);
  const totalDurationSec = useTimerStore(s => s.totalDurationSec);
  const presentation = usePresentationStore(s => s.getActivePresentation());

  if (!presentation) return null;

  const handleClick = (index: number) => {
    // Only allow completing the currently active section by clicking it
    if (index === activeSectionIndex && (status === 'running' || status === 'paused')) {
      completeCurrentSection();
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <span className={styles.colName}>Section</span>
        <span className={styles.colTime}>Planned</span>
        <span className={styles.colTime}>Actual</span>
      </div>
      <div className={styles.list}>
        {sections.map((section, index) => {
          const sectionData = presentation.sections.find(
            s => s.id === section.sectionId
          );
          const name = sectionData?.name ?? `Section ${index + 1}`;
          const isActive = index === activeSectionIndex;
          const isAdjusted =
            section.adjustedDurationSec !== section.originalDurationSec;

          const statusClasses = [
            styles.row,
            isActive && styles.active,
            section.status === 'completed' && styles.completed,
            section.status === 'skipped' && styles.skipped,
          ]
            .filter(Boolean)
            .join(' ');

          const isCompleted = section.status === 'completed';

          return (
            <div
              key={section.sectionId}
              className={statusClasses}
              onClick={() => handleClick(index)}
            >
              <span className={styles.statusIcon}>
                {section.status === 'completed' && '✓'}
                {section.status === 'active' && '▶'}
                {section.status === 'skipped' && '⏭'}
                {section.status === 'pending' && `${index + 1}.`}
              </span>
              <span className={styles.sectionName}>{name}</span>
              <span className={styles.colTime}>
                {formatTime(section.adjustedDurationSec)}
                {isAdjusted && section.status === 'pending' && (
                  <span className={styles.adjusted} title="Adjusted due to overtime">
                    {' '}adj
                  </span>
                )}
              </span>
              <span
                className={`${styles.colTime} ${
                  isCompleted
                    ? section.elapsedSec <= section.adjustedDurationSec
                      ? styles.timingUnder
                      : styles.timingOver
                    : ''
                }`}
              >
                {isCompleted ? formatTime(section.elapsedSec) : '—'}
              </span>
            </div>
          );
        })}
      </div>
      <div className={styles.footer}>
        <span className={styles.footerName}>Total</span>
        <span className={styles.colTime}>
          {formatTime(totalDurationSec)}
        </span>
        <span
          className={`${styles.colTime} ${
            totalElapsedSec <= totalDurationSec
              ? styles.timingUnder
              : styles.timingOver
          }`}
        >
          {formatTime(totalElapsedSec)}
        </span>
      </div>
    </div>
  );
}
