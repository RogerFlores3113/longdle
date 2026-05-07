# Phase 5: Practice Mode - Research

**Researched:** 2026-05-07
**Domain:** React SPA routing, Zustand store isolation, component reuse, in-memory state
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

- **D-01:** Detect `/random` via `window.location.pathname === '/random'` in `main.tsx`. Zero dependencies — no React Router needed.
- **D-02:** `main.tsx` renders `<PracticeGame />` when `isPractice` is true, otherwise renders `<App />`. The two component trees are fully separate — no shared state at the root level.
- **D-03:** Vercel's existing catch-all rewrite (`"source": "/(.*)"` → `"/index.html"`) already covers `/random`. No new `vercel.json` config needed, but the plan must confirm the catch-all is in place before closing this phase.
- **D-04:** New `src/hooks/usePracticeGame.ts` — a Zustand store with **NO** `persist()` middleware. Daily `useGame` store and `longdle-game-state` localStorage key are never touched during a practice session.
- **D-05:** Extract shared pure game-logic into `src/lib/gameCore.ts` (e.g., `buildOnKeyHandler`, scoring pipeline, hard mode validation). Both `useGame` and `usePracticeGame` call these helpers.
- **D-06:** Random word is picked at `usePracticeGame` module load via `ANSWERS[Math.floor(Math.random() * ANSWERS.length)]`. On "Play Again", a `resetPractice()` action re-rolls a new random word and resets board state.
- **D-07:** `useSettings` (colorblind mode, hard mode) is shared — practice game reads it just like the daily game.
- **D-08:** `recordGameEnd()` is **never called** in `usePracticeGame`. `longdle-stats` localStorage key is untouched.
- **D-09:** Banner is a full-width bar rendered between the app header and the board.
- **D-10:** Banner text: `"Practice Mode"` with a clickable link `"→ Play today's puzzle"` that navigates to `/`.
- **D-11:** Banner uses existing CSS tokens — `background: var(--color-surface)`, `color: var(--color-text)` — with a subtle bottom border or slight tint.
- **D-12:** Practice EndGame modal shows a **"Play Again"** button that calls `resetPractice()` on `usePracticeGame`.
- **D-13:** No share button in the practice EndGame modal.
- **D-14:** No "Go to daily puzzle" link in the EndGame modal.

### Claude's Discretion

None specified.

### Deferred Ideas (OUT OF SCOPE)

None — discussion stayed within phase scope.

Not in Phase 5: Stats modal for practice, practice history, sharing practice results, sound effects, red panda animations.
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| PRACTICE-01 | Visiting `/random` loads a practice game with a randomly selected word from the answer list | D-01/D-02: pathname detection in main.tsx + `<PracticeGame />` component; D-06: `ANSWERS[Math.random()*len]` at store load |
| PRACTICE-02 | Practice mode displays a visible "Practice Mode" banner distinguishing it from the daily puzzle | D-09/D-10/D-11: full-width banner between header and board using existing CSS tokens |
| PRACTICE-03 | Guesses made in practice mode do not affect daily stats, streaks, or localStorage game state | D-04/D-08: Zustand store with no `persist()` middleware; `recordGameEnd()` never called |
</phase_requirements>

---

## Summary

Phase 5 adds a `/random` route to the Longdle SPA that renders a fully isolated practice game. All locked decisions are confirmed against the actual codebase: the approach is straightforward and all integration points are well-understood.

The central technical work is (1) extracting duplicated game logic from `useGame.ts` into a shared `src/lib/gameCore.ts`, (2) creating `src/hooks/usePracticeGame.ts` as a Zustand store without `persist()`, (3) adding routing detection to `main.tsx`, and (4) building the `<PracticeGame />` component tree that mirrors `<App />` with a banner and a trimmed EndGame modal. The `vercel.json` catch-all rewrite is already in place and covers `/random` — no config change needed.

The primary risks are: (a) extracting too much into `gameCore.ts` such that `useGame` becomes a hollow wrapper adding no value, and (b) components currently hard-wired to `useGame` (Board, Keyboard, Toast, Key) needing to accept the store as a prop or context rather than importing `useGame` directly. This is the most significant structural decision: whether to prop-drill `onKey`/`keyStatuses` etc. or to create a React context.

**Primary recommendation:** Use a `GameContext` to make Board/Keyboard/Toast store-agnostic. This is the cleanest solution that avoids duplicating component files and avoids prop-drilling 5+ values through every component. The alternative — forking Board/Keyboard/Toast into Practice variants — creates immediate drift risk.

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Route detection | Browser / Client | — | `window.location.pathname` check at SPA entry point, before React renders |
| Practice game state | Browser / Client | — | In-memory Zustand store, no persistence, no backend |
| Stats isolation | Browser / Client | — | Ensured by never calling `recordGameEnd()` and omitting `persist()` |
| Practice banner | Browser / Client | — | Pure UI, rendered inside `<PracticeGame />` component tree |
| Word selection (random) | Browser / Client | — | `ANSWERS` array indexed by `Math.random()` — no server needed |
| CSS tokens / theming | Browser / Client | — | Phase 3 contract: all colors in `:root` in `tiles.css` — banner reuses same tokens |

---

## Standard Stack

All libraries used in this phase are already installed. No new npm dependencies.

### Core (already installed)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| React 19 | 19.x | Component rendering | Project stack |
| Zustand 5 | 5.x | In-memory practice store (no persist) | Project stack — same pattern as `useGame` minus `persist()` |
| TypeScript | 5.x | Type safety across new files | Project stack |

### No New Dependencies
This phase adds zero new npm packages. All required APIs (`window.location.pathname`, `Math.random()`, React context) are native.

---

## Architecture Patterns

### System Architecture Diagram

```
window.location.pathname
         │
         ▼
      main.tsx
    isPractice?
    /          \
   yes          no
    │            │
    ▼            ▼
<PracticeGame> <App>
    │
    ├── <header> (same markup as App header)
    ├── <PracticeBanner>  ← "Practice Mode" + "→ Play today's puzzle" link
    ├── GameContext.Provider (value = usePracticeGame selectors)
    │       ├── <Board />        (reads context, unchanged)
    │       ├── <Keyboard />     (reads context, unchanged)
    │       └── <Toast />        (reads context, unchanged)
    ├── <PracticeEndGameModal>   ← custom: "Play Again" only, no share
    └── <SettingsModal />        (reads useSettings — shared, unchanged)
```

### Recommended Project Structure

```
src/
├── lib/
│   ├── gameCore.ts        # NEW — extracted pure logic shared by useGame + usePracticeGame
│   ├── scoring.ts         # unchanged
│   ├── wordSelection.ts   # unchanged
│   ├── hardMode.ts        # unchanged
│   ├── storage.ts         # unchanged — never touched by practice path
│   └── share.ts           # unchanged
├── hooks/
│   ├── useGame.ts         # refactored to call gameCore helpers
│   ├── usePracticeGame.ts # NEW — Zustand, no persist()
│   └── useKeyboardListener.ts  # NEW variant or made generic
├── contexts/
│   └── GameContext.ts     # NEW — makes Board/Keyboard/Toast store-agnostic
├── components/
│   ├── PracticeGame.tsx        # NEW — root for /random tree
│   ├── PracticeBanner.tsx      # NEW — full-width bar
│   ├── PracticeEndGameModal.tsx # NEW — "Play Again" only
│   ├── Board.tsx               # reads GameContext (refactored from useGame import)
│   ├── Keyboard.tsx            # reads GameContext (refactored)
│   ├── Key.tsx                 # reads GameContext.onKey (refactored)
│   └── Toast.tsx               # reads GameContext.toastMessage (refactored)
```

### Pattern 1: Pathname-Based Route Detection (D-01, D-02)

**What:** Check `window.location.pathname` in `main.tsx` before React renders; conditionally mount `<PracticeGame />` or `<App />`.

**When to use:** Single-page apps with 1–2 routes, no need for React Router.

**Example:**
```typescript
// src/main.tsx
// [VERIFIED: current codebase — main.tsx currently has no routing]
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { PracticeGame } from './components/PracticeGame.tsx'

const isPractice = window.location.pathname === '/random'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {isPractice ? <PracticeGame /> : <App />}
  </StrictMode>,
)
```

### Pattern 2: In-Memory Zustand Store (No Persist)

**What:** Create a Zustand store that behaves identically to `useGame` but omits the `persist()` middleware wrapper. State lives in module memory, cleared on page navigation.

**When to use:** Any practice/ephemeral state that must NOT survive refresh or touch localStorage.

**Example:**
```typescript
// src/hooks/usePracticeGame.ts
// [VERIFIED: Zustand docs — create() without persist() = in-memory only]
import { create } from 'zustand'
import { ANSWERS } from '../data/words'
import { buildOnKeyHandler, upgradeKeyStatuses } from '../lib/gameCore'
import type { GameStatus, ScoredGuess, KeyStatus } from '../types/game'

function pickRandom(): string {
  return ANSWERS[Math.floor(Math.random() * ANSWERS.length)]
}

export interface PracticeGameState {
  answer: string
  guesses: ScoredGuess[]
  currentGuess: string
  gameStatus: GameStatus
  isAnimating: boolean
  toastMessage: string | null
  rowShakeKey: number
  keyStatuses: Record<string, KeyStatus>
  onKey: (key: string) => void
  resetPractice: () => void
}

export const usePracticeGame = create<PracticeGameState>()((set, get) => ({
  answer: pickRandom(),
  guesses: [],
  currentGuess: '',
  gameStatus: 'playing',
  isAnimating: false,
  toastMessage: null,
  rowShakeKey: 0,
  keyStatuses: {},

  onKey: buildOnKeyHandler(set, get, { isPractice: true }),

  resetPractice: () => set({
    answer: pickRandom(),
    guesses: [],
    currentGuess: '',
    gameStatus: 'playing',
    isAnimating: false,
    toastMessage: null,
    rowShakeKey: 0,
    keyStatuses: {},
  }),
}))
```

**Note:** The `answer` field is stored in the practice store state (not recomputed via `getDailyAnswer`) because there is no day-index involved — it is just the random word picked at load time or on reset.

### Pattern 3: GameContext to Decouple Components (D-05)

**What:** Create a React context whose value matches the shape expected by Board, Keyboard, Toast, and Key. Both `useGame` and `usePracticeGame` conform to the same interface. Components read from context instead of importing a specific store.

**When to use:** When multiple stores need to power the same component tree without forking component files.

**Example:**
```typescript
// src/contexts/GameContext.ts
// [ASSUMED — pattern follows React context best practices]
import { createContext, useContext } from 'react'
import type { ScoredGuess, KeyStatus, GameStatus } from '../types/game'

export interface GameContextValue {
  guesses: ScoredGuess[]
  currentGuess: string
  gameStatus: GameStatus
  isAnimating: boolean
  toastMessage: string | null
  rowShakeKey: number
  keyStatuses: Record<string, KeyStatus>
  onKey: (key: string) => void
}

export const GameContext = createContext<GameContextValue | null>(null)

export function useGameContext(): GameContextValue {
  const ctx = useContext(GameContext)
  if (!ctx) throw new Error('useGameContext must be used inside a GameContext.Provider')
  return ctx
}
```

Components (`Board`, `Keyboard`, `Key`, `Toast`) replace their `useGame(s => s.xxx)` calls with `useGameContext().xxx`.

`App` wraps children with `<GameContext.Provider value={gameContextValue}>` where `gameContextValue` is derived from `useGame` selectors.

`PracticeGame` wraps children with `<GameContext.Provider value={practiceContextValue}>` derived from `usePracticeGame`.

### Pattern 4: gameCore.ts — Extracted Pure Logic (D-05)

**What:** Move the non-trivial logic from `useGame.ts` into standalone functions in `gameCore.ts`. Both stores call these helpers.

**Candidates for extraction (verified in `useGame.ts`):**
- `upgradeKeyStatus(prev, next)` — key color upgrade rule (lines 25–33)
- `showToast(msg, set)` — toast show + auto-dismiss timer pattern (lines 230–237)
- `triggerShake(set, get)` — rowShakeKey increment + timer (lines 246–257)
- The Enter-key submission logic — scoring, key-status update, win/loss detection — can be extracted as `processGuess(currentGuess, answer, guesses, keyStatuses, set, useSettings)` or similar

**What NOT to extract:** The `persist()` configuration, `onRehydrateStorage`, `getAnswer` (daily-specific), `resetForNewDay` (daily-specific). These remain in `useGame.ts`.

**Caution from CONTEXT.md:** "plan must not extract so much that `useGame` becomes a thin wrapper with no reduction in complexity." Extract the logic that is genuinely duplicated in `usePracticeGame`, not everything.

### Pattern 5: useKeyboardListener Generalization

**What:** `useKeyboardListener.ts` currently hard-imports `useGame.getState().onKey`. In the practice context, it needs to call `usePracticeGame.getState().onKey` instead.

**Options (two viable approaches):**

1. **Accept `onKey` as a parameter:**
```typescript
// src/hooks/useKeyboardListener.ts refactored
export function useKeyboardListener(onKey: (key: string) => void): void {
  useEffect(() => {
    function handler(e: KeyboardEvent) {
      if (e.metaKey || e.ctrlKey || e.altKey) return
      const k = e.key
      if (k === 'Enter' || k === 'Backspace' || k === 'Delete') {
        e.preventDefault()
        onKey(k)
        return
      }
      if (/^[a-zA-Z]$/.test(k)) {
        e.preventDefault()
        onKey(k.toLowerCase())
      }
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [onKey])
}
```
Then `App.tsx` calls `useKeyboardListener(useGame.getState().onKey)` and `PracticeGame.tsx` calls `useKeyboardListener(usePracticeGame.getState().onKey)`.

2. **Alternatively** keep current `useKeyboardListener` unchanged, create `usePracticeKeyboardListener` pointing at `usePracticeGame`.

Option 1 is cleaner — single hook, no fork. [ASSUMED — both approaches are valid]

### Pattern 6: PracticeEndGameModal

**What:** Minimal modal mirroring `EndGameModal` but with "Play Again" button and no share/stats.

**Verified shape of existing EndGameModal (from `src/components/EndGameModal.tsx`):**
- Uses `<Modal>` wrapper
- Shows result text ("Brilliant!" or "The word was XXXXX")
- Shows `<WinAnimation>` on win
- Shows "Share" + "See Stats" action buttons

**Practice version omits:** share button (D-13), "See Stats" button, stats callback prop, `onCopyFallback`, `onShareSuccess`. Adds: "Play Again" button calling `resetPractice()`.

```typescript
// src/components/PracticeEndGameModal.tsx
interface PracticeEndGameModalProps {
  onClose: () => void
  answer: string
  won: boolean
  guessCount: number
  onPlayAgain: () => void
}
```

### Anti-Patterns to Avoid

- **Touching `longdle-game-state` or `longdle-stats` from practice path:** The isolation guarantee (PRACTICE-03) is structural — enforced by never importing `recordGameEnd`, never using `persist()` in `usePracticeGame`. A linter check in code review is sufficient.
- **Forking Board/Keyboard/Toast into practice variants:** Creates two files to maintain per component. Use GameContext instead.
- **Calling `useGame` from `PracticeGame.tsx` or its children:** If GameContext is implemented correctly, children never need to know which store backs them. Any `useGame` import inside the practice tree is a bug.
- **Persisting the random answer:** Storing `answer` in localStorage in practice mode (even accidentally via a misconfigured `persist` call) would be a PRACTICE-03 violation. The absence of `persist()` is the structural guard.
- **Async clipboard write in practice share (if added later):** CLAUDE.md requires synchronous clipboard write. Currently not in scope (D-13), but note for future.
- **Using `window.location.href = '/random'` for internal navigation:** The banner link `→ Play today's puzzle` should use `<a href="/">` for standard browser semantics, not JS navigation.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| In-memory ephemeral state | Custom React reducer + ref | Zustand without `persist()` | Same API as daily store, typed, DevTools-compatible |
| Tile scoring for practice | Duplicate `scoreTiles()` | Import from `src/lib/scoring.ts` | Already unit-tested, two-pass algorithm |
| Hard mode validation for practice | Duplicate `validateHardModeGuess()` | Import from `src/lib/hardMode.ts` | Already unit-tested |
| Keyboard → store wiring | Inline `document.addEventListener` in component | `useKeyboardListener(onKey)` (refactored) | Cleanup handled, modifier key guards in place |
| Random word selection | Custom shuffle | `ANSWERS[Math.floor(Math.random() * ANSWERS.length)]` | `ANSWERS` is already the curated list; `Math.random()` is sufficient for a 2-person game |

**Key insight:** Almost everything this phase needs already exists. The work is wiring, not building.

---

## Common Pitfalls

### Pitfall 1: Components Hard-Wired to useGame
**What goes wrong:** `Board`, `Keyboard`, `Key`, and `Toast` all directly `import { useGame }` and call `useGame(s => s.xxx)`. If left unchanged, they always read from the daily store — practice guesses update `usePracticeGame` but the components display stale daily state.
**Why it happens:** Components were written assuming a single store.
**How to avoid:** Introduce `GameContext` and refactor these four components to use `useGameContext()`. Both `App` and `PracticeGame` wrap their trees with the appropriate `GameContext.Provider`.
**Warning signs:** In the practice game, the board displays the daily game's guesses instead of the practice game's guesses.

### Pitfall 2: useKeyboardListener Still Points at useGame
**What goes wrong:** Physical keyboard input in practice mode routes to `useGame.onKey` instead of `usePracticeGame.onKey` — guesses appear in the daily game state.
**Why it happens:** `useKeyboardListener` currently hard-imports `useGame`.
**How to avoid:** Generalize `useKeyboardListener` to accept an `onKey` callback (see Pattern 5). `PracticeGame` passes `usePracticeGame`'s `onKey`.
**Warning signs:** Typing in `/random` updates the daily game; refreshing the daily game shows practice guesses.

### Pitfall 3: recordGameEnd Called in Practice Path
**What goes wrong:** If `gameCore.ts` calls `recordGameEnd()` internally (wrapped into a shared `processGuess` function), both daily and practice games write to stats.
**Why it happens:** Logic extracted into `gameCore.ts` might inadvertently include the `recordGameEnd` call.
**How to avoid:** `gameCore.ts` must NOT call `recordGameEnd()`. Stats recording stays in `useGame.ts` only, called after `processGuess` returns, guarded by a comment `// practice path: recordGameEnd intentionally omitted`.
**Warning signs:** Stats increment after practice games.

### Pitfall 4: Module-Scoped Timer Refs Shared Between Stores
**What goes wrong:** `useGame.ts` uses module-scoped `toastTimer`, `shakeTimer`, `flipTimer` refs. If `usePracticeGame.ts` imports these or declares its own at the same scope, HMR may cause timer interference between stores.
**Why it happens:** Copy-paste from `useGame.ts` brings timer refs into `usePracticeGame.ts` at module scope.
**How to avoid:** `usePracticeGame.ts` declares its own private timer refs — separate variables, not shared with `useGame.ts`. The HMR `import.meta.hot.dispose()` cleanup pattern from `useGame.ts` should be replicated in `usePracticeGame.ts`.
**Warning signs:** Practice toast dismisses the daily game's toast, or vice versa.

### Pitfall 5: Banner CSS Breaks on Mobile
**What goes wrong:** Banner is full-width but uses `position: absolute` or similar, overlapping the board on small screens.
**Why it happens:** Incorrect CSS positioning instead of normal document flow.
**How to avoid:** Banner is a normal block element in the DOM order — between header and `<main>`. No absolute positioning. Uses `var(--color-surface)` background with a `border-bottom: 1px solid var(--color-border)` or similar subtle separator. Width is 100% in flow.
**Warning signs:** Banner overlaps tiles; board is pushed off-screen; banner disappears on scroll.

### Pitfall 6: Practice Game Opens EndGame Modal Automatically from App Logic
**What goes wrong:** `App.tsx` has a `useEffect` that auto-opens the EndGame modal when `gameStatus === 'won' || 'lost'`. If `<PracticeGame />` accidentally renders inside `<App />` or shares the effect, the practice game triggers the daily EndGame modal.
**Why it happens:** Incorrect component tree structure — not honoring the D-02 "fully separate trees" decision.
**How to avoid:** `<PracticeGame />` is the root component for `/random` — `<App />` is never rendered in the practice path. `<PracticeGame />` has its own `useEffect` for auto-opening `<PracticeEndGameModal />`, watching `usePracticeGame`'s `gameStatus`.
**Warning signs:** Daily EndGame modal appears during practice; stats modal opens after practice win.

---

## Code Examples

Verified patterns from the actual codebase:

### Vercel catch-all rewrite (already in place)
```json
// vercel.json — [VERIFIED: file read]
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```
The `/(.*)`  pattern covers `/random` — no change needed.

### Zustand store without persist (contrast with useGame)
```typescript
// [VERIFIED: useGame.ts lines 76-78 show how persist() wraps create()]
// Daily: create<GameState>()(persist((set, get) => ({ ... }), { name: GAME_STATE_KEY }))
// Practice: create<PracticeGameState>()((set, get) => ({ ... }))  ← no persist wrapper
```

### recordGameEnd isolation boundary
```typescript
// [VERIFIED: useGame.ts lines 162-164]
// In useGame.ts only — practice store must never call this:
if (gameStatus !== 'playing') {
  recordGameEnd(won, nextGuesses.length)  // writes longdle-stats
}
```

### Key component: onPointerDown pattern (Phase 4, already in place)
```typescript
// [VERIFIED: src/components/Key.tsx line 26]
// <button onPointerDown={() => onKey(value)} ...>
// After GameContext refactor, this becomes:
// const { onKey } = useGameContext()
// <button onPointerDown={() => onKey(value)} ...>
```

### Random word selection (D-06)
```typescript
// [VERIFIED: src/lib/wordSelection.ts — ANSWERS exported from words.ts]
// [VERIFIED: src/data/words.ts — ANSWERS is the exported answer array]
function pickRandom(): string {
  return ANSWERS[Math.floor(Math.random() * ANSWERS.length)]
}
```

### Auto-open EndGame pattern (from App.tsx, to replicate in PracticeGame)
```typescript
// [VERIFIED: src/App.tsx lines 38-42]
useEffect(() => {
  if ((gameStatus === 'won' || gameStatus === 'lost') && !isAnimating) {
    setActiveModal('endGame')
  }
}, [gameStatus, isAnimating])
// PracticeGame.tsx replicates this, reading from usePracticeGame
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `useGame` direct import in all components | `GameContext` providing store shape | Phase 5 | Components become store-agnostic |
| Single game tree (`<App />`) | Conditional root based on pathname | Phase 5 | `/random` gets fully isolated tree |
| All game logic in `useGame.ts` | Shared helpers in `gameCore.ts` | Phase 5 | Eliminates drift between daily and practice rules |

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | `GameContext` is the right decoupling mechanism (vs. forking components or prop-drilling) | Architecture Patterns, Pattern 3 | If prop-drilling chosen instead, component signatures change significantly — more files touched but no logic risk |
| A2 | `useKeyboardListener` is best generalized by accepting `onKey` as a parameter | Pattern 5 | If hook is forked instead, two hooks to maintain — low risk, just duplication |
| A3 | `buildOnKeyHandler` can be meaningfully extracted into `gameCore.ts` as a factory | Pattern 2 / Pattern 4 | If extraction is awkward (e.g., too many closure variables), inline logic in `usePracticeGame` instead — acceptable fallback |
| A4 | `<WinAnimation />` slot should be preserved in `<PracticeEndGameModal />` for consistency | Code Examples (EndGameModal shape) | If omitted, v3 integration has to touch both modal files — minor |

**Note:** A1–A3 are architectural choices within Claude's discretion (no locked decision covers them). The planner should implement the context approach (A1) as the primary plan but can note the prop-drilling alternative if simpler given actual component count.

---

## Open Questions

1. **How much logic to extract into gameCore.ts?**
   - What we know: `upgradeKeyStatus`, `showToast`, `triggerShake`, and the Enter-key submission block are all candidates. `usePracticeGame` needs the same behavior.
   - What's unclear: Whether `buildOnKeyHandler` (a function that returns the `onKey` handler) is the right shape, vs. extracting each sub-function individually and calling them from both stores.
   - Recommendation: Extract the four helpers individually (not a handler factory). This is simpler, more readable, and easier to test. Both `useGame.ts` and `usePracticeGame.ts` call the helpers in their own `onKey` implementations — which will be nearly identical but retain their local store references and timer refs.

2. **Should `<PracticeGame />` include the HowToPlay / Settings modals?**
   - What we know: D-07 says `useSettings` is shared. `<App />` includes `<SettingsModal />` and `<HowToPlayModal />`.
   - What's unclear: CONTEXT.md does not specify whether the practice game should expose settings and how-to-play.
   - Recommendation: Include `<SettingsModal />` (player may want colorblind/hard mode in practice) but omit `<HowToPlayModal />` auto-open (already seen on daily game; `hasSeenHowToPlay` will be true). Keep the settings icon in the practice header for parity. The how-to-play icon can be included or omitted — safe either way.

---

## Environment Availability

Step 2.6: SKIPPED — this phase is purely code changes. All external dependencies (Vercel, npm packages) are already installed and configured. No new tools, services, or runtimes required.

**Vercel rewrite confirmed:** `vercel.json` contains `"source": "/(.*)"` → `"/index.html"` — covers `/random`. [VERIFIED: file read]

---

## Sources

### Primary (HIGH confidence)
- `src/hooks/useGame.ts` — full source read; timer patterns, persist config, onKey logic, recordGameEnd call sites
- `src/components/EndGameModal.tsx` — full source read; modal shape, props interface, WinAnimation slot
- `src/App.tsx` — full source read; modal management pattern, useEffect auto-open pattern, component tree structure
- `src/components/Board.tsx` — full source read; useGame selector pattern, isAnimating, rowShakeKey usage
- `src/components/Keyboard.tsx` — full source read; keyStatuses selector pattern
- `src/components/Key.tsx` — full source read; onKey/onPointerDown pattern
- `src/components/Toast.tsx` — full source read; toastMessage selector pattern
- `src/hooks/useKeyboardListener.ts` — full source read; hard-import of useGame confirmed
- `src/lib/storage.ts` — full source read; recordGameEnd, STATS_KEY, GAME_STATE_KEY confirmed
- `src/lib/wordSelection.ts` — full source read; ANSWERS export, getDailyAnswer pattern
- `vercel.json` — confirmed catch-all rewrite covers /random [VERIFIED]
- `.planning/config.json` — `nyquist_validation: false` confirmed — Validation Architecture section omitted

### Secondary (MEDIUM confidence)
- `.planning/phases/05-practice-mode/05-CONTEXT.md` — locked decisions D-01 through D-14
- `.planning/REQUIREMENTS.md` — PRACTICE-01, PRACTICE-02, PRACTICE-03 requirement text
- `.planning/ROADMAP.md` — Phase 5 goal, success criteria, dependency on Phase 4

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all libraries already installed, no new deps
- Architecture: HIGH — full codebase read; integration points verified against actual source
- Pitfalls: HIGH — derived from actual code patterns observed (hard-wired useGame imports in every component)
- Extraction scope: MEDIUM — precise gameCore.ts boundary is a judgment call; see Open Questions

**Research date:** 2026-05-07
**Valid until:** 2026-06-07 (stable project — Zustand 5 + React 19 APIs stable)
