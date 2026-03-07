import { test, expect } from '../fixtures/timer-fixture';
import { setupLightningTalk, navigateToPresenter, startTimer } from '../helpers/navigation';
import { tickTimer, completeCurrentSection } from '../helpers/store-bridge';
import { LIGHTNING_TALK } from '../helpers/constants';

test.describe('Full Presentation Run', () => {
  test('all sections complete → Presentation Complete', async ({ page }) => {
    await setupLightningTalk(page);

    for (let i = 0; i < LIGHTNING_TALK.sections.length; i++) {
      const section = LIGHTNING_TALK.sections[i];

      // Verify section name and info are visible
      await expect(page.getByText(section.name).first()).toBeVisible();
      await expect(page.getByText(`Section ${i + 1} of ${LIGHTNING_TALK.sections.length}`)).toBeVisible();

      // Tick the section duration
      await tickTimer(page, section.duration);

      // Complete the section
      if (i < LIGHTNING_TALK.sections.length - 1) {
        await completeCurrentSection(page);
      } else {
        // Last section — complete triggers 'finished' status
        await completeCurrentSection(page);
      }
    }

    // Should show completion screen
    await expect(page.getByText('Presentation Complete')).toBeVisible();
    await expect(page.getByRole('button', { name: '↻ Rerun' })).toBeVisible();
  });

  test('PaceIndicator visibility across states', async ({ page }) => {
    await navigateToPresenter(page, 'Lightning Talk');

    // Idle: PaceIndicator not visible (returns null)
    await expect(page.getByText('ON PACE')).not.toBeVisible();

    // Running: visible
    await startTimer(page);
    await tickTimer(page, 5);
    await expect(page.getByText('ON PACE')).toBeVisible();

    // Complete all sections to finish
    for (const section of LIGHTNING_TALK.sections) {
      await tickTimer(page, section.duration);
      await completeCurrentSection(page);
    }

    // Finished: PaceIndicator hidden, completion screen shown
    await expect(page.getByText('Presentation Complete')).toBeVisible();
    await expect(page.getByText('ON PACE')).not.toBeVisible();
  });

  test('Rerun returns to idle state', async ({ page }) => {
    await setupLightningTalk(page);

    // Quick-complete all sections
    for (const section of LIGHTNING_TALK.sections) {
      await tickTimer(page, section.duration);
      await completeCurrentSection(page);
    }

    await expect(page.getByText('Presentation Complete')).toBeVisible();

    // Click Rerun
    await page.getByRole('button', { name: '↻ Rerun' }).click();

    // Should be back to idle with Start button
    await expect(page.getByRole('button', { name: '▶ Start' })).toBeVisible();
  });
});
