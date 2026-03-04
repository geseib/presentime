import type { ReactNode } from 'react';
import { WARNING_COLORS } from '../../utils/constants';
import type { WarningLevel } from '../../types';
import styles from './ProgressArc.module.css';

interface ProgressArcProps {
  /** 0..1 progress (1 = full, 0 = empty) */
  progress: number;
  /** Diameter in pixels */
  size: number;
  /** Stroke width in pixels */
  strokeWidth?: number;
  /** Warning level controls the color */
  warningLevel?: WarningLevel;
  /** Override track circle stroke color */
  trackColor?: string;
  /** Content to render inside the arc */
  children?: ReactNode;
}

export function ProgressArc({
  progress,
  size,
  strokeWidth = 6,
  warningLevel = 'ok',
  trackColor,
  children,
}: ProgressArcProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const clampedProgress = Math.max(0, Math.min(1, progress));
  const dashOffset = circumference * (1 - clampedProgress);
  const color = WARNING_COLORS[warningLevel];

  return (
    <div className={styles.wrapper} style={{ width: size, height: size }}>
      <svg
        className={styles.svg}
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
      >
        <circle
          className={styles.trackCircle}
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
          {...(trackColor ? { stroke: trackColor } : {})}
        />
        <circle
          className={styles.progressCircle}
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
          stroke={color}
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          style={{ '--arc-color': color } as React.CSSProperties}
        />
      </svg>
      <div className={styles.content}>{children}</div>
    </div>
  );
}
