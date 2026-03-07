import type { Page } from '@playwright/test';

/**
 * Wait until the Zustand stores are exposed on window (dev mode).
 */
export async function waitForStores(page: Page): Promise<void> {
  await page.waitForFunction(
    () => (window as any).__timerStore && (window as any).__presentationStore,
    undefined,
    { timeout: 10_000 }
  );
}

/**
 * Deterministic time advance — calls timerStore.getState().tick(seconds).
 * Bypasses rAF loop but exercises all real warning/pace/redistribution logic.
 */
export async function tickTimer(page: Page, seconds: number): Promise<void> {
  await page.evaluate((sec) => {
    (window as any).__timerStore.getState().tick(sec);
  }, seconds);
}

/**
 * Tick in small increments with real-time delays between steps.
 * Required for TrendTracker which uses Date.now() for its 15s rolling window.
 */
export async function tickTimerGradually(
  page: Page,
  totalSec: number,
  stepSize: number = 1
): Promise<void> {
  let remaining = totalSec;
  while (remaining > 0) {
    const step = Math.min(stepSize, remaining);
    await tickTimer(page, step);
    remaining -= step;
    if (remaining > 0) {
      await page.waitForTimeout(50);
    }
  }
}

/**
 * Return the current timer status string.
 */
export async function getTimerStatus(page: Page): Promise<string> {
  return page.evaluate(() => (window as any).__timerStore.getState().status);
}

/**
 * Complete the current section via store action.
 */
export async function completeCurrentSection(page: Page): Promise<void> {
  await page.evaluate(() => {
    (window as any).__timerStore.getState().completeCurrentSection();
  });
}

/**
 * Remove persisted state from localStorage.
 */
export async function clearPersistedState(page: Page): Promise<void> {
  await page.evaluate(() => {
    localStorage.removeItem('presentime-presentations');
  });
}
