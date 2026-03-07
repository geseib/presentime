import { test as base } from '@playwright/test';
import { clearPersistedState, waitForStores } from '../helpers/store-bridge';

/**
 * Custom fixture that ensures every test starts with:
 * - Clean localStorage (no persisted presentations)
 * - Stores exposed on window
 * - Manager view visible
 * - Countdown interval disabled (so only explicit tickTimer calls advance time)
 */
export const test = base.extend({
  page: async ({ page }, use) => {
    // Set test mode flag so useCountdown's setInterval loop never starts.
    // All time advancement is controlled by tickTimer().
    // addInitScript runs before any JS on every page load/navigation,
    // so it persists across the goto/reload calls in navigateToPresenter.
    await page.addInitScript(() => {
      (window as any).__PRESENTIME_TEST_MODE = true;
    });

    await page.goto('/');
    await clearPersistedState(page);
    await page.reload();
    await waitForStores(page);

    await use(page);
  },
});

export { expect } from '@playwright/test';
