import { useEffect, useCallback, useState } from 'react';
import { usePresentationStore } from '../../store/presentationStore';
import { useTimerStore } from '../../store/timerStore';
import { useThemeStore } from '../../store/themeStore';
import { useCountdown } from '../../hooks/useCountdown';
import { useWakeLock } from '../../hooks/useWakeLock';
import { useWarningState } from '../../hooks/useWarningState';
import { formatTime } from '../../utils/timeUtils';
import { OverallTimer } from './OverallTimer';
import { SectionTimer } from './SectionTimer';
import { SectionList } from './SectionList';
import { TimerControls } from './TimerControls';
import { PaceIndicator } from './PaceIndicator';
import { ThemeSelector } from './ThemeSelector';
import { WarningOverlay } from '../shared/WarningOverlay';
import { Button } from '../shared/Button';
import styles from './PresenterView.module.css';
import './themes.css';

export function PresenterView() {
  const presentation = usePresentationStore(s => s.getActivePresentation());
  const activePresentationId = usePresentationStore(s => s.activePresentationId);
  const theme = useThemeStore(s => s.theme);
  const openEditor = usePresentationStore(s => s.openEditor);
  const timerStatus = useTimerStore(s => s.status);
  const initialize = useTimerStore(s => s.initialize);
  const start = useTimerStore(s => s.start);
  const pause = useTimerStore(s => s.pause);
  const resume = useTimerStore(s => s.resume);
  const reset = useTimerStore(s => s.reset);
  const completeCurrentSection = useTimerStore(s => s.completeCurrentSection);
  const totalElapsedSec = useTimerStore(s => s.totalElapsedSec);
  const totalDurationSec = useTimerStore(s => s.totalDurationSec);
  const activeSection = useTimerStore(s => s.getActiveSection());

  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Activate the rAF countdown loop
  useCountdown();

  // Keep screen awake during presentation
  useWakeLock(timerStatus === 'running' || timerStatus === 'paused');

  // Initialize timer once when entering presenter mode (keyed on ID only)
  useEffect(() => {
    if (presentation) {
      initialize(presentation);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activePresentationId]);

  // Derive warning levels
  const sectionRemaining = activeSection
    ? activeSection.adjustedDurationSec - activeSection.elapsedSec
    : 0;
  const sectionTotal = activeSection?.adjustedDurationSec ?? 0;
  const sectionWarning = useWarningState(sectionRemaining, sectionTotal);

  const totalRemaining = totalDurationSec - totalElapsedSec;
  const totalWarning = useWarningState(totalRemaining, totalDurationSec);

  // The more urgent of the two warning levels drives the overlay
  const overlayWarning = getWorstWarning(sectionWarning, totalWarning);

  // Keyboard shortcuts
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      switch (e.code) {
        case 'Space':
          e.preventDefault();
          if (timerStatus === 'idle') start();
          else if (timerStatus === 'running') pause();
          else if (timerStatus === 'paused') resume();
          break;
        case 'ArrowRight':
          e.preventDefault();
          if (timerStatus === 'running' || timerStatus === 'paused') {
            completeCurrentSection();
          }
          break;
        case 'Escape':
          e.preventDefault();
          if (sidebarOpen) setSidebarOpen(false);
          else if (presentation) openEditor(presentation.id);
          break;
      }
    },
    [timerStatus, start, pause, resume, completeCurrentSection, openEditor, presentation, sidebarOpen]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  if (!presentation) return null;

  const handleExit = () => openEditor(presentation.id);

  const handleRerun = () => {
    reset();
    const fresh = usePresentationStore.getState().getActivePresentation();
    if (fresh) initialize(fresh);
  };

  return (
    <div className={styles.container} data-theme={theme}>
      <WarningOverlay warningLevel={timerStatus === 'running' ? overlayWarning : 'ok'} />

      <ThemeSelector />

      <Button
        variant="ghost"
        className={styles.exitButton}
        onClick={handleExit}
        title="Exit (Esc)"
      >
        ✕ Exit
      </Button>

      <button
        className={styles.sidebarToggle}
        onClick={() => setSidebarOpen(o => !o)}
        aria-label={sidebarOpen ? 'Close sidebar' : 'Open sidebar'}
      >
        {sidebarOpen ? '✕' : '☰'}
      </button>

      {sidebarOpen && (
        <div
          className={styles.sidebarBackdrop}
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <div className={styles.main}>
        {timerStatus === 'finished' ? (
          <div className={styles.finished}>
            <div className={styles.finishedTitle}>Presentation Complete</div>
            <div className={styles.finishedTime}>
              {formatTime(totalElapsedSec)}
            </div>
            <TimerControls
              status={timerStatus}
              onStart={start}
              onPause={pause}
              onResume={resume}
              onReset={handleRerun}
            />
          </div>
        ) : (
          <>
            <div className={styles.timers}>
              <OverallTimer />
              <SectionTimer />
            </div>
            <PaceIndicator />
            <div className={styles.controls}>
              <TimerControls
                status={timerStatus}
                onStart={start}
                onPause={pause}
                onResume={resume}
                onReset={reset}
                onComplete={completeCurrentSection}
              />
            </div>
          </>
        )}
      </div>

      <div className={`${styles.sidebar} ${sidebarOpen ? styles.sidebarOpen : ''}`}>
        <SectionList />
      </div>
    </div>
  );
}

function getWorstWarning(...levels: import('../../types').WarningLevel[]): import('../../types').WarningLevel {
  const order: import('../../types').WarningLevel[] = ['ok', 'caution', 'danger', 'overtime'];
  let worst = 0;
  for (const level of levels) {
    const idx = order.indexOf(level);
    if (idx > worst) worst = idx;
  }
  return order[worst];
}
