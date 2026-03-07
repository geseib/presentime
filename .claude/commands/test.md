# /test — Presentime E2E Test Runner

Run, debug, and write Playwright E2E tests for the Presentime app.

## Usage

- `/test` — run the full suite (`npx playwright test`)
- `/test <name>` — run a specific spec (e.g., `/test mini-presenter`, `/test smoke`)
- `/test new <feature>` — write a new test file for a feature
- `/test debug <name>` — run a specific test headed with trace (`npx playwright test <name> --headed --trace on`)

## File Layout

```
playwright.config.ts          ← Chromium-only, single worker, dev server on :5174
e2e/
  fixtures/
    timer-fixture.ts           ← Custom test/expect with deterministic time control
  helpers/
    store-bridge.ts            ← tickTimer(), completeCurrentSection(), clearPersistedState()
    navigation.ts              ← navigateToPresenter(), startTimer(), setupLightningTalk()
    constants.ts               ← WARNING_COLORS, LIGHTNING_TALK sections, thresholds
    assertions.ts              ← expectArcColor(), expectOverlayPresent/Absent(), expectTrendArrow()
  tests/
    smoke.spec.ts              ← App loads, navigation flow, keyboard shortcuts
    full-run.spec.ts           ← Complete presentation run, PaceIndicator, rerun
    mini-presenter.spec.ts     ← Popup open/close, battery bar colors
    section-warnings.spec.ts   ← Hybrid caution/danger thresholds
    overlay.spec.ts            ← Warning flash on/off behavior
    on-pace.spec.ts            ← ON PACE text, no overlay, no recovery
    projection.spec.ts         ← "Finishing X over/early", projection colors
    recovery.spec.ts           ← "Save Xs/section", "Wrap up by" guidance
    trend-arrows.spec.ts       ← Worsening/improving trend indicators
```

## Generated Output (gitignored)

| Directory | Contents | View With |
|-----------|----------|-----------|
| `playwright-report/` | HTML report from last run | `npx playwright show-report` |
| `test-results/` | Failure screenshots + first-retry traces | `npx playwright show-trace test-results/.../trace.zip` |

## Deterministic Time Control

Tests never use real timers. The fixture sets `window.__PRESENTIME_TEST_MODE = true` which prevents `useCountdown`'s `setInterval` from running. All time is advanced explicitly:

```typescript
// Jump 16 seconds forward instantly
await tickTimer(page, 16);

// Skip to next section
await completeCurrentSection(page);

// Gradual ticks (required only for TrendTracker's Date.now() rolling window)
await tickTimerGradually(page, 10, 1); // 10s in 1s steps with 50ms real delays
```

**Why**: The app's countdown uses `setInterval` + `performance.now()` deltas. In tests, disabling the interval and calling `timerStore.tick(seconds)` directly gives instant, deterministic control. No flaky waits, no timing races.

## Key Testing Patterns

### Always import from the fixture, not `@playwright/test`

```typescript
import { test, expect } from '../fixtures/timer-fixture';
```

### Standard test setup

```typescript
test('my test', async ({ page }) => {
  await setupLightningTalk(page); // navigate + start timer
  await tickTimer(page, 20);     // advance time
  // ... assertions
});
```

### Popup window testing

React StrictMode double-invokes effects, so `window.open()` fires twice. Find the surviving popup:

```typescript
async function openPopup(page: Page, context: any): Promise<Page> {
  await page.keyboard.press('m');
  await page.waitForTimeout(500); // let StrictMode settle
  let popup: Page | undefined;
  await expect(async () => {
    const pages = context.pages();
    popup = pages.find((p: Page) => p !== page && !p.isClosed());
    expect(popup).toBeTruthy();
  }).toPass({ timeout: 5000 });
  return popup!;
}
```

### Color assertions

**ProgressArc** (main view): Check `stroke` attribute on progress circle:
```typescript
const sectionArc = page.locator('[class*="progressCircle"]').nth(1);
await expect(sectionArc).toHaveAttribute('stroke', WARNING_COLORS.ok);
```

**BatteryBar** (popup): Appends `59` hex alpha to colors. Browser converts to rgba:
```typescript
const bg = await fill.evaluate(el => (el as HTMLElement).style.backgroundColor);
expect(bg).toContain('255, 214, 0'); // caution color
```

### Warning overlay

```typescript
await expectOverlayPresent(page);  // z-index:100 element visible
await expectOverlayAbsent(page);   // handles motion exit animations leaving opacity:0 ghosts
```

## Section Warning Math Reference

Hybrid formula for per-section thresholds:
- `caution = clamp(duration * 0.25, floor=45s, cap=duration * 0.5)`
- `danger = clamp(duration * 0.10, floor=15s, cap=duration * 0.25)`

| Section | Duration | Caution At | Danger At |
|---------|----------|------------|-----------|
| Hook | 30s | 15s remaining | 7.5s remaining |
| Big Idea | 90s | 45s remaining | 15s remaining |
| Evidence | 120s | 45s remaining | 15s remaining |
| So What? | 60s | 45s remaining | 15s remaining |

## Writing New Tests

1. Create `e2e/tests/<feature>.spec.ts`
2. Import `{ test, expect }` from `'../fixtures/timer-fixture'`
3. Import helpers: `setupLightningTalk`, `tickTimer`, `completeCurrentSection`, etc.
4. Group with `test.describe('<Feature>', () => { ... })`
5. Advance time with `tickTimer()` — never `page.waitForTimeout()` for timer logic
6. Add reusable assertions to `e2e/helpers/assertions.ts`
7. Add constants to `e2e/helpers/constants.ts` when mirroring app values
8. Run the new test: `npx playwright test <name>`
9. Run full suite to check for regressions: `npx playwright test`

## Debugging Failed Tests

1. Check the HTML report: `npx playwright show-report`
2. Re-run headed with trace: `npx playwright test <name> --headed --trace on`
3. View trace: `npx playwright show-trace test-results/.../trace.zip`
4. Read the failing test + relevant source code before attempting fixes
