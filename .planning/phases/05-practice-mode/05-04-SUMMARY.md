---
phase: 05-practice-mode
plan: 04
subsystem: practice-game-route
tags: [routing, practice, components, modal, banner]
dependency_graph:
  requires:
    - src/hooks/usePracticeGame.ts (plan 02 — practice store)
    - src/contexts/GameContext.ts (plan 01 — GameContextValue)
    - src/hooks/useGame.ts (useSettings export)
    - src/hooks/useKeyboardListener.ts (plan 01 — generalized)
    - src/components/Board.tsx (plan 03 — GameContext wired)
    - src/components/Keyboard.tsx (plan 03 — GameContext wired)
    - src/components/Toast.tsx (plan 03 — GameContext wired)
    - src/components/Modal.tsx
    - src/components/WinAnimation.tsx
  provides:
    - src/components/PracticeGame.tsx
    - src/components/PracticeBanner.tsx
    - src/components/PracticeEndGameModal.tsx
    - src/main.tsx (routing)
  affects:
    - src/styles/tiles.css (banner CSS added)
tech_stack:
  added: []
  patterns:
    - pathname-routing: window.location.pathname check in main.tsx (no React Router)
    - context-provider-per-route: each route provides its own GameContext.Provider
    - store-isolation: usePracticeGame (no persist) vs useGame (persist)
key_files:
  created:
    - src/components/PracticeGame.tsx
    - src/components/PracticeBanner.tsx
    - src/components/PracticeEndGameModal.tsx
  modified:
    - src/main.tsx
    - src/styles/tiles.css
    - src/hooks/usePracticeGame.ts (removed unused TileStatus import)
decisions:
  - "Reuse .share-btn CSS class for Play Again button — inherits existing button style (D-13 note)"
  - "PracticeBanner uses &rarr; HTML entity instead of → Unicode for JSX compatibility"
  - "Recovery commit prefixed chore(05) to restore plan 02-03 artifacts dropped during merge"
metrics:
  duration_minutes: 15
  tasks_completed: 2
  tasks_total: 2
  files_modified: 6
  completed_date: "2026-05-07"
---

# Phase 5 Plan 04: Practice Route Assembly Summary

Assembled the complete /random practice mode: PracticeGame root component, PracticeBanner, PracticeEndGameModal, and pathname-based routing in main.tsx. Visiting /random delivers a fully isolated, playable practice game.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Create PracticeBanner, PracticeEndGameModal, PracticeGame | e7c6bab | src/components/PracticeBanner.tsx, src/components/PracticeEndGameModal.tsx, src/components/PracticeGame.tsx, src/styles/tiles.css |
| 2 | Update main.tsx with pathname-based routing | 949a166 | src/main.tsx, src/hooks/usePracticeGame.ts |

## What Was Built

**PracticeBanner.tsx** — Full-width bar rendered between the app header and the board. Displays "Practice Mode" text and an anchor link "→ Play today's puzzle" pointing to /. Uses CSS custom property tokens (var(--color-surface), var(--color-text), var(--color-border)) — no hardcoded hex values.

**PracticeEndGameModal.tsx** — Trimmed EndGameModal with only a "Play Again" button. Props: onClose, answer, won, guessCount, onPlayAgain. No share button, no stats button (D-13, D-14). Keeps WinAnimation slot for v3 consistency (dayIndex=0 as neutral value). Reuses .share-btn CSS class for the action button styling.

**PracticeGame.tsx** — Root component for /random route. Mirrors App.tsx structure: useKeyboardListener wired to usePracticeGame.getState().onKey, all game state read via usePracticeGame selectors, GameContext.Provider wraps Board/Keyboard/Toast. Has SettingsModal (D-07: settings are shared). No stats modal, no how-to-play, no share handler, no CopyFallbackModal.

**main.tsx** — Single-line routing: `const isPractice = window.location.pathname === '/random'` conditionally renders PracticeGame or App. Two fully separate component trees — no shared state at root level (D-01, D-02).

**vercel.json** — Confirmed existing catch-all `"source": "/(.*)"` already covers /random (D-03). No changes needed.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Plan 02-03 artifacts absent from worktree**

- **Found during:** Pre-task setup — usePracticeGame.ts missing, Board/Key/Keyboard/Toast still on useGame, 05-03-SUMMARY.md missing
- **Issue:** The worktree branch (worktree-agent-ab1c3025adf9128dc) was based on old phase 3 commits; plans 02-03 worktree commits were never merged into main (they were in an unreachable dangling ref). Main HEAD (51b74d7) only had the App.tsx fix but not the component refactors or usePracticeGame.ts.
- **Fix:** Restored files from dangling commits using `git show <hash>:path > path`. Recovery commit: e5db373 `chore(05): restore plan 02-03 artifacts dropped during worktree merge`
- **Files restored:** src/hooks/usePracticeGame.ts, src/components/Board.tsx, src/components/Key.tsx, src/components/Keyboard.tsx, src/components/Toast.tsx, 05-02-SUMMARY.md, 05-03-SUMMARY.md

**2. [Rule 1 - Bug] Unused TileStatus import in usePracticeGame.ts**

- **Found during:** Task 2 — `npm run build` failed with TS6133 error
- **Issue:** `import type { TileStatus } from '../lib/scoring'` was declared but never used
- **Fix:** Removed the unused import line
- **Files modified:** src/hooks/usePracticeGame.ts (commit 949a166)

## Threat Surface Scan

T-05-08 (Tampering — daily stats during practice): Mitigated — usePracticeGame never imports storage.ts; `recordGameEnd` appears only in a documentation comment (grep confirms: line 120, comment only).

No new network endpoints, auth paths, file access patterns, or schema changes introduced.

## Known Stubs

None — all components render real data from usePracticeGame store. PracticeBanner link navigates to / (daily game). WinAnimation is a documented v3 stub (renders null) that existed before this plan.

## Self-Check: PASSED

Files exist:
- src/components/PracticeGame.tsx — FOUND
- src/components/PracticeBanner.tsx — FOUND
- src/components/PracticeEndGameModal.tsx — FOUND
- src/main.tsx (updated) — FOUND

Commits exist:
- e7c6bab — feat(05-04): create PracticeBanner, PracticeEndGameModal, PracticeGame — FOUND
- 949a166 — feat(05-04): update main.tsx with pathname-based routing to PracticeGame — FOUND

Build: tsc -b && vite build — PASSED (50 modules, 0 errors)
Tests: 102/102 passed
