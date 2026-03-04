import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useThemeStore } from '../../store/themeStore';
import { THEME_OPTIONS } from './themeConfig';
import styles from './ThemeSelector.module.css';

export function ThemeSelector() {
  const [open, setOpen] = useState(false);
  const theme = useThemeStore(s => s.theme);
  const setTheme = useThemeStore(s => s.setTheme);
  const panelRef = useRef<HTMLDivElement>(null);

  const close = useCallback(() => setOpen(false), []);

  // Close on click-outside
  useEffect(() => {
    if (!open) return;
    const handleClick = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        close();
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open, close]);

  // Close on Escape; stop propagation so timer shortcuts don't fire
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      e.stopPropagation();
      if (e.key === 'Escape') {
        close();
      }
    },
    [close]
  );

  return (
    <div ref={panelRef} className={styles.container} onKeyDown={handleKeyDown}>
      <button
        className={styles.trigger}
        onClick={() => setOpen(prev => !prev)}
        title="Theme"
        aria-label="Change theme"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="13.5" cy="6.5" r="2.5" />
          <circle cx="6" cy="12" r="2.5" />
          <circle cx="8" cy="21" r="2.5" />
          <circle cx="17.5" cy="17.5" r="2.5" />
          <path d="M12 2a10 10 0 0 1 0 20 10 10 0 0 1 0-20" />
        </svg>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            className={styles.dropdown}
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.15 }}
          >
            {THEME_OPTIONS.map(opt => (
              <button
                key={opt.id}
                className={`${styles.option} ${opt.id === theme ? styles.active : ''}`}
                onClick={() => {
                  setTheme(opt.id);
                  close();
                }}
              >
                <span
                  className={styles.swatch}
                  style={{ background: opt.accent }}
                />
                <span className={styles.optionText}>
                  <span className={styles.optionName}>{opt.name}</span>
                  <span className={styles.optionDesc}>{opt.description}</span>
                </span>
                {opt.id === theme && <span className={styles.check}>&#10003;</span>}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
