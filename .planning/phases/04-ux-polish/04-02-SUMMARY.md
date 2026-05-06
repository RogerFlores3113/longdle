---
phase: 04-ux-polish
plan: "02"
subsystem: input-latency, timezone
tags: [mobile, onPointerDown, DST, timezone, LA-midnight, Intl]
dependency_graph:
  requires: []
  provides:
    - onPointerDown-key-handler
    - getDayIndex-LA-timezone
  affects:
    - src/components/Key.tsx
    - src/lib/wordSelection.ts
    - src/lib/wordSelection.test.ts
tech_stack:
  added: []
  patterns:
    - Intl.DateTimeFormat formatToParts for DST-aware timezone extraction
    - onPointerDown instead of onClick for zero-latency mobile input
key_files:
  modified:
    - src/components/Key.tsx
    - src/lib/wordSelection.ts
    - src/lib/wordSelection.test.ts
decisions:
  - "onPointerDown replaces onClick in Key.tsx — no deduplication guard needed per D-09"
  - "Intl.DateTimeFormat('en-US', {timeZone: 'America/Los_Angeles'}) + formatToParts replaces Date.UTC getUTC* approach for DST correctness"
  - "Plan's test case 2026-11-01T07:59:59Z had wrong expected value (was Nov 1 00:59 PDT, not Oct 31) — corrected to 2026-11-01T06:59:59Z (Oct 31 23:59 PDT)"
metrics:
  duration: "~8 min"
  completed_date: "2026-05-06"
  tasks_completed: 2
  files_modified: 3
---

# Phase 4 Plan 02: Mobile Tap Latency + LA Timezone Rollover Summary

onPointerDown on Key.tsx eliminates ~300ms mobile tap delay; getDayIndex() now uses Intl.DateTimeFormat with America/Los_Angeles for DST-correct daily rollover at LA midnight.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Replace onClick with onPointerDown in Key.tsx | ff9f420 | src/components/Key.tsx |
| 2 | Update getDayIndex() to LA timezone + update tests | 1c455d6 | src/lib/wordSelection.ts, src/lib/wordSelection.test.ts |
| TDD-RED | Failing LA timezone tests | 045013e | src/lib/wordSelection.test.ts |

## What Was Built

**Task 1 (POLISH-03):** Changed the `<button>` in Key.tsx from `onClick` to `onPointerDown`. This eliminates the ~300ms mobile tap delay caused by the browser's click-event disambiguation cycle. The change is a single-prop swap with no side effects — onPointerDown does not double-fire on mobile.

**Task 2 (DAILY-06):** Replaced `getDayIndex()`'s UTC-based date extraction (using `now.getUTCFullYear/Month/Date`) with `Intl.DateTimeFormat('en-US', {timeZone: 'America/Los_Angeles'}).formatToParts(now)`. This extracts the LA calendar date (year/month/day) and constructs a UTC midnight timestamp from those LA components, ensuring the daily word rolls over at Los Angeles midnight regardless of DST.

EPOCH constant (`2026-05-04T00:00:00Z`) is unchanged. `getDailyAnswer()` and `isValidGuess()` are unchanged.

## TDD Gate Compliance

- RED gate: commit `045013e` — `test(04-02)`: 4 LA-timezone tests fail against old UTC implementation
- GREEN gate: commit `1c455d6` — `feat(04-02)`: Intl-based implementation; all 16 wordSelection tests pass
- No REFACTOR needed

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Corrected DST boundary test timestamp**
- **Found during:** Task 2, GREEN phase
- **Issue:** The plan's test case `getDayIndex(new Date('2026-11-01T07:59:59Z')).toBe(180)` is incorrect. `2026-11-01T07:59:59Z` = `2026-11-01 00:59:59 AM PDT` (Nov 1 in LA, not Oct 31). The DST fall-back on Nov 1 happens at 2:00 AM, not midnight, so midnight Nov 1 PDT is `07:00:00Z`, not `08:00:00Z`.
- **Fix:** Changed test timestamp to `2026-11-01T06:59:59Z` which correctly maps to `2026-10-31 23:59:59 PDT` (Oct 31 in LA = day 180). Updated test description to reflect PDT context.
- **Files modified:** src/lib/wordSelection.test.ts
- **Commit:** 1c455d6

## Verification Results

```
Test Files  5 passed (5)
Tests  52 passed (52)
```

- `grep onPointerDown src/components/Key.tsx` → 1 match on button element
- `grep onClick src/components/Key.tsx` → 0 matches
- `grep America/Los_Angeles src/lib/wordSelection.ts` → 1 match (inside getDayIndex)
- `grep getUTCFullYear src/lib/wordSelection.ts` → 0 matches
- `grep formatToParts src/lib/wordSelection.ts` → 1 match

## Known Stubs

None.

## Threat Flags

None. No new network endpoints, auth paths, file access patterns, or schema changes introduced.

## Self-Check: PASSED

- src/components/Key.tsx: FOUND (modified, onPointerDown present)
- src/lib/wordSelection.ts: FOUND (modified, America/Los_Angeles present)
- src/lib/wordSelection.test.ts: FOUND (modified, 16 tests pass)
- Commit ff9f420: FOUND (Task 1 — Key.tsx onPointerDown)
- Commit 045013e: FOUND (TDD RED — failing tests)
- Commit 1c455d6: FOUND (Task 2 — Intl LA timezone implementation)
