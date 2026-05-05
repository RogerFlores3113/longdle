---
phase: 02-features
plan: 05
subsystem: ui
tags: [react, zustand, clipboard, ios-safari, modal]

requires:
  - phase: 02-01
    provides: generateShareText pure function in src/lib/share.ts
  - phase: 02-03
    provides: Modal wrapper component with Escape/backdrop close
  - phase: 02-04
    provides: WinAnimation stub component, share-btn CSS class in tiles.css

provides:
  - EndGameModal component with win/loss headlines and iOS-safe synchronous share handler
  - CSS classes: endgame-modal__result, endgame-modal__actions, see-stats-btn
  - WinAnimation slot in EndGame modal (renders null in Phase 2, v3 interface ready)

affects: [02-07-app-wiring, phase-3-theme]

tech-stack:
  added: []
  patterns:
    - "Synchronous clipboard write: no async/await before navigator.clipboard.writeText() per iOS Safari rule"
    - "useGame.getState() / useSettings.getState() for synchronous store access in event handlers"
    - "Callback props (onShareSuccess, onCopyFallback) for App.tsx-owned toast/fallback control"

key-files:
  created:
    - src/components/EndGameModal.tsx
  modified:
    - src/styles/tiles.css

key-decisions:
  - "Share handler uses synchronous generator + synchronous writeText call (no async/await) to satisfy iOS Safari gesture context requirement"
  - "onShareSuccess callback prop delegates toast display to App.tsx instead of EndGameModal owning toast state"
  - "useGame.getState() used in share handler (not hooks) for synchronous access during click event"
  - "WinAnimation slot only rendered when won === true (D-21)"

patterns-established:
  - "iOS Safari clipboard pattern: generate text sync, call writeText sync, handle result with .then()/.catch()"
  - "getState() over hooks for synchronous event-handler store reads"

requirements-completed:
  - SHARE-01
  - SHARE-02
  - V3-01

duration: 8min
completed: 2026-05-05
---

# Phase 02 Plan 05: EndGame Modal Summary

**EndGameModal with synchronous iOS-safe clipboard share, win/loss headlines, WinAnimation v3 slot, and callback-driven toast/fallback pattern**

## Performance

- **Duration:** 8 min
- **Started:** 2026-05-05T00:00:00Z
- **Completed:** 2026-05-05T00:08:00Z
- **Tasks:** 1
- **Files modified:** 2

## Accomplishments

- EndGameModal renders "Brilliant!" on win and "The word was ANSWER" on loss — replacing EndGameBanner inline div
- Share button handler has zero async/await keywords — iOS Safari gesture context preserved
- WinAnimation slot present and conditionally rendered on won (renders null in Phase 2, v3-ready interface)
- CSS classes endgame-modal__result, endgame-modal__actions, see-stats-btn added to tiles.css
- TypeScript clean (tsc --noEmit exits 0)

## Task Commits

1. **Task 1: Create EndGameModal with synchronous share and See Stats navigation** - `0aa0c6d` (feat)

## Files Created/Modified

- `src/components/EndGameModal.tsx` - EndGame modal with win/loss result, WinAnimation slot, Share and See Stats buttons; synchronous clipboard write handler
- `src/styles/tiles.css` - Added endgame-modal__result, endgame-modal__actions, see-stats-btn CSS classes

## Decisions Made

- Used `.then(() => onShareSuccess())` after writeText — safe per iOS Safari constraint because `.then()` fires AFTER writeText is called; the synchronous constraint is "no await BEFORE writeText", not "no .then() AFTER"
- onShareSuccess callback prop passed from App.tsx rather than local React state for toast — keeps EndGameModal decoupled from toast mechanism
- useGame.getState() and useSettings.getState() used inside click handler for synchronous store reads (hooks are for render, not events)

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- EndGameModal ready for App.tsx wiring (plan 02-07)
- App.tsx will connect: onClose, onShowStats, onCopyFallback, onShareSuccess props
- App.tsx opens EndGameModal when gameStatus transitions from 'playing' to 'won' or 'lost' (D-03)
- Share success path: App.tsx calls showToast('Copied to clipboard!') via existing toast mechanism
- Share fallback path: App.tsx opens a copy-fallback modal showing text for manual copy

## Self-Check

- [x] `src/components/EndGameModal.tsx` exists
- [x] `src/styles/tiles.css` endgame-modal__result class present
- [x] Commit `0aa0c6d` exists (verified via git log)
- [x] No async/await in functional code (comment-only mentions)
- [x] TypeScript clean

## Self-Check: PASSED

---
*Phase: 02-features*
*Completed: 2026-05-05*
