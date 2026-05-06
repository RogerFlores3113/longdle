---
phase: 03-polish-deploy
plan: 02
subsystem: ui
tags: [react, zustand, animation, tile-flip, isAnimating, toast, typescript]

# Dependency graph
requires:
  - phase: 03-01
    provides: "CSS tile-flip keyframes and .tile--flip class that JS props will trigger"
provides:
  - "Tile/Row/Board prop plumbing for tile--flip class with per-tile animationDelay"
  - "isAnimating lifecycle: true on every submit, cleared via flipTimer setTimeout at 1150ms"
  - "Toast hiding-state timer (1200ms) that triggers .toast--hiding CSS fade before unmount"
  - "App.tsx EndGame modal waits for !isAnimating before auto-opening"
affects: [phase-03-03, phase-03-04]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "flipTimer module-scoped pattern (matches toastTimer/shakeTimer HMR-safe pattern)"
    - "Component-owned timer for Toast fade (Pattern E — transient presentational state)"
    - "Single-field Zustand selector per field (Pattern D — no useShallow needed)"
    - "isFlipping computed at Board via i === guesses.length - 1 && isAnimating (Pitfall 3 mitigation)"

key-files:
  created: []
  modified:
    - src/components/Tile.tsx
    - src/components/Row.tsx
    - src/components/Board.tsx
    - src/components/Toast.tsx
    - src/hooks/useGame.ts
    - src/App.tsx

key-decisions:
  - "isAnimating now set true on EVERY row submit (was game-end only per WR-05) — covers full flip window per CLAUDE.md Keyboard Input rule"
  - "flipTimer uses useGame.setState for out-of-action clear — matches canonical out-of-action update path"
  - "Toast fade timer is component-owned (Pattern E), not store state — transient presentational concern excluded from partialize"
  - "App.tsx isAnimating selector uses single-field form (Pattern D) not object-selector D-09 — avoids importing useShallow, matches existing file style"
  - "EndGame useEffect dep array includes isAnimating — triggers when flip completes on game-end rows"

patterns-established:
  - "Pattern A: Module-scoped timer with HMR dispose (flipTimer extends toastTimer/shakeTimer pattern)"
  - "Pattern D: Single-field Zustand selector per field in App.tsx"
  - "Pattern E: Component-owned useEffect timer with cleanup for presentational fade state"
  - "Pitfall 3 mitigation: isFlipping computed via i === guesses.length - 1 && isAnimating to prevent re-fire on unrelated renders"

requirements-completed: [THEME-02, THEME-04]

# Metrics
duration: 12min
completed: 2026-05-05
---

# Phase 3 Plan 02: Animation JS Wiring Summary

**Tile flip prop plumbing (Tile/Row/Board), isAnimating lifecycle covering all submits with 1150ms flipTimer, Toast 1200ms hiding-state fade, and EndGame modal isAnimating guard**

## Performance

- **Duration:** ~12 min
- **Started:** 2026-05-05T17:48:00Z
- **Completed:** 2026-05-05T17:52:30Z
- **Tasks:** 3
- **Files modified:** 6

## Accomplishments

- Tile/Row/Board prop chain wired so only the just-submitted row receives `tile--flip` class with per-tile `animationDelay` (Pitfall 3 mitigated)
- `isAnimating` lifecycle now covers ALL row submits — set `true` on enter, cleared via `flipTimer` at 1150ms — keyboard is correctly locked during the flip window per CLAUDE.md "Keyboard Input" rule
- Toast component adds `toast--hiding` class 1200ms after message, letting CSS fade complete before the 1500ms store clear unmounts the element
- EndGame modal auto-open guarded on `&& !isAnimating` so it never pops over the final row's color reveal

## Task Commits

Each task was committed atomically:

1. **Task 1: Tile + Row + Board flip prop plumbing** - `c5a791d` (feat)
2. **Task 2: flipTimer + FLIP_TOTAL_MS in useGame** - `6a2e046` (feat)
3. **Task 3: Toast hiding timer + App.tsx EndGame guard** - `92212e9` (feat)

## Files Created/Modified

- `src/components/Tile.tsx` - Added optional `flip` + `flipDelayMs` props; applies `tile--flip` class and inline `animationDelay` style
- `src/components/Row.tsx` - Added required `isFlipping: boolean` prop; passes `flip` + `flipDelayMs={i * 150}` to each Tile
- `src/components/Board.tsx` - Subscribes to `isAnimating`; computes `isFlipping={i === guesses.length - 1 && isAnimating}` for completed-guess rows; `isFlipping={false}` for active and empty rows
- `src/hooks/useGame.ts` - Added `FLIP_DURATION_MS`, `FLIP_STAGGER_MS`, `FLIP_TOTAL_MS` constants; `flipTimer` module-scope declaration + HMR dispose; changed `isAnimating: true` unconditionally on submit; added `flipTimer = setTimeout(useGame.setState({ isAnimating: false }), FLIP_TOTAL_MS)`
- `src/components/Toast.tsx` - Added `useState(hiding)` + `useEffect([message])` with 1200ms timer; applies `toast--hiding` class before unmount; preserves `role="status"` and `aria-live="polite"`
- `src/App.tsx` - Added dedicated `isAnimating` selector (Pattern D); EndGame `useEffect` guarded on `&& !isAnimating` with `[gameStatus, isAnimating]` dep array; removed `TODO: Phase 3` comment

## Decisions Made

**Behavioral change to isAnimating (WR-05 to Phase 3):** Phase 2 commit 309dd73 (WR-05) set `isAnimating: gameStatus !== 'playing'` (game-end only) as a double-tap guard. Phase 3 changes this to `isAnimating: true` on EVERY row submit because the tile flip animation covers ALL guesses — the keyboard guard at `useGame.ts` line 89 (`if (s.isAnimating || s.gameStatus !== 'playing') return`) must block input during the entire 1150ms flip window, not just on game end. This is a necessary and intentional behavioral expansion.

**Pattern D over D-09:** CONTEXT.md D-09 proposed an object-selector form requiring `useShallow` from `zustand/react/shallow`. The file's established style is one selector per field (line 25). Pattern D was chosen to match the file's existing style without adding a new import.

**flipTimer uses `useGame.setState` (not `set`):** The timer fires after the action returns, so `set` is out of scope. `useGame.setState` is the canonical out-of-action update path, matching how `showGameToast` in the same file calls `showToast(msg, useGame.setState)`.

**Toast timer is component-owned (Pattern E):** Adding a `isToastHiding` field to the store would conflate transient presentational state with game state — the `partialize` block comment explicitly lists `toastMessage` and `isAnimating` as excluded transient fields. The component-owned `useEffect` timer with cleanup is the correct pattern and requires no store schema change.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- JS animation wiring complete; CSS keyframes (Plan 01) will activate `tile--flip`, `.row--shake`, `.row--win` classes when rendered
- Toast fade CSS (`.toast--hiding { opacity: 0 }`) will activate when the hiding class is applied
- Plan 03 (deploy: `vercel.json`) and Plan 04 (mobile responsive) have zero overlap with these files

## Threat Surface Scan

No new network endpoints, auth paths, file access patterns, or schema changes introduced.

## Self-Check

- [x] `src/components/Tile.tsx` — `flip?: boolean` prop present, `tile--flip` class applied
- [x] `src/components/Row.tsx` — `isFlipping: boolean` prop present, `flipDelayMs={i * 150}` passed
- [x] `src/components/Board.tsx` — `const isAnimating = useGame(...)` present; `isFlipping={i === guesses.length - 1 && isAnimating}` in completed row; 2x `isFlipping={false}` in active/empty rows
- [x] `src/hooks/useGame.ts` — `FLIP_TOTAL_MS`, `flipTimer`, HMR dispose entry, `isAnimating: true`, flipTimer setTimeout all present
- [x] `src/components/Toast.tsx` — `toast--hiding` applied 1200ms after message; `role="status"` preserved
- [x] `src/App.tsx` — `isAnimating` selector added; `&& !isAnimating` guard in EndGame effect; TODO comment removed
- [x] Commits: c5a791d, 6a2e046, 92212e9 all exist
- [x] `npm run build` exits 0
- [x] `npm test -- --run` 50/50 pass

## Self-Check: PASSED

---
*Phase: 03-polish-deploy*
*Completed: 2026-05-05*
