import type { WarningLevel } from '../../types';
import { WARNING_COLORS } from '../../utils/constants';
import styles from './BatteryBar.module.css';

interface BatteryBarProps {
  progress: number;
  timeText: string;
  warningLevel: WarningLevel;
  label: string;
  onClick?: () => void;
}

export function BatteryBar({ progress, timeText, warningLevel, label, onClick }: BatteryBarProps) {
  const color = WARNING_COLORS[warningLevel];
  const fillPct = `${Math.max(0, Math.min(1, progress)) * 100}%`;
  const isOvertime = warningLevel === 'overtime';

  return (
    <div
      className={styles.container}
      style={{ '--fill-pct': fillPct, cursor: onClick ? 'pointer' : undefined } as React.CSSProperties}
      onClick={onClick}
    >
      <div
        className={styles.fill}
        style={{ backgroundColor: `${color}59` }}
      />
      <div className={styles.content}>
        <span
          className={styles.time}
          style={isOvertime ? { color: WARNING_COLORS.danger } : undefined}
        >
          {timeText}
        </span>
        <span className={styles.label}>{label}</span>
      </div>
    </div>
  );
}
