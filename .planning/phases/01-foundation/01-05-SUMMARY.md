---
phase: 01-foundation
plan: "05"
subsystem: ui
tags: [react, zustand, tailwind, css-custom-properties, typescript]

# Dependency graph
requires:
  - phase: 01-04
    provides: useGame store (guesses, currentGuess, gameStatus, keyStatuses, toastMessage, rowShakeKey, onKey, getAnswer), useSettings store, useKeyboardListener hook
provides:
  - "Fully playable Phase 1 game shell: Board (7×6 grid), Row, Tile, Keyboard (QWERTY + ENTER + ⌫), Key, Toast, EndGameBanner"
  - "src/styles/tiles.css with full CSS class contract (tile/row/key/toast) and 8 CSS custom properties for Phase 3 theming"
  - "App.tsx wired with useKeyboardListener + all game components rendered"
  - "Phase 1 complete — game playable end-to-end in dev"
affects: [02-features, 03-polish, theme-01, theme-02, theme-03]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "CSS class contract: tile/tile--empty/tile--active/tile--correct/tile--present/tile--absent, row/row--shake/row--win, key/key--correct/key--present/key--absent, toast — load-bearing for Phase 3 animation hooks"
    - "CSS custom properties: all colors declared in :root on tiles.css; Phase 3 reskins via :root overrides only"
    - "Board reads rowShakeKey from store, tracks delta in useRef, drives transient shaking state for 350ms"
    - "Single input seam: both physical keyboard (useKeyboardListener) and on-screen Key clicks call useGame.onKey"

key-files:
  created:
    - src/components/Tile.tsx
    - src/components/Row.tsx
    - src/components/Board.tsx
    - src/components/Key.tsx
    - src/components/Keyboard.tsx
    - src/components/Toast.tsx
    - src/components/EndGameBanner.tsx
    - src/styles/tiles.css
  modified:
    - src/App.tsx
    - src/index.css

key-decisions:
  - "Shake transient flag driven by rowShakeKey delta (useRef tracks last value, useEffect flips shaking bool for 350ms) — Board owns the animation timing, store owns the increment"
  - "EndGameBanner reads getAnswer() at render time (not stored) — consistent with anti-pattern avoidance from 01-04"
  - "CSS classes plumbed but animations inert in Phase 1 (row--shake, row--win, tile--active pop-in) — Phase 3 adds @keyframes CSS only, no React changes needed"

patterns-established:
  - "Phase 3 theming contract: override :root custom properties in tiles.css only — component code stays untouched"
  - "Class names are stable: tile--correct, row--shake, etc. are permanent API surface for Phase 3 CSS"

requirements-completed: [GAME-01, GAME-02, GAME-03, GAME-04, DAILY-03, DAILY-04, DAILY-05]

# Metrics
duration: 8min
completed: 2026-05-05
---

# Phase 1, Plan 05: UI Shell Summary

**Fully playable Longdle game shell: 7×6 tile board, QWERTY on-screen keyboard, toast, end-game banner, and physical keyboard listener wired to Zustand store — Phase 1 closes**

## Performance

- **Duration:** 8 min
- **Started:** 2026-05-05T08:42:00Z
- **Completed:** 2026-05-05T08:50:00Z
- **Tasks:** 3 (Tasks 1 + 2 auto, Task 3 checkpoint auto-approved)
- **Files modified:** 10

## Accomplishments
- 7 React components built: Tile, Row, Board, Key, Keyboard, Toast, EndGameBanner
- Full CSS class contract delivered — all Phase 3 animation hooks plumbed as inert stubs
- App.tsx wired: useKeyboardListener + Board + Keyboard + Toast + EndGameBanner — game is playable end-to-end
- npm run build exits 0; npm test passes 45/45

## Task Commits

Each task was committed atomically:

1. **Task 1: Build all UI components and tile stylesheet** - `2762090` (feat)
2. **Task 2: Wire App.tsx** - `34ee52a` (feat)
3. **Task 3: Smoke test checkpoint** - auto-approved (no commit — checkpoint only)

## Files Created/Modified

- `src/components/Tile.tsx` — 56×56 tile; applies tile/tile--empty/tile--active/tile--correct/tile--present/tile--absent
- `src/components/Row.tsx` — 6-tile row; toggles row--shake (350ms transient) and row--win
- `src/components/Board.tsx` — 7-row grid; reads guesses/currentGuess/gameStatus/rowShakeKey from useGame
- `src/components/Key.tsx` — on-screen keyboard key; calls useGame.onKey on click; applies key--correct/present/absent
- `src/components/Keyboard.tsx` — three QWERTY rows: Q-P / A-L / ENTER+Z-M+⌫ (wide keys 64px)
- `src/components/Toast.tsx` — fixed-position toast; reads toastMessage from useGame
- `src/components/EndGameBanner.tsx` — "You got it!" on win; "The word was {ANSWER}" on loss
- `src/styles/tiles.css` — full CSS class contract + 8 CSS custom properties (--color-bg through --color-text-inverse)
- `src/App.tsx` — replaced stub; renders full game shell with useKeyboardListener
- `src/index.css` — added `@import "./styles/tiles.css"` after tailwindcss

## Decisions Made
- Shake transient state owned by Board (useRef + setTimeout 350ms) rather than stored in Zustand — transient UI animation state should not survive page reload; store only exposes rowShakeKey increment as trigger
- EndGameBanner calls getAnswer() at render time (not reading stored answer) — matches anti-pattern avoidance from 01-04
- CSS animations deferred entirely to Phase 3 — row--shake, row--win, tile--active pop-in are plumbed (classes toggle correctly) but @keyframes not yet defined

## Deviations from Plan

None — plan executed exactly as written. All code matched the plan's detailed step-by-step instructions.

## CSS Class Contract Delivered

| Class | Status |
|-------|--------|
| `tile` | delivered |
| `tile--empty` | delivered |
| `tile--active` | delivered |
| `tile--correct` | delivered |
| `tile--present` | delivered |
| `tile--absent` | delivered |
| `row` | delivered |
| `row--shake` | delivered (class plumbed, @keyframes deferred Phase 3) |
| `row--win` | delivered (class plumbed, @keyframes deferred Phase 3) |
| `key` | delivered |
| `key--correct` | delivered |
| `key--present` | delivered |
| `key--absent` | delivered |
| `toast` | delivered |

## CSS Custom Properties Declared

| Property | Value |
|----------|-------|
| `--color-bg` | `#ffffff` |
| `--color-surface` | `#f3f4f6` |
| `--color-correct` | `#6aaa64` |
| `--color-present` | `#c9b458` |
| `--color-absent` | `#787c7e` |
| `--color-border` | `#d3d6da` |
| `--color-text` | `#1a1a1b` |
| `--color-text-inverse` | `#ffffff` |

## Smoke Test Result

**⚡ Auto-approved checkpoint: automated checks passed**
- `npm run build` exits 0 (TypeScript + Vite, dist/ rebuilt)
- `npm test` passes 45/45 (all prior tests still green)
- Dev server responds at localhost with `<div id="root">` (HTTP 200)

## Phase 1 Closing Summary

**Phase 1 Foundation is complete.** All 13 requirements are addressable end-to-end:

| Requirement group | Coverage |
|-------------------|---------|
| GAME-01 (6×7 grid visible) | Board renders 7 rows × 6 tiles on load |
| GAME-02 (tile scoring on Enter) | scoreTiles() from Plan 02 wired via useGame |
| GAME-03 (key status coloring) | keyStatuses from useGame drive Key component |
| GAME-04 (physical keyboard input) | useKeyboardListener wired in App |
| DAILY-03 (win/loss + input block) | EndGameBanner + onKey guard in store |
| DAILY-04 (toast + shake) | Toast + row--shake class plumbed |
| DAILY-05 (refresh restores state) | Zustand persist middleware from Plan 04 |

**Deferrals confirmed:**
- CSS animations (flip, shake, bounce, pop-in) — Phase 3 THEME-02/03
- Dark green jungle theme — Phase 3 THEME-01
- Mobile responsive sizing — Phase 3 THEME-05
- EndGameModal (stats, share CTA) — Phase 2 SHARE/ONBOARD
- Settings modal — Phase 2 SETTINGS
- WinAnimation stub — Phase 2 V3-01

## Issues Encountered

None.

## Known Stubs

None — all data sources are wired. EndGameBanner reads live game state; Board reads live store. No hardcoded empty values flow to UI rendering.

## Threat Flags

None — Phase 1 is a static SPA with no network endpoints, no auth paths, and no trust boundary changes. All state is localStorage only.

## User Setup Required

None — no external service configuration required.

## Next Phase Readiness

Phase 2 (Features) can begin immediately:
- SHARE-01: share mechanic (emoji grid + clipboard)
- ONBOARD-01: HowToPlay modal
- SETTINGS-01: Settings modal (hard mode, colorblind mode)
- V3-01: WinAnimation no-op stub

The store interface (useGame, useSettings) and component tree (App → Board/Keyboard/Toast) are stable and ready for Phase 2 overlays.

## Self-Check: PASSED

All created files found on disk. All task commits verified in git log:
- `2762090` feat(01-05): build UI shell components and tile stylesheet — FOUND
- `34ee52a` feat(01-05): wire App.tsx — Header + Board + Keyboard + Toast + EndGameBanner — FOUND

---
*Phase: 01-foundation*
*Completed: 2026-05-05*
