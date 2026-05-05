# Phase 1: Foundation - Context

**Gathered:** 2026-05-04
**Status:** Ready for planning

<domain>
## Phase Boundary

Phase 1 delivers the fully playable core game engine:
- Vite + React 19 + TypeScript project scaffold with all dependencies installed
- Curated word lists: ANSWERS (~1,800 words) + VALID_GUESSES (~12,000 words) in `src/data/words.ts`
- Two-pass tile scoring algorithm (`src/lib/scoring.ts`) — unit-tested before any UI is built
- UTC-based day-index word selection (`src/lib/wordSelection.ts`) — unit-tested for timezone correctness
- Hard mode validation pure function (`src/lib/hardMode.ts`)
- localStorage read/write with schema versioning (`src/lib/storage.ts`)
- Zustand game store (`useGame` hook) connecting all lib functions to React state
- Static UI shell: Board, Row, Tile, Keyboard, Key components
- Fully wired, playable game: keyboard input → validation → scoring → win/loss detection → state persistence
- Invalid-guess feedback: row shake + toast notification (CSS-only, no animation library)

This phase covers requirements: GAME-01, GAME-02, GAME-03, GAME-04, DAILY-01, DAILY-02, DAILY-03, DAILY-04, DAILY-05, WORDS-01, WORDS-02, WORDS-03, WORDS-04.

**Not in Phase 1:** Share mechanic, stats modal, how-to-play modal, settings modal, colorblind mode, hard mode UI toggle, dark green theme, CSS flip/bounce animations, Vercel deploy, WinAnimation stub.

</domain>

<decisions>
## Implementation Decisions

### Word List Sourcing
- **D-01:** Source from cfreshman's public Wordle corpus (GitHub), filter to exactly 6-letter words. Target: ~1,800 answers (ANSWERS array), ~12,000 valid guesses (VALID_GUESSES array). Researcher should identify the exact raw GitHub URLs and produce the filtered lists.
- **D-02:** ANSWERS must NOT be sorted alphabetically in `src/data/words.ts` — sorting leaks upcoming words to anyone reading the JS bundle. Shuffle or use insertion order from original corpus.
- **D-03:** VALID_GUESSES includes all ANSWERS entries — a valid answer must also be a valid guess.

### Project Bootstrap
- **D-04:** First executor step: `npm create vite@latest longdle -- --template react-ts` in the repo root. Then install: `zustand`, `@tailwindcss/vite`, `tailwindcss`, `vitest`, `@testing-library/react`, `@testing-library/user-event`, `jsdom`. Configure `vite.config.ts` with `@tailwindcss/vite` plugin and Vitest settings.

### Zustand Store Shape
- **D-05:** Single Zustand store with `persist` middleware, structured as three logical sections matching three localStorage keys:
  - `longdle-game-state` — session state: `answer`, `guesses`, `currentGuess`, `gameOver`, `won`, `isAnimating`, `toastMessage`, `dayIndex`. Overwritten every guess.
  - `longdle-stats` — lifetime stats: `gamesPlayed`, `gamesWon`, `currentStreak`, `maxStreak`, `guessDistribution` (array of 7 ints). Written only on game end.
  - `longdle-settings` — preferences: `hardMode`, `colorblindMode`. Written on toggle.
  - Each section includes a `version: number` field (start at `1`) for migration.
- **D-06:** Persist only `longdle-game-state` and `longdle-settings` via Zustand's `persist` middleware. Stats written directly via the storage lib on game end (avoids partial-write issues on loss).

### Tile Color Reveal (Phase 1 vs Phase 3)
- **D-07:** In Phase 1, tiles show color immediately on row submission — no flip animation. Apply CSS classes (`tile--correct`, `tile--present`, `tile--absent`) directly at React state update time. Flip animation (color reveals at 50% keyframe midpoint) is deferred to Phase 3 (THEME-02).

### Invalid-Guess Feedback (Toast + Shake)
- **D-08:** Toast: `toastMessage: string | null` in game store. Component renders a positioned `<div>` when non-null. Auto-dismiss via `setTimeout(1500ms)` — clear `toastMessage` to null. No animation library.
- **D-09:** Row shake: CSS class `row--shake` toggled on the active row for invalid guesses. CSS `@keyframes` defined in global stylesheet. Remove class after animation completes (350ms timeout or `animationend` listener).

### Keyboard Input
- **D-10:** Physical keyboard: `document.addEventListener('keydown', handler)` registered in a `useEffect` inside `useGame`, cleaned up on unmount. No native `<input>` elements. Guard handler: `if (state.isAnimating || state.gameOver) return`.
- **D-11:** On-screen keyboard: `Key` component calls `useGame` action on click. Same guard applies.

### isAnimating Guard
- **D-12:** Add `isAnimating: boolean` to game store state, initialized `false`. All key handlers (physical + on-screen) check this guard. Value stays `false` throughout Phase 1 since no flip animations exist yet. Phase 3 sets it `true` during tile flip sequence and back to `false` after the last tile reveals.

### localStorage Schema
- **D-13:** `version` field is a number starting at `1`. On load, check `version` against expected version; if missing or mismatched, treat as fresh start (don't attempt migration in v1 — just reset). Log a console warning on version mismatch. Migration logic added before first real deployment.

### Build Order (Execution Sequence)
- **D-14:** Mandatory build order per CLAUDE.md and SUMMARY.md:
  1. `src/data/words.ts` (ANSWERS + VALID_GUESSES)
  2. `src/lib/scoring.ts` + Vitest unit tests
  3. `src/lib/wordSelection.ts` + Vitest unit tests (UTC timezone correctness)
  4. `src/lib/hardMode.ts`
  5. `src/lib/storage.ts`
  6. `src/hooks/useGame.ts` (Zustand store + game logic)
  7. Static UI shell (Tile, Row, Board, Key, Keyboard) — against hardcoded stub data
  8. Wire useGame to shell — game playable at this step
  9. Smoke test: can play a full game in dev, state persists on refresh

### Claude's Discretion
- Exact word list file URL(s) for cfreshman corpus — researcher resolves this
- Specific Tailwind utility classes for tile/keyboard layout — planner decides based on Tailwind v4 docs
- Exact TypeScript types for `TileState`, `GuessResult` etc. — planner decides
- Test coverage targets — planner decides (scoring + day-index must have tests; components optional in Phase 1)

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project Spec & Requirements
- `.planning/REQUIREMENTS.md` — Full requirement list with REQ-IDs; Phase 1 covers GAME-01–04, DAILY-01–05, WORDS-01–04
- `.planning/PROJECT.md` — Core value, key decisions table, constraints

### Architecture & Research
- `.planning/research/SUMMARY.md` — Stack versions, build order, critical pitfalls (duplicate-letter scoring bug, UTC drift, clipboard, isAnimating), open questions
- `.planning/research/ARCHITECTURE.md` — Component tree, data flow architecture
- `.planning/research/STACK.md` — Verified dependency versions
- `.planning/research/PITFALLS.md` — Detailed pitfall mitigations

### Critical Algorithms (from CLAUDE.md — overrides defaults)
- `CLAUDE.md` §"Tile Scoring" — Mandatory two-pass algorithm spec; single-pass is wrong
- `CLAUDE.md` §"Day-Index (timezone)" — `Date.UTC()` only; code snippet provided; never `new Date()` local time
- `CLAUDE.md` §"localStorage" — Three namespaced keys with version field
- `CLAUDE.md` §"Keyboard Input" — `isAnimating || gameOver` guard on all handlers

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- None — greenfield project, no existing code

### Established Patterns
- None established yet — this phase defines the patterns all subsequent phases follow

### Integration Points
- This phase IS the foundation. Phase 2 connects to: `useGame` hook (reads game state, calls actions), `src/lib/storage.ts` (reads/writes stats and settings), localStorage keys (all three namespaced keys established here)
- Phase 3 connects to: Zustand `isAnimating` setter (flip animation lifecycle), CSS class conventions (`tile--correct`, `tile--present`, `tile--absent`) established here

</code_context>

<specifics>
## Specific Ideas

- **Epoch date:** `2026-05-04T00:00:00Z` — hardcoded, never changes post-launch (per CLAUDE.md and STATE.md pre-launch decisions)
- **Word counts:** ~1,800 answers, ~12,000 valid guesses (sourced from cfreshman corpus filtered to 6 letters)
- **7 guesses for 6 letters:** One extra guess vs. standard Wordle to compensate for longer words (PROJECT.md key decision)
- **Answer list not sorted:** Must NOT be alphabetically sorted in source to prevent bundle-reader spoilers (WORDS-03)
- **cfreshman corpus:** The researcher should look for cfreshman's Wordle answer/guess lists on GitHub and identify the 6-letter subset

</specifics>

<deferred>
## Deferred Ideas

- Share emoji grid mechanic — Phase 2 (SHARE-01–04)
- Stats modal — Phase 2 (SHARE-03, SHARE-04)
- How-to-play modal — Phase 2 (ONBOARD-01–02)
- Settings modal (hard mode toggle, colorblind toggle) — Phase 2 (SETTINGS-01–03)
- Colorblind mode palette — Phase 2
- WinAnimation stub component — Phase 2 (V3-01)
- Dark green jungle theme / CSS custom properties — Phase 3 (THEME-01)
- Tile flip animation (color at 50% keyframe midpoint) — Phase 3 (THEME-02)
- Row shake + bounce animation — Phase 3 (THEME-03)
- Toast auto-dismiss animation — Phase 3 (THEME-04)
- Mobile-responsive polish — Phase 3 (THEME-05)
- Vercel deploy — Phase 3 (DEPLOY-01–02)
- localStorage migration function — before first real deployment (noted as v1 constraint)

</deferred>

---

*Phase: 1-Foundation*
*Context gathered: 2026-05-04*
