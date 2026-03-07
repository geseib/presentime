import type { Page } from '@playwright/test';
import { clearPersistedState, waitForStores } from './store-bridge';

/**
 * Full UI flow: goto `/` → clear state → reload → click template card →
 * click "▶ Present" → wait for "▶ Start".
 *
 * Navigates through the real UI (not store manipulation) to validate the
 * user path and exercise copy-on-edit for system presentations.
 */
export async function navigateToPresenter(
  page: Page,
  templateName: string
): Promise<void> {
  await page.goto('/');
  await clearPersistedState(page);
  await page.reload();
  await waitForStores(page);

  // Manager view — click on the template card
  await page.getByText(templateName).first().click();

  // Editor view — click "▶ Present"
  await page.getByRole('button', { name: '▶ Present' }).click();

  // Presenter view — wait for idle state
  await page.getByRole('button', { name: '▶ Start' }).waitFor({ state: 'visible' });
}

/**
 * Click "▶ Start" and wait for the running state indicator.
 */
export async function startTimer(page: Page): Promise<void> {
  await page.getByRole('button', { name: '▶ Start' }).click();
  await page.getByRole('button', { name: '⏸ Pause' }).waitFor({ state: 'visible' });
}

/**
 * Convenience: navigate to Lightning Talk presenter and start the timer.
 */
export async function setupLightningTalk(page: Page): Promise<void> {
  await navigateToPresenter(page, 'Lightning Talk');
  await startTimer(page);
}
