import { useState, useRef, useEffect } from 'react';
import { useTimerStore } from '../../store/timerStore';
import styles from './BreakInsert.module.css';

interface BreakInsertProps {
  insertIndex: number;
  isOpen: boolean;
  onToggle: () => void;
  onClose: () => void;
}

const PRESETS = [
  { label: '5', seconds: 300 },
  { label: '10', seconds: 600 },
  { label: '15', seconds: 900 },
];

export function BreakInsert({ insertIndex, isOpen, onToggle, onClose }: BreakInsertProps) {
  const insertBreak = useTimerStore(s => s.insertBreakAt);
  const [customMin, setCustomMin] = useState('');
  const popupRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const handleClick = (e: MouseEvent) => {
      if (popupRef.current && !popupRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [isOpen, onClose]);

  const handlePreset = (seconds: number) => {
    insertBreak(insertIndex, seconds);
    onClose();
  };

  const handleCustom = () => {
    const mins = parseInt(customMin, 10);
    if (mins > 0) {
      insertBreak(insertIndex, mins * 60);
      setCustomMin('');
      onClose();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    e.stopPropagation();
    if (e.key === 'Enter') handleCustom();
    if (e.key === 'Escape') onClose();
  };

  return (
    <div className={styles.wrapper} ref={popupRef}>
      <div className={styles.divider} onClick={onToggle}>
        <span className={styles.label}>+ add break</span>
      </div>
      {isOpen && (
        <div className={styles.popup}>
          <div className={styles.presets}>
            {PRESETS.map(p => (
              <button
                key={p.seconds}
                className={styles.presetBtn}
                onClick={() => handlePreset(p.seconds)}
              >
                {p.label}m
              </button>
            ))}
          </div>
          <div className={styles.custom}>
            <input
              type="number"
              className={styles.customInput}
              placeholder="min"
              min={1}
              value={customMin}
              onChange={e => setCustomMin(e.target.value)}
              onKeyDown={handleKeyDown}
              autoFocus
            />
            <button className={styles.presetBtn} onClick={handleCustom}>
              Go
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
