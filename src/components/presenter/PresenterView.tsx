import { useEffect, useCallback, useState } from 'react';
import { usePresentationStore } from '../../store/presentationStore';
import { useTimerStore } from '../../store/timerStore';
import { useThemeStore } from '../../store/themeStore';
import { useCountdown } from '../../hooks/useCountdown';
import { useWakeLock } from '../../hooks/useWakeLock';
import { usePaceEngine } from '../../hooks/usePaceEngine';
import { formatTime } from '../../utils/timeUtils';
import { OverallTimer } from './OverallTimer';
import { SectionTimer } from './SectionTimer';
import { SectionList } from './SectionList';
import { PaceIndicator } from './PaceIndicator';
import { ThemeSelector } from './ThemeSelector';
import { MiniPresenter } from './MiniPresenter';
import { PopoutPortal } from './PopoutPortal';
import { FinishTimeDisplay } from './FinishTimeDisplay';
import { ExtraTimeIndicator } from './ExtraTimeIndicator';
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
  const goToPreviousSection = useTimerStore(s => s.goToPreviousSection);
  const totalElapsedSec = useTimerStore(s => s.totalElapsedSec);

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [popoutOpen, setPopoutOpen] = useState(false);

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

  // Overlay driven by pace deficit only — no section-level flashing
  const { pace } = usePaceEngine();
  const overlayWarning = pace.paceWarning;

  const handlePopout = useCallback(() => {
    if (popoutOpen) return;
    setPopoutOpen(true);
  }, [popoutOpen]);

  const handlePopoutClose = useCallback(() => {
    setPopoutOpen(false);
  }, []);

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
        case 'ArrowLeft':
          e.preventDefault();
          if (timerStatus === 'running' || timerStatus === 'paused') {
            goToPreviousSection();
          }
          break;
        case 'KeyM':
          e.preventDefault();
          if (popoutOpen) {
            setPopoutOpen(false);
          } else {
            handlePopout();
          }
          break;
        case 'Escape':
          e.preventDefault();
          if (popoutOpen) setPopoutOpen(false);
          else if (sidebarOpen) setSidebarOpen(false);
          else if (presentation) openEditor(presentation.id);
          break;
      }
    },
    [timerStatus, start, pause, resume, completeCurrentSection, goToPreviousSection, openEditor, presentation, sidebarOpen, popoutOpen, handlePopout]
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
    <>
      <WarningOverlay
        warningLevel={timerStatus === 'running' ? overlayWarning : 'ok'}
      />

      {popoutOpen && (
        <PopoutPortal onClose={handlePopoutClose}>
          <MiniPresenter
            onExpand={handlePopoutClose}
            onStart={start}
            onPause={pause}
            onResume={resume}
            onReset={reset}
            onComplete={completeCurrentSection}
          />
        </PopoutPortal>
      )}

      <div className={styles.container} data-theme={theme}>

        <ThemeSelector />

        <div className={styles.topButtons}>
          <Button
            variant="ghost"
            onClick={handlePopout}
            title="Pop out mini timer (M)"
          >
            {popoutOpen ? '✕ Close Mini' : '⧉ Pop Out'}
          </Button>
          <Button
            variant="ghost"
            onClick={handleExit}
            title="Exit (Esc)"
          >
            ✕ Exit
          </Button>
        </div>

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
              <Button size="large" onClick={handleRerun}>
                ↻ Rerun
              </Button>
            </div>
          ) : (
            <>
              <div className={styles.timers}>
                <OverallTimer />
                <SectionTimer />
              </div>
              <ExtraTimeIndicator />
              <PaceIndicator />
              <FinishTimeDisplay />
            </>
          )}
        </div>

        <div className={`${styles.sidebar} ${sidebarOpen ? styles.sidebarOpen : ''}`}>
          <SectionList />
        </div>
      </div>
    </>
  );
}
