import { test, expect } from '../fixtures/timer-fixture';
import { setupLightningTalk } from '../helpers/navigation';
import { tickTimer, completeCurrentSection } from '../helpers/store-bridge';

test.describe('Trend Arrows', () => {
  /**
   * TrendTracker uses Date.now() internally with a 15s rolling window.
   * Pace offset only changes on section COMPLETION (it's always 0 during a section).
   *
   * React hook ordering: useMemo(trend) runs DURING render (before effects),
   * but the useEffect that records samples runs AFTER render. So the trend
   * is always one step behind. We need 3 offset changes with >= 1s real gaps
   * so the useMemo sees 2 prior samples from completed effects.
   *
   * Sequence: timer start records sample 0 at T0, then 2 completions at T0+1.2s
   * and T0+2.4s. The useMemo at the 3rd change sees samples from T0 and T0+1.2s.
   */

  test('worsening arrow when pace is declining', async ({ page }) => {
    await setupLightningTalk(page);
    // Timer start → useEffect records sample (offset=0, T0)

    await page.waitForTimeout(1200); // Date.now() advances to T0+1.2s

    // Complete Hook 10s late → offset changes from 0 to -10
    await tickTimer(page, 40);
    await completeCurrentSection(page);
    // useEffect records (-10, T0+1.2s). useMemo sees 1 sample → stable

    await page.waitForTimeout(1200); // T0+2.4s

    // Complete Big Idea 30s late (120s into 90s section) → offset -10 → -40
    await tickTimer(page, 120);
    await completeCurrentSection(page);
    // useMemo sees (0, T0) and (-10, T0+1.2s) → delta=-8.3/s → worsening!

    await expect(page.getByText('\u2193')).toBeVisible({ timeout: 5000 });
  });

  test('improving arrow when recovering pace', async ({ page }) => {
    await setupLightningTalk(page);
    // Timer start → useEffect records sample (offset=0, T0)

    await page.waitForTimeout(1200); // T0+1.2s

    // Complete Hook 20s EARLY (10s into 30s section) → offset 0 → +20
    await tickTimer(page, 10);
    await completeCurrentSection(page);
    // useEffect records (+20, T0+1.2s). useMemo sees 1 sample → stable

    await page.waitForTimeout(1200); // T0+2.4s

    // Complete Big Idea slightly late (100s into 90s section) → offset +20 → +10
    await tickTimer(page, 100);
    await completeCurrentSection(page);
    // useMemo sees (0, T0) and (+20, T0+1.2s) → delta=+16.7/s → improving!

    await expect(page.getByText('\u2191')).toBeVisible({ timeout: 5000 });
  });
});
