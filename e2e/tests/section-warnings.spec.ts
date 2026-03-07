import { test, expect } from '../fixtures/timer-fixture';
import { setupLightningTalk, navigateToPresenter, startTimer } from '../helpers/navigation';
import { tickTimer, completeCurrentSection } from '../helpers/store-bridge';
import { WARNING_COLORS } from '../helpers/constants';

test.describe('Section Warning Thresholds (Hybrid)', () => {
  /**
   * Lightning Talk Hook = 30s.
   * Hybrid caution = min(max(30*0.25, 45), 30*0.5) = min(max(7.5, 45), 15) = 15s
   * Hybrid danger  = min(max(30*0.10, 15), 30*0.25) = min(max(3, 15), 7.5) = 7.5s
   */
  test('short section: caution at 15s remaining', async ({ page }) => {
    await setupLightningTalk(page);

    // Section arc = 2nd SVG on page, 2nd circle (progress circle)
    const sectionArc = page.locator('[class*="progressCircle"]').nth(1);

    // At 10s elapsed (20s remaining) → still ok (20 > 15)
    await tickTimer(page, 10);
    await expect(sectionArc).toHaveAttribute('stroke', WARNING_COLORS.ok);

    // At 16s elapsed (14s remaining) → caution (14 < 15)
    await tickTimer(page, 6);
    await expect(sectionArc).toHaveAttribute('stroke', WARNING_COLORS.caution);
  });

  test('short section: danger at 7.5s remaining', async ({ page }) => {
    await setupLightningTalk(page);

    const sectionArc = page.locator('[class*="progressCircle"]').nth(1);

    // At 22s elapsed (8s remaining) → caution (8 < 15 but 8 > 7.5)
    await tickTimer(page, 22);
    await expect(sectionArc).toHaveAttribute('stroke', WARNING_COLORS.caution);

    // At 23s elapsed (7s remaining) → danger (7 < 7.5)
    await tickTimer(page, 1);
    await expect(sectionArc).toHaveAttribute('stroke', WARNING_COLORS.danger);
  });

  test('longer section (120s): caution at 45s remaining, danger at 15s remaining', async ({ page }) => {
    await setupLightningTalk(page);

    // Complete Hook on time (30s) and Big Idea on time (90s)
    // to reach Evidence/Story (120s)
    await tickTimer(page, 30);
    await completeCurrentSection(page);
    await tickTimer(page, 90);
    await completeCurrentSection(page);

    /**
     * Evidence/Story = 120s.
     * Hybrid caution = min(max(120*0.25, 45), 120*0.5) = min(max(30, 45), 60) = 45s
     * Hybrid danger  = min(max(120*0.10, 15), 120*0.25) = min(max(12, 15), 30) = 15s
     */
    const sectionArc = page.locator('[class*="progressCircle"]').nth(1);

    // 74s elapsed in section (46s remaining) → still ok (46 > 45)
    await tickTimer(page, 74);
    await expect(sectionArc).toHaveAttribute('stroke', WARNING_COLORS.ok);

    // 76s elapsed (44s remaining) → caution (44 <= 45)
    await tickTimer(page, 2);
    await expect(sectionArc).toHaveAttribute('stroke', WARNING_COLORS.caution);

    // 104s elapsed (16s remaining) → still caution (16 > 15)
    await tickTimer(page, 28);
    await expect(sectionArc).toHaveAttribute('stroke', WARNING_COLORS.caution);

    // 106s elapsed (14s remaining) → danger (14 <= 15)
    await tickTimer(page, 2);
    await expect(sectionArc).toHaveAttribute('stroke', WARNING_COLORS.danger);
  });
});
