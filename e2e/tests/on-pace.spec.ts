import { test, expect } from '../fixtures/timer-fixture';
import { setupLightningTalk } from '../helpers/navigation';
import { tickTimer } from '../helpers/store-bridge';
import { expectOverlayAbsent } from '../helpers/assertions';

test.describe('On Pace Behavior', () => {
  test('shows ON PACE text when running on time', async ({ page }) => {
    await setupLightningTalk(page);
    // Tick 10s into 30s Hook section — well within budget
    await tickTimer(page, 10);
    await expect(page.getByText('ON PACE')).toBeVisible();
  });

  test('no overlay when on pace', async ({ page }) => {
    await setupLightningTalk(page);
    await tickTimer(page, 10);
    await expectOverlayAbsent(page);
  });

  test('no recovery row when on pace', async ({ page }) => {
    await setupLightningTalk(page);
    await tickTimer(page, 10);
    await expect(page.getByText(/Save \d+s\/section/)).not.toBeVisible();
  });
});
