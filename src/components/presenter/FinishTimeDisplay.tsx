import { useState, useEffect } from 'react';
import { useTimerStore } from '../../store/timerStore';
import styles from './FinishTimeDisplay.module.css';

function formatClockTime(epochMs: number): string {
  return new Date(epochMs).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

function epochFromTimeString(timeStr: string): number | null {
  const [hours, minutes] = timeStr.split(':').map(Number);
  if (isNaN(hours) || isNaN(minutes)) return null;
  const d = new Date();
  d.setHours(hours, minutes, 0, 0);
  // If the time is in the past, assume next day
  if (d.getTime() < Date.now()) {
    d.setDate(d.getDate() + 1);
  }
  return d.getTime();
}

export function FinishTimeDisplay() {
  const setTargetFinishTime = useTimerStore(s => s.setTargetFinishTime);
  const targetFinishTime = useTimerStore(s => s.targetFinishTime);
  const totalDurationSec = useTimerStore(s => s.totalDurationSec);
  const startedAtEpochMs = useTimerStore(s => s.startedAtEpochMs);

  const [now, setNow] = useState(Date.now());
  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState('');

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  // Before starting: estimate from now. After starting: locked target.
  const estimatedFinishMs = startedAtEpochMs
    ? startedAtEpochMs + totalDurationSec * 1000
    : now + totalDurationSec * 1000;

  const finishMs = targetFinishTime ?? estimatedFinishMs;

  // Warn if projected content finish exceeds the target
  const projectedFinishMs = startedAtEpochMs
    ? startedAtEpochMs + totalDurationSec * 1000
    : now + totalDurationSec * 1000;
  const isOverTarget = targetFinishTime != null && projectedFinishMs > targetFinishTime + 30_000; // 30s grace

  const handleEditStart = () => {
    const d = new Date(finishMs);
    const hh = String(d.getHours()).padStart(2, '0');
    const mm = String(d.getMinutes()).padStart(2, '0');
    setEditValue(`${hh}:${mm}`);
    setEditing(true);
  };

  const handleEditConfirm = () => {
    const epochMs = epochFromTimeString(editValue);
    if (epochMs) {
      setTargetFinishTime(epochMs);
    }
    setEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    e.stopPropagation();
    if (e.key === 'Enter') handleEditConfirm();
    if (e.key === 'Escape') setEditing(false);
  };

  return (
    <div className={styles.container}>
      <div className={styles.item}>
        <span className={styles.label}>Now</span>
        <span className={styles.time}>{formatClockTime(now)}</span>
      </div>
      <div className={styles.item}>
        <span className={styles.label}>Finish</span>
        {editing ? (
          <input
            type="time"
            className={styles.timeInput}
            value={editValue}
            onChange={e => setEditValue(e.target.value)}
            onBlur={handleEditConfirm}
            onKeyDown={handleKeyDown}
            autoFocus
          />
        ) : (
          <span
            className={`${styles.time} ${styles.editable} ${isOverTarget ? styles.overTarget : ''}`}
            onClick={handleEditStart}
            title="Click to set finish time"
          >
            {formatClockTime(finishMs)}
          </span>
        )}
        {isOverTarget && (
          <span className={styles.warning}>over target</span>
        )}
      </div>
    </div>
  );
}
