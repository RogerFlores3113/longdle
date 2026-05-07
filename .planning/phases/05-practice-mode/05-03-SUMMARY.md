---
phase: 05-practice-mode
plan: 03
subsystem: ui-context-wiring
tags: [context, refactor, daily-game, store-agnostic]
dependency_graph:
  requires:
    - src/contexts/GameContext.ts (plan 01)
    - src/hooks/useKeyboardListener.ts generalized (plan 01)
  provides:
    - src/components/Board.tsx (context-aware)
    - src/components/Keyboard.tsx (context-aware)
    - src/components/Key.tsx (context-aware)
    - src/components/Toast.tsx (context-aware)
    - src/App.tsx (GameContext.Provider + fixed useKeyboardListener call)
  affects:
    - src/components/PracticeGame.tsx (plan 04 — will provide same context shape)
tech_stack:
  added: []
  patterns:
    - store-agnostic UI: all four UI components read from GameContext, not a specific Zustand store
    - provider at app root: App.tsx owns the daily context value; PracticeGame.tsx will own the practice one
    - stable action ref: useGame.getState().onKey passed to useKeyboardListener (not reactive, stable across renders)
key_files:
  created: []
  modified:
    - src/components/Board.tsx
    - src/components/Keyboard.tsx
    - src/components/Key.tsx
    - src/components/Toast.tsx
    - src/App.tsx
decisions:
  - "GameContext.Provider wraps only main+Toast — modals read from useGame directly and do not need context"
  - "useGame.getState().onKey used for keyboard listener (stable Zustand action, not a reactive selector)"
  - "gameContextValue built from individual useGame selectors so each field re-renders independently"
metrics:
  duration_minutes: 6
  tasks_completed: 2
  tasks_total: 2
  files_modified: 5
  completed_date: "2026-05-07"
---

# Phase 5 Plan 03: UI Component Context Wiring Summary

Board, Keyboard, Key, and Toast refactored to read from GameContext instead of useGame directly, and App.tsx updated to provide the GameContext with daily game values — making all four components store-agnostic and ready for PracticeGame.tsx to reuse in plan 04.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Refactor Board, Keyboard, Key, Toast to use GameContext | 714e45c | Board.tsx, Keyboard.tsx, Key.tsx, Toast.tsx |
| 2 | Update App.tsx — add GameContext.Provider and fix useKeyboardListener call | 0e48ede | App.tsx |

## What Was Built

**Board.tsx** — Replaced 5 individual `useGame((s) => s.*)` selector calls with a single `useGameContext()` destructure.

**Keyboard.tsx** — Replaced `useGame((s) => s.keyStatuses)` with `const { keyStatuses } = useGameContext()`.

**Key.tsx** — Replaced `useGame((s) => s.onKey)` with `const { onKey } = useGameContext()`. Button handler unchanged.

**Toast.tsx** — Replaced `useGame((s) => s.toastMessage)` with `const { toastMessage: message } = useGameContext()`. Alias preserves existing `message` variable name throughout the component.

**App.tsx** — Added 6 new `useGame` selectors (guesses, currentGuess, toastMessage, rowShakeKey, keyStatuses, onKey), assembled `gameContextValue: GameContextValue`, wrapped `<main>` and `<Toast />` with `<GameContext.Provider value={gameContextValue}>`, and fixed `useKeyboardListener()` to `useKeyboardListener(useGame.getState().onKey)`.

## Deviations from Plan

None - plan executed exactly as written.

## Known Stubs

None — this is a pure refactor. No data sources changed; all values flow from the same Zustand store as before.

## Threat Flags

None — no new network endpoints, auth paths, file access patterns, or schema changes introduced. Context value is derived directly from the existing Zustand store.

## Self-Check: PASSED

Files exist:
- src/components/Board.tsx — FOUND (useGameContext)
- src/components/Keyboard.tsx — FOUND (useGameContext)
- src/components/Key.tsx — FOUND (useGameContext)
- src/components/Toast.tsx — FOUND (useGameContext)
- src/App.tsx — FOUND (GameContext.Provider)

Commits exist:
- 714e45c — refactor(05-03): switch Board, Keyboard, Key, Toast to useGameContext — FOUND
- 0e48ede — feat(05-03): add GameContext.Provider to App.tsx and fix useKeyboardListener call — FOUND

Verification:
- No useGame imports in 4 components: PASSED
- All 4 components have useGameContext: PASSED
- GameContext.Provider count in App.tsx: 2 (open + close tags) — PASSED
- useKeyboardListener receives useGame.getState().onKey: PASSED
- TypeScript: 0 errors — PASSED
- Tests: 52/52 passed — PASSED
