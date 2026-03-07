import { test, expect } from '../fixtures/timer-fixture';
import { setupLightningTalk } from '../helpers/navigation';
import { tickTimer, completeCurrentSection } from '../helpers/store-bridge';
import { expectOverlayAbsent, expectOverlayPresent } from '../helpers/assertions';

test.describe('Warning Overlay', () => {
  test('no flash on-pace through section endings', async ({ page }) => {
    await setupLightningTalk(page);

    // Complete Hook on time (tick exactly 30s, then complete)
    await tickTimer(page, 30);
    await expectOverlayAbsent(page);

    await completeCurrentSection(page);

    // Overlay still absent after section transition (completed on time)
    await expectOverlayAbsent(page);

    // Advance 30s into section 2 — still on pace overall
    await tickTimer(page, 30);
    await expectOverlayAbsent(page);
  });

  test('flash appears on pace deficit', async ({ page }) => {
    await setupLightningTalk(page);

    // Overrun Hook by 12s (tick 42s in 30s section), then COMPLETE it
    // to create pace deficit. Total=300s, caution threshold=300*0.03=9s.
    // Deficit=12s > 9s → overlay should appear.
    await tickTimer(page, 42);
    await completeCurrentSection(page);
    await expectOverlayPresent(page);
  });

  test('flash stops on recovery', async ({ page }) => {
    await setupLightningTalk(page);

    // Create deficit: overrun Hook by 12s and complete
    await tickTimer(page, 42);
    await completeCurrentSection(page);
    await expectOverlayPresent(page);

    // Recover by completing Big Idea early (only 60s of 90s budget)
    await tickTimer(page, 60);
    await completeCurrentSection(page);

    // Now deficit is recovered — overlay should be gone
    await expectOverlayAbsent(page);
  });
});
