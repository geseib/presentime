import { test, expect } from '../fixtures/timer-fixture';
import { setupLightningTalk } from '../helpers/navigation';
import { tickTimer, completeCurrentSection } from '../helpers/store-bridge';
import { WARNING_COLORS } from '../helpers/constants';

test.describe('Projected Finish Display', () => {
  test('shows "Finishing X:XX over" when behind pace', async ({ page }) => {
    await setupLightningTalk(page);
    // Overrun Hook by 20s and complete to create pace deficit
    await tickTimer(page, 50);
    await completeCurrentSection(page);
    await expect(page.getByText(/Finishing.*over/)).toBeVisible();
  });

  test('shows "Finishing X:XX early" when ahead of pace', async ({ page }) => {
    await setupLightningTalk(page);
    // Complete Hook in 10s (20s early) to create pace surplus
    await tickTimer(page, 10);
    await completeCurrentSection(page);
    await expect(page.getByText(/Finishing.*early/)).toBeVisible();
  });

  test('projection color matches warning level', async ({ page }) => {
    await setupLightningTalk(page);

    // On pace → green "ON PACE"
    await tickTimer(page, 5);
    const paceWrapper = page.getByText('ON PACE').locator('..');
    const onPaceColor = await paceWrapper.evaluate(
      (el) => getComputedStyle(el).color
    );
    // getComputedStyle returns rgb format; check it's the green color
    // #00E676 = rgb(0, 230, 118)
    expect(onPaceColor).toContain('0, 230, 118');

    // Create moderate deficit: overrun Hook by 20s and complete.
    // Total=300s. okFraction=5% → 15s, cautionFraction=15% → 45s.
    // Deficit=20s → between 15 and 45 → caution (yellow)
    await tickTimer(page, 45); // total 50s into 30s Hook
    await completeCurrentSection(page);

    // CSS has transition: color 0.5s, so use toPass to retry until settled
    await expect(async () => {
      const overWrapper = page.getByText(/Finishing.*over/).locator('..');
      const overColor = await overWrapper.evaluate(
        (el) => getComputedStyle(el).color
      );
      // #FFD600 = rgb(255, 214, 0)
      expect(overColor).toContain('255, 214, 0');
    }).toPass({ timeout: 3000 });
  });
});
