# Presentime

Presentation timer app with pace tracking, section warnings, and a popout mini presenter.

## Tech Stack

- **Framework**: React 19 + TypeScript + Vite (port 5174)
- **State**: Zustand (persisted to localStorage)
- **Animation**: motion/react (Framer Motion)
- **Drag & Drop**: @dnd-kit
- **Testing**: Playwright E2E (deterministic time control)

## Architecture

### Views (3-screen flow)

```
Manager → Editor → Presenter
```

- **Manager** (`PresentationManager.tsx`) — template gallery, click card to edit
- **Editor** (`EditorView.tsx`) — section names/durations, drag-to-reorder, "Present" button
- **Presenter** (`PresenterView.tsx`) — full-screen timer with arc visualizations, pace tracking, popout mini mode

### Stores (`src/store/`)

| Store | Key State | Persistence |
|-------|-----------|-------------|
| `presentationStore` | presentations, activePresentationId, view routing | localStorage via `presentime-presentations` key |
| `timerStore` | status, sections[], totalElapsedSec, activeSectionIndex | in-memory only |
| `themeStore` | theme name | in-memory only |

### Timer System

- **`useCountdown` hook** — `setInterval(100ms)` loop calling `timerStore.tick(deltaSec)` with `performance.now()` deltas
- **`__PRESENTIME_TEST_MODE`** flag disables the interval for deterministic test control
- Timer keeps running when main window is backgrounded (popup focused)

### Key Hooks (`src/hooks/`)

| Hook | Purpose |
|------|---------|
| `useCountdown` | Drives timer ticks via setInterval |
| `usePaceEngine` | Calculates pace deficit, projected finish, recovery guidance |
| `useWarningState` | Overall timer warning level (ok/caution/danger/overtime) |
| `useSectionWarning` | Per-section warning with hybrid thresholds |
| `useWakeLock` | Screen Wake Lock API during presentations |
| `useResponsiveSize` | Responsive arc sizing |

### Warning Thresholds

**Overall**: caution at 3% deficit, danger at 10% deficit (fraction of total duration)

**Per-section** (hybrid formula):
- `caution = clamp(duration * 0.25, floor=45s, cap=duration * 0.5)`
- `danger = clamp(duration * 0.10, floor=15s, cap=duration * 0.25)`

### Popout Mini Presenter

- `PopoutPortal.tsx` — `window.open()` + `createPortal()` to render React into popup
- `MiniPresenter.tsx` — battery bar UI with section/total timers
- `BatteryBar.tsx` — stateless fill bar, `key={activeSectionIndex}` forces remount on section change for instant snap
- Keyboard events forwarded from popup → main window via `dispatchEvent`

### Keyboard Shortcuts

| Key | Action |
|-----|--------|
| Space | Start / Pause / Resume |
| ArrowRight | Complete current section |
| M | Toggle popout mini presenter |
| Escape | Close popup / sidebar / exit presenter |

## Conventions

- CSS Modules for component styles (`.module.css`)
- Theme system via CSS custom properties and `data-theme` attribute
- Warning colors defined in `src/utils/constants.ts`: ok=#00E676, caution=#FFD600, danger=#FF1744
- System presentations in `src/data/systemPresentations.ts` (copied on first edit)
- Stores exposed on `window.__timerStore` / `window.__presentationStore` in dev mode for testing

## Commands

- `npm run dev` — start dev server on :5174
- `npm run build` — type-check + production build
- `npm run lint` — ESLint
- `/test` — run Playwright E2E suite (see `.claude/commands/test.md`)

## Generated Artifacts (gitignored)

| Directory | Purpose |
|-----------|---------|
| `playwright-report/` | HTML test report (`npx playwright show-report`) |
| `test-results/` | Failure screenshots and traces |
| `.playwright-mcp/` | Browser console logs from MCP Playwright sessions |
