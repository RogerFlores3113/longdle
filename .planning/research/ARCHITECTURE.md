# Architecture Research — Longdle

**Domain:** 6-letter daily Wordle clone (React CSR, no backend, Vercel)
**Researched:** 2026-05-04
**Overall confidence:** HIGH (patterns are well-established across many open-source implementations)

---

## Component Hierarchy

The standard Wordle architecture decomposes into four top-level concerns: the board, the keyboard, modals, and the game logic hook. All game state lives in a single custom hook consumed by the root `App` component and passed down as props.

```
App
├── useGame (custom hook — owns all game state)
├── Header
│   ├── HelpButton (opens HowToPlayModal)
│   └── SettingsButton (opens SettingsModal)
├── Board
│   └── Row × 7
│       └── Tile × 6
├── Keyboard
│   └── Key (26 letter keys + Enter + Backspace)
├── HowToPlayModal
├── SettingsModal
│   ├── HardModeToggle
│   └── ColorblindModeToggle
└── EndGameModal
    ├── ResultSummary (win/loss message)
    ├── GuessDistributionChart
    └── ShareButton (emoji grid copy-to-clipboard)
```

### Component Boundaries

| Component | Responsibility | Receives | Emits |
|-----------|---------------|----------|-------|
| `App` | Root; owns modal visibility state; passes game state down | — | — |
| `useGame` | All game logic: input, validation, scoring, persistence | word, wordIndex | full game state + handlers |
| `Board` | Renders 7 rows of 6 tiles | `rows: TileState[][]`, `currentRow` | — |
| `Row` | Renders 6 tiles; applies flip animation on submit | `tiles: TileState[]`, `isActive` | — |
| `Tile` | Single letter cell; maps status → CSS class | `letter`, `status: TileStatus` | — |
| `Keyboard` | On-screen keyboard; mirrors key color state | `keyStatuses: Record<string, TileStatus>`, `onKey` | `onKey(key: string)` |
| `Key` | Single keyboard button | `label`, `status`, `onClick` | `onClick` |
| `EndGameModal` | Post-game stats + share | `stats`, `board`, `wordIndex` | `onClose` |
| `ShareButton` | Formats emoji grid → clipboard | `board`, `wordIndex`, `guessCount` | — |

### Data Flow Direction

```
useGame hook
    │
    ├──► Board (read-only: rows of resolved TileState)
    ├──► Keyboard (read-only: key status map)
    ├──► EndGameModal (read-only: stats snapshot)
    │
    └──◄ Keyboard / physical keyboard events (write: onKey handler)
```

State is unidirectional. The hook owns all mutations. Components are pure renderers. Physical keyboard events and on-screen key clicks funnel through the same `onKey(key: string)` handler — this is the single input seam.

---

## Game State Shape

```typescript
// ---- Enums / literals ----

type TileStatus = 'empty' | 'active' | 'correct' | 'present' | 'absent';
//  empty   = no letter typed yet
//  active  = letter typed, row not yet submitted
//  correct = right letter, right position (green)
//  present = right letter, wrong position (yellow)
//  absent  = letter not in word (grey)

type GameStatus = 'playing' | 'won' | 'lost';

// ---- Tile ----

interface TileState {
  letter: string;     // '' when empty
  status: TileStatus;
}

// ---- Core game state (owned by useGame) ----

interface GameState {
  // Board
  board: TileState[][];     // [7 rows][6 columns]; fully pre-allocated at init
  currentRow: number;       // 0–6; index of active guess row
  currentInput: string;     // letters typed so far in the active row (0–6 chars)

  // Outcome
  gameStatus: GameStatus;
  wordIndex: number;        // day index; deterministic; drives daily word selection

  // Keyboard colouring
  keyStatuses: Record<string, TileStatus>; // 'a' → 'correct' etc.

  // History (for validation + hard mode)
  submittedGuesses: string[]; // raw submitted words in order

  // Settings (persisted separately — see localStorage schema)
  hardMode: boolean;
  colorblindMode: boolean;
}
```

### Hard Mode Constraint State

Hard mode adds a derived constraint set that must be checked on each submission:

```typescript
interface HardModeConstraints {
  requiredLetters: { letter: string; minCount: number }[];  // from 'present' tiles
  lockedPositions: { position: number; letter: string }[];   // from 'correct' tiles
}
```

These are derived from `submittedGuesses` + the scored board on every guess; they are not stored separately in localStorage — they are recomputed from the board state on load.

---

## localStorage Schema

Two keys. Keep them namespaced with the app name to avoid collisions.

### Key 1: `longdle-game-state`

Persists the active session so a half-played game survives a page refresh. Overwritten after every valid guess submission.

```typescript
interface StoredGameState {
  wordIndex: number;        // which day this session belongs to
  board: TileState[][];     // full board including scored tiles
  currentRow: number;
  currentInput: string;
  gameStatus: GameStatus;
  keyStatuses: Record<string, TileStatus>;
  submittedGuesses: string[];
}
```

On app load: read this key, compare `wordIndex` to today's computed index. If they match, restore the session. If stale (different day), discard and start fresh.

### Key 2: `longdle-stats`

Persists lifetime statistics. Updated only when a game ends (win or loss).

```typescript
interface StoredStats {
  gamesPlayed: number;
  gamesWon: number;
  currentStreak: number;
  maxStreak: number;
  lastWonWordIndex: number | null; // used to detect broken streaks
  guessDistribution: number[];     // index 0 = won in 1 guess, index 6 = loss
  // length 7: indices 0–5 for wins (guesses 1–6), index 6 for losses
}
```

`guessDistribution[guessCount - 1]++` on win; `guessDistribution[6]++` on loss.

Streak logic: `currentStreak` increments if `lastWonWordIndex === todayIndex - 1` (consecutive days). Otherwise reset to 1 (or 0 on loss).

### Key 3: `longdle-settings`

User preferences, updated immediately on toggle.

```typescript
interface StoredSettings {
  hardMode: boolean;
  colorblindMode: boolean;
  hasSeenHowToPlay: boolean; // suppress modal after first visit
}
```

---

## Daily Word Selection Algorithm

The standard Wordle approach, adapted for Longdle's 6-letter word list:

```typescript
const EPOCH = new Date('2026-01-01').getTime(); // fixed launch date
const MS_PER_DAY = 86_400_000;

function getTodayWordIndex(): number {
  const now = new Date();
  // Use midnight UTC to keep all users on the same puzzle regardless of timezone
  const todayMidnightUTC = Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate()
  );
  return Math.floor((todayMidnightUTC - EPOCH) / MS_PER_DAY);
}

function getTodayWord(wordList: string[]): string {
  const index = getTodayWordIndex() % wordList.length;
  return wordList[index];
}
```

Key decisions in this algorithm:

- **UTC midnight normalization** — prevents a user in UTC+14 from seeing tomorrow's word. All players share the same puzzle on the same UTC date.
- **Modulo wrap** — if `wordIndex` exceeds the list length the list cycles rather than crashing. For a list of ~1,000–2,000 words this gives 3–5 years before repetition.
- **EPOCH = launch date** — Day 0 is the launch day's word. Changing the epoch shifts all past words; never change it post-launch.

### Word Bank File Structure

Two separate arrays in a single TypeScript module. This is the canonical two-list pattern from the original Wordle source:

```typescript
// src/data/words.ts

// List 1: valid daily answers — curated, not obscure, roughly 1000–2000 words
// Words are in a fixed stable order (NOT alphabetical — alphabetical order leaks
// the upcoming word to anyone reading the source; shuffle once at curation time)
export const ANSWERS: string[] = [
  'planet', 'bridge', 'candle', /* ... */
];

// List 2: additional valid guesses — broader dictionary for guess validation
// Does NOT include the ANSWERS list (they are the union, not the same list)
export const VALID_GUESSES: string[] = [
  'abcdef', 'bagnio', /* ... */
];

// Combined set used for guess validation (union)
export const VALID_WORDS = new Set([...ANSWERS, ...VALID_GUESSES]);
```

Why two lists?
- `ANSWERS` is curated: common, recognizable 6-letter words the target audience would know.
- `VALID_GUESSES` is permissive: allows obscure words as guesses without making them daily targets.
- The daily answer is drawn only from `ANSWERS`.
- Guess validation checks `VALID_WORDS` (the union).

Do NOT sort `ANSWERS` alphabetically in the source file — sequential alphabetical order makes upcoming answers trivially discoverable via source inspection.

---

## Tile Scoring Algorithm

The dual-pass algorithm correctly handles duplicate letters (the most common correctness bug in amateur implementations):

```typescript
function scoreTiles(guess: string, answer: string): TileStatus[] {
  const result: TileStatus[] = new Array(6).fill('absent');
  const answerLetters = answer.split('');
  const guessLetters = guess.split('');

  // Pass 1: mark exact matches (green); consume those answer positions
  for (let i = 0; i < 6; i++) {
    if (guessLetters[i] === answerLetters[i]) {
      result[i] = 'correct';
      answerLetters[i] = '#'; // consumed; prevents double-counting in pass 2
    }
  }

  // Pass 2: mark present (yellow) for remaining letters
  for (let i = 0; i < 6; i++) {
    if (result[i] === 'correct') continue;
    const idx = answerLetters.indexOf(guessLetters[i]);
    if (idx !== -1) {
      result[i] = 'present';
      answerLetters[idx] = '#'; // consume to avoid double-marking
    }
  }

  return result;
}
```

Keyboard key status update rule: a key adopts the highest-confidence status seen across all past guesses. Priority: `correct` > `present` > `absent`. Never downgrade a key from `correct` to `present`.

---

## Build Order

Build in dependency order — each layer depends only on what came before it.

### Step 1: Data Layer (no React)
Build first because everything else depends on it.
- `src/data/words.ts` — the two word lists (ANSWERS + VALID_GUESSES)
- `src/lib/wordSelection.ts` — `getTodayWordIndex`, `getTodayWord`, `isValidGuess`
- `src/lib/scoring.ts` — `scoreTiles` dual-pass algorithm
- `src/lib/hardMode.ts` — `deriveConstraints`, `validateHardModeGuess`
- `src/lib/localStorage.ts` — read/write helpers for all three storage keys

Unit-test `scoring.ts` and `wordSelection.ts` before touching React. These are pure functions with no dependencies.

### Step 2: Core Game Hook (`useGame`)
Build second. The hook is the central nervous system. Once it works, components become trivial.
- Initializes board state (pre-allocate 7×6 `TileState` grid)
- Loads/restores session from `longdle-game-state`
- Handles `onKey(key)`: append letter, backspace, or submit
- On submit: validate length, validate word, score tiles, update key statuses, check win/loss, persist
- Updates stats in `longdle-stats` on game end
- Exposes read-only state + `onKey` handler

### Step 3: Static UI Shell (no logic)
Build the rendering components against hardcoded stub state before wiring to the hook.
- `Tile` (pure; maps TileStatus → CSS class)
- `Row` (renders 6 tiles)
- `Board` (renders 7 rows)
- `Key` (pure; maps status → colour)
- `Keyboard` (renders three key rows)

These have zero game logic. Test them visually with mocked data.

### Step 4: Wire Hook to UI
Connect `useGame` to Board and Keyboard in `App`. At this point the game is playable.
- Pass `board` to `Board`
- Pass `keyStatuses` and `onKey` to `Keyboard`
- Wire physical keyboard listener in `App` (or in the hook via `useEffect`)

### Step 5: Modals and Settings
- `HowToPlayModal` — static content, show on first visit (`hasSeenHowToPlay` flag)
- `SettingsModal` — hard mode + colorblind toggles; persist to `longdle-settings`
- `EndGameModal` — stats display + share button

### Step 6: Emoji Share
- `ShareButton` — converts `board` + `wordIndex` + `guessCount` into the emoji grid string and calls `navigator.clipboard.writeText`

### Step 7: Theme and Polish
- Dark green jungle CSS custom properties
- Tile flip animations on submit
- Shake animation on invalid guess
- Toast notifications (invalid word, hard mode violation, win/loss message)
- Colorblind palette swap via CSS class on `<body>`

### Placeholder Hook for v3 Animation
Add a single `onGameEvent` callback prop to `EndGameModal` (or export a custom event from `useGame`) with payload `type: 'win' | 'loss'`. In v3, the red panda animation layer subscribes to this. The hook emits; the animation layer listens. No other components are modified.

---

## Anti-Patterns to Avoid

### 1. Storing the Answer Plainly in localStorage
The current game answer is derivable from the date + source code — that is unavoidable for a no-backend game. Do not additionally persist it as a plain string in localStorage where it is trivially visible in DevTools. The hook derives the answer at runtime from `wordIndex` on every load; there is no need to persist the answer itself.

### 2. Alphabetically-Ordered Answer List
Sorting `ANSWERS` alphabetically in the source file leaks upcoming answers to anyone who reads the built bundle in sequence. Randomize order once at curation time and commit that order.

### 3. Single-Pass Tile Scoring
The naive algorithm (check each position once) mis-handles repeated letters (e.g., guess `battle` against answer `little` — the first `t` would incorrectly show yellow when it should show grey because the `t` slot is already consumed by the correct `t`). Always use the two-pass approach.

### 4. UTC Offset Neglect
Computing today's word using `new Date()` local time means UTC+14 users see tomorrow's word. Normalize to `Date.UTC(...)` for the day boundary calculation.

### 5. Mutable Board Array
Treat the board as immutable in the hook. Always produce a new array on each state update (`board.map(...)`) to ensure React re-renders correctly and avoid stale closure bugs.

---

## Sources

- [React Game Design: Recreating Wordle — rozmichelle.com](https://www.rozmichelle.com/react-game-design-recreating-wordle/)
- [Building a Wordle clone using React — OpenReplay Blog](https://blog.openreplay.com/build-a-wordle-like-game-using-react/)
- [Wordle in React: Picking Up Where We Left Off — Cup of Code](https://dev.to/cupofcode/wordle-in-react-picking-up-where-we-left-off-39j6)
- [Wordle in React: Part 1 — Cup of Code](https://cupofcode.blog/wordle-in-react-part-1/)
- [Original Wordle answer list — cfreshman GitHub gist](https://gist.github.com/cfreshman/a03ef2cba789d8cf00c08f767e0fad7b)
- [Original Wordle allowed guesses — cfreshman GitHub gist](https://gist.github.com/cfreshman/cdcdf777450c5b5301e439061d29694c)
- [Wordle localStorage stats migration — DEV Community](https://dev.to/timothee/how-wordle-kept-your-streak-alive-when-it-migrated-to-the-nyts-website-170b)
- [josepholiveira/wordle-game — GitHub](https://github.com/josepholiveira/wordle-game)
- [sungchi/wordle (React + TypeScript + Tailwind) — GitHub](https://github.com/sungchi/wordle)
