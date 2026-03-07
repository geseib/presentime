import { test, expect } from '../fixtures/timer-fixture';
import { setupLightningTalk } from '../helpers/navigation';
import { tickTimer } from '../helpers/store-bridge';
import type { Page } from '@playwright/test';

/**
 * React StrictMode double-invokes effects in dev mode.
 * PopoutPortal's effect calls window.open(), so the first popup opens,
 * gets cleaned up (closed), then a second popup opens.
 * We need to find the surviving popup, not the first (closed) one.
 */
async function openPopup(page: Page, context: any): Promise<Page> {
  await page.keyboard.press('m');

  // Wait for StrictMode double-effect to settle
  await page.waitForTimeout(500);

  // Find the surviving popup page
  let popup: Page | undefined;
  await expect(async () => {
    const pages = context.pages();
    popup = pages.find((p: Page) => p !== page && !p.isClosed());
    expect(popup).toBeTruthy();
  }).toPass({ timeout: 5000 });

  return popup!;
}

test.describe('Mini Presenter (Popup)', () => {
  test('popup opens with battery bars and closes', async ({ page, context }) => {
    await setupLightningTalk(page);

    const popup = await openPopup(page, context);

    // Wait for React portal to render content into popup
    await expect(popup.getByText('TOTAL')).toBeVisible({ timeout: 5000 });
    await expect(popup.getByText('Hook')).toBeVisible();

    // Press M again to close
    await page.keyboard.press('m');
    await expect(async () => {
      expect(popup.isClosed()).toBe(true);
    }).toPass({ timeout: 3000 });
  });

  test('section battery shows caution color at threshold', async ({ page, context }) => {
    await setupLightningTalk(page);

    const popup = await openPopup(page, context);
    await expect(popup.getByText('TOTAL')).toBeVisible({ timeout: 5000 });

    // Tick 16s into 30s Hook → 14s remaining → section caution threshold
    await tickTimer(page, 16);

    // The BatteryBar fill div should have caution color in its backgroundColor
    // BatteryBar sets style={{ backgroundColor: `${color}59` }}
    // Browser converts #FFD60059 → rgba(255, 214, 0, 0.35)
    const fills = popup.locator('[class*="fill"]');
    // Second fill bar is the section battery
    await expect(async () => {
      const sectionFill = fills.nth(1);
      const bg = await sectionFill.evaluate(
        (el) => (el as HTMLElement).style.backgroundColor
      );
      expect(bg).toContain('255, 214, 0');
    }).toPass({ timeout: 5000 });

    // Close popup
    await page.keyboard.press('m');
    await expect(async () => {
      expect(popup.isClosed()).toBe(true);
    }).toPass({ timeout: 3000 });
  });
});
