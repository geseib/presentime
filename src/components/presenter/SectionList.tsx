import { useState } from 'react';
import { useTimerStore } from '../../store/timerStore';
import { usePresentationStore } from '../../store/presentationStore';
import { formatTime } from '../../utils/timeUtils';
import { BreakInsert } from './BreakInsert';
import styles from './SectionList.module.css';

export function SectionList() {
  const sections = useTimerStore(s => s.sections);
  const activeSectionIndex = useTimerStore(s => s.activeSectionIndex);
  const completeCurrentSection = useTimerStore(s => s.completeCurrentSection);
  const jumpToSection = useTimerStore(s => s.jumpToSection);
  const status = useTimerStore(s => s.status);
  const totalElapsedSec = useTimerStore(s => s.totalElapsedSec);
  const extraTimeSec = useTimerStore(s => s.getExtraTimeSec());
  const presentation = usePresentationStore(s => s.getActivePresentation());

  const [breakPopupIndex, setBreakPopupIndex] = useState<number | null>(null);

  if (!presentation) return null;

  const isActive = status === 'running' || status === 'paused';
  const totalOriginalDuration = sections.reduce((sum, s) => sum + s.originalDurationSec, 0);

  const handleClick = (index: number) => {
    if (!isActive) return;
    if (index === activeSectionIndex) {
      completeCurrentSection();
    } else {
      jumpToSection(index);
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
          const name = section.name
            ?? presentation.sections.find(s => s.id === section.sectionId)?.name
            ?? `Section ${index + 1}`;
          const isActiveRow = index === activeSectionIndex;
          const isAdjusted =
            section.adjustedDurationSec !== section.originalDurationSec;

          const statusClasses = [
            styles.row,
            isActiveRow && styles.active,
            section.status === 'completed' && styles.completed,
            section.status === 'skipped' && styles.skipped,
            isActive && styles.clickable,
          ]
            .filter(Boolean)
            .join(' ');

          const isCompleted = section.status === 'completed';
          const isSkipped = section.status === 'skipped';

          let actualText: string;
          let actualColorClass = '';

          if (isCompleted || isSkipped) {
            actualText = formatTime(section.elapsedSec);
            actualColorClass = section.elapsedSec <= section.originalDurationSec
              ? styles.timingUnder
              : styles.timingOver;
          } else if (section.status === 'active') {
            actualText = formatTime(section.elapsedSec);
            actualColorClass = section.elapsedSec <= section.originalDurationSec
              ? styles.timingUnder
              : styles.timingOver;
          } else {
            if (isAdjusted) {
              actualText = formatTime(section.adjustedDurationSec);
              actualColorClass = styles.timingAdjusted;
            } else {
              actualText = '—';
            }
          }

          return (
            <div key={section.sectionId}>
              {/* Break insert point before this section (between rows) */}
              {isActive && index > 0 && (
                <BreakInsert
                  insertIndex={index}
                  isOpen={breakPopupIndex === index}
                  onToggle={() => setBreakPopupIndex(breakPopupIndex === index ? null : index)}
                  onClose={() => setBreakPopupIndex(null)}
                />
              )}
              <div
                className={statusClasses}
                onClick={() => handleClick(index)}
              >
                <span className={styles.statusIcon}>
                  {section.isBreak && '☕'}
                  {!section.isBreak && section.status === 'completed' && '✓'}
                  {!section.isBreak && section.status === 'active' && '▶'}
                  {!section.isBreak && section.status === 'skipped' && '⏭'}
                  {!section.isBreak && section.status === 'pending' && `${index + 1}.`}
                </span>
                <span className={styles.sectionName}>{name}</span>
                <span className={styles.colTime}>
                  {formatTime(section.originalDurationSec)}
                </span>
                <span className={`${styles.colTime} ${actualColorClass}`}>
                  {actualText}
                </span>
              </div>
            </div>
          );
        })}
        {/* Break insert point after last section */}
        {isActive && sections.length > 0 && (
          <BreakInsert
            insertIndex={sections.length}
            isOpen={breakPopupIndex === sections.length}
            onToggle={() => setBreakPopupIndex(breakPopupIndex === sections.length ? null : sections.length)}
            onClose={() => setBreakPopupIndex(null)}
          />
        )}
      </div>
      <div className={styles.footer}>
        <span className={styles.footerName}>Total</span>
        <span className={styles.colTime}>
          {formatTime(totalOriginalDuration)}
        </span>
        <span
          className={`${styles.colTime} ${
            totalElapsedSec <= totalOriginalDuration
              ? styles.timingUnder
              : styles.timingOver
          }`}
        >
          {formatTime(totalElapsedSec)}
        </span>
      </div>
      {extraTimeSec > 0 && (
        <div className={styles.extraRow}>
          <span className={styles.extraLabel}>Extra</span>
          <span className={styles.extraTime}>+{formatTime(Math.round(extraTimeSec))}</span>
        </div>
      )}
    </div>
  );
}
