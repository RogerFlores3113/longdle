# Phase 1: Foundation - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-04
**Phase:** 01-Foundation
**Mode:** --auto (all areas auto-resolved with recommended defaults)
**Areas discussed:** Word List Sourcing, Project Bootstrap, Zustand Store Shape, Tile Color Reveal, Invalid-Guess Feedback, Keyboard Input, isAnimating Guard, localStorage Schema, Build Order

---

## Word List Sourcing

| Option | Description | Selected |
|--------|-------------|----------|
| cfreshman Wordle corpus | Public GitHub repo, filter to 6 letters, ~1,800 answers + ~12,000 guesses | ✓ |
| Stub list for dev | ~50 placeholder words, replace later | |
| Custom curated from scratch | Manual curation, time-intensive | |

**Auto-selected:** cfreshman Wordle corpus filtered to 6 letters
**Notes:** Research SUMMARY.md identifies this as the primary open question for Phase 1. Researcher resolves exact GitHub URLs. Answer list must NOT be sorted alphabetically.

---

## Project Bootstrap

| Option | Description | Selected |
|--------|-------------|----------|
| npm create vite@latest | Official Vite scaffold, react-ts template | ✓ |
| Manual file creation | Write tsconfig, vite.config from scratch | |

**Auto-selected:** `npm create vite@latest longdle -- --template react-ts`
**Notes:** Cleanest approach, correct tsconfig and vite.config structure out of the box. Install zustand, tailwindcss, @tailwindcss/vite, vitest, @testing-library/react, jsdom after scaffold.

---

## Zustand Store Shape

| Option | Description | Selected |
|--------|-------------|----------|
| Single store, three logical sections | One store, persist middleware, sections match 3 localStorage keys | ✓ |
| Three separate Zustand stores | One store per localStorage key | |
| Context API instead of Zustand | No dependency, but more boilerplate | |

**Auto-selected:** Single Zustand store with three logical sections
**Notes:** Standard Zustand pattern. Each section has a `version: number` field for schema migration. Stats section written directly via storage lib on game end (not persisted via middleware) to avoid partial-write issues.

---

## Tile Color Reveal

| Option | Description | Selected |
|--------|-------------|----------|
| Immediate color in Phase 1 | CSS classes applied at React state update time; flip deferred to Phase 3 | ✓ |
| Flip animation from Phase 1 | Color reveals at 50% keyframe midpoint from the start | |

**Auto-selected:** Immediate color in Phase 1
**Notes:** Flip animation (THEME-02) belongs in Phase 3. Phase 1 establishes the CSS class conventions (`tile--correct`, `tile--present`, `tile--absent`) that Phase 3's animation hooks into.

---

## Invalid-Guess Feedback (Toast + Shake)

| Option | Description | Selected |
|--------|-------------|----------|
| Pure CSS + state-driven toast | `toastMessage: string \| null` in store, CSS @keyframes for shake, setTimeout 1500ms dismiss | ✓ |
| React-Hot-Toast or similar library | Adds dependency | |
| Inline error messages | Less idiomatic | |

**Auto-selected:** Pure CSS + state-driven toast, no library
**Notes:** Research explicitly recommends CSS-only for v1 (no animation library). Row shake via CSS class toggle (`row--shake`), removed after 350ms or `animationend`.

---

## Keyboard Input

| Option | Description | Selected |
|--------|-------------|----------|
| document.addEventListener('keydown') in useEffect | Standard approach, no native input | ✓ |
| Native `<input>` element with React synthetic events | Creates focus management complexity | |

**Auto-selected:** `document.addEventListener('keydown')` in `useEffect`, cleaned up on unmount
**Notes:** Guard: `if (state.isAnimating || state.gameOver) return`. On-screen keyboard calls same useGame actions on click.

---

## isAnimating Guard

| Option | Description | Selected |
|--------|-------------|----------|
| Add to state in Phase 1, value stays false | Future-proof from day one, no Phase 3 refactor | ✓ |
| Add only when flip animation is implemented (Phase 3) | Minimal Phase 1 scope | |

**Auto-selected:** Add `isAnimating: boolean` to game store in Phase 1, initialized `false`
**Notes:** PITFALLS.md item #4 and CLAUDE.md explicitly require this guard. Cost is near-zero in Phase 1; deferring would require Phase 3 to touch all key handlers.

---

## localStorage Schema

| Option | Description | Selected |
|--------|-------------|----------|
| version: number, treat mismatch as fresh start | Simple, safe for v1 | ✓ |
| Full migration function now | Over-engineering for v1 | |

**Auto-selected:** `version: 1` in each stored object, treat missing/mismatch as fresh start with console warning
**Notes:** Migration logic added before first real deployment per SUMMARY.md pitfall #5. Fresh start on mismatch is safe for a 2-person audience.

---

## Build Order

| Option | Description | Selected |
|--------|-------------|----------|
| Data layer first, then UI shell | lib functions unit-tested before any React code | ✓ |
| UI first, wire logic later | Faster visual feedback but skips critical test gate | |

**Auto-selected:** Data layer first (words → scoring → wordSelection → hardMode → storage → useGame → UI shell → wire → smoke test)
**Notes:** CLAUDE.md and SUMMARY.md both mandate this order. Two-pass scoring must be unit-tested before UI is built — this is the #1 correctness risk.

---

## Claude's Discretion

- Exact cfreshman corpus GitHub URLs — researcher resolves
- TypeScript types (`TileState`, `GuessResult`, etc.) — planner decides
- Specific Tailwind utility classes for layout — planner decides based on Tailwind v4 docs
- Test coverage targets — planner decides (scoring + day-index must have tests; component tests optional in Phase 1)
- Exact `@keyframes` timing values for shake animation — planner decides

## Deferred Ideas

- Share mechanic, stats modal, how-to-play modal, settings modal → Phase 2
- Colorblind mode palette, WinAnimation stub → Phase 2
- Dark green theme, flip/bounce animations, mobile polish → Phase 3
- Vercel deploy → Phase 3
- localStorage migration function → before first real deployment
