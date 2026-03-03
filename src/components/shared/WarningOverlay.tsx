import { motion, AnimatePresence } from 'motion/react';
import type { WarningLevel } from '../../types';
import { WARNING_COLORS, FLASH_INTERVALS } from '../../utils/constants';

interface WarningOverlayProps {
  warningLevel: WarningLevel;
}

export function WarningOverlay({ warningLevel }: WarningOverlayProps) {
  const isActive = warningLevel !== 'ok';
  const color = WARNING_COLORS[warningLevel];
  const interval = FLASH_INTERVALS[warningLevel];

  return (
    <AnimatePresence>
      {isActive && (
        <motion.div
          key={warningLevel}
          initial={{ opacity: 0 }}
          animate={{
            opacity: [0, 0.15, 0],
          }}
          exit={{ opacity: 0 }}
          transition={{
            duration: interval,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          style={{
            position: 'fixed',
            inset: 0,
            pointerEvents: 'none',
            zIndex: 100,
            background: `radial-gradient(ellipse at center, transparent 40%, ${color}40)`,
            boxShadow: `inset 0 0 120px ${color}30`,
          }}
        />
      )}
    </AnimatePresence>
  );
}
