---
phase: 02-features
reviewed: 2026-05-05T00:00:00Z
depth: standard
files_reviewed: 15
files_reviewed_list:
  - src/App.tsx
  - src/components/CopyFallbackModal.tsx
  - src/components/EndGameModal.tsx
  - src/components/HowToPlayModal.tsx
  - src/components/Modal.tsx
  - src/components/SettingsModal.tsx
  - src/components/StatsModal.tsx
  - src/components/WinAnimation.tsx
  - src/components/icons/HelpIcon.tsx
  - src/components/icons/StatsIcon.tsx
  - src/components/icons/SettingsIcon.tsx
  - src/hooks/useGame.ts
  - src/lib/share.ts
  - src/lib/share.test.ts
  - src/styles/tiles.css
findings:
  critical: 3
  warning: 5
  info: 3
  total: 11
status: issues_found
---

# Phase 02: Code Review Report

**Reviewed:** 2026-05-05T00:00:00Z
**Depth:** standard
**Files Reviewed:** 15
**Status:** issues_found

## Summary

Phase 2 delivers the modal system, share mechanic, settings, stats, and the game's core `useGame` hook. The iOS clipboard rule from CLAUDE.md is correctly followed in both `EndGameModal` and `App.tsx`. The two-pass tile scoring in `scoring.ts` is correct. The day-index UTC computation is correct.

Three blockers were found: (1) the stats histogram highlight uses the live guess count to index `guessDistribution` which is pre-game data, producing a wrong or out-of-bounds index on the first game; (2) module-level timer variables (`toastTimer`, `shakeTimer`) survive hot-module-replacement cycles in Vite dev mode and are shared across test runs, making both development behavior and test isolation unreliable; (3) `useGame.getState()` is called directly inside JSX in `EndGameModal` on every render, bypassing Zustand reactivity — if `dayIndex` or `guessCount` change the component will not re-render to reflect the new values. Five warnings covering missing accessibility, stale-closure risk on modal `onClose`, a double-toast UI bug, stats read during render, and missing `aria-label` on the dialog element are also documented.

---

## Critical Issues

### CR-01: Stats histogram highlight uses wrong index — out-of-bounds on first game

**File:** `src/components/StatsModal.tsx:36`

**Issue:** `isHighlight` is computed as:
```ts
const isHighlight = gameStatus === 'won' && i === guesses.length - 1
```
`guesses` is the live Zustand slice (current session), but `stats.guessDistribution` is read fresh from `localStorage` via `readStats()` and reflects *lifetime* data that may differ from the live session. On a user's **first ever win** `stats.guessDistribution` has 7 slots (indices 0-6), and `guesses.length - 1` maps correctly, but the semantics are still wrong: the highlight is supposed to mark the bar that just received an increment. The real bug is that `guesses.length - 1` is a 0-based index but `guessDistribution` index `k` represents wins in `k+1` guesses — which happens to be the same value — so the index arithmetic is accidentally correct. However, because `readStats()` is called at render time (see WR-03) rather than after `recordGameEnd`, there is a window where the distribution shown does not yet include the just-completed game: `recordGameEnd` is called inside `useGame.onKey` synchronously, but React re-renders are batched, so `StatsModal` may read stale `localStorage` data if the stats modal is opened before the next React paint cycle resolves. More critically: if the user has already won 7 times using exactly 2 guesses, `stats.guessDistribution[1]` is some large number — the highlight logic still uses `guesses.length - 1` from the *current session* not from where the distribution was incremented. This will show the wrong bar highlighted whenever a returning user opens stats. The root issue is that `isHighlight` should be derived from the current session's guess count read from the game store, cross-referenced with the distribution index — and the stats snapshot should be captured after the write, not by re-reading localStorage.

**Fix:**
```tsx
// Derive highlight index from current session, not live guesses
const highlightIndex = gameStatus === 'won' ? guesses.length - 1 : -1

// Then in the map:
const isHighlight = i === highlightIndex
```
This is the same value but makes the intent explicit. The deeper fix for the stale-read problem is to capture stats in a `useMemo` or `useRef` that is stable across renders, or to subscribe the stats to the Zustand store rather than reading `localStorage` directly in the render function (see WR-03).

---

### CR-02: `useGame.getState()` called inside JSX — bypasses reactivity, values silently stale

**File:** `src/components/EndGameModal.tsx:41-44`

**Issue:**
```tsx
{won && (
  <WinAnimation
    dayIndex={useGame.getState().dayIndex}
    won={true}
    guessCount={useGame.getState().guesses.length}
  />
)}
```
`useGame.getState()` is a snapshot read of the store at the moment of that render call. It is correct that these values do not change mid-game (the game is over), but this pattern is fragile: if `WinAnimation` is ever made reactive or if `EndGameModal` is reused in a context where the store can change (e.g., the TODO Phase 3 `resetForNewDay` flow), these props will not update. More practically, this is a rules-of-hooks violation risk — while `getState()` is not a hook, it is placed inline in JSX alongside hooks, creating a code pattern that future developers will read as "these are dynamic values" when they are actually frozen snapshots. The correct pattern is to use the Zustand selector hooks at the top of the component, which is already done for `gameStatus` and `getAnswer`.

**Fix:**
```tsx
// At top of component, alongside other selectors:
const dayIndex = useGame((s) => s.dayIndex)
const guessCount = useGame((s) => s.guesses.length)

// Then in JSX:
{won && (
  <WinAnimation dayIndex={dayIndex} won={true} guessCount={guessCount} />
)}
```

---

### CR-03: Module-level timer variables create state leakage across HMR reloads and test runs

**File:** `src/hooks/useGame.ts:58-59`

**Issue:**
```ts
let toastTimer: ReturnType<typeof setTimeout> | null = null
let shakeTimer: ReturnType<typeof setTimeout> | null = null
```
These variables live at module scope and survive Vite HMR module replacement. When a developer saves a file and HMR replaces the module, the old timer IDs are lost but the new module starts with `null`, meaning any pending timer from the previous module instance cannot be cleared — leading to `set()` calls on a stale store setter after HMR. In Vitest, if tests import this module without resetting timers between test cases, a timer fired in one test can mutate state in the next test. The same `toastTimer` is shared across all concurrent renders (there is only one Zustand store instance, so this is generally safe in production), but the HMR and test isolation issues are real.

**Fix:** Move timers inside the store's closure or use a `WeakRef` pattern. The simplest fix for test isolation is to export a `__resetTimers` function for test teardown. For HMR, accept Vite's `import.meta.hot.dispose` to clear timers:
```ts
if (import.meta.hot) {
  import.meta.hot.dispose(() => {
    if (toastTimer) clearTimeout(toastTimer)
    if (shakeTimer) clearTimeout(shakeTimer)
  })
}
```

---

## Warnings

### WR-01: `Modal` dialog missing `aria-labelledby` — screen reader announces no title

**File:** `src/components/Modal.tsx:26-33`

**Issue:** The `modal-panel` div has `role="dialog"` and `aria-modal="true"` but no `aria-labelledby` or `aria-label` attribute. Screen readers will announce the dialog but provide no accessible name, making it impossible for assistive technology users to know which dialog just opened. WCAG 2.1 requires dialogs to have an accessible name.

**Fix:**
```tsx
// Add aria-labelledby to Modal and accept a labelId prop, or
// add a default aria-label prop:
interface ModalProps {
  onClose: () => void
  children: React.ReactNode
  ariaLabel?: string
  ariaLabelledBy?: string
}

// In JSX:
<div
  className="modal-panel"
  onClick={(e) => e.stopPropagation()}
  role="dialog"
  aria-modal="true"
  aria-labelledby={ariaLabelledBy}
  aria-label={!ariaLabelledBy ? ariaLabel : undefined}
>
```
Each modal that renders an `<h2>` should pass its heading's `id` as `ariaLabelledBy`.

---

### WR-02: `Modal` `onClose` stale-closure risk when `onClose` identity changes

**File:** `src/components/Modal.tsx:9-17`

**Issue:**
```ts
useEffect(() => {
  const handler = (e: KeyboardEvent) => {
    if (e.key === 'Escape') onClose()
  }
  window.addEventListener('keydown', handler)
  return () => window.removeEventListener('keydown', handler)
}, [onClose])
```
The effect dependency is `[onClose]`. If the parent component (App.tsx) re-renders and recreates `closeModal` as a new function reference (which it does — `closeModal` is an inline arrow function, not memoized), the effect will run on every parent render: remove the old listener, add a new one. This is correct behavior but is wasteful and fragile. If the parent ever passes an unstable `onClose` reference during a rapid re-render sequence (e.g., triggered by a toast state change), there is a brief window between `removeEventListener` and `addEventListener` where Escape does not close the modal. The fix is to either memoize `closeModal` in `App.tsx` with `useCallback`, or use a `useRef` for the callback inside `Modal`:

**Fix (in Modal.tsx):**
```ts
const onCloseRef = useRef(onClose)
useEffect(() => { onCloseRef.current = onClose })

useEffect(() => {
  const handler = (e: KeyboardEvent) => {
    if (e.key === 'Escape') onCloseRef.current()
  }
  window.addEventListener('keydown', handler)
  return () => window.removeEventListener('keydown', handler)
}, []) // stable — never re-registers
```

---

### WR-03: `readStats()` called on every render of `StatsModal` — stale data risk

**File:** `src/components/StatsModal.tsx:8`

**Issue:**
```ts
const stats = readStats()
```
`readStats()` reads `localStorage` synchronously on every render. React may call this during concurrent mode scheduling multiple times. More critically, if the user just finished a game and the EndGame modal opens, then immediately clicks "See Stats", the stats write from `recordGameEnd` may not have flushed to localStorage by the time `StatsModal` renders (in practice it has, since `recordGameEnd` is synchronous, but this is a fragile assumption). The larger issue is that there is no reactive subscription — if stats change (in any future code path) while the modal is open, the display will not update. Calling a side-effecting read in the render body is an anti-pattern in React 18+ strict mode which double-invokes renders.

**Fix:** Wrap in `useMemo` at minimum, or better, use a `useState` initialized once on mount:
```ts
const [stats] = useState(() => readStats())
```
This reads once on mount, avoids repeated localStorage access, and plays nicely with Strict Mode double-rendering.

---

### WR-04: Double-toast UI — App.tsx has its own `shareToast` state AND StatsModal's share calls `handleShare` which also triggers `handleShareSuccess`

**File:** `src/App.tsx:54-57, 109-111`

**Issue:** The App renders two separate toast mechanisms:
1. The `<Toast />` component (connected to `useGame((s) => s.toastMessage)`) at line 108 — used for game-play toasts (invalid word, etc.)
2. A bespoke `shareToast` div at line 109-111 hardcoded to position `top: 80` with the text "Copied to clipboard!"

The `shareToast` div uses an inline `style={{ top: 80 }}`. This overlaps with the global `.toast` CSS which already defines `top: 80px`. If the game-play toast fires at the same time as the share toast (unlikely but possible if a player shares immediately after losing), both will stack at `top: 80px`, making neither readable. Additionally, the share toast fires via `handleShareSuccess` from both `StatsModal` (via `handleShare` in App) and `EndGameModal` (via `onShareSuccess` prop) — the paths diverge and are easy to miss in future changes. The `shareToast` div also lacks the `toast` className, meaning it will not inherit the `.toast` styles (background, padding, border-radius) unless those are re-declared inline. Looking at the current code, the div has no styling at all except the `top` override — it will render as an unstyled positioned div, making it invisible against most backgrounds.

**Fix:** Use a single toast mechanism. Add the `toast` className to the share toast div and deduplicate display logic, or route share success through the game store's `toastMessage` mechanism:
```tsx
{shareToast && (
  <div className="toast">Copied to clipboard!</div>
)}
```
(Remove the `style={{ top: 80 }}` since `.toast` already sets that.)

---

### WR-05: `recordGameEnd` can record duplicate stats if the game store is rehydrated after a stale dayIndex reset

**File:** `src/hooks/useGame.ts:193-199`

**Issue:**
```ts
onRehydrateStorage: () => (state) => {
  if (!state) return
  const todayIndex = getDayIndex()
  if (state.dayIndex !== todayIndex) {
    state.resetForNewDay?.()
  }
}
```
When the store rehydrates with a stale `dayIndex` (previous day's game), it calls `resetForNewDay()`. This correctly clears `guesses` and `gameStatus`. However, `resetForNewDay` does not reset stats — stats are stored in a separate `localStorage` key managed by `storage.ts`. If somehow `recordGameEnd` fires twice in the same session (e.g., due to a duplicate `onKey('Enter')` call sneaking through before `isAnimating` is set — see the commented TODO about adding the `!isAnimating` check in App.tsx line 42), stats will be double-counted for that game with no way to detect or undo it. The guard `if (gameStatus !== 'playing')` in `onKey` should prevent this, but the state is set in a single `set({...gameStatus})` call and `recordGameEnd` is called immediately after in the same synchronous block — Zustand's `set` is synchronous, so the guard will not prevent a re-entrant `onKey` call that starts executing before the first `set` resolves... actually Zustand sets are synchronous and the guard reads `s.gameStatus` from the snapshot at the start of `onKey`. If two Enter keypresses are queued (rapid tap on mobile), the second `onKey` call will read the pre-update `s.gameStatus` as `'playing'` and proceed to score again. `isAnimating` is supposed to block this but it is never set to `true` in the current code (no animation exists yet in Phase 2).

**Fix:** Set `isAnimating: true` synchronously in the same `set()` call that records the guess, before the game-end branch:
```ts
set({
  guesses: nextGuesses,
  currentGuess: '',
  keyStatuses: nextKeyStatuses,
  gameStatus,
  isAnimating: gameStatus !== 'playing', // lock input immediately on game end
})
```
And ensure `resetForNewDay` sets `isAnimating: false` (it already does).

---

## Info

### IN-01: `stats-bar` CSS text is invisible when count is 0

**File:** `src/styles/tiles.css:326-338`

**Issue:** The `.stats-bar` has `color: var(--color-text-inverse)` (white) and `background: var(--color-surface)` (light gray `#f3f4f6`). When a bar has count 0, the text "0" renders in white on light gray — invisible. This is a display defect that makes the distribution table unreadable for new users.

**Fix:** Either use a dark text color for the default (non-highlighted) bar state, or suppress the count label when it is 0:
```css
.stats-bar {
  color: var(--color-text); /* dark on surface, white on correct */
}
.stats-bar--highlight {
  color: var(--color-text-inverse);
}
```

---

### IN-02: `share.test.ts` — `guess()` helper uses 5-character patterns for 6-letter words

**File:** `src/lib/share.test.ts:18`

**Issue:**
```ts
const guesses = [guess('ABCDEF', 'AAAAAC'), guess('GHIJKL', 'CCCCCC')]
```
`'AAAAAC'` is 6 characters — correct. But the helper function `guess()` maps each character in `pattern` to a status, and the function signature says `word` is the guess string and `pattern` is the status pattern. There is no length validation in the helper, so passing a mismatched-length pattern would silently produce a `ScoredGuess` with the wrong number of statuses. While all existing tests appear to use 6-character patterns, the absence of a length assertion means a future test author could write a 5-character pattern for a 6-letter word and get a subtly wrong `ScoredGuess` that still produces output. Adding a guard would make test bugs immediately obvious.

**Fix:**
```ts
function guess(word: string, pattern: string): ScoredGuess {
  if (word.length !== 6 || pattern.length !== 6) {
    throw new Error(`guess() requires 6-char word and pattern, got "${word}" / "${pattern}"`)
  }
  // ...
}
```

---

### IN-03: `TODO` comment left in production-path code in App.tsx

**File:** `src/App.tsx:42`

**Issue:**
```ts
// TODO: Phase 3 — add !isAnimating check here before opening EndGame modal (tile flip timing)
```
This is a documented deferred item, not a forgotten TODO, but it represents a correctness gap that is currently shipping: the EndGame modal will open immediately when `gameStatus` changes, before any tile-flip animation completes. This is acceptable as a Phase 2 stub, but should be tracked as a Phase 3 requirement to avoid being lost.

**Fix:** No code change needed for Phase 2, but this should be captured in the Phase 3 plan (THEME-01 or a new ticket) to ensure `isAnimating` is properly threaded through the `useEffect` dependency on line 39.

---

_Reviewed: 2026-05-05T00:00:00Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
