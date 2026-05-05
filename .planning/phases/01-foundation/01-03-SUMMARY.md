---
phase: 01-foundation
plan: 03
subsystem: game-engine
tags: [tdd, scoring, word-selection, hard-mode, storage, pure-functions]
dependency_graph:
  requires: [01-02]
  provides: [scoring.ts, wordSelection.ts, hardMode.ts, storage.ts]
  affects: [01-04-useGame]
tech_stack:
  added: []
  patterns:
    - Two-pass sentinel-consume scoring (duplicate-letter correctness)
    - Date.UTC() UTC-only day-index (timezone safety)
    - Modulo-wrap answer selection (WORDS-04 infinite daily cycling)
    - localStorage schema-versioned persistence with console.warn fallback
key_files:
  created:
    - src/lib/scoring.ts
    - src/lib/scoring.test.ts
    - src/lib/wordSelection.ts
    - src/lib/wordSelection.test.ts
    - src/lib/hardMode.ts
    - src/lib/hardMode.test.ts
    - src/lib/storage.ts
  modified: []
decisions:
  - Two-pass '#' sentinel correctly handles all duplicate-letter cases without complex bookkeeping
  - guessDistribution has 7 slots (indices 0-6) for wins in 1-7 guesses; losses tracked via gamesPlayed - gamesWon
  - validateHardModeGuess aggregates constraints across ALL prior guesses (not just last)
metrics:
  duration: 4 min
  completed: 2026-05-05
  tasks_completed: 3
  files_created: 7
---

# Phase 01 Plan 03: Pure-Function Libraries (TDD) Summary

Four pure-function libraries powering the Longdle game engine, built TDD-first for the two correctness-critical invariants (two-pass scoring and UTC day-index) before any React code is wired.

## Test Counts

| File | Tests | Status |
|------|-------|--------|
| src/lib/scoring.test.ts | 8 | All passing |
| src/lib/wordSelection.test.ts | 14 | All passing |
| src/lib/hardMode.test.ts | 6 | All passing |
| **Total** | **28** | **All passing** |

## TDD Gate Compliance

- RED gate (scoring): Import failure with no implementation — confirmed failing
- GREEN gate (scoring): 8/8 tests pass after two-pass implementation
- RED gate (wordSelection): Import failure with no implementation — confirmed failing
- GREEN gate (wordSelection): 14/14 tests pass after UTC-only implementation
- RED gate (hardMode): Import failure with no implementation — confirmed failing
- GREEN gate (hardMode): 6/6 tests pass after implementation

## Correctness Invariants Verified

**C-1: Two-pass tile scoring**
- `scoreTiles('little', 'bottle')` returns `['absent','absent','correct','correct','correct','correct']` — verified by test
- `scoreTiles('eeeeee', 'pelmet')` returns `['absent','correct','absent','absent','correct','absent']` — verified by test
- Two loops confirmed: `grep -c "for (let i = 0; i < 6; i++)" scoring.ts` returns 2
- Sentinel pattern confirmed: `'#'` used to consume matched slots

**C-2: UTC-only day-index**
- `getDayIndex(new Date('2026-05-04T00:00:00Z'))` returns 0 — verified by test
- `getDayIndex(new Date('2026-05-05T00:00:00Z'))` returns 1 — verified by test
- `Date.UTC()` exclusively; no `.getMonth()`, `.getDate()`, `.getFullYear()` local-time calls

## TypeScript Types Exported for Plan 04

- `TileStatus` from `scoring.ts` — consumed by hardMode.ts and will be consumed by useGame hook
- `Stats` interface from `storage.ts` — consumed by useGame store for stats state

## Deviations from Plan

None — plan executed exactly as written.

## Known Stubs

None — all four libraries are fully functional pure functions with no placeholder values.

## Self-Check

- [x] src/lib/scoring.ts exists and has two-pass algorithm
- [x] src/lib/scoring.test.ts has 8 tests
- [x] src/lib/wordSelection.ts uses Date.UTC() exclusively
- [x] src/lib/wordSelection.test.ts has 14 tests
- [x] src/lib/hardMode.ts exports validateHardModeGuess
- [x] src/lib/hardMode.test.ts has 6 tests
- [x] src/lib/storage.ts exports SCHEMA_VERSION=1, three exact localStorage keys
- [x] npm test exits 0 with all 28 tests passing

## Self-Check: PASSED
