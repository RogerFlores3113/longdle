# Phase 5: Practice Mode - Context

**Gathered:** 2026-05-06
**Status:** Ready for planning

<domain>
## Phase Boundary

Phase 5 adds a `/random` route that serves a fully isolated practice game:
- **PRACTICE-01**: `/random` loads a playable game with a randomly selected word from the answer list
- **PRACTICE-02**: A visible "Practice Mode" banner distinguishes it from the daily puzzle at all times
- **PRACTICE-03**: Guesses made in practice mode do not affect daily stats, streaks, or localStorage game state

The practice game reuses the full game UI (Board, Keyboard, Tile scoring, modals) but with an isolated in-memory store and a custom EndGame modal. No new game mechanics — just routing, isolation, and a banner.

**Not in Phase 5:** Stats modal for practice, practice history, sharing practice results, sound effects, red panda animations.

</domain>

<decisions>
## Implementation Decisions

### Routing (PRACTICE-01)
- **D-01:** Detect `/random` via `window.location.pathname === '/random'` in `main.tsx`. Zero dependencies — no React Router needed.
- **D-02:** `main.tsx` renders `<PracticeGame />` when `isPractice` is true, otherwise renders `<App />`. The two component trees are fully separate — no shared state at the root level.
- **D-03:** Vercel's existing catch-all rewrite (`"source": "/(.*)"` → `"/index.html"`) already covers `/random`. No new `vercel.json` config needed, but the plan must confirm the catch-all is in place before closing this phase.

### State Isolation (PRACTICE-03)
- **D-04:** New `src/hooks/usePracticeGame.ts` — a Zustand store with **NO** `persist()` middleware. Daily `useGame` store and `longdle-game-state` localStorage key are never touched during a practice session.
- **D-05:** Extract shared pure game-logic into `src/lib/gameCore.ts` (e.g., `buildOnKeyHandler`, scoring pipeline, hard mode validation). Both `useGame` and `usePracticeGame` call these helpers. Avoids logic drift if game rules change.
- **D-06:** Random word is picked at `usePracticeGame` module load via `ANSWERS[Math.floor(Math.random() * ANSWERS.length)]`. On "Play Again", a `resetPractice()` action re-rolls a new random word and resets board state.
- **D-07:** `useSettings` (colorblind mode, hard mode) is shared — practice game reads it just like the daily game. Settings are user preferences, not game state.
- **D-08:** `recordGameEnd()` is **never called** in `usePracticeGame`. `longdle-stats` localStorage key is untouched.

### Practice Mode Banner (PRACTICE-02)
- **D-09:** Banner is a full-width bar rendered between the app header and the board (inside `app__main` or as its own element above it). Always visible for the duration of a practice session.
- **D-10:** Banner text: `"Practice Mode"` with a clickable link `"→ Play today's puzzle"` that navigates to `/` (daily game).
- **D-11:** Banner uses existing CSS tokens — `background: var(--color-surface)`, `color: var(--color-text)` — with a subtle bottom border or slight tint. Same palette as the rest of the app, visually distinct but not jarring.

### EndGame Modal (PRACTICE-01, PRACTICE-03)
- **D-12:** Practice EndGame modal shows a **"Play Again"** button that calls `resetPractice()` on `usePracticeGame`, picks a new random word, and resets the board. No page reload needed.
- **D-13:** No share button in the practice EndGame modal — practice results aren't meaningful to share.
- **D-14:** No "Go to daily puzzle" link in the EndGame modal (the banner link already provides that navigation). Keep the modal minimal.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Requirements and roadmap
- `.planning/REQUIREMENTS.md` — PRACTICE-01, PRACTICE-02, PRACTICE-03 definitions
- `.planning/ROADMAP.md` — Phase 5 goal and success criteria

### Core files being modified or created
- `src/main.tsx` — routing: add pathname check and conditional render
- `src/hooks/useGame.ts` — source of truth for game logic to extract into gameCore
- `src/lib/wordSelection.ts` — `ANSWERS` export and `getDailyAnswer()` pattern for reference
- `src/lib/storage.ts` — `recordGameEnd()`, `STATS_KEY`, `GAME_STATE_KEY` — must NOT be called/written in practice mode
- `src/components/EndGameModal.tsx` — reference for practice EndGame modal shape

### Prior context
- `.planning/phases/04-ux-polish/04-CONTEXT.md` — Phase 4 decisions (color tokens, toast, onPointerDown, LA timezone)
- `.planning/STATE.md` — key project decisions including "practice mode uses /random route, game state scoped to session memory only, no localStorage writes"

### Vercel config
- `vercel.json` — must confirm catch-all rewrite `"source": "/(.*)"` covers `/random` before closing phase

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/hooks/useGame.ts` — full game logic to refactor into `src/lib/gameCore.ts` shared helpers; `usePracticeGame` will be a slimmed-down wrapper over the same helpers
- `src/data/words.ts` — `ANSWERS` array (exported) used for random word selection
- `src/lib/wordSelection.ts` — `getDailyAnswer()` pattern shows how to index into ANSWERS
- `src/components/EndGameModal.tsx` — reference for shape of practice EndGame modal; practice version reuses most of the same structure minus share
- `src/components/Board.tsx`, `src/components/Keyboard.tsx` — reused unchanged in `<PracticeGame />`

### Established Patterns
- Zustand store with `persist()` for daily game; practice store deliberately omits `persist()` — isolation is structural, not conditional
- Phase 3 theming contract: all color tokens in `tiles.css` `:root` — banner styles must use CSS custom properties, not hardcoded hex
- `touch-action: manipulation` + `onPointerDown` already on `.key` (from Phase 4) — applies automatically to practice keyboard too
- `useSettings` is a separate store (`longdle-settings` key) — safe to read in practice mode without touching game state

### Integration Points
- `main.tsx` is the routing decision point — `window.location.pathname` check here means neither `<App />` nor `<PracticeGame />` needs to know about routing
- `useKeyboardListener.ts` will need to be wired to `usePracticeGame.onKey` in the practice context (currently wired to `useGame.onKey`)
- `src/lib/gameCore.ts` (new) connects `useGame` and `usePracticeGame` — plan must not extract so much that `useGame` becomes a thin wrapper with no reduction in complexity

</code_context>

<specifics>
## Specific Ideas

- Practice game component tree: `<PracticeGame />` wraps `<PracticeBanner />` + `<Board />` + `<Keyboard />` + `<Toast />` + modals — same structure as `<App />` with banner added and EndGame modal swapped
- `resetPractice()` action on `usePracticeGame` picks a new `ANSWERS[Math.floor(Math.random() * ANSWERS.length)]` and resets all board state — called by "Play Again" button
- Banner link uses `window.location.href = '/'` or an `<a href="/">` — no router needed for this navigation

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 5-Practice Mode*
*Context gathered: 2026-05-06*
