# Phase 2: Features - Context

**Gathered:** 2026-05-05
**Status:** Ready for planning

<domain>
## Phase Boundary

Phase 2 adds every social and settings feature that transforms the working game into a shareable daily ritual:
- **Share mechanic** (SHARE-01–04): emoji grid copy-to-clipboard after game end, iOS-safe synchronous write
- **Stats modal** (SHARE-03–04): lifetime stats (games played, win %, streaks, guess distribution histogram)
- **How-to-play modal** (ONBOARD-01–02): auto-shown on first visit, accessible via header help icon
- **Settings modal** (SETTINGS-01–03): hard mode toggle (before-game-only), colorblind mode toggle (any time)
- **Colorblind palette** (SETTINGS-02–03): high-contrast orange/blue applied via CSS custom property overrides
- **WinAnimation stub** (V3-01): no-op component slot in EndGame modal, interface documented for v3 red panda assets
- **Header evolution**: help icon → HowToPlay, stats icon → Stats, settings icon → Settings
- **EndGameBanner → EndGame modal**: inline banner becomes full modal overlay with share + WinAnimation slot

Requirements covered: SHARE-01, SHARE-02, SHARE-03, SHARE-04, ONBOARD-01, ONBOARD-02, SETTINGS-01, SETTINGS-02, SETTINGS-03, V3-01

**Not in Phase 2:** Dark green jungle theme (Phase 3), CSS flip/bounce/shake animations (Phase 3), mobile polish (Phase 3), Vercel deploy (Phase 3), red panda assets (v3).

</domain>

<decisions>
## Implementation Decisions

### Modal Architecture
- **D-01:** App.tsx owns a single `activeModal: 'howToPlay' | 'stats' | 'settings' | 'endGame' | null` React state (useState). All modals render as fixed overlays from App.tsx. No Zustand for UI modal state — keeps game state store focused on game logic.
- **D-02:** A shared `<Modal>` wrapper component handles: fixed overlay backdrop, close-on-backdrop-click, close-on-Escape, and an `onClose` prop. Individual modals (HowToPlay, Stats, Settings, EndGame) render inside this wrapper.
- **D-03:** EndGame modal auto-opens when `gameStatus` transitions from `'playing'` to `'won'` or `'lost'`. The existing `EndGameBanner` component is replaced entirely by the EndGame modal.

### Share Mechanic (SHARE-01, SHARE-02)
- **D-04:** Share button lives in the EndGame modal (primary CTA after game ends). Also surfaced in the Stats modal (secondary action).
- **D-05:** Emoji characters: Normal mode — 🟩 (correct), 🟨 (present), ⬛ (absent). Colorblind mode — 🟧 (correct), 🟦 (present), ⬛ (absent). SETTINGS-03 requires the colorblind palette in share output.
- **D-06:** Share text format: `Longdle #${dayIndex + 1} ${won ? guessCount : 'X'}/7\n\n${emojiGrid}`. The puzzle number is `dayIndex + 1` (day 0 = puzzle #1).
- **D-07:** Synchronous clipboard write per CLAUDE.md §"Clipboard (iOS Safari)": generate share text synchronously, call `navigator.clipboard.writeText(text)` synchronously (no `await` before the call), `.catch()` fallback opens a modal showing the text for manual copy.
- **D-08:** `generateShareText(guesses, dayIndex, colorblindMode)` is a pure function in `src/lib/share.ts`. No side effects — callable synchronously from the share button click handler.

### Stats Modal (SHARE-03, SHARE-04)
- **D-09:** Stats modal reads from `readStats()` in `src/lib/storage.ts`. No Zustand store for stats — stats are written directly to localStorage on game end (already implemented in Phase 1 via `recordGameEnd`).
- **D-10:** Guess distribution histogram: each bar is a `<div>` with `width: {pct}%` as inline style, where `pct = (count / maxCount) * 100` (minimum bar width 8% so empty bars are visible). The bar for the current game's guess count is highlighted via `.stats-bar--highlight` CSS class.
- **D-11:** Stats displayed: Games Played, Win %, Current Streak, Max Streak, Guess Distribution (rows 1–7). Win % is `Math.round((gamesWon / gamesPlayed) * 100)` or `0` if no games played.

### How-to-Play Modal (ONBOARD-01, ONBOARD-02)
- **D-12:** First-visit detection: add `hasSeenHowToPlay: boolean` (default `false`) to the `useSettings` Zustand store. App.tsx opens HowToPlay modal on mount if `!hasSeenHowToPlay`, then calls `setHasSeenHowToPlay(true)` immediately on open.
- **D-13:** How-to-play content: three example rows showing one tile each — a green tile labeled "Right spot", a yellow tile labeled "Wrong spot", a gray tile labeled "Not in word". Use simplified styled `<div>` elements (not the actual Tile component, which depends on ScoredGuess state). Text explains 6-letter / 7-guess rules.

### Settings Modal (SETTINGS-01, SETTINGS-02, SETTINGS-03)
- **D-14:** Hard mode toggle (SETTINGS-01): disabled (grayed out with cursor-not-allowed) if any guesses have been submitted (`guesses.length > 0`). A subtitle reads "Hard mode can only be enabled at the start of a game." Toggle still visible — not hidden.
- **D-15:** Colorblind mode toggle (SETTINGS-02): enabled at any time. Palette swaps immediately on toggle.

### Colorblind Palette (SETTINGS-02)
- **D-16:** App.tsx adds a `useEffect` that toggles a `colorblind` CSS class on `document.documentElement` whenever `colorblindMode` changes: `document.documentElement.classList.toggle('colorblind', colorblindMode)`.
- **D-17:** In `src/styles/tiles.css`, add an override block:
  ```css
  html.colorblind {
    --color-correct: #f5793a;  /* orange */
    --color-present: #85c0f9;  /* blue */
  }
  ```
  This pattern is consistent with Phase 3's theming contract (Phase 3 overrides `:root` custom properties in tiles.css only). The `html.colorblind` override survives Phase 3's dark green theme addition cleanly.

### Header Evolution
- **D-18:** Header refactored: left side = help icon (?), center = "Longdle" title, right side = stats icon + settings icon. Layout: flex, `justify-content: space-between`. Update `app__header` in tiles.css accordingly.
- **D-19:** Icon approach: inline SVG React components (no icon library). Keep the dependency count minimal for a 2-person audience. Three icons needed: help (?), stats (bar chart), settings (gear).

### WinAnimation Stub (V3-01)
- **D-20:** Interface: `interface WinAnimationProps { dayIndex: number; won: boolean; guessCount: number }`. Component renders `null`. JSDoc comment documents v3 integration point:
  ```ts
  /**
   * WinAnimation — v3 placeholder.
   * Receives game result props; currently renders nothing.
   * v3 will replace this with red panda pixel art animations.
   */
  ```
- **D-21:** WinAnimation is placed inside the EndGame modal, rendered when `gameStatus === 'won'`.

### Claude's Discretion
- Exact SVG paths for the 3 header icons — planner picks readable inline SVGs
- Modal backdrop z-index values and stacking order — planner decides
- Exact CSS class naming for modal, stats bars, settings toggles — planner decides
- Whether to use `<dialog>` element or `<div>` with role="dialog" for modal — planner decides (accessibility tradeoff)
- Animation (fade-in) for modals — planner defers to Phase 3; Phase 2 modals appear instantly

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project Spec & Requirements
- `.planning/REQUIREMENTS.md` — Full requirement list; Phase 2 covers SHARE-01–04, ONBOARD-01–02, SETTINGS-01–03, V3-01
- `.planning/PROJECT.md` — Core value, key decisions, constraints

### Critical Implementation Rules (CLAUDE.md)
- `CLAUDE.md` §"Clipboard (iOS Safari)" — synchronous clipboard write; no `await` before `writeText`; `.catch()` fallback modal
- `CLAUDE.md` §"Keyboard Input" — `isAnimating || gameOver` guard must remain active; Phase 2 must not break this
- `CLAUDE.md` §"localStorage" — three namespaced keys with version field; settings store already has persist middleware

### Phase 1 Foundation (what Phase 2 builds on)
- `.planning/phases/01-foundation/01-CONTEXT.md` — D-05 (store shape), D-06 (stats written via storage lib), D-07 (tile color CSS classes), D-08 (toast), D-09 (row shake)
- `.planning/phases/01-foundation/01-UI-SPEC.md` — Existing component conventions and CSS class names

### Existing Implementation Files (read before planning)
- `src/hooks/useGame.ts` — GameState and SettingsState interfaces; `useGame` and `useSettings` stores; `recordGameEnd` already called on game end
- `src/lib/storage.ts` — `readStats()`, `writeStats()`, `recordGameEnd()`, Stats interface, localStorage keys
- `src/styles/tiles.css` — 8 CSS custom properties declared in `:root`; CSS class conventions for tiles/keyboard; Phase 3 theming contract (override `:root` in tiles.css only)
- `src/App.tsx` — Current wiring; Header + Board + Keyboard + Toast + EndGameBanner

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `useGame` store: exposes `gameStatus`, `guesses`, `keyStatuses`, `dayIndex`, `getAnswer` — Phase 2 modals read these directly
- `useSettings` store: already has `hardMode`, `colorblindMode`, `setHardMode`, `setColorblindMode` + Zustand persist — add `hasSeenHowToPlay` + setter
- `src/lib/storage.ts`: `readStats()` and `Stats` interface already implemented — Stats modal reads this directly
- `src/styles/tiles.css`: 8 color tokens in `:root` — colorblind override adds only 2 (`--color-correct`, `--color-present`)
- `EndGameBanner`: currently a simple inline div — replace entirely with EndGame modal component

### Established Patterns
- Zustand store pattern: `create<T>()(persist(...))` with `migrate` on version mismatch → reset
- CSS custom properties: all colors flow from `:root` variables; override via class on `<html>` for colorblind/theme
- Toast pattern: `toastMessage` in store, `setTimeout` auto-dismiss, `Toast` component reads directly
- Partialize pattern: transient UI state (toastMessage, isAnimating) excluded from persistence

### Integration Points
- `App.tsx`: add `activeModal` useState; add `useEffect` for colorblind class; replace `EndGameBanner` with EndGame modal; evolve header with icon buttons
- `useGame.ts → onKey`: Phase 2 must not modify game logic; modal state is separate (App.tsx useState)
- `src/lib/share.ts` (new): pure function `generateShareText(guesses, dayIndex, colorblindMode)` — called synchronously from share button click handler
- `useSettings` store: add `hasSeenHowToPlay: boolean` field + setter; will be persisted automatically via existing middleware

</code_context>

<specifics>
## Specific Ideas

- Puzzle number in share text uses `dayIndex + 1` (epoch day 0 = puzzle #1 — matches player expectation)
- Colorblind emoji: 🟧🟦⬛ (orange square / blue square / black square) — standard high-contrast convention
- Normal emoji: 🟩🟨⬛ (green / yellow / black) — standard Wordle convention
- Hard mode restriction: disable toggle in-game (grayed out), not hidden — user sees the restriction exists
- How-to-play tiles: simplified div elements (not actual Tile components) to avoid dependency on game state shape
- WinAnimation slot: renders only when `won === true` inside EndGame modal

</specifics>

<deferred>
## Deferred Ideas

- Modal fade-in/fade-out CSS animations — Phase 3 (THEME-* scope)
- Dark green jungle theme application — Phase 3 (THEME-01)
- Toast appear/dismiss animation — Phase 3 (THEME-04)
- localStorage migration function — before first real deployment (noted in Phase 1)
- Sound effects — v2 (deferred pre-launch)
- Practice mode — v2 (deferred pre-launch)
- Score comparison UI — v2 (deferred pre-launch)
- Red panda pixel art / animations — v3 (WinAnimation stub is Phase 2; assets are v3)

</deferred>

---

*Phase: 2-Features*
*Context gathered: 2026-05-05*
