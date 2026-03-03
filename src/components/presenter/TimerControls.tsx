import type { TimerStatus } from '../../types';
import { Button } from '../shared/Button';
import styles from './TimerControls.module.css';

interface TimerControlsProps {
  status: TimerStatus;
  onStart: () => void;
  onPause: () => void;
  onResume: () => void;
  onReset: () => void;
  onComplete?: () => void;
}

export function TimerControls({
  status,
  onStart,
  onPause,
  onResume,
  onReset,
  onComplete,
}: TimerControlsProps) {
  return (
    <div>
      <div className={styles.controls}>
        {status === 'idle' && (
          <Button size="large" onClick={onStart}>
            ▶ Start
          </Button>
        )}
        {status === 'running' && (
          <>
            <Button size="large" variant="secondary" onClick={onPause}>
              ⏸ Pause
            </Button>
            {onComplete && (
              <Button size="large" onClick={onComplete}>
                ⏭ Next Section
              </Button>
            )}
          </>
        )}
        {status === 'paused' && (
          <>
            <Button size="large" onClick={onResume}>
              ▶ Resume
            </Button>
            {onComplete && (
              <Button size="large" variant="secondary" onClick={onComplete}>
                ⏭ Next Section
              </Button>
            )}
          </>
        )}
        {status === 'finished' && (
          <Button size="large" onClick={onReset}>
            ↻ Rerun
          </Button>
        )}
        {(status === 'running' || status === 'paused') && (
          <Button variant="ghost" onClick={onReset}>
            ↻ Reset
          </Button>
        )}
      </div>
      <div className={styles.hint}>
        {status === 'idle' && 'Space to start'}
        {status === 'running' && 'Space = pause · → = next section · Esc = exit'}
        {status === 'paused' && 'Space = resume · → = next section · Esc = exit'}
      </div>
    </div>
  );
}
