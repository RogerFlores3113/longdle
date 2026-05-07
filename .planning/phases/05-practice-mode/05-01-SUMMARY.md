---
phase: 05-practice-mode
plan: 01
subsystem: shared-infrastructure
tags: [game-core, context, keyboard, refactor]
dependency_graph:
  requires: []
  provides:
    - src/lib/gameCore.ts
    - src/contexts/GameContext.ts
    - src/hooks/useKeyboardListener.ts (generalized)
  affects:
    - src/hooks/usePracticeGame.ts (plan 02 — imports gameCore helpers)
    - src/components/Board.tsx (plan 03 — switches to useGameContext)
    - src/components/Keyboard.tsx (plan 03 — switches to useGameContext)
    - src/App.tsx (plan 03 — provides GameContext, passes onKey to useKeyboardListener)
tech_stack:
  added: []
  patterns:
    - timer-ref ownership: each store passes its own timerRef into showToast/triggerShake
    - store-agnostic context: GameContext decouples UI components from specific Zustand stores
    - parameterized keyboard hook: useKeyboardListener accepts onKey instead of hard-wiring
key_files:
  created:
    - src/lib/gameCore.ts
    - src/contexts/GameContext.ts
  modified:
    - src/hooks/useKeyboardListener.ts
decisions:
  - "Timer refs passed as parameters (not module-scoped) so daily and practice stores maintain independent timer state"
  - "GameContext uses null sentinel + throw pattern so missing Provider is caught immediately at runtime"
  - "useKeyboardListener dependency array includes [onKey] to correctly re-register on callback identity change"
metrics:
  duration_minutes: 8
  tasks_completed: 3
  tasks_total: 3
  files_modified: 3
  completed_date: "2026-05-07"
---

# Phase 5 Plan 01: Shared Infrastructure Summary

Three new shared infrastructure pieces that both daily and practice game paths depend on: `gameCore.ts` pure helpers, `GameContext.ts` store-agnostic React context, and a generalized `useKeyboardListener` that accepts any `onKey` callback.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Create src/lib/gameCore.ts | f2e8176 | src/lib/gameCore.ts (new) |
| 2 | Create src/contexts/GameContext.ts | 1b8511d | src/contexts/GameContext.ts (new) |
| 3 | Generalize useKeyboardListener | 9274e85 | src/hooks/useKeyboardListener.ts (modified) |

## What Was Built

**gameCore.ts** — Three extracted pure helpers:
- `upgradeKeyStatus(prev, next)` — promotes key color using KEY_RANK (correct>present>absent), never downgrades
- `showToast(msg, set, timerRef, toastMs=1500)` — per-store timer ref pattern; prevents cross-store timer collisions
- `triggerShake(set, get, timerRef, shakeMs=350)` — increments rowShakeKey to trigger CSS shake animation

**GameContext.ts** — Store-agnostic React context with full `GameContextValue` interface (8 fields: guesses, currentGuess, gameStatus, isAnimating, toastMessage, rowShakeKey, keyStatuses, onKey). `useGameContext()` throws if called outside a Provider.

**useKeyboardListener.ts** — Removed hard-wired `useGame` import. Now accepts `onKey: (key: string) => void` as its only parameter. `useEffect` dependency array updated to `[onKey]`.

## Deviations from Plan

None - plan executed exactly as written.

Note: The plan anticipated a TypeScript compile error in App.tsx after Task 3 (argument count mismatch). In practice, TypeScript compiled cleanly even with `useKeyboardListener()` called without arguments because `tsconfig.app.json` does not enable `strict` mode. All 104 tests continued to pass.

## Known Stubs

None — all three files are interface/infrastructure code with no UI rendering or placeholder values.

## Self-Check: PASSED

Files exist:
- src/lib/gameCore.ts — FOUND
- src/contexts/GameContext.ts — FOUND
- src/hooks/useKeyboardListener.ts — FOUND (modified)

Commits exist:
- f2e8176 — feat(05-01): create gameCore.ts — FOUND
- 1b8511d — feat(05-01): create GameContext.ts — FOUND
- 9274e85 — feat(05-01): generalize useKeyboardListener — FOUND

Test suite: 104/104 passed
