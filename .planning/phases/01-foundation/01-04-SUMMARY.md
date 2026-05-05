---
phase: 01-foundation
plan: "04"
subsystem: ui
tags: [zustand, react, typescript, localStorage, persist, keyboard]

# Dependency graph
requires:
  - phase: 01-03
    provides: scoring.ts, wordSelection.ts, hardMode.ts, storage.ts pure libs
provides:
  - src/types/game.ts — GameStatus, KeyStatus, ScoredGuess, TileStatus re-export
  - src/hooks/useGame.ts — useGame Zustand store + useSettings store with persist middleware
  - src/hooks/useKeyboardListener.ts — physical keyboard wired to store.onKey
affects: [01-05, 02-share, 02-settings, 02-modals]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Single seam: all input (keyboard + on-screen) flows through useGame.onKey"
    - "Zustand partialize: transient fields excluded from localStorage persistence"
    - "onRehydrateStorage: stale dayIndex triggers resetForNewDay on app load"
    - "upgradeKeyStatus: correct > present > absent, never downgrades (GAME-03)"
    - "Module-scoped timers (toastTimer, shakeTimer) for toast auto-dismiss + shake reset"

key-files:
  created:
    - src/types/game.ts
    - src/hooks/useGame.ts
    - src/hooks/useGame.test.ts
    - src/hooks/useKeyboardListener.ts
  modified: []

key-decisions:
  - "01-04: answer NOT persisted — getDailyAnswer(dayIndex) recomputed on every access (anti-pattern avoidance)"
  - "01-04: partialize excludes toastMessage, isAnimating, rowShakeKey (transient, must not survive reload)"
  - "01-04: useSettings.getState() read inside onKey — avoids cross-store subscription and re-binding listeners"
  - "01-04: MAX_GUESSES=7 — 6 colored guesses plus 1 safety, consistent with game design"

patterns-established:
  - "Pattern: All input mutations flow through useGame.onKey — never set state directly from components"
  - "Pattern: Physical keyboard handler reads useGame.getState() — stable reference, no re-binding on state changes"

requirements-completed: [GAME-03, GAME-04, DAILY-03, DAILY-04, DAILY-05]

# Metrics
duration: 2min
completed: 2026-05-05
---

# Phase 01 Plan 04: Zustand Game Store Summary

**Zustand useGame + useSettings stores with persist middleware, localStorage namespacing, stale-day rehydration, and physical keyboard wiring via useKeyboardListener**

## Performance

- **Duration:** 2 min
- **Started:** 2026-05-05T15:39:36Z
- **Completed:** 2026-05-05T15:41:40Z
- **Tasks:** 2
- **Files modified:** 4 created

## Accomplishments

- useGame Zustand store with persist middleware: game-state persisted to `longdle-game-state`, partialize excludes transient fields (toastMessage, isAnimating, rowShakeKey), answer never persisted — recomputed via getDailyAnswer(dayIndex)
- onKey input pipeline: guard (isAnimating || gameStatus !== 'playing'), letter append, Backspace/Delete, Enter validation (length, VALID_WORDS, hard mode), scoring, keyStatus upgrades, game-end detection with recordGameEnd() call
- useSettings store: hardMode + colorblindMode with toggle actions, persisted to `longdle-settings`
- Both stores: SCHEMA_VERSION, migrate() returns undefined on mismatch, onRehydrateStorage triggers resetForNewDay() on stale dayIndex
- useKeyboardListener: document keydown handler → onKey, browser shortcuts pass through, cleanup on unmount
- 17 new integration tests; 45 total tests passing; build exits 0

## Store Shapes

### useGame (persisted fields)
| Field | Type | Persisted |
|-------|------|-----------|
| version | number | yes |
| dayIndex | number | yes |
| guesses | ScoredGuess[] | yes |
| currentGuess | string | yes |
| gameStatus | GameStatus | yes |
| keyStatuses | Record<string, KeyStatus> | yes |
| toastMessage | string \| null | **no** (transient) |
| isAnimating | boolean | **no** (transient) |
| rowShakeKey | number | **no** (transient) |
| answer | — | **never** (recomputed) |

### useSettings (persisted fields)
| Field | Type | Persisted |
|-------|------|-----------|
| version | number | yes |
| hardMode | boolean | yes |
| colorblindMode | boolean | yes |

## Task Commits

1. **Task 1: useGame + useSettings stores (TDD)** - `8afe349` (feat)
2. **Task 2: useKeyboardListener hook** - `60ded4c` (feat)

## Files Created/Modified

- `src/types/game.ts` — GameStatus, KeyStatus, ScoredGuess, re-exports TileStatus
- `src/hooks/useGame.ts` — useGame store (game-state) and useSettings store (settings)
- `src/hooks/useGame.test.ts` — 17 integration tests for onKey pipeline and settings
- `src/hooks/useKeyboardListener.ts` — physical keyboard → store.onKey wiring

## Decisions Made

- `answer` is NOT in the store and NOT persisted — getDailyAnswer(dayIndex) is called on each access (getAnswer selector). This prevents the answer from being trivially visible in DevTools localStorage and avoids stale answer after midnight.
- partialize excludes toastMessage, isAnimating, rowShakeKey: these are transient UI states that should reset on reload, not survive a page refresh.
- MAX_GUESSES = 7: allows 6 scoring rows + 1 "final" guess, giving 7 total attempts.
- useSettings.getState() called directly inside onKey (not subscribed via hook): avoids re-binding the listener when settings change, maintaining the single-seam architecture.

## Deviations from Plan

None — plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None — no external service configuration required.

## Next Phase Readiness

- Plan 05 (static UI shell) can import useGame and useSettings directly
- useKeyboardListener is ready to call from App.tsx with a single `useKeyboardListener()` call
- All store actions are documented and tested; Plan 05 has a clear contract for consuming the store

## Self-Check

- [x] src/types/game.ts — exists
- [x] src/hooks/useGame.ts — exists
- [x] src/hooks/useGame.test.ts — exists (17 tests)
- [x] src/hooks/useKeyboardListener.ts — exists
- [x] Commits 8afe349 and 60ded4c — verified
- [x] npm run build — exits 0
- [x] npm test — 45 tests pass

## Self-Check: PASSED

---
*Phase: 01-foundation*
*Completed: 2026-05-05*
