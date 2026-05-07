---
phase: 05-practice-mode
plan: 02
subsystem: practice-game-store
tags: [zustand, practice, game-state, no-persist]
dependency_graph:
  requires:
    - src/lib/gameCore.ts (plan 01 — upgradeKeyStatus, showToast, triggerShake)
    - src/contexts/GameContext.ts (plan 01 — GameContextValue interface)
    - src/hooks/useGame.ts (useSettings export)
    - src/lib/scoring.ts (scoreTiles)
    - src/lib/hardMode.ts (validateHardModeGuess)
    - src/data/words.ts (ANSWERS, VALID_WORDS)
  provides:
    - src/hooks/usePracticeGame.ts
  affects:
    - src/components/PracticeGame.tsx (plan 04 — imports usePracticeGame)
    - src/App.tsx (plan 03 — provides GameContext with usePracticeGame on /random route)
tech_stack:
  added: []
  patterns:
    - no-persist store: create<PracticeGameState>()((set, get) => ...) with no middleware
    - per-store timer refs: practiceToastTimerRef/practiceShakeTimerRef/practiceFlipTimer separate from daily store timers
    - answer-in-state: s.answer replaces getDailyAnswer(s.dayIndex) in the Enter handler
key_files:
  created:
    - src/hooks/usePracticeGame.ts
  modified: []
decisions:
  - "No persist() middleware — practice game state must never write to localStorage (PRACTICE-03)"
  - "Timer refs named with 'practice' prefix to prevent HMR cross-store interference (Pitfall 4)"
  - "recordGameEnd omitted from flipTimer callback — stats isolation is an explicit design constraint"
  - "FLIP_DURATION_MS suppressed via void to avoid unused-variable lint error (it contributes to FLIP_TOTAL_MS)"
metrics:
  duration_minutes: 6
  tasks_completed: 1
  tasks_total: 1
  files_modified: 1
  completed_date: "2026-05-07"
---

# Phase 5 Plan 02: usePracticeGame Store Summary

In-memory Zustand store for the practice (/random) game route — mirrors the daily useGame onKey logic but is fully isolated from localStorage (no persist middleware) and never calls recordGameEnd, so practice sessions never affect stats.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Create src/hooks/usePracticeGame.ts | 7574364 | src/hooks/usePracticeGame.ts (new) |

## What Was Built

**usePracticeGame.ts** — Zustand store providing:
- `PracticeGameState` interface: answer, guesses, currentGuess, gameStatus, isAnimating, toastMessage, rowShakeKey, keyStatuses, onKey, resetPractice
- `pickRandom()` module-level helper selects a word from ANSWERS at store init and on every reset
- `onKey` handler: identical flow to useGame (Backspace, Enter with validation, letter input) but reads `s.answer` instead of `getDailyAnswer(s.dayIndex)`, and the flipTimer callback explicitly omits `recordGameEnd`
- `resetPractice()` action: resets all board state and picks a new random word via `pickRandom()`
- HMR disposal block clears all three practiceFlipTimer / practiceToastTimerRef / practiceShakeTimerRef

## Deviations from Plan

None - plan executed exactly as written.

Note: The plan's verification checks flagged "1 match" for `recordGameEnd` and `getDailyAnswer` patterns — both were in documentation comments (not imports or calls), which is correct behavior. The comment on the flipTimer callback explicitly documents the intentional omission.

## Known Stubs

None — this file is pure game logic with no UI rendering or placeholder values.

## Threat Surface Scan

No new network endpoints, auth paths, file access patterns, or schema changes introduced.

T-05-03 (Information Disclosure — localStorage): Mitigated — no `persist()` wrapper means nothing from this store is ever written to localStorage.

T-05-04 (Tampering — recordGameEnd isolation): Mitigated — `recordGameEnd` is not imported; the flipTimer callback comment documents the intentional omission.

## Self-Check: PASSED

Files exist:
- src/hooks/usePracticeGame.ts — FOUND

Commits exist:
- 7574364 — feat(05-02): create usePracticeGame.ts — FOUND

Test suite: 52/52 passed
