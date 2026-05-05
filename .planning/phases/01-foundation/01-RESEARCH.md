# Phase 1: Foundation — Research

**Researched:** 2026-05-04
**Domain:** Static React SPA — daily 6-letter Wordle clone (data layer + algorithms + playable game shell)
**Confidence:** HIGH

## Summary

Phase 1 is a greenfield foundation phase that delivers a fully playable (but unstyled-baseline) 6-letter Wordle clone. Every architectural decision is already locked in CONTEXT.md — the planner's job is to sequence the build, and this research's job is to (a) resolve the one genuine open question (word-list source), (b) verify the prescribed library versions are current, and (c) restate the load-bearing algorithms and pitfalls in a form the planner can paste into task descriptions.

There is no novel engineering here. Wordle has been cloned hundreds of times publicly and the canonical patterns are mature. The two correctness-critical algorithms (two-pass tile scoring, UTC day-index) and three persistence keys are fully specified in CLAUDE.md and `.planning/research/ARCHITECTURE.md`. The CONTEXT.md decisions resolve every other choice (Zustand `persist`, single store with three sections, no animations in Phase 1, `isAnimating` wired but inert, `document.addEventListener('keydown')` for physical keyboard).

**One material correction to CONTEXT.md:** The cfreshman GitHub gists referenced in CONTEXT.md D-01 are **5-letter Wordle word lists only** — there is no 6-letter cfreshman list. The viable 6-letter sources are documented below; the strongest is `lynn/hello-wordl`'s curated `targets.json` + `dictionary.json` filtered to length 6 (its curation philosophy — "remove obscure words, plurals, conjugated verbs, inappropriate language, British spellings" — exactly matches Longdle's stated curation rules).

**Primary recommendation:** Source ANSWERS from `lynn/hello-wordl/src/targets.json` filtered to 6 letters and shuffled; source VALID_GUESSES from `lynn/hello-wordl/src/dictionary.json` filtered to 6 letters (which, per its README, is the OTCWL Scrabble word list and is permissive). Both are derived from established curated corpora and match Longdle's philosophy without further hand-curation needed for v1.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Word List Sourcing**
- **D-01:** Source from cfreshman's public Wordle corpus (GitHub), filter to exactly 6-letter words. Target: ~1,800 answers (ANSWERS array), ~12,000 valid guesses (VALID_GUESSES array). Researcher should identify the exact raw GitHub URLs and produce the filtered lists.
  - **⚠ Researcher correction:** cfreshman's gists are 5-letter only. See "Word List Sourcing — Correction to D-01" below for the resolved 6-letter source.
- **D-02:** ANSWERS must NOT be sorted alphabetically in `src/data/words.ts` — sorting leaks upcoming words to anyone reading the JS bundle. Shuffle or use insertion order from original corpus.
- **D-03:** VALID_GUESSES includes all ANSWERS entries — a valid answer must also be a valid guess.

**Project Bootstrap**
- **D-04:** First executor step: `npm create vite@latest longdle -- --template react-ts` in the repo root. Then install: `zustand`, `@tailwindcss/vite`, `tailwindcss`, `vitest`, `@testing-library/react`, `@testing-library/user-event`, `jsdom`. Configure `vite.config.ts` with `@tailwindcss/vite` plugin and Vitest settings.

**Zustand Store Shape**
- **D-05:** Single Zustand store with `persist` middleware, structured as three logical sections matching three localStorage keys:
  - `longdle-game-state` — session state: `answer`, `guesses`, `currentGuess`, `gameOver`, `won`, `isAnimating`, `toastMessage`, `dayIndex`. Overwritten every guess.
  - `longdle-stats` — lifetime stats: `gamesPlayed`, `gamesWon`, `currentStreak`, `maxStreak`, `guessDistribution` (array of 7 ints). Written only on game end.
  - `longdle-settings` — preferences: `hardMode`, `colorblindMode`. Written on toggle.
  - Each section includes a `version: number` field (start at `1`) for migration.
- **D-06:** Persist only `longdle-game-state` and `longdle-settings` via Zustand's `persist` middleware. Stats written directly via the storage lib on game end (avoids partial-write issues on loss).

**Tile Color Reveal (Phase 1 vs Phase 3)**
- **D-07:** In Phase 1, tiles show color immediately on row submission — no flip animation. Apply CSS classes (`tile--correct`, `tile--present`, `tile--absent`) directly at React state update time. Flip animation deferred to Phase 3 (THEME-02).

**Invalid-Guess Feedback (Toast + Shake)**
- **D-08:** Toast: `toastMessage: string | null` in game store. Component renders a positioned `<div>` when non-null. Auto-dismiss via `setTimeout(1500ms)` — clear `toastMessage` to null. No animation library.
- **D-09:** Row shake: CSS class `row--shake` toggled on the active row for invalid guesses. CSS `@keyframes` defined in global stylesheet. Remove class after animation completes (350ms timeout or `animationend` listener).

**Keyboard Input**
- **D-10:** Physical keyboard: `document.addEventListener('keydown', handler)` registered in a `useEffect` inside `useGame`, cleaned up on unmount. No native `<input>` elements. Guard handler: `if (state.isAnimating || state.gameOver) return`.
- **D-11:** On-screen keyboard: `Key` component calls `useGame` action on click. Same guard applies.

**isAnimating Guard**
- **D-12:** Add `isAnimating: boolean` to game store state, initialized `false`. All key handlers (physical + on-screen) check this guard. Stays `false` throughout Phase 1.

**localStorage Schema**
- **D-13:** `version` field is a number starting at `1`. On load, check `version` against expected version; if missing or mismatched, treat as fresh start. Log a console warning on version mismatch. Migration logic added before first real deployment.

**Build Order**
- **D-14:** Mandatory build order: `words.ts` → `scoring.ts` + tests → `wordSelection.ts` + tests → `hardMode.ts` → `storage.ts` → `useGame.ts` → static UI shell → wire → smoke test.

### Claude's Discretion
- Exact word list file URL(s) — researcher resolves (see "Word List Sourcing" below)
- Specific Tailwind utility classes for tile/keyboard layout — planner decides
- Exact TypeScript types for `TileState`, `GuessResult` etc. — planner decides
- Test coverage targets — planner decides (scoring + day-index must have tests; components optional in Phase 1)

### Deferred Ideas (OUT OF SCOPE)
- Share emoji grid mechanic — Phase 2
- Stats modal — Phase 2
- How-to-play modal — Phase 2
- Settings modal (hard mode toggle, colorblind toggle) — Phase 2
- Colorblind mode palette — Phase 2
- WinAnimation stub component — Phase 2
- Dark green jungle theme — Phase 3
- Tile flip animation — Phase 3
- Row shake + bounce animation (the `@keyframes` themselves) — Phase 3
- Toast auto-dismiss animation — Phase 3
- Mobile-responsive polish — Phase 3
- Vercel deploy — Phase 3
- localStorage migration function — before first real deployment
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| GAME-01 | 6×7 grid with active row visually highlighted | UI-SPEC layout contract; pre-allocate `board: TileState[][]` (ARCHITECTURE) |
| GAME-02 | Color-coded tile feedback with two-pass duplicate handling | Two-pass `scoreTiles()` algorithm in CLAUDE.md + ARCHITECTURE; unit-tested before UI per D-14 |
| GAME-03 | On-screen keyboard updates to best color state (green > yellow > gray) | `keyStatuses: Record<string, TileStatus>` priority rule (ARCHITECTURE) |
| GAME-04 | Physical keyboard input (A-Z, Backspace, Enter) without `<input>` | `document.addEventListener('keydown')` per D-10; div tiles per PITFALLS #10 |
| DAILY-01 | Deterministic UTC day-index off fixed epoch (2026-05-04) | `getDayIndex()` snippet in CLAUDE.md; `EPOCH = new Date('2026-05-04T00:00:00Z').getTime()` |
| DAILY-02 | `Date.UTC()` only — never `new Date()` local time | CLAUDE.md mandate; PITFALLS #2 (timezone drift) — unit-test required per D-14 |
| DAILY-03 | Win message on correct guess; answer revealed on loss after 7; input disabled | UI-SPEC end-game contract (Phase 1 = inline text below board, no modal) |
| DAILY-04 | Row shake + toast on invalid guess | D-08 toast pattern; D-09 shake class (CSS `@keyframes` deferred to Phase 3) |
| DAILY-05 | In-progress game state persists across refresh | Zustand `persist` middleware on `longdle-game-state` (D-06) |
| WORDS-01 | Curated ~1,000–2,000 answer list, plurals/proper nouns/obscure removed | hello-wordl `targets.json` filtered to length 6 (already curated); see "Word List Sourcing" |
| WORDS-02 | Broader ~8,000–15,000 valid guess list | hello-wordl `dictionary.json` filtered to length 6 (~10–15K range expected); see "Word List Sourcing" |
| WORDS-03 | ANSWERS NOT alphabetically sorted in source | Shuffle once at curation time (D-02); commit shuffled order |
| WORDS-04 | Deterministic day-to-word mapping; no repeats until list exhausted | `ANSWERS[dayIndex % ANSWERS.length]` (ARCHITECTURE) |
</phase_requirements>

## Architectural Responsibility Map

Phase 1 is single-tier (browser/client only — no SSR, no API, no database). Capability ownership maps to layers within the SPA:

| Capability | Primary Layer | Secondary Layer | Rationale |
|------------|---------------|-----------------|-----------|
| Tile scoring (green/yellow/gray) | Pure lib (`src/lib/scoring.ts`) | — | Deterministic pure function; testable without React |
| Day-index → daily word | Pure lib (`src/lib/wordSelection.ts`) | — | Deterministic pure function; testable without React |
| Hard-mode constraint validation | Pure lib (`src/lib/hardMode.ts`) | — | Pure function; built in Phase 1 even though UI toggle is Phase 2 |
| localStorage read/write | Storage lib (`src/lib/storage.ts`) | Zustand `persist` middleware | Lib for direct stats writes (D-06); Zustand `persist` auto-handles game-state + settings |
| Game state (board, currentRow, etc.) | Zustand store (`src/hooks/useGame.ts`) | — | Single source of truth; React subscribes to slices |
| Physical keyboard listener | `useEffect` inside `useGame` | — | Document-level listener; cleanup on unmount per D-10 |
| Input mutation (typing, submit, backspace) | Zustand actions called via single `onKey(key)` seam | — | Same seam for physical + on-screen keyboards (ARCHITECTURE) |
| Render | Pure components (Tile, Row, Board, Key, Keyboard) | — | Read state, no side effects |
| Color CSS classes (`tile--correct` etc.) | CSS file + Tailwind utilities | CSS custom properties in `:root` | Phase 1 ships neutral palette; Phase 3 reskins via property override only |

**Why this matters for the planner:** Each lib file (`scoring.ts`, `wordSelection.ts`, `hardMode.ts`, `storage.ts`) is independently unit-testable. The mandatory build order (D-14) enforces tests-before-UI on the two correctness-critical libs. Components are pure renderers — putting any game logic in a component is an anti-pattern (PITFALLS — derived from ARCHITECTURE state-flow rule).

## Standard Stack

### Core (verified versions, npm registry, 2026-05-04)

| Library | Verified Latest | Purpose | Why Standard |
|---------|-----------------|---------|--------------|
| `vite` | 8.0.10 `[VERIFIED: npm view vite version]` | Build tool, dev server, HMR | De facto standard for React SPAs; auto-detected by Vercel; native ESM |
| `react` + `react-dom` | 19.2.5 `[VERIFIED: npm view react version]` | UI framework | Owner requirement; React 19 is GA |
| `typescript` | 5.x (template-managed) `[CITED: vite create react-ts template]` | Type safety | Catches state-shape and word-index errors at compile time |
| `zustand` | 5.0.13 `[VERIFIED: npm view zustand version]` | Game state + persistence | < 2 kB; built-in `persist` middleware writes to localStorage with version migration; better than Context for tile re-render granularity |
| `tailwindcss` | 4.2.4 `[VERIFIED: npm view tailwindcss version]` | Styling | v4 supports CSS custom properties (load-bearing for Phase 3 reskin) |
| `@tailwindcss/vite` | 4.2.4 `[VERIFIED: npm view @tailwindcss/vite version]` | Tailwind v4 Vite plugin | Zero-config — replaces `tailwind.config.js` + PostCSS pipeline |

### Test infrastructure (verified versions)

| Library | Verified Latest | Purpose | When to Use |
|---------|-----------------|---------|-------------|
| `vitest` | 4.1.5 `[VERIFIED: npm view vitest version]` | Unit test runner | Vite-native; reuses Vite config; Jest-compatible API |
| `@testing-library/react` | 16.3.2 `[VERIFIED: npm view @testing-library/react version]` | Component tests | Pairs with Vitest for component + keyboard-event tests |
| `@testing-library/user-event` | latest `[ASSUMED]` | Simulate keyboard events | Use for typing/Enter/Backspace integration tests if added |
| `@testing-library/jest-dom` | latest `[ASSUMED]` | DOM matchers | `toBeInTheDocument()`, `toHaveClass()` etc. |
| `jsdom` | 29.1.1 `[VERIFIED: npm view jsdom version]` | DOM environment for Vitest | `environment: 'jsdom'` in `vitest.config.ts` |

### Alternatives Considered (not for Phase 1)

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Pure CSS for animations | `motion/react` (formerly framer-motion) | Pure CSS suffices for shake/flip/bounce; CONTEXT.md defers all animations to Phase 3 anyway. Do not install `motion` in Phase 1. |
| Vitest | Jest | Vitest is Vite-native (no Babel transform); Jest works but adds a parallel config. STACK.md ruled out Jest. |
| Zustand `persist` | Custom localStorage wrapper or `use-local-storage-state` | `persist` natively handles version migration (matches D-13). Custom wrapper would duplicate this. |

### Installation (single command sequence)

```bash
npm create vite@latest longdle -- --template react-ts
cd longdle
npm install zustand
npm install -D vitest @testing-library/react @testing-library/user-event @testing-library/jest-dom jsdom
npm install tailwindcss @tailwindcss/vite
```

`vite.config.ts` minimum content (replaces template default):

```ts
// Source: STACK.md verified pattern; Tailwind v4 + Vite official guide
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
  },
})
```

`src/index.css` minimum (Tailwind v4 import — different from v3):

```css
/* Source: Tailwind v4 official docs */
@import "tailwindcss";
```

## Word List Sourcing — Correction to D-01

**Problem:** CONTEXT.md D-01 prescribes "cfreshman's public Wordle corpus filtered to 6 letters." Investigation shows cfreshman's well-known gists are **5-letter only**:

- `cfreshman/a03ef2cba789d8cf00c08f767e0fad7b` — original Wordle answers, 2,309 entries, all 5-letter `[VERIFIED: WebFetch]`
- `cfreshman/cdcdf777450c5b5301e439061d29694c` — original Wordle allowed guesses, 5-letter only `[VERIFIED: WebSearch + gist description]`
- `cfreshman/dec102adb5e60a8299857cbf78f6cf57` — Wordle allowed guesses + answers (1/15/21), 5-letter only `[VERIFIED: WebFetch]`

**Resolution: use `lynn/hello-wordl` as the sourced corpus.** `[VERIFIED: WebFetch of github.com/lynn/hello-wordl]`

`hello-wordl` is the most-cited curated Wordle clone for variable-length play. Its README states the curation philosophy verbatim matches Longdle's rules:

> "Manually curates the top 25,000 or so entries of Peter Norvig's English word frequency list to get rid of obscure words, plurals, conjugated verbs, inappropriate language, and British spellings."

Two files, both filterable to length 6:

| File | Raw URL | Role | Source corpus |
|------|---------|------|---------------|
| `targets.json` | `https://raw.githubusercontent.com/lynn/hello-wordl/main/src/targets.json` | ANSWERS pool (filter to length 6, then shuffle) | Norvig frequency list, manually curated |
| `dictionary.json` | `https://raw.githubusercontent.com/lynn/hello-wordl/main/src/dictionary.json` | VALID_GUESSES superset (filter to length 6) | OTCWL Scrabble tournament word list |

**Expected counts after filter to length 6:**
- ANSWERS: hello-wordl's `targets.json` is ~4,000+ entries across all lengths `[VERIFIED: WebFetch]`. The 6-letter slice is expected to be in the ~1,000–1,800 range, matching CONTEXT.md target. **This number must be confirmed at curation time** by the executor — it's a script output, not a research datum.
- VALID_GUESSES: OTCWL contains ~30,000 6-letter words `[CITED: OTCWL Scrabble tournament word list]`; after intersecting with hello-wordl's curated dictionary, expect ~10,000–15,000, matching CONTEXT.md target.

### Curation script (one-time, executor produces `src/data/words.ts`)

```ts
// Source: synthesized from hello-wordl source structure + WORDS-01/02/03 requirements
// One-time script, not shipped — produces src/data/words.ts

import targetsRaw from './targets.json'    // hello-wordl targets
import dictionaryRaw from './dictionary.json' // hello-wordl dictionary

// Step 1: filter to 6-letter, lowercase, alpha-only
const SIX = /^[a-z]{6}$/
const answers = targetsRaw.filter((w: string) => SIX.test(w))
const guesses = dictionaryRaw.filter((w: string) => SIX.test(w))

// Step 2: ensure ANSWERS ⊆ VALID_GUESSES (D-03)
const guessSet = new Set([...guesses, ...answers])
const validGuesses = [...guessSet]

// Step 3: shuffle ANSWERS so source order is NOT alphabetical (WORDS-03, D-02)
//         Use a fixed seed so the shuffle is reproducible across re-curations.
import seedrandom from 'seedrandom' // dev-only; not a runtime dep
const rng = seedrandom('longdle-2026-05-04')
for (let i = answers.length - 1; i > 0; i--) {
  const j = Math.floor(rng() * (i + 1))
  ;[answers[i], answers[j]] = [answers[j], answers[i]]
}

// Step 4: emit src/data/words.ts as two exported arrays
```

### Alternative sources (rejected)

| Source | Why rejected |
|--------|--------------|
| `dwyl/english-words` (479k words) | No curation — contains plurals, proper nouns, obscure words. Would require Longdle to do curation work hello-wordl has already done. `[VERIFIED: WebFetch]` |
| `jonathanwelton/word-lists` (29,874 6-letter words) | Derived from dwyl/english-words; same curation problem. No license declared. `[VERIFIED: WebFetch]` |
| `sindresorhus/word-list` (atebits/Words, MIT) | Common bad words filtered, but no plural/obscure/proper-noun curation. `[VERIFIED: WebFetch]` |
| Any cfreshman gist filtered to 6-letter | Not possible — cfreshman gists are exclusively 5-letter `[VERIFIED]` |

### License note

`lynn/hello-wordl` does not declare a top-level LICENSE file in its repo description `[ASSUMED — not verified beyond README]`. For a 2-person personal project, deriving a word list from a public source is low-risk, but the planner should add a task to verify the license (or fall back to dwyl/english-words + hand-curate) before public deployment in Phase 3. **This is an Assumption — see Assumptions Log A1.**

## Architecture Patterns

### System Architecture Diagram (Phase 1)

```
                         ┌──────────────────────┐
                         │  Physical keyboard   │
                         │  (document keydown)  │
                         └──────────┬───────────┘
                                    │
                         on-screen Key click
                                    │
                                    ▼
                         ┌──────────────────────┐
                         │  useGame.onKey(k)    │
                         │  ┌─ guard:           │
                         │  │  isAnimating ||   │
                         │  │  gameOver ─► drop │
                         │  └─ dispatch         │
                         └──────────┬───────────┘
                                    │
                                    ▼
       ┌────────────────────────────────────────────────────┐
       │  Zustand store (single, with persist middleware)    │
       │                                                      │
       │  ┌──────────────┐  ┌──────────────┐  ┌────────────┐ │
       │  │ game-state   │  │ stats        │  │ settings   │ │
       │  │ (persisted)  │  │ (NOT persist) │  │ (persisted)│ │
       │  └──────┬───────┘  └──────┬────────┘  └────────────┘ │
       └─────────┼─────────────────┼──────────────────────────┘
                 │                 │
   on-submit:    │                 │  on game end:
   call lib fns  │                 │  storage.writeStats()
                 ▼                 ▼
       ┌─────────────────┐  ┌──────────────────────────┐
       │ scoring         │  │ localStorage             │
       │ wordSelection   │  │  longdle-game-state (v1) │
       │ hardMode        │  │  longdle-stats      (v1) │
       │ storage         │  │  longdle-settings   (v1) │
       └────────┬────────┘  └──────────────────────────┘
                │
                ▼
       ┌─────────────────┐
       │ words.ts        │  (ANSWERS shuffled, VALID_GUESSES superset)
       └─────────────────┘

       Read-only state ──► Components: Board → Row → Tile, Keyboard → Key
                           (pure renderers; CSS classes drive all visuals)
```

Trace: physical keypress → document keydown listener → `onKey('a')` → store action `appendLetter` → store updates `currentGuess` → React re-renders the active row's Tile components with the new letter and `tile--active` class.

Trace (submit): physical Enter → `onKey('Enter')` → store action `submitGuess` → calls `scoring.scoreTiles(guess, answer)` → updates `guesses` array, `keyStatuses`, `currentRow`, possibly `gameOver`/`won` → Zustand `persist` middleware writes `longdle-game-state` to localStorage → on game end, `storage.writeStats()` writes `longdle-stats` directly.

### Recommended Project Structure

```
longdle/
├── src/
│   ├── data/
│   │   └── words.ts              # ANSWERS (shuffled), VALID_GUESSES, VALID_WORDS Set
│   ├── lib/
│   │   ├── scoring.ts            # scoreTiles() — two-pass; pure
│   │   ├── scoring.test.ts       # MUST exist before any UI is wired
│   │   ├── wordSelection.ts      # getDayIndex(), getDailyAnswer()
│   │   ├── wordSelection.test.ts # MUST exist; UTC timezone tests
│   │   ├── hardMode.ts           # validateHardModeGuess() — pure
│   │   ├── hardMode.test.ts      # optional in Phase 1 but cheap
│   │   └── storage.ts            # readStats, writeStats, version constants
│   ├── hooks/
│   │   └── useGame.ts            # Zustand store + persist; onKey actions
│   ├── components/
│   │   ├── Board.tsx
│   │   ├── Row.tsx
│   │   ├── Tile.tsx
│   │   ├── Keyboard.tsx
│   │   ├── Key.tsx
│   │   └── Toast.tsx
│   ├── styles/
│   │   └── tiles.css             # CSS custom properties + class definitions
│   ├── test/
│   │   └── setup.ts              # @testing-library/jest-dom registration
│   ├── App.tsx
│   ├── index.css                 # @import "tailwindcss";
│   └── main.tsx
├── vite.config.ts
├── tsconfig.json
├── package.json
└── (no vercel.json yet — Phase 3)
```

### Pattern 1: Two-Pass Tile Scoring (load-bearing — GAME-02)

**What:** Score 6 tiles into `correct` / `present` / `absent` while correctly handling repeated letters.
**When to use:** Every guess submission. Single source of truth — no other module duplicates this logic.

```ts
// Source: CLAUDE.md §"Tile Scoring" + ARCHITECTURE.md scoring algorithm
// File: src/lib/scoring.ts

export type TileStatus = 'empty' | 'active' | 'correct' | 'present' | 'absent'

export function scoreTiles(guess: string, answer: string): TileStatus[] {
  if (guess.length !== 6 || answer.length !== 6) {
    throw new Error('scoreTiles requires 6-letter strings')
  }

  const result: TileStatus[] = new Array(6).fill('absent')
  const answerLetters = answer.split('')      // mutable copy

  // Pass 1: greens. Consume the answer slot so pass 2 cannot reuse it.
  for (let i = 0; i < 6; i++) {
    if (guess[i] === answerLetters[i]) {
      result[i] = 'correct'
      answerLetters[i] = '#'                  // sentinel — '#' cannot collide with a-z
    }
  }

  // Pass 2: yellows from the *remaining* unmatched slots.
  for (let i = 0; i < 6; i++) {
    if (result[i] === 'correct') continue
    const idx = answerLetters.indexOf(guess[i])
    if (idx !== -1) {
      result[i] = 'present'
      answerLetters[idx] = '#'                // consume to prevent double-yellow
    }
  }

  return result
}
```

**Required test cases (executor MUST cover all of these before wiring UI per D-14):**

| Case | Guess | Answer | Expected | Why |
|------|-------|--------|----------|-----|
| Plain green | `planet` | `planet` | all `correct` | sanity |
| All absent | `xxyyzz` | `planet` | all `absent` | sanity |
| Plain yellow | `tenalp` | `planet` | all `present` | sanity |
| **Dup in guess, single in answer** | `little` | `bottle` | t1=absent, t2=correct (the second t lines up); see test fixture | **PITFALLS #1** — must not double-yellow |
| **Dup in both** | `mammae` | `mammal` | first 4 = correct, m5=absent, a6=absent (a/m already consumed) | both consumed in pass 1 |
| **Dup in guess, dup in answer (one green, one elsewhere)** | `eerier` | `revere` | r at pos 5 = correct (pos 5), other r = present, e dispersal | classic edge case |
| **Letter appears 3× in guess, 1× in answer** | `eeeeee` (ill-formed but valid for unit test) | `pelmet` | exactly one `correct` (pos 1, 'e' matches 'e'), rest `absent` | quota enforcement |

The planner should write these tests **before** any UI task starts. They are the only correctness gate Phase 1 has.

### Pattern 2: UTC Day-Index (load-bearing — DAILY-01, DAILY-02)

**What:** Map today's UTC calendar date to a stable integer index that drives daily-word selection.
**When to use:** App initialization; whenever current day must be compared to stored game's day.

```ts
// Source: CLAUDE.md §"Day-Index (timezone)" — verbatim
// File: src/lib/wordSelection.ts

import { ANSWERS } from '../data/words'

const EPOCH = new Date('2026-05-04T00:00:00Z').getTime()
const MS_PER_DAY = 86_400_000

export function getDayIndex(now: Date = new Date()): number {
  const utcToday = Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate()
  )
  return Math.floor((utcToday - EPOCH) / MS_PER_DAY)
}

export function getDailyAnswer(dayIndex: number = getDayIndex()): string {
  return ANSWERS[dayIndex % ANSWERS.length]   // % guards against index >= length
}

export function isValidGuess(word: string, validGuesses: Set<string>): boolean {
  return word.length === 6 && validGuesses.has(word)
}
```

**Required test cases for `getDayIndex` (D-14 mandates UTC tests):**

| Case | Input (`new Date(...)`) | Expected dayIndex | Why |
|------|--------------------------|-------------------|-----|
| Epoch midnight UTC | `2026-05-04T00:00:00Z` | 0 | epoch boundary |
| Epoch midnight UTC + 1ms | `2026-05-04T00:00:00.001Z` | 0 | sub-day stability |
| Epoch + 1 day UTC | `2026-05-05T00:00:00Z` | 1 | one-day step |
| Late evening Tokyo (UTC+9), still May 4 UTC | `2026-05-04T23:00:00Z` (= 2026-05-05 08:00 JST) | 0 | timezone immunity #1 |
| Early morning NYC (UTC-4), but May 5 UTC | `2026-05-05T03:00:00Z` (= 2026-05-04 23:00 EDT) | 1 | timezone immunity #2 — NYC player on May 4 evening sees the **next** word; this is correct UTC behavior |
| Far-future date | `2030-05-04T00:00:00Z` | 1461 (~4 years) | proves no overflow, modulo wrap works |

**Critical:** Test injection of `now` parameter — do NOT call `new Date()` inside tests. Pass an explicit Date instance to make tests timezone-independent of the test runner's clock. `[CITED: PITFALLS.md #2]`

### Pattern 3: Zustand Store with Three-Section Persist

**What:** Single store, three logical sections, two persisted keys, version field per section.
**When to use:** App-wide game state.

```ts
// Source: synthesized from D-05/D-06 + Zustand docs
// File: src/hooks/useGame.ts

import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { scoreTiles, type TileStatus } from '../lib/scoring'
import { getDayIndex, getDailyAnswer, isValidGuess } from '../lib/wordSelection'
import { VALID_WORDS } from '../data/words'

const SCHEMA_VERSION = 1

interface GameSlice {
  // game-state section (persisted as longdle-game-state)
  version: number
  dayIndex: number
  answer: string
  guesses: string[]              // submitted guesses, in order
  currentGuess: string           // active row buffer
  gameOver: boolean
  won: boolean
  isAnimating: boolean           // false in Phase 1; wired anyway (D-12)
  toastMessage: string | null

  // settings section (persisted as longdle-settings — separate persist instance)
  // For Phase 1 these can live on the same store with partial persist; planner decides.
  hardMode: boolean
  colorblindMode: boolean

  // actions
  onKey: (key: string) => void
  resetForNewDay: () => void
}

export const useGame = create<GameSlice>()(
  persist(
    (set, get) => ({
      version: SCHEMA_VERSION,
      dayIndex: getDayIndex(),
      answer: getDailyAnswer(),
      guesses: [],
      currentGuess: '',
      gameOver: false,
      won: false,
      isAnimating: false,
      toastMessage: null,
      hardMode: false,
      colorblindMode: false,

      onKey: (key: string) => {
        const s = get()
        if (s.isAnimating || s.gameOver) return    // D-10/D-11 guard
        // ... append / backspace / submit logic
      },

      resetForNewDay: () => set({
        guesses: [],
        currentGuess: '',
        gameOver: false,
        won: false,
        toastMessage: null,
        dayIndex: getDayIndex(),
        answer: getDailyAnswer(),
      }),
    }),
    {
      name: 'longdle-game-state',
      storage: createJSONStorage(() => localStorage),
      version: SCHEMA_VERSION,
      // partialize: only persist game-state slice, not settings
      partialize: (s) => ({
        version: s.version,
        dayIndex: s.dayIndex,
        answer: s.answer,
        guesses: s.guesses,
        currentGuess: s.currentGuess,
        gameOver: s.gameOver,
        won: s.won,
        // isAnimating, toastMessage are transient — do NOT persist
      }),
      // Per D-13: on version mismatch, treat as fresh start.
      migrate: (_persisted, version) => {
        if (version !== SCHEMA_VERSION) {
          console.warn(`longdle: storage v${version} != app v${SCHEMA_VERSION}, resetting`)
          return undefined as never  // returning undefined → Zustand uses initial state
        }
        return _persisted as GameSlice
      },
      // On rehydrate: if persisted dayIndex differs from today's, reset session
      onRehydrateStorage: () => (state) => {
        if (!state) return
        const todayIndex = getDayIndex()
        if (state.dayIndex !== todayIndex) {
          // It's a new day — reset session (stats/settings unaffected)
          state.resetForNewDay?.()
        }
      },
    }
  )
)
```

**Note on settings persistence:** D-05/D-06 specify `longdle-settings` as a separately persisted section. In Zustand, the cleanest way is **either** (a) two `create()` stores each with their own `persist`, or (b) one store with `partialize` writing only `longdle-game-state`, plus a second `persist` wrapper around a settings sub-store, or (c) one store with custom `storage` adapter that splits writes by key. The planner should pick (a) — two stores — for clarity. Stats use direct `storage.ts` writes per D-06, not Zustand persist.

### Pattern 4: Physical Keyboard Listener (D-10)

```ts
// Source: D-10 + PITFALLS.md #10 (no <input> elements)
// File: src/App.tsx (or src/hooks/useKeyboardListener.ts)

import { useEffect } from 'react'
import { useGame } from './hooks/useGame'

export function useKeyboardListener() {
  const onKey = useGame((s) => s.onKey)

  useEffect(() => {
    function handler(e: KeyboardEvent) {
      // Don't intercept browser shortcuts
      if (e.metaKey || e.ctrlKey || e.altKey) return

      const k = e.key
      if (k === 'Enter' || k === 'Backspace' || k === 'Delete') {
        e.preventDefault()
        onKey(k === 'Delete' ? 'Backspace' : k)   // Delete = Backspace per UI-SPEC
        return
      }
      if (/^[a-zA-Z]$/.test(k)) {
        e.preventDefault()
        onKey(k.toLowerCase())
      }
      // all other keys: ignore (no preventDefault per UI-SPEC interaction contract)
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [onKey])
}
```

### Anti-Patterns to Avoid

- **Single-pass tile scoring** — wrong for any guess with repeated letters. PITFALLS.md #1.
- **`new Date()` for day boundary** — uses local timezone; breaks two-player core value. PITFALLS.md #2.
- **Storing the answer in localStorage as plain text** — derivable at runtime from `dayIndex`; persisting it just makes spoilers easier in DevTools. ARCHITECTURE.md anti-pattern #1. (Note: D-05 lists `answer` in game-state. The planner can choose: persist it for restore-without-recompute, or omit it and recompute on rehydrate. **Recommendation: omit from `partialize`** — recompute via `getDailyAnswer(dayIndex)` on rehydrate. Cheaper and safer.)
- **Sorted ANSWERS array** — leaks upcoming words. Shuffle once at curation, commit shuffled order. WORDS-03.
- **Mutable board updates** — Zustand requires new array references for re-render. Use `[...guesses, newGuess]` not `guesses.push(...)`. ARCHITECTURE anti-pattern #5.
- **Native `<input>` elements for game tiles** — triggers mobile soft keyboard, intercepts focus. PITFALLS.md #10.
- **`await` inside the `onKey` Enter branch before any state mutation** — irrelevant for Phase 1 (no async work) but it primes a bad habit for Phase 2's clipboard write. CLAUDE.md §"Clipboard".
- **Forgetting `e.preventDefault()` on Enter/Backspace** — Backspace can trigger browser back-navigation in some contexts; Enter can submit a form if any ancestor `<form>` exists.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| State + localStorage sync | Custom `useEffect` reading/writing localStorage | Zustand `persist` middleware | Handles version migration, rehydration timing, JSON serialization, partial persistence. Hand-rolling is the source of PITFALLS.md #5 schema-drift bugs. |
| Word-list curation | Hand-pruning a 30k-word list | `lynn/hello-wordl` filtered to length 6 | Already curated by humans for Wordle-style play. Rebuilding curation is days of work for a 2-person audience. |
| Keyboard event handling | A Zustand subscription to `window` events | `document.addEventListener('keydown')` in `useEffect` | Standard React + DOM pattern. Adding a library is overhead. Zustand handles state, not DOM events. |
| Random shuffle for ANSWERS | Inline `Math.random()` shuffle in `words.ts` build | Seeded shuffle at curation time, committed | `Math.random()` produces a different order on every run, making the source file diff-noisy. A seeded shuffle gives a stable, reviewable order. |
| Toast component | Library (`react-hot-toast`, `sonner`) | One-off `<div>` driven by `toastMessage` state | One toast type, one message slot. A library is overkill. D-08 specifies the pattern. |
| Tile flip animation | JS animation library (motion, GSAP) | Pure CSS `@keyframes` — **deferred to Phase 3** | Not in Phase 1 scope at all. Do not install motion. STACK.md confirms. |

**Key insight:** Every "don't hand-roll" item above has a hand-rolled version that *appears* to work and breaks subtly. The library or canonical pattern handles the edge cases (rehydration race conditions, version migration, deterministic curation order). Use them.

## Common Pitfalls

### Pitfall 1: Duplicate-Letter Scoring (single-pass bug)

**What goes wrong:** Naive scoring — single loop checking "is letter in answer?" — marks all repeated guess letters yellow when only one should be.
**Why it happens:** No tracking of which answer slots are already "consumed" by green or earlier yellow.
**How to avoid:** Two-pass algorithm, sentinel-consume answer slots, tests for the cases listed in Pattern 1.
**Warning signs:** Tile colors look wrong on any guess with a repeated letter; users complain "the game is broken."
`[CITED: CLAUDE.md, PITFALLS.md #1, ARCHITECTURE.md scoring]`

### Pitfall 2: UTC Drift in Day-Index

**What goes wrong:** `new Date()` returns local time; player in Tokyo and player in NYC see different daily words for ~12 hours of overlap each day.
**Why it happens:** Default JS Date methods (`getMonth`, `getDate`) return local. `Date.UTC(...)` returns UTC milliseconds.
**How to avoid:** Use `getUTCFullYear`, `getUTCMonth`, `getUTCDate` — never local equivalents. Define EPOCH with a UTC ISO string ending in `Z`. CLAUDE.md gives the exact snippet.
**Warning signs:** Test with simulated dates 12+ hours apart UTC and verify dayIndex matches. Two players checking on the same UTC day get different words = bug.
`[CITED: CLAUDE.md §Day-Index, PITFALLS.md #2]`

### Pitfall 3: localStorage Schema Drift

**What goes wrong:** Schema change between deploys leaves old persisted data unreadable; app crashes on rehydrate or silently resets streaks.
**Why it happens:** No version field, or no migration path.
**How to avoid:** D-13 — `version: 1` field on every section. On version mismatch, log a warning and treat as fresh start. Migration logic added before public deploy.
**Warning signs:** Users report "my streak got wiped after the update."
`[CITED: PITFALLS.md #5, D-13]`

### Pitfall 4: Input Not Blocked on Game End

**What goes wrong:** After winning, pressing Enter starts another guess and the game state goes inconsistent.
**Why it happens:** Forgot to add `gameOver` to the input guard.
**How to avoid:** D-10 guard `if (state.isAnimating || state.gameOver) return` at the top of `onKey`. UI-SPEC §Interaction Contract.
**Warning signs:** End-game UI is correct but tile rows continue accepting letters.

### Pitfall 5: Stale Game State After Day Boundary

**What goes wrong:** User leaves Longdle open in a tab overnight. Next day, opening the tab restores yesterday's game (with yesterday's word) instead of today's puzzle.
**Why it happens:** `onRehydrateStorage` doesn't check `dayIndex` against `getDayIndex()` and reset on mismatch.
**How to avoid:** On rehydrate, compare persisted `dayIndex` to current; if different, call `resetForNewDay()`. See Pattern 3 above.
**Warning signs:** Day-1 streak counts day-0's puzzle as "today" — usability bug masquerading as a streak bug.

### Pitfall 6: Tailwind v4 Configuration Mistake (template default)

**What goes wrong:** Vite's `react-ts` template scaffolds Tailwind v3 conventions (or no Tailwind) and a `tailwind.config.js` is added unnecessarily, or `@tailwind base/components/utilities` directives are used instead of v4's `@import "tailwindcss"`.
**Why it happens:** v3 patterns are still the most-googled.
**How to avoid:** Use `@tailwindcss/vite` plugin (D-04, STACK.md). In `index.css`, use `@import "tailwindcss";` — NOT the three v3 directives. No `tailwind.config.js` needed unless customizing.
**Warning signs:** Utility classes do nothing; build emits no Tailwind CSS.
`[CITED: STACK.md, Tailwind v4 official docs]`

### Pitfall 7: ANSWERS Sorted Alphabetically

**What goes wrong:** `src/data/words.ts` ships alphabetically — DevTools inspection reveals tomorrow's word in 5 seconds.
**Why it happens:** Default behavior when filtering a sorted source list.
**How to avoid:** Curation script must shuffle (with seed) before emitting. WORDS-03, D-02.
**Warning signs:** Anyone who reads `words.ts` line N can see day N's answer.

## Code Examples

### Bootstrap commands (Step 1 of D-14)

```bash
# Source: STACK.md verified versions, D-04
npm create vite@latest longdle -- --template react-ts
cd longdle
npm install
npm install zustand
npm install -D vitest @testing-library/react @testing-library/user-event @testing-library/jest-dom jsdom
npm install tailwindcss @tailwindcss/vite
```

### Test setup (`src/test/setup.ts`)

```ts
// Source: @testing-library/jest-dom v6 README
import '@testing-library/jest-dom/vitest'
```

### Word-list module (`src/data/words.ts` shape)

```ts
// Source: ARCHITECTURE.md §Word Bank File Structure
// Output of curation script (executor produces; this file is the build artifact)

export const ANSWERS: readonly string[] = [
  // Shuffled (NOT alphabetical) — produced by curation script with seed 'longdle-2026-05-04'
  'planet', 'bridge', /* ... ~1,500 entries */
] as const

export const VALID_GUESSES: readonly string[] = [
  // Filtered to 6 letters from hello-wordl/dictionary.json; sorted is OK here
  // (it's a Set under the hood for lookup)
  'aalii', /* ... */
] as const

export const VALID_WORDS: ReadonlySet<string> = new Set([...ANSWERS, ...VALID_GUESSES])
```

### `useGame.onKey` action body (sketch)

```ts
// Source: synthesized from CLAUDE.md + UI-SPEC §Submission Flow + D-10
onKey: (key: string) => {
  const s = get()
  if (s.isAnimating || s.gameOver) return

  if (key === 'Backspace') {
    set({ currentGuess: s.currentGuess.slice(0, -1) })
    return
  }

  if (key === 'Enter') {
    if (s.currentGuess.length < 6) {
      showToast(set, 'Not enough letters')
      shake(set)
      return
    }
    if (!VALID_WORDS.has(s.currentGuess)) {
      showToast(set, 'Not in word list')
      shake(set)
      return
    }
    const guesses = [...s.guesses, s.currentGuess]
    const won = s.currentGuess === s.answer
    const gameOver = won || guesses.length >= 7
    set({
      guesses,
      currentGuess: '',
      won,
      gameOver,
    })
    // keyStatuses derived in selector or computed in same setter — planner decides
    if (gameOver) {
      // direct write to longdle-stats per D-06 (NOT via persist middleware)
      writeStatsOnGameEnd({ won, guessCount: guesses.length })
    }
    return
  }

  // Letter
  if (s.currentGuess.length < 6 && /^[a-z]$/.test(key)) {
    set({ currentGuess: s.currentGuess + key })
  }
},
```

`showToast` and `shake` are tiny helpers that set state and schedule a `setTimeout` to clear it — D-08, D-09.

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `framer-motion` | `motion` (`motion/react`) | 2025 — package renamed | If animation is added (Phase 3 or later), install `motion`, NOT `framer-motion`. Phase 1 needs neither. |
| Tailwind v3 + `tailwind.config.js` + `postcss.config.js` | Tailwind v4 + `@tailwindcss/vite` + `@import "tailwindcss"` | Tailwind v4 GA (2024) | Configuration shifts from JS file to CSS. Less boilerplate, faster builds. |
| Jest + Babel + ts-jest | Vitest (Vite-native) | Vite 4+ era | Vitest reuses Vite's transform pipeline; faster, simpler config. |
| CRA (`create-react-app`) | Vite (`npm create vite@latest`) | CRA archived 2023 | Do not use CRA. |
| Redux Toolkit for app state | Zustand for small apps | 2022+ | < 2 kB vs Redux's larger surface area; built-in persist; right-sized for Longdle. |
| React 18 | React 19 (GA) | 2024 | Vite template may scaffold 18; manually bump to 19 per owner requirement. |

**Deprecated/outdated:**
- `framer-motion` package name — replaced by `motion`.
- `tailwind.config.js` for default setups — Tailwind v4 needs no config file.
- `create-react-app` — archived; do not use.

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | `lynn/hello-wordl` license permits derivation of word lists for a personal project | Word List Sourcing — Correction to D-01 | Licensing exposure on Phase 3 public deploy. Mitigation: planner adds a license-verification task in Phase 3 (DEPLOY-01). Fallback: use `dwyl/english-words` (Unlicense) + hand-curate (1–2 days work). |
| A2 | Filtering hello-wordl `targets.json` to length 6 yields ~1,000–1,800 answers | Word List Sourcing — Correction to D-01 | Could yield significantly fewer or more. Mitigation: curation script logs the count; if outside ~800–2,500 range, planner re-evaluates source. |
| A3 | `@testing-library/user-event` and `@testing-library/jest-dom` latest versions are compatible with Vitest 4 + React 19 | Standard Stack | Likely correct (these are industry-standard pairings). Mitigation: planner verifies installation succeeds without peer-dep warnings; if breakage, pin versions. |
| A4 | Zustand `persist` `migrate` returning `undefined` causes initial state to be used | Pattern 3 (store) | If wrong, behavior on version mismatch could differ. Mitigation: planner verifies against current Zustand 5 docs at implementation time, or alternatively: throw inside `migrate` and let `onRehydrateStorage` handle reset. |
| A5 | Tailwind v4 with `@tailwindcss/vite` requires zero config file for utility classes (no `tailwind.config.js` needed) | Standard Stack, Pitfall 6 | Likely correct per official v4 docs but config-file requirements have shifted across v4 betas. Mitigation: confirm at install time with `npx tailwindcss --help` or v4 docs. |
| A6 | A 6-letter word list filtered from OTCWL via hello-wordl yields ~10–15K entries | Word List Sourcing | Likely correct (OTCWL has ~30K 6-letter words; hello-wordl curates them down). Mitigation: curation script logs count. |

## Open Questions

1. **License of `lynn/hello-wordl` for derived word-list distribution**
   - What we know: README describes curation philosophy; no explicit LICENSE file referenced in our research.
   - What's unclear: Whether deriving filtered word lists for a public deploy is permitted.
   - Recommendation: Plan a Phase 3 license-verification task before public deploy. For Phase 1 (development), proceed with hello-wordl-derived lists; outcome doesn't change Phase 1 code.

2. **Should Zustand persist `answer` field, or recompute it from `dayIndex` on rehydrate?**
   - What we know: D-05 lists `answer` in game-state. ARCHITECTURE anti-pattern #1 says don't persist the answer.
   - What's unclear: D-05 may be prescriptive about persistence shape, or it may describe the in-memory shape only.
   - Recommendation: Treat `answer` as in-memory derived state. **Exclude from `partialize`** and recompute via `getDailyAnswer(dayIndex)` on rehydrate. Saves bytes and reduces DevTools spoilage. Confirm with user in plan-check phase if needed.

3. **`@testing-library/user-event` version pin**
   - What we know: latest is stable; React 19 + Vitest 4 + RTL 16 is a common combo.
   - What's unclear: Exact version float behavior.
   - Recommendation: Let npm pick latest at install; planner verifies no peer-dep warnings. Pin only if a warning appears.

4. **Where should the keyboard listener `useEffect` live — `App` or `useGame` hook?**
   - What we know: D-10 says "in a `useEffect` inside `useGame`." Architectural layering says hooks should not own DOM listeners.
   - What's unclear: Whether D-10's wording is prescriptive or descriptive.
   - Recommendation: Compromise — put the listener in a small `useKeyboardListener()` custom hook (not the Zustand store), called from `App`. The store exposes `onKey` action; the hook calls it. This honors D-10's intent (single seam, single store action) without coupling DOM to Zustand. Planner decides.

## Environment Availability

Phase 1 has only npm-package external dependencies — no runtimes, services, or system tools are required beyond Node + npm. No environment audit needed beyond confirming Node 20+ is installed (Vite 8 requires Node 20.19+ or 22.12+). The project is a standalone Vite scaffold; no databases, no Docker, no Redis, nothing that could be missing on the dev machine.

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | Vite 8 + all tooling | Confirm at executor time | ≥ 20.19 or ≥ 22.12 | None — install Node if missing |
| npm | All package installs | Bundled with Node | ≥ 10 | None |

**Missing dependencies with no fallback:** None expected — Node + npm are universal.
**Missing dependencies with fallback:** None.

## Project Constraints (from CLAUDE.md)

The following directives in `./CLAUDE.md` are load-bearing for Phase 1. The planner must verify every plan honors them; the verifier must check them at gate.

| # | Constraint | Source line |
|---|------------|-------------|
| C-1 | Two-pass tile scoring algorithm; single-pass is wrong | §Critical Correctness Rules — Tile Scoring |
| C-2 | `Date.UTC()` exclusively; never `new Date()` local time | §Day-Index (timezone) |
| C-3 | EPOCH = `new Date('2026-05-04T00:00:00Z').getTime()` — exact value | §Day-Index code snippet |
| C-4 | Synchronous `navigator.clipboard.writeText()` (no `await` before) | §Clipboard (relevant to Phase 2 — but if any clipboard touchpoint creeps into Phase 1, must comply) |
| C-5 | All key handlers guarded: `if (isAnimating || gameOver) return` | §Keyboard Input |
| C-6 | Three localStorage keys, namespaced, each with `version` field | §localStorage |
| C-7 | localStorage keys: `longdle-game-state`, `longdle-stats`, `longdle-settings` exactly | §localStorage |
| C-8 | Build order: `words.ts` → `scoring.ts` → `wordSelection.ts` → `hardMode.ts` → `storage.ts` → `useGame.ts` → static UI shell → wire → modals/animation/polish | §Build Order |
| C-9 | ANSWERS NOT sorted alphabetically in source | §Word List Curation |
| C-10 | Stack: Vite 8 + React 19 + TS, Zustand 5 with `persist`, Tailwind v4 + `@tailwindcss/vite`, Vitest 4 + `@testing-library/react`, Vercel | §Stack |
| C-11 | Use `/browse` skill from gstack for any web browsing (user CLAUDE.md global rule — relevant only if a Phase 1 task needs to browse) | $HOME/.claude/CLAUDE.md |

These constraints are **not negotiable** — they are the same authority level as locked decisions in CONTEXT.md.

## Sources

### Primary (HIGH confidence)
- `[VERIFIED]` npm registry checks (2026-05-04): vite 8.0.10, react 19.2.5, zustand 5.0.13, vitest 4.1.5, tailwindcss 4.2.4, @tailwindcss/vite 4.2.4, @testing-library/react 16.3.2, jsdom 29.1.1
- `./CLAUDE.md` — load-bearing project directives (tile scoring, day-index, clipboard, keyboard, localStorage, build order, stack)
- `.planning/phases/01-foundation/01-CONTEXT.md` — D-01 through D-14 locked decisions
- `.planning/phases/01-foundation/01-UI-SPEC.md` — CSS class contract, copywriting, interaction contract, layout
- `.planning/research/ARCHITECTURE.md` — component tree, state shape, scoring algorithm, day-index algorithm, build order
- `.planning/research/PITFALLS.md` — duplicate-letter scoring, timezone drift, clipboard, keyboard guards, schema drift
- `.planning/research/STACK.md` — verified library versions, what-not-to-use list, Vercel SPA rewrite
- `.planning/research/SUMMARY.md` — executive summary of research
- `.planning/REQUIREMENTS.md` — REQ-IDs and key decisions

### Secondary (MEDIUM confidence — verified via WebFetch)
- [lynn/hello-wordl](https://github.com/lynn/hello-wordl) — curated 6-letter word source; targets.json + dictionary.json
- [hello-wordl targets.json raw](https://raw.githubusercontent.com/lynn/hello-wordl/main/src/targets.json) — verified ~4,000+ entries, JSON array of strings
- [cfreshman gist a03ef2cba789d8cf00c08f767e0fad7b](https://gist.github.com/cfreshman/a03ef2cba789d8cf00c08f767e0fad7b) — verified 5-letter only (correction to D-01)
- [cfreshman gist dec102adb5e60a8299857cbf78f6cf57](https://gist.github.com/cfreshman/dec102adb5e60a8299857cbf78f6cf57) — verified 5-letter only
- [dwyl/english-words](https://github.com/dwyl/english-words) — 479k word fallback (Unlicense); no length-filtered subset
- [jonathanwelton/word-lists](https://github.com/jonathanwelton/word-lists) — 29,874 6-letter words, no license
- [sindresorhus/word-list](https://github.com/sindresorhus/word-list) — atebits Words, MIT, no length subsets

### Tertiary (LOW confidence — flag for validation if used)
- Specific filtered counts (1,000–1,800 ANSWERS, 10,000–15,000 VALID_GUESSES from hello-wordl) — must be empirically verified during curation; logged as A2/A6 in Assumptions Log

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — every version verified via `npm view` on 2026-05-04
- Architecture: HIGH — patterns sourced from CLAUDE.md, ARCHITECTURE.md, and CONTEXT.md (which already locked the design)
- Critical algorithms (scoring, day-index): HIGH — algorithms sourced from CLAUDE.md verbatim with required test cases
- Pitfalls: HIGH — every pitfall is sourced from PITFALLS.md, CLAUDE.md, or canonical Wordle clone discussions
- Word list source: MEDIUM — hello-wordl is a strong, sourceable curated corpus, but license is unverified (A1) and exact filtered counts are unverified (A2, A6); recommendation is robust but warrants a license-check task before public deploy

**Research date:** 2026-05-04
**Valid until:** 2026-06-03 (30 days — stack is stable, but always re-check `npm view` on Phase 1 start if execution slips beyond this window)
