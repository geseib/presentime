import type { Page } from '@playwright/test';
import { expect } from '@playwright/test';
import { WARNING_COLORS } from './constants';
import type { Locator } from '@playwright/test';

type WarningLevel = keyof typeof WARNING_COLORS;

/**
 * Assert the stroke color of a ProgressArc's progress circle.
 * ProgressArc renders two circles: track (1st) and progress (2nd).
 * `nthArc` is 1-based (1 = first ProgressArc on page, 2 = second, etc.)
 */
export async function expectArcColor(
  page: Page,
  nthArc: number,
  level: WarningLevel
): Promise<void> {
  const expectedColor = WARNING_COLORS[level];
  const arc = page.locator('.wrapper svg').nth(nthArc - 1);
  // The progress circle is the second <circle> element
  const progressCircle = arc.locator('circle').nth(1);
  await expect(progressCircle).toHaveAttribute('stroke', expectedColor);
}

/**
 * Assert pace text is visible on the page.
 */
export async function expectPaceText(
  page: Page,
  text: string | RegExp
): Promise<void> {
  await expect(page.getByText(text)).toBeVisible();
}

/**
 * Assert the warning overlay (z-index:100 motion.div) is present.
 * WarningOverlay sets inline style with zIndex: 100.
 */
export async function expectOverlayPresent(page: Page): Promise<void> {
  const overlay = page.locator('[style*="z-index: 100"]');
  await expect(overlay.first()).toBeVisible({ timeout: 5000 });
}

/**
 * Assert the warning overlay is absent (not visible to the user).
 * In tests, rAF is disabled to prevent double-counting time. This means
 * motion/react exit animations can't complete, so AnimatePresence may leave
 * a ghost element in the DOM with opacity: 0. We accept either:
 * - Element removed from DOM (count = 0)
 * - Element present but at opacity: 0 (functionally invisible)
 */
export async function expectOverlayAbsent(page: Page): Promise<void> {
  await expect(async () => {
    const overlay = page.locator('[style*="z-index: 100"]');
    const count = await overlay.count();
    if (count === 0) return; // fully removed — pass
    const opacity = await overlay.first().evaluate(
      el => getComputedStyle(el).opacity
    );
    expect(Number(opacity)).toBe(0);
  }).toPass({ timeout: 5000 });
}

/**
 * Assert a trend arrow (↑ or ↓) is visible.
 */
export async function expectTrendArrow(
  page: Page,
  direction: 'improving' | 'worsening'
): Promise<void> {
  const arrow = direction === 'improving' ? '\u2191' : '\u2193';
  await expect(page.getByText(arrow)).toBeVisible();
}

/**
 * Get the locator for the popup (MiniPresenter) page.
 * MiniPresenter opens via window.open() through PopoutPortal.
 */
export function getPopupLocator(page: Page): Locator {
  return page.locator('[style*="z-index"]');
}
