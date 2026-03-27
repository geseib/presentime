import { usePaceEngine } from '../../hooks/usePaceEngine';
import { useTimerStore } from '../../store/timerStore';
import { formatTime } from '../../utils/timeUtils';
import { AnimatePresence, motion } from 'motion/react';
import styles from './ExtraTimeIndicator.module.css';

const DEAD_ZONE_SEC = 2;

export function ExtraTimeIndicator() {
  const status = useTimerStore(s => s.status);
  const { pace } = usePaceEngine();

  const isRunning = status === 'running' || status === 'paused';
  const showExtra = isRunning && pace.offsetSec > DEAD_ZONE_SEC;

  return (
    <AnimatePresence>
      {showExtra && (
        <motion.div
          className={styles.pill}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          transition={{ duration: 0.3 }}
        >
          + {formatTime(Math.round(pace.offsetSec))} extra
        </motion.div>
      )}
    </AnimatePresence>
  );
}
