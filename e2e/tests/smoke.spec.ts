import { test, expect } from '../fixtures/timer-fixture';

test.describe('Smoke Tests', () => {
  test('app loads with all template names visible', async ({ page }) => {
    await expect(page.getByText('Quarterly Team Update')).toBeVisible();
    await expect(page.getByText('Project Pitch')).toBeVisible();
    await expect(page.getByText('Workshop / Training Session')).toBeVisible();
    await expect(page.getByText('Lightning Talk')).toBeVisible();
  });

  test('navigation: Manager → Editor → Presenter → back to Editor', async ({ page }) => {
    // Manager → click Lightning Talk card → Editor
    await page.getByText('Lightning Talk').first().click();
    await expect(page.getByRole('button', { name: '▶ Present' })).toBeVisible();

    // Editor → click Present → Presenter
    await page.getByRole('button', { name: '▶ Present' }).click();
    await expect(page.getByRole('button', { name: '▶ Start' })).toBeVisible();

    // Presenter → Escape → back to Editor
    await page.keyboard.press('Escape');
    await expect(page.getByRole('button', { name: '▶ Present' })).toBeVisible();
  });

  test('keyboard shortcuts: Space starts, pauses, resumes', async ({ page }) => {
    // Navigate to presenter
    await page.getByText('Lightning Talk').first().click();
    await page.getByRole('button', { name: '▶ Present' }).click();
    await page.getByRole('button', { name: '▶ Start' }).waitFor({ state: 'visible' });

    // Space → Start
    await page.keyboard.press('Space');
    await expect(page.getByRole('button', { name: '⏸ Pause' })).toBeVisible();

    // Space → Pause
    await page.keyboard.press('Space');
    await expect(page.getByRole('button', { name: '▶ Resume' })).toBeVisible();

    // Space → Resume
    await page.keyboard.press('Space');
    await expect(page.getByRole('button', { name: '⏸ Pause' })).toBeVisible();
  });
});
