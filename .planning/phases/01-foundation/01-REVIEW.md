---
phase: 01-foundation
reviewed: 2026-05-05T00:00:00Z
depth: standard
files_reviewed: 31
files_reviewed_list:
  - .gitignore
  - README.md
  - eslint.config.js
  - index.html
  - package.json
  - scripts/curate-words.ts
  - src/App.tsx
  - src/components/Board.tsx
  - src/components/EndGameBanner.tsx
  - src/components/Key.tsx
  - src/components/Keyboard.tsx
  - src/components/Row.tsx
  - src/components/Tile.tsx
  - src/components/Toast.tsx
  - src/hooks/useGame.test.ts
  - src/hooks/useGame.ts
  - src/hooks/useKeyboardListener.ts
  - src/index.css
  - src/lib/hardMode.test.ts
  - src/lib/hardMode.ts
  - src/lib/scoring.test.ts
  - src/lib/scoring.ts
  - src/lib/storage.ts
  - src/lib/wordSelection.test.ts
  - src/lib/wordSelection.ts
  - src/main.tsx
  - src/styles/tiles.css
  - src/test/setup.ts
  - src/types/game.ts
  - tsconfig.app.json
  - vite.config.ts
findings:
  critical: 4
  warning: 6
  info: 4
  total: 14
status: issues_found
---

# Phase 01: Code Review Report

**Reviewed:** 2026-05-05T00:00:00Z
**Depth:** standard
**Files Reviewed:** 31
**Status:** issues_found

## Summary

The foundation layer is largely correct. The two-pass scoring algorithm is properly implemented, UTC-only day indexing is correct, and the Zustand store architecture is sound. However, there are four blockers: a silent crash when `#root` is missing at startup, the `migrate` callback returning `undefined` in a way that breaks Zustand's persist contract, a hard-mode constraint bug that allows a yellow letter to be replayed in the same wrong position, and `recordGameEnd` writing stats on every replay (a won game is replayed on `resetForNewDay`). Additionally the game allows up to 7 guesses but the board only shows 7 rows while classic Wordle allows 6 — if the intent is 7 max guesses the board needs 7 rows (it has 7), but the constant `MAX_GUESSES = 7` is duplicated across two files with no shared definition.

---

## Critical Issues

### CR-01: Non-null assertion on `#root` crashes silently with no user feedback

**File:** `src/main.tsx:6`
**Issue:** `document.getElementById('root')!` suppresses TypeScript's null check. If the element is ever absent (malformed HTML deploy, CDN serving wrong file, test environment without jsdom `#root`), React throws an uncaught runtime error with no recovery path. The non-null assertion is the entire error-handling strategy.
**Fix:**
```typescript
const rootEl = document.getElementById('root')
if (!rootEl) throw new Error('Fatal: #root element not found. Check index.html.')
createRoot(rootEl).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
```

---

### CR-02: `migrate` returns `undefined as unknown as GameState` — violates Zustand persist contract

**File:** `src/hooks/useGame.ts:169-177` and `src/hooks/useGame.ts:240-248`
**Issue:** Zustand's `persist` middleware `migrate` callback is typed as `(persistedState: unknown, version: number) => S | Promise<S>`. Returning `undefined` cast through `as unknown as GameState` bypasses TypeScript but produces `undefined` at runtime. Zustand will attempt to spread `undefined` into the store, which either silently produces no-ops or throws depending on the version. The correct reset pattern is to return the store's initial values explicitly.
**Fix:**
```typescript
migrate: (_persisted, version) => {
  if (version !== SCHEMA_VERSION) {
    console.warn(`longdle: game-state v${version} != app v${SCHEMA_VERSION}, resetting`)
    // Return valid initial state rather than undefined
    return {
      version: SCHEMA_VERSION,
      dayIndex: getDayIndex(),
      guesses: [],
      currentGuess: '',
      gameStatus: 'playing' as GameStatus,
      isAnimating: false,
      toastMessage: null,
      rowShakeKey: 0,
      keyStatuses: {},
    } as unknown as GameState
  }
  return _persisted as GameState
},
```
Apply the same fix to the `useSettings` store's `migrate` callback (line 240–248).

---

### CR-03: Hard mode allows yellow letter to be reused in the exact position it was marked yellow

**File:** `src/lib/hardMode.ts:32-36`
**Issue:** The yellow constraint set only checks that the letter appears *somewhere* in the new guess (`newGuess.includes(letter)`). It does not check that the letter is placed at a *different* position than where it was yellow. Standard Wordle hard mode forbids reusing a yellow letter in the same position that produced the yellow. As written, if 'A' is yellow at position 2, the player may submit a guess with 'A' again at position 2 and pass hard mode validation — which is incorrect.

This is a correctness defect in game rules, not just a quality issue.

**Fix:**
```typescript
// Track yellow positions: letter -> set of positions where it was yellow
const yellowPositions = new Map<string, Set<number>>()

for (const pg of priorGuesses) {
  for (let i = 0; i < pg.statuses.length; i++) {
    if (pg.statuses[i] === 'correct') {
      greens.set(i, pg.guess[i])
    } else if (pg.statuses[i] === 'present') {
      yellows.add(pg.guess[i])
      if (!yellowPositions.has(pg.guess[i])) yellowPositions.set(pg.guess[i], new Set())
      yellowPositions.get(pg.guess[i])!.add(i)
    }
  }
}

// After the greens check, check yellows:
for (const letter of yellows) {
  // Must appear somewhere in the guess
  if (!newGuess.includes(letter)) {
    return `Guess must contain ${letter}`
  }
  // Must not be placed in a position where it was previously yellow
  const badPositions = yellowPositions.get(letter)!
  for (const pos of badPositions) {
    if (newGuess[pos] === letter) {
      return `Letter ${letter} cannot be in position ${pos + 1}`
    }
  }
}
```

---

### CR-04: `recordGameEnd` is called on game-end but stats will double-count on session resume

**File:** `src/hooks/useGame.ts:136-138`
**Issue:** Stats are written via `recordGameEnd` immediately after a game ends. However, the `onRehydrateStorage` callback only resets state when `dayIndex !== todayIndex` — meaning if the player finishes a game today and then refreshes the page, the persisted `gameStatus` is `'won'` or `'lost'` and no stats call is made (correct). But if the player's clock crosses midnight while the browser is open and then `resetForNewDay` is called manually (or by the rehydration path), a new game starts cleanly. This flow is fine.

The actual defect is subtler: `recordGameEnd` reads from `localStorage` and writes back immediately within `onKey`. Because `onKey` is also inside a Zustand `set` call that runs `persist`'s `partialize` and writes `longdle-game-state` to localStorage, there is a window where `readStats()` inside `recordGameEnd` reads from a stale stats entry if a previous `writeStats` write was still pending a microtask flush. In practice with synchronous `localStorage`, the race is zero-width — but the more concrete defect is:

`recordGameEnd` is called with `nextGuesses.length` (the count after the winning/losing guess). For a loss, `nextGuesses.length` equals `MAX_GUESSES` (7). `guessDistribution` is defined as length 7 with indices 0–5 = wins in 1–6 guesses, index 6 = losses. The winning guard is `if (won && guessCount >= 1 && guessCount <= 7)`. When `won=true` and the player wins on guess 7 (the last row), `guessCount=7` and `guessDistribution[6]` is incremented — but index 6 is documented as the **losses** bucket. A 7-guess win stomps on the losses counter.

**Fix:** The game allows 7 guesses (`MAX_GUESSES = 7`). If a 7-guess win is valid, the distribution array must be length 8 (indices 0–6 = wins in 1–7 guesses, index 7 = losses). Alternatively, reduce `MAX_GUESSES` to 6 to match standard Wordle, keeping the 7-slot distribution. The current combination is internally inconsistent.

```typescript
// Option A: reduce MAX_GUESSES to 6 in useGame.ts (standard Wordle)
const MAX_GUESSES = 6

// Option B: expand guessDistribution to length 8 in storage.ts
guessDistribution: [0, 0, 0, 0, 0, 0, 0, 0], // indices 0-6 wins, index 7 losses

// And update the write condition:
if (won && guessCount >= 1 && guessCount <= 6) {   // or <= 7 with 8-slot array
  next.guessDistribution[guessCount - 1]++
} else if (!won) {
  next.guessDistribution[next.guessDistribution.length - 1]++
}
```
Note also that the current code never increments the losses bucket at all — it only increments on wins.

---

## Warnings

### WR-01: `MAX_GUESSES` is duplicated across two files with no shared constant

**File:** `src/hooks/useGame.ts:18` and `src/components/Board.tsx:5`
**Issue:** Both files define `const MAX_GUESSES = 7`. If one is updated the other silently diverges, causing the board to render a different number of rows than the game logic allows (e.g., 6-row board with 7-guess logic leaves no empty row for the final guess, or shows an extra row after the game ends).
**Fix:** Export the constant from a shared location (e.g., `src/lib/scoring.ts` or a new `src/lib/constants.ts`) and import it in both consumers.

---

### WR-02: `onRehydrateStorage` mutates state directly — not a valid Zustand pattern

**File:** `src/hooks/useGame.ts:191-197`
**Issue:** The `onRehydrateStorage` callback receives the `state` object and calls `state.resetForNewDay?.()`. This mutates the store object directly during rehydration, which can conflict with Zustand's internal state reconciliation. The correct pattern for post-rehydration reset is to use `useGame.setState(...)` inside the callback, or use the second argument form `onRehydrateStorage: () => (state, error) => { if (!error && state && ...) useGame.setState({...}) }`.
**Fix:**
```typescript
onRehydrateStorage: () => (state, error) => {
  if (error || !state) return
  const todayIndex = getDayIndex()
  if (state.dayIndex !== todayIndex) {
    // Use setState to let Zustand handle the transition correctly
    useGame.setState({
      dayIndex: todayIndex,
      guesses: [],
      currentGuess: '',
      gameStatus: 'playing',
      toastMessage: null,
      isAnimating: false,
      rowShakeKey: 0,
      keyStatuses: {},
    })
  }
},
```

---

### WR-03: Module-level timer variables are not reset between test runs — causes timer bleed

**File:** `src/hooks/useGame.ts:56-57`
**Issue:** `toastTimer` and `shakeTimer` are module-scoped singletons. In test environments where the module is imported once but tests run sequentially, a timer set in one test can fire during a later test's assertion window if fake timers are not installed. The `useGame.test.ts` does not install fake timers (`vi.useFakeTimers()`). A toast timer from the `"Not enough letters"` test could clear `toastMessage` mid-assertion in a subsequent test.
**Fix:** Either move timers inside the store state (cleared on `resetForNewDay`) or install `vi.useFakeTimers()` in `beforeEach` and `vi.useRealTimers()` in `afterEach` in the test file:
```typescript
beforeEach(() => {
  vi.useFakeTimers()
  localStorage.clear()
  // ...
})
afterEach(() => {
  vi.useRealTimers()
})
```

---

### WR-04: `Tile` renders letter content for `active` status but not for `empty` — inconsistency that hides typed letters

**File:** `src/components/Tile.tsx:19`
**Issue:** `{status === 'empty' ? '' : letter}` suppresses letter rendering only for `empty`. This is correct for blank tiles. However, `Row.tsx` sets `status = 'active'` only when `isActive && letter && status === 'empty'` — if the letter is present, the status flips to `active`. The empty case is fine. But a tile at position `i` in the active row with no letter typed yet will have `letter = ''` (via `letters[i] ?? ''`) and `status = 'empty'`. The `Tile` renders `''` for `empty` — fine. The concern is that when `letter` is `''` and `status` happens to be `active` (impossible by current Row logic, but easily broken in a future refactor), `Tile` would render `''` for an active tile. This is a fragile implicit coupling.

More directly: `{status === 'empty' ? '' : letter}` renders the letter for ALL non-empty statuses including `active`. This is correct, but the condition should be `letter` alone (or `status !== 'empty' ? letter : ''`) to make intent clear and avoid rendering a space character if `letter` is somehow undefined.

**Fix:**
```typescript
{letter || null}
```

---

### WR-05: `EndGameBanner` calls `getAnswer()` unconditionally on every render even when `gameStatus === 'won'`

**File:** `src/components/EndGameBanner.tsx:5`
**Issue:** Both `gameStatus` and `getAnswer` are selected from the store on every render. When `gameStatus === 'won'`, the banner returns early without using `getAnswer`. But `getAnswer` is still subscribed, causing unnecessary re-renders if any store slice that `getAnswer` closes over changes. More critically, `getAnswer` is a function reference selected from the store — Zustand's selector equality check will always pass for stable function references, but calling `useGame((s) => s.getAnswer)` subscribes to the entire store slice containing `getAnswer`, which is stable. This is fine for now, but the pattern of selecting a function and calling it in render (rather than selecting the derived value) is an antipattern.
**Fix:**
```typescript
// Select the answer value directly; only compute when game is over
const answer = useGame((s) =>
  s.gameStatus !== 'playing' ? getDailyAnswer(s.dayIndex) : null
)
```

---

### WR-06: `isValidGuess` in `wordSelection.ts` accepts a `ReadonlySet<string>` but `useGame.ts` passes `VALID_WORDS` directly without calling `isValidGuess`

**File:** `src/hooks/useGame.ts:96` and `src/lib/wordSelection.ts:19-21`
**Issue:** `isValidGuess` was written as a pure, testable function but the game logic bypasses it and calls `VALID_WORDS.has(cg)` inline. This means: (1) the 6-length guard inside `isValidGuess` is not applied at the call site (though `cg` is guarded separately to be exactly 6 letters by the prior `cg.length < 6` check, so this is safe for now), and (2) `isValidGuess` is dead code in the production path. If the validation logic in `isValidGuess` ever diverges from the inline check, the utility function provides false safety in tests while the actual behavior differs.
**Fix:** Use `isValidGuess` at the call site:
```typescript
import { isValidGuess } from '../lib/wordSelection'
// ...
if (!isValidGuess(cg, VALID_WORDS)) {
  showToast('Not in word list', set)
  triggerShake(set, get)
  return
}
```

---

## Info

### IN-01: `index.html` title is placeholder text

**File:** `index.html:7`
**Issue:** `<title>longdle-scaffold</title>` is the Vite scaffold default. It should be updated to "Longdle" (or "Longdle — Daily Word Game") before any user-facing deployment.
**Fix:** `<title>Longdle</title>`

---

### IN-02: `@types/seedrandom` listed as devDependency but `seedrandom` itself is also in devDependencies — correct, but the runtime import in `curate-words.ts` runs via `tsx` so no bundle issue. Worth noting the `seedrandom` package is in devDependencies but is imported in a build script only.

**File:** `package.json:37`
**Issue:** No actual defect — `seedrandom` is only used in `scripts/curate-words.ts`, which runs outside the browser bundle. Noted for clarity.
**Fix:** No action required; informational only.

---

### IN-03: `hardMode.test.ts` does not test the case where a yellow letter is re-used in the same position it was yellow

**File:** `src/lib/hardMode.test.ts`
**Issue:** Given CR-03 above (the yellow-position constraint is missing from the implementation), there is no test case catching this regression. Even after CR-03 is fixed, the test suite should include:
```typescript
it('rejects guess that reuses yellow letter in the same position it was yellow', () => {
  const prior = [{
    guess: 'planet',
    statuses: ['absent', 'present', 'absent', 'absent', 'absent', 'absent'] as TileStatus[],
    // 'l' at index 1 was yellow
  }]
  // 'l' at index 1 again — should fail
  expect(validateHardModeGuess('glower', prior)).not.toBeNull()
})
```

---

### IN-04: `storage.ts` `recordGameEnd` loss path never writes to `guessDistribution`

**File:** `src/lib/storage.ts:60-62`
**Issue:** When `won === false`, `guessDistribution` is cloned but no index is incremented. Losses are tracked via `gamesPlayed - gamesWon` implicitly, but the `guessDistribution[6]` slot is documented as "losses" and is never written. Future stats UI that renders distribution slot 6 as the loss count will always display 0. This is a data integrity defect, not just style.
**Fix:**
```typescript
if (won && guessCount >= 1 && guessCount <= 6) {
  next.guessDistribution[guessCount - 1]++
} else if (!won) {
  next.guessDistribution[6]++  // losses bucket
}
```
(Coordinate with the `MAX_GUESSES` decision in CR-04.)

---

_Reviewed: 2026-05-05T00:00:00Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
