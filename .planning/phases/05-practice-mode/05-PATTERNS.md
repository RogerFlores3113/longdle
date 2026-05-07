# Phase 5: Practice Mode - Pattern Map

**Mapped:** 2026-05-07
**Files analyzed:** 10 new/modified files
**Analogs found:** 9 / 10

---

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|---|---|---|---|---|
| `src/main.tsx` | config/entry | request-response | `src/main.tsx` (current) | exact (modify) |
| `src/lib/gameCore.ts` | utility | transform | `src/hooks/useGame.ts` (extract from) | role-partial |
| `src/hooks/usePracticeGame.ts` | store/hook | CRUD | `src/hooks/useGame.ts` | exact |
| `src/hooks/useKeyboardListener.ts` | hook | event-driven | `src/hooks/useKeyboardListener.ts` (current) | exact (modify) |
| `src/contexts/GameContext.ts` | provider | request-response | none | no analog |
| `src/components/PracticeGame.tsx` | component | request-response | `src/App.tsx` | role-match |
| `src/components/PracticeBanner.tsx` | component | request-response | none (simple element) | no analog |
| `src/components/PracticeEndGameModal.tsx` | component | request-response | `src/components/EndGameModal.tsx` | exact |
| `src/components/Board.tsx` | component | CRUD | `src/components/Board.tsx` (current) | exact (modify) |
| `src/components/Keyboard.tsx` + `Key.tsx` + `Toast.tsx` | component | event-driven | current files | exact (modify) |

---

## Pattern Assignments

### `src/main.tsx` (entry, pathname routing)

**Analog:** `src/main.tsx` (current, lines 1–10)
**Change:** Add pathname check before render; conditionally mount `<PracticeGame />` or `<App />`.

**Current pattern** (lines 1–10):
```typescript
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
```

**Target pattern** — add two lines before render:
```typescript
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

---

### `src/lib/gameCore.ts` (utility, pure logic extraction)

**Analog:** `src/hooks/useGame.ts` — extract these three helpers verbatim, no behavior change.

**`upgradeKeyStatus` to extract** (useGame.ts lines 25–33):
```typescript
import type { TileStatus } from './scoring'
import type { KeyStatus } from '../types/game'

const KEY_RANK: Record<KeyStatus, number> = { correct: 3, present: 2, absent: 1 }

export function upgradeKeyStatus(
  prev: KeyStatus | undefined,
  next: TileStatus
): KeyStatus | undefined {
  if (next === 'empty' || next === 'active') return prev
  const prevRank = prev ? KEY_RANK[prev] : 0
  const nextRank = KEY_RANK[next as KeyStatus]
  return nextRank > prevRank ? (next as KeyStatus) : prev
}
```

**`showToast` helper pattern** (useGame.ts lines 230–237) — parameterize the `set` function so each store passes its own:
```typescript
// Takes the store's set function and a timer ref holder; each store owns its own timer ref
export function showToast(
  msg: string,
  set: (partial: Partial<{ toastMessage: string | null }>) => void,
  timerRef: { current: ReturnType<typeof setTimeout> | null },
  toastMs = 1500
): void {
  if (timerRef.current) clearTimeout(timerRef.current)
  set({ toastMessage: msg })
  timerRef.current = setTimeout(() => {
    set({ toastMessage: null })
    timerRef.current = null
  }, toastMs)
}
```

**`triggerShake` helper pattern** (useGame.ts lines 247–257) — same parameterization:
```typescript
export function triggerShake(
  set: (partial: Partial<{ rowShakeKey: number }>) => void,
  get: () => { rowShakeKey: number },
  timerRef: { current: ReturnType<typeof setTimeout> | null },
  shakeMs = 350
): void {
  if (timerRef.current) clearTimeout(timerRef.current)
  set({ rowShakeKey: get().rowShakeKey + 1 })
  timerRef.current = setTimeout(() => {
    timerRef.current = null
  }, shakeMs)
}
```

**What NOT to extract into gameCore.ts:**
- `persist()` config, `onRehydrateStorage`, `resetForNewDay` — daily-specific, stays in `useGame.ts`
- `getDailyAnswer(dayIndex)` call — daily-specific
- `recordGameEnd()` call — daily-specific, MUST NOT appear in `usePracticeGame.ts`

---

### `src/hooks/usePracticeGame.ts` (store, in-memory, no persist)

**Analog:** `src/hooks/useGame.ts`

**Key structural difference:** `create()` with NO `persist()` wrapper (useGame.ts line 76–77 shows the daily pattern to NOT follow):
```typescript
// Daily (DO NOT copy this outer wrapper):
export const useGame = create<GameState>()(
  persist(
    (set, get) => ({ ... }),
    { name: GAME_STATE_KEY, ... }
  )
)

// Practice (correct pattern — no persist):
export const usePracticeGame = create<PracticeGameState>()((set, get) => ({
  // ... state and actions
}))
```

**Imports pattern** — copy useGame.ts lines 1–14, remove storage imports, add gameCore imports:
```typescript
import { create } from 'zustand'
import { scoreTiles } from '../lib/scoring'
import { validateHardModeGuess } from '../lib/hardMode'
import { VALID_WORDS, ANSWERS } from '../data/words'
import { upgradeKeyStatus, showToast, triggerShake } from '../lib/gameCore'
import { useSettings } from './useGame'
import type { ScoredGuess, KeyStatus, GameStatus } from '../types/game'
```

**Random word selection** (D-06) — module-level function:
```typescript
function pickRandom(): string {
  return ANSWERS[Math.floor(Math.random() * ANSWERS.length)]
}
```

**Timer refs pattern** — copy useGame.ts lines 64–74 verbatim but with SEPARATE variable names to avoid HMR interference:
```typescript
// Practice-store-scoped timers — SEPARATE from useGame.ts timers (Pitfall 4)
let practiceToastTimer: ReturnType<typeof setTimeout> | null = null
let practiceShakeTimer: ReturnType<typeof setTimeout> | null = null
let practiceFlipTimer: ReturnType<typeof setTimeout> | null = null

if (import.meta.hot) {
  import.meta.hot.dispose(() => {
    if (practiceToastTimer) clearTimeout(practiceToastTimer)
    if (practiceShakeTimer) clearTimeout(practiceShakeTimer)
    if (practiceFlipTimer) clearTimeout(practiceFlipTimer)
  })
}
```

**`onKey` handler pattern** — copy useGame.ts lines 91–176, with these changes:
1. Replace `getDailyAnswer(s.dayIndex)` with `s.answer` (random answer stored in state, D-06)
2. Remove `recordGameEnd(won, nextGuesses.length)` call entirely (D-08, Pitfall 3)
3. Replace `useGame.setState` with `usePracticeGame.setState` in the flipTimer callback
4. Use `practiceFlipTimer` / `practiceShakeTimer` / `practiceToastTimer` refs

**`resetPractice` action** (D-06, D-12):
```typescript
resetPractice: () => set({
  answer: pickRandom(),
  guesses: [],
  currentGuess: '',
  gameStatus: 'playing' as GameStatus,
  isAnimating: false,
  toastMessage: null,
  rowShakeKey: 0,
  keyStatuses: {},
}),
```

---

### `src/hooks/useKeyboardListener.ts` (hook, event-driven, generalize)

**Analog:** `src/hooks/useKeyboardListener.ts` (current, lines 1–32)

**Current pattern** — hard-wired to `useGame` (line 19):
```typescript
import { useEffect } from 'react'
import { useGame } from './useGame'

export function useKeyboardListener(): void {
  useEffect(() => {
    function handler(e: KeyboardEvent) {
      if (e.metaKey || e.ctrlKey || e.altKey) return
      const k = e.key
      if (k === 'Enter' || k === 'Backspace' || k === 'Delete') {
        e.preventDefault()
        useGame.getState().onKey(k)   // ← hard-wired, must change
        return
      }
      if (/^[a-zA-Z]$/.test(k)) {
        e.preventDefault()
        useGame.getState().onKey(k.toLowerCase())  // ← hard-wired, must change
      }
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [])
}
```

**Target pattern** — accept `onKey` callback parameter (Pattern 5 from RESEARCH.md):
```typescript
import { useEffect } from 'react'

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

**Callers after refactor:**
- `App.tsx`: `useKeyboardListener(useGame.getState().onKey)`  (or a stable ref via `useCallback`)
- `PracticeGame.tsx`: `useKeyboardListener(usePracticeGame.getState().onKey)`

---

### `src/contexts/GameContext.ts` (context/provider, no analog)

No existing analog. Create using React `createContext` + a typed interface matching `GameState` fields consumed by Board/Keyboard/Key/Toast.

**Interface shape** — derived from actual selector calls in the four components:
```typescript
// Board reads: guesses, currentGuess, gameStatus, rowShakeKey, isAnimating
// Keyboard reads: keyStatuses
// Key reads: onKey
// Toast reads: toastMessage
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

---

### `src/components/PracticeGame.tsx` (component, root for /random)

**Analog:** `src/App.tsx` (full file, lines 1–133)

**Imports pattern** — adapt App.tsx lines 1–16, swap `useGame` for `usePracticeGame`, add `GameContext`, remove share/stats imports:
```typescript
import { useState, useEffect } from 'react'
import { Board } from './Board'
import { Keyboard } from './Keyboard'
import { Toast } from './Toast'
import { SettingsModal } from './SettingsModal'
import { PracticeBanner } from './PracticeBanner'
import { PracticeEndGameModal } from './PracticeEndGameModal'
import { SettingsIcon } from './icons/SettingsIcon'
import { usePracticeGame } from '../hooks/usePracticeGame'
import { useSettings } from '../hooks/useGame'
import { useKeyboardListener } from '../hooks/useKeyboardListener'
import { GameContext } from '../contexts/GameContext'
import type { GameContextValue } from '../contexts/GameContext'
```

**Auto-open EndGame pattern** — copy App.tsx lines 38–42, reading from `usePracticeGame`:
```typescript
// Copy from App.tsx lines 38-42, change store to usePracticeGame
useEffect(() => {
  if ((gameStatus === 'won' || gameStatus === 'lost') && !isAnimating) {
    setActiveModal('practiceEndGame')
  }
}, [gameStatus, isAnimating])
```

**GameContext.Provider wiring** — wrap Board/Keyboard/Toast:
```typescript
// Derive context value from usePracticeGame selectors
const contextValue: GameContextValue = {
  guesses,
  currentGuess,
  gameStatus,
  isAnimating,
  toastMessage,
  rowShakeKey,
  keyStatuses,
  onKey,
}

return (
  <div className="app">
    <header className="app__header">
      {/* Same header markup as App.tsx lines 78–103, minus stats/help icons */}
      <span>Longdle</span>
      <div className="app__header-right">
        <button className="header-icon-btn" onClick={() => setActiveModal('settings')} aria-label="Settings">
          <SettingsIcon />
        </button>
      </div>
    </header>
    <PracticeBanner />
    <GameContext.Provider value={contextValue}>
      <main className="app__main">
        <Board />
        <Keyboard />
      </main>
      <Toast />
    </GameContext.Provider>
    {activeModal === 'settings' && <SettingsModal onClose={closeModal} />}
    {activeModal === 'practiceEndGame' && (
      <PracticeEndGameModal
        onClose={closeModal}
        answer={answer}
        won={gameStatus === 'won'}
        guessCount={guesses.length}
        onPlayAgain={() => { resetPractice(); closeModal() }}
      />
    )}
  </div>
)
```

**colorblind CSS class effect** — copy App.tsx lines 44–47 verbatim:
```typescript
useEffect(() => {
  document.documentElement.classList.toggle('colorblind', colorblindMode)
}, [colorblindMode])
```

---

### `src/components/PracticeBanner.tsx` (component, no direct analog)

No existing analog component — use App.tsx header markup style as reference for CSS class naming conventions. Banner is a plain block element in document flow (D-11, Pitfall 5 warning: no absolute positioning).

**Pattern** (CSS token usage from existing `:root` vars):
```typescript
export function PracticeBanner() {
  return (
    <div className="practice-banner">
      Practice Mode
      {' '}
      <a href="/" className="practice-banner__link">→ Play today's puzzle</a>
    </div>
  )
}
```

**CSS** (must use existing tokens — `var(--color-surface)`, `var(--color-text)`, `var(--color-border)`):
```css
.practice-banner {
  width: 100%;
  background: var(--color-surface);
  color: var(--color-text);
  border-bottom: 1px solid var(--color-border);
  text-align: center;
  padding: 0.4rem 1rem;
  font-size: 0.875rem;
}
```

---

### `src/components/PracticeEndGameModal.tsx` (component, trim of EndGameModal)

**Analog:** `src/components/EndGameModal.tsx` (full file, lines 1–54)

**Imports pattern** — copy EndGameModal.tsx lines 1–4, remove `useGame`/`useSettings`/`generateShareText`:
```typescript
import { Modal } from './Modal'
import { WinAnimation } from './WinAnimation'
```

**Props interface** — trimmed from EndGameModal (remove share/stats callbacks; add `onPlayAgain`):
```typescript
interface PracticeEndGameModalProps {
  onClose: () => void
  answer: string       // passed as prop; practice store has no getAnswer() method
  won: boolean
  guessCount: number
  onPlayAgain: () => void
}
```

**Core modal pattern** — copy EndGameModal.tsx lines 34–53, remove Share/See Stats buttons, add Play Again:
```typescript
export function PracticeEndGameModal({ onClose, answer, won, guessCount, onPlayAgain }: PracticeEndGameModalProps) {
  return (
    <Modal onClose={onClose} ariaLabel={won ? 'You won!' : 'Game over'}>
      <button className="modal-close" onClick={onClose} aria-label="Close">×</button>
      <p className="endgame-modal__result">
        {won ? 'Brilliant!' : `The word was ${answer.toUpperCase()}`}
      </p>
      {won && (
        <WinAnimation
          dayIndex={0}   // practice has no dayIndex; pass 0 as neutral value
          won={true}
          guessCount={guessCount}
        />
      )}
      <div className="endgame-modal__actions">
        <button className="share-btn" onClick={onPlayAgain}>Play Again</button>
      </div>
    </Modal>
  )
}
```

---

### `src/components/Board.tsx`, `Keyboard.tsx`, `Key.tsx`, `Toast.tsx` (refactor, context migration)

**Analog:** Each current file — change only the store import line.

**Board.tsx lines 1–3** (current):
```typescript
import { useEffect, useRef, useState } from 'react'
import { useGame } from '../hooks/useGame'       // ← remove
import { Row } from './Row'
```
**After refactor:**
```typescript
import { useEffect, useRef, useState } from 'react'
import { useGameContext } from '../contexts/GameContext'  // ← add
import { Row } from './Row'
```
Replace every `useGame((s) => s.xxx)` call (lines 8–12) with `const { guesses, currentGuess, gameStatus, rowShakeKey, isAnimating } = useGameContext()`.

**Keyboard.tsx lines 1–2** (current):
```typescript
import { useGame } from '../hooks/useGame'       // ← replace
import { Key } from './Key'
```
```typescript
import { useGameContext } from '../contexts/GameContext'  // ← add
import { Key } from './Key'
```
Replace `const keyStatuses = useGame((s) => s.keyStatuses)` with `const { keyStatuses } = useGameContext()`.

**Key.tsx lines 2 and 18** (current):
```typescript
import { useGame } from '../hooks/useGame'       // ← replace line 2
// ...
const onKey = useGame((s) => s.onKey)            // ← replace line 18
```
```typescript
import { useGameContext } from '../contexts/GameContext'
// ...
const { onKey } = useGameContext()
```

**Toast.tsx lines 2 and 5** (current):
```typescript
import { useGame } from '../hooks/useGame'       // ← replace line 2
// ...
const message = useGame((s) => s.toastMessage)   // ← replace line 5
```
```typescript
import { useGameContext } from '../contexts/GameContext'
// ...
const { toastMessage: message } = useGameContext()
```

**App.tsx** — must add `GameContext.Provider` wrapper after this refactor. App.tsx currently calls `useGame` selectors for `gameStatus` and `isAnimating` directly (lines 25–26) which is still fine — those are used for modal logic, not passed through context. But the Board/Keyboard/Toast children now read from context, so App must provide it:

```typescript
// App.tsx — derive contextValue from existing useGame selectors
const contextValue: GameContextValue = {
  guesses: useGame((s) => s.guesses),
  currentGuess: useGame((s) => s.currentGuess),
  gameStatus,                    // already selected on line 25
  isAnimating,                   // already selected on line 26
  toastMessage: useGame((s) => s.toastMessage),
  rowShakeKey: useGame((s) => s.rowShakeKey),
  keyStatuses: useGame((s) => s.keyStatuses),
  onKey: useGame((s) => s.onKey),
}
// Wrap <main> and <Toast> with <GameContext.Provider value={contextValue}>
```

---

## Shared Patterns

### Zustand selector pattern
**Source:** `src/hooks/useGame.ts` lines 76–88 (store shape) and `src/App.tsx` lines 25–26 (consumption)
**Apply to:** `usePracticeGame.ts`, `PracticeGame.tsx`
```typescript
// Consumption: subscribe to individual slices to minimize re-renders
const gameStatus = useGame((s) => s.gameStatus)
const isAnimating = useGame((s) => s.isAnimating)
// For practice: replace useGame with usePracticeGame, same selector pattern
```

### Modal close pattern
**Source:** `src/App.tsx` lines 22–23, 49–51
**Apply to:** `PracticeGame.tsx`
```typescript
const [activeModal, setActiveModal] = useState<ActiveModal>(null)
function closeModal() { setActiveModal(null) }
```

### Modal wrapper
**Source:** `src/components/Modal.tsx` lines 10–45
**Apply to:** `PracticeEndGameModal.tsx`
```typescript
// Always wrap modal content with <Modal onClose={onClose} ariaLabel="...">
// Modal provides: backdrop click-to-close, Escape key, role="dialog", aria-modal
```

### HMR timer disposal
**Source:** `src/hooks/useGame.ts` lines 68–74
**Apply to:** `usePracticeGame.ts` (separate timer variable names)
```typescript
if (import.meta.hot) {
  import.meta.hot.dispose(() => {
    if (practiceToastTimer) clearTimeout(practiceToastTimer)
    if (practiceShakeTimer) clearTimeout(practiceShakeTimer)
    if (practiceFlipTimer) clearTimeout(practiceFlipTimer)
  })
}
```

### Input guard pattern
**Source:** `src/hooks/useGame.ts` lines 93–95
**Apply to:** `usePracticeGame.ts` `onKey` implementation
```typescript
// C-5 / D-10: guard blocks input during animations or after game end
if (s.isAnimating || s.gameStatus !== 'playing') return
```

### CSS token usage
**Source:** Phase 3 contract — all tokens defined in `tiles.css` `:root`
**Apply to:** `PracticeBanner.tsx` (CSS class)
```css
/* Always use CSS custom properties, never hardcoded hex */
background: var(--color-surface);
color: var(--color-text);
border-bottom: 1px solid var(--color-border);
```

---

## No Analog Found

| File | Role | Data Flow | Reason |
|---|---|---|---|
| `src/contexts/GameContext.ts` | provider | request-response | No React context files exist in the codebase yet |
| `src/components/PracticeBanner.tsx` | component | request-response | No banner/notification components exist; closest is the `<Toast>` but it's a floating overlay, not a flow element |

---

## Critical Isolation Constraints

These are not patterns to copy — they are hard stops verified in the codebase:

| Constraint | Verified Location | What to NEVER do in practice path |
|---|---|---|
| `recordGameEnd()` is stats write | `src/lib/storage.ts` lines 48–65 | Never import or call from `usePracticeGame.ts` or `gameCore.ts` |
| `GAME_STATE_KEY` = `'longdle-game-state'` | `src/lib/storage.ts` line 2 | Never use as `persist()` name (practice store has no persist at all) |
| `STATS_KEY` = `'longdle-stats'` | `src/lib/storage.ts` line 3 | Never `localStorage.getItem/setItem` this key from practice path |
| `vercel.json` catch-all | `vercel.json` lines 3–5 | Already covers `/random` — confirmed, no change needed |

---

## Metadata

**Analog search scope:** `src/hooks/`, `src/components/`, `src/lib/`, `src/contexts/`, `src/main.tsx`
**Files scanned:** 14 source files read
**Pattern extraction date:** 2026-05-07
