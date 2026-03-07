import { motion, AnimatePresence } from 'motion/react';
import type { WarningLevel } from '../../types';
import { WARNING_COLORS, FLASH_INTERVALS } from '../../utils/constants';

interface WarningOverlayProps {
  warningLevel: WarningLevel;
  /** Use 'compact' for small viewports where the radial vignette is invisible */
  variant?: 'default' | 'compact';
}

export function WarningOverlay({ warningLevel, variant = 'default' }: WarningOverlayProps) {
  const isActive = warningLevel !== 'ok';
  const color = WARNING_COLORS[warningLevel];
  const interval = FLASH_INTERVALS[warningLevel];

  const isCompact = variant === 'compact';
  const peakOpacity = isCompact ? 0.3 : 0.15;
  const bg = isCompact
    ? `${color}40`
    : `radial-gradient(ellipse at center, transparent 40%, ${color}40)`;
  const shadow = isCompact
    ? `inset 0 0 40px ${color}50`
    : `inset 0 0 120px ${color}30`;

  return (
    <AnimatePresence>
      {isActive && (
        <motion.div
          key={warningLevel}
          initial={{ opacity: 0 }}
          animate={{
            opacity: [0, peakOpacity, 0],
            transition: {
              duration: interval,
              repeat: Infinity,
              ease: 'easeInOut',
            },
          }}
          exit={{ opacity: 0, transition: { duration: 0.3 } }}
          style={{
            position: 'fixed',
            inset: 0,
            pointerEvents: 'none',
            zIndex: 100,
            background: bg,
            boxShadow: shadow,
          }}
        />
      )}
    </AnimatePresence>
  );
}
