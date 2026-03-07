import { motion } from 'motion/react';
import { usePresentationStore } from '../../store/presentationStore';
import { useTimerStore } from '../../store/timerStore';
import { useWarningState } from '../../hooks/useWarningState';
import { useSectionWarning } from '../../hooks/useSectionWarning';
import { formatTime } from '../../utils/timeUtils';
import { BatteryBar } from './BatteryBar';
import styles from './MiniPresenter.module.css';

interface MiniPresenterProps {
  onExpand: () => void;
  onStart: () => void;
  onPause: () => void;
  onResume: () => void;
  onReset: () => void;
  onComplete: () => void;
}

export function MiniPresenter({ onExpand, onStart, onPause, onResume, onReset, onComplete }: MiniPresenterProps) {
  const status = useTimerStore(s => s.status);
  const totalElapsedSec = useTimerStore(s => s.totalElapsedSec);
  const totalDurationSec = useTimerStore(s => s.totalDurationSec);
  const activeSection = useTimerStore(s => s.getActiveSection());
  const activeSectionIndex = useTimerStore(s => s.activeSectionIndex);

  const presentation = usePresentationStore(s => s.getActivePresentation());

  // Total progress
  const totalRemaining = totalDurationSec - totalElapsedSec;
  const totalProgress = totalDurationSec > 0 ? Math.max(0, totalRemaining / totalDurationSec) : 0;
  const totalWarning = useWarningState(totalRemaining, totalDurationSec);

  // Section progress
  const sectionRemaining = activeSection
    ? activeSection.adjustedDurationSec - activeSection.elapsedSec
    : 0;
  const sectionTotal = activeSection?.adjustedDurationSec ?? 0;
  const sectionProgress = sectionTotal > 0 ? Math.max(0, sectionRemaining / sectionTotal) : 0;
  const sectionWarning = useSectionWarning(sectionRemaining, sectionTotal);

  // Section name from presentation data
  const sectionName = presentation?.sections[activeSectionIndex]?.name ?? 'Section';

  return (
    <motion.div
      className={styles.container}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.15 }}
    >
      <div className={styles.batteries}>
        <BatteryBar
          progress={totalProgress}
          timeText={formatTime(totalRemaining)}
          warningLevel={status === 'running' ? totalWarning : 'ok'}
          label="TOTAL"
          onClick={() => status === 'idle' ? onStart() : status === 'running' ? onPause() : onResume()}
        />
        <div className={styles.divider} />
        <BatteryBar
          key={activeSectionIndex}
          progress={sectionProgress}
          timeText={formatTime(sectionRemaining)}
          warningLevel={status === 'running' ? sectionWarning : 'ok'}
          label={sectionName}
          onClick={onComplete}
        />
      </div>

      <div className={styles.controls}>
        <button
          className={styles.controlButton}
          onClick={() => status === 'idle' ? onStart() : status === 'running' ? onPause() : onResume()}
          title={status === 'idle' ? 'Start (Space)' : status === 'running' ? 'Pause (Space)' : 'Resume (Space)'}
        >
          {status === 'running' ? '⏸' : '▶'}
        </button>
        <button
          className={styles.controlButton}
          onClick={onComplete}
          title="Next Section (→)"
        >
          ⏭
        </button>
        <button
          className={styles.controlButton}
          onClick={onReset}
          title="Reset"
        >
          ↻
        </button>
        <button
          className={styles.controlButton}
          onClick={onExpand}
          title="Expand (M)"
        >
          ⛶
        </button>
      </div>
    </motion.div>
  );
}
