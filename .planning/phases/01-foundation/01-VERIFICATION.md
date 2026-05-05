---
phase: 01-foundation
verified: 2026-05-05T08:53:00Z
status: human_needed
score: 5/5 must-haves verified
overrides_applied: 0
human_verification:
  - test: "Play a full game end-to-end in dev (npm run dev)"
    expected: "Physical keyboard input, tile coloring, on-screen keyboard coloring, toast for invalid guesses, win/loss banner, localStorage restore on refresh all work visually"
    why_human: "Plan 05 Task 3 smoke test was auto-approved without actual human play-through. The automated checks only verify build success and HTTP 200 — they do not confirm the UI renders correctly, tiles color properly, or user interaction flows work. This is the final D-14 step 9 gate."
---

# Phase 1: Foundation Verification Report

**Phase Goal:** The core game is fully playable — correct tile scoring, daily word selection, keyboard input, win/loss detection, and localStorage persistence all work correctly
**Verified:** 2026-05-05T08:53:00Z
**Status:** human_needed
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths (ROADMAP Success Criteria)

| #   | Truth   | Status     | Evidence       |
| --- | ------- | ---------- | -------------- |
| 1   | User can type 6-letter guesses using physical keyboard (A-Z, Backspace, Enter) and submit against day's word | ✓ VERIFIED | `useKeyboardListener.ts` wires `document.addEventListener('keydown')` to `useGame.getState().onKey(k)`. Guards against metaKey/ctrlKey/altKey. `onKey` in `useGame.ts` handles all three input types with full validation pipeline. 17 integration tests pass including letter append, Backspace, Delete, Enter flows. |
| 2   | User sees correctly color-coded tile feedback including duplicate-letter edge cases — two-pass scoring verified by unit tests before UI | ✓ VERIFIED | `scoring.ts` has exactly 2 for-loops with '#' sentinel consume pattern. `scoreTiles('little','bottle')` returns `['absent','absent','correct','correct','correct','correct']` verified by runtime check. `scoreTiles('eeeeee','pelmet')` returns `['absent','correct','absent','absent','correct','absent']` verified. 8 unit tests pass. |
| 3   | User sees on-screen keyboard keys update to best color state (green > yellow > gray, never downgrade) | ✓ VERIFIED | `upgradeKeyStatus()` in `useGame.ts` uses rank map `{correct:3, present:2, absent:1}` — only upgrades when `nextRank > prevRank`. `Keyboard.tsx` reads `keyStatuses` from store and passes to each `Key`. `Key.tsx` applies `key--correct/present/absent` classes. |
| 4   | User sees win message after correct guess or answer revealed after 7 failed attempts, with all input disabled | ✓ VERIFIED | `EndGameBanner.tsx` renders `"You got it!"` when `gameStatus==='won'` and `"The word was {ANSWER.toUpperCase()}"` when `gameStatus==='lost'`. `onKey` first line: `if (s.isAnimating \|\| s.gameStatus !== 'playing') return`. Loss detection: `const lost = !won && nextGuesses.length >= MAX_GUESSES` (MAX_GUESSES=7). Win test passes; loss logic is correct code with no test for full 7-guess sequence (implementation verified, test gap noted as WARNING). |
| 5   | User resumes exactly where they left off after page refresh — in-progress state restores from localStorage | ✓ VERIFIED | `useGame` uses Zustand `persist` with `createJSONStorage(() => localStorage)`, key `longdle-game-state`. `partialize` persists: version, dayIndex, guesses, currentGuess, gameStatus, keyStatuses. `onRehydrateStorage` checks `state.dayIndex !== getDayIndex()` and calls `resetForNewDay()` if stale. |

**Score:** 5/5 truths verified

### Required Artifacts

| Artifact | Expected | Status | Details |
| -------- | --------- | ------ | ------- |
| `src/data/words.ts` | ANSWERS + VALID_GUESSES + VALID_WORDS exports | ✓ VERIFIED | ANSWERS: 1800 entries (range 800-2500 PASS). VALID_GUESSES: 15787 (range 5000-20000 PASS). D-03: 0 ANSWERS missing from VALID_GUESSES. All entries match `/^[a-z]{6}$/`. Shuffled (not alpha-sorted). |
| `src/lib/scoring.ts` | `scoreTiles()` two-pass, `TileStatus` export | ✓ VERIFIED | Two loops confirmed (`grep -c` = 2). '#' sentinel. Exports `scoreTiles` and `TileStatus`. Throws on non-6-letter input. |
| `src/lib/wordSelection.ts` | `getDayIndex()`, `getDailyAnswer()`, `isValidGuess()`, `EPOCH` | ✓ VERIFIED | `EPOCH = 1777852800000` matches `new Date('2026-05-04T00:00:00Z').getTime()`. Uses `Date.UTC()` exclusively — no local-time `.getMonth()/.getDate()/.getFullYear()` calls. Modulo-wraps for WORDS-04. |
| `src/lib/hardMode.ts` | `validateHardModeGuess()` | ✓ VERIFIED | Aggregates greens (Map) and yellows (Set) across all prior guesses. Returns null on pass, error string on failure. 6 passing tests. |
| `src/lib/storage.ts` | `readStats()`, `writeStats()`, `recordGameEnd()`, keys, version | ✓ VERIFIED | Keys: `longdle-game-state`, `longdle-stats`, `longdle-settings` (exact). `SCHEMA_VERSION = 1`. `readStats()` returns DEFAULT_STATS on absence or version mismatch with `console.warn`. |
| `src/hooks/useGame.ts` | useGame + useSettings Zustand stores with persist | ✓ VERIFIED | Both stores use `persist` middleware. `partialize` excludes `toastMessage`, `isAnimating`, `rowShakeKey`. `answer` never persisted — `getAnswer()` recomputes via `getDailyAnswer(dayIndex)`. Both stores have `migrate()` returning undefined on version mismatch. |
| `src/hooks/useKeyboardListener.ts` | Physical keyboard → `onKey` via `useEffect` | ✓ VERIFIED | `document.addEventListener('keydown', handler)` with cleanup `removeEventListener`. Handles Enter, Backspace, Delete, A-Z (lowercased). Guards metaKey/ctrlKey/altKey. C-5 guard lives inside `onKey`, not here (single seam). |
| `src/components/Tile.tsx` | Tile with status-based CSS classes | ✓ VERIFIED | Applies `tile tile--{empty|active|correct|present|absent}` via `STATUS_CLASS` map. |
| `src/components/Row.tsx` | 6 tiles, shake/win class toggling | ✓ VERIFIED | Toggles `row--shake` and `row--win`. Delegates to `Tile` with correct active/empty status derivation. |
| `src/components/Board.tsx` | 7×6 grid reading live store | ✓ VERIFIED | Reads `guesses`, `currentGuess`, `gameStatus`, `rowShakeKey` from `useGame`. rowShakeKey delta drives 350ms transient shake via `useRef`/`useEffect`. |
| `src/components/Key.tsx` | On-screen key calling `onKey` on click | ✓ VERIFIED | Reads `onKey` from `useGame`. `onClick={() => onKey(value)}`. Applies `key--{correct|present|absent}` classes from `status` prop. |
| `src/components/Keyboard.tsx` | QWERTY layout with ENTER and backspace | ✓ VERIFIED | ROW_1: qwertyuiop, ROW_2: asdfghjkl, ROW_3: ENTER + zxcvbnm + ⌫. Wide keys use `wide` prop. Reads `keyStatuses` from store. |
| `src/components/Toast.tsx` | Fixed-position toast from store | ✓ VERIFIED | Reads `toastMessage` from `useGame`. Returns `null` when no message. Has `role="status"` and `aria-live="polite"`. |
| `src/components/EndGameBanner.tsx` | Win/loss copy from live store | ✓ VERIFIED | Reads `gameStatus` and `getAnswer`. "You got it!" on won. "The word was {ANSWER.toUpperCase()}" on lost. Returns null during playing. |
| `src/styles/tiles.css` | Full CSS class contract + custom properties | ✓ VERIFIED | All required classes: tile, tile--empty, tile--active, tile--correct, tile--present, tile--absent, row, row--shake, row--win, key, key--correct, key--present, key--absent, toast. All 8 CSS custom properties declared in `:root`. |
| `src/App.tsx` | Wired shell with keyboard listener | ✓ VERIFIED | Calls `useKeyboardListener()`. Renders `<Board />`, `<EndGameBanner />`, `<Keyboard />`, `<Toast />`. Header text "Longdle". |

### Key Link Verification

| From | To | Via | Status | Details |
| ---- | -- | --- | ------ | ------- |
| `useGame.ts` | `scoring.ts` | `import { scoreTiles } from '../lib/scoring'` | ✓ WIRED | Import confirmed; `scoreTiles` called in `onKey` Enter path. |
| `useGame.ts` | `wordSelection.ts` | `import { getDayIndex, getDailyAnswer }` | ✓ WIRED | Both called: `getDayIndex()` in initial state, `getDailyAnswer(dayIndex)` in `onKey` and `getAnswer`. |
| `useGame.ts` | `words.ts` | `import { VALID_WORDS }` | ✓ WIRED | `VALID_WORDS.has(cg)` in Enter validation. |
| `useGame.ts` | `storage.ts` | `recordGameEnd()` on game end | ✓ WIRED | Called when `gameStatus !== 'playing'` after guess submission. |
| `wordSelection.ts` | `words.ts` | `import { ANSWERS }` | ✓ WIRED | `ANSWERS[dayIndex % ANSWERS.length]` in `getDailyAnswer`. |
| `App.tsx` | `useKeyboardListener.ts` | `useKeyboardListener()` call | ✓ WIRED | Called at top of App component body. |
| `Key.tsx` | `useGame.ts` | `useGame((s) => s.onKey)` | ✓ WIRED | `onClick={() => onKey(value)}` sends to store. |
| `Board.tsx` | `useGame.ts` | `useGame((s) => s.guesses)` etc. | ✓ WIRED | Reads guesses, currentGuess, gameStatus, rowShakeKey — all live store subscriptions. |

### Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
| -------- | ------------- | ------ | ------------------ | ------ |
| `Board.tsx` | `guesses`, `currentGuess` | `useGame` Zustand store (persisted, updated by `onKey`) | Yes — store is populated by real user input via `onKey('Enter')` path that calls `scoreTiles` and appends to guesses | ✓ FLOWING |
| `Keyboard.tsx` | `keyStatuses` | `useGame` store — computed via `upgradeKeyStatus()` on each guess submission | Yes — populated when guesses are submitted | ✓ FLOWING |
| `Toast.tsx` | `toastMessage` | `useGame` store — set by `showToast()` helper on invalid input | Yes — populated on validation failure, auto-cleared after 1500ms | ✓ FLOWING |
| `EndGameBanner.tsx` | `gameStatus`, `getAnswer()` | `useGame` store + `getDailyAnswer(dayIndex)` | Yes — `gameStatus` set by game logic; `getAnswer()` calls `getDailyAnswer` which indexes into real ANSWERS array | ✓ FLOWING |

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
| -------- | ------- | ------ | ------ |
| All 45 tests pass | `npm test` | 4 files, 45 tests passed | ✓ PASS |
| Production build succeeds | `npm run build` | `dist/index.html` + JS/CSS bundles, exit 0 | ✓ PASS |
| `scoreTiles('little','bottle')` two-pass | runtime check via tsx | `['absent','absent','correct','correct','correct','correct']` | ✓ PASS |
| `getDayIndex(epoch)` returns 0 | runtime check via tsx | 0 | ✓ PASS |
| `getDayIndex(next day)` returns 1 | runtime check via tsx | 1 | ✓ PASS |
| D-03: ANSWERS ⊆ VALID_GUESSES | runtime check via tsx | 0 missing | ✓ PASS |
| ANSWERS count in range | banner comment | 1800 (range 800-2500) | ✓ PASS |
| VALID_GUESSES count in range | banner comment | 15787 (range 5000-20000) | ✓ PASS |
| ANSWERS not alpha-sorted | first 5 entries: runoff/vacuum/basalt/subtly/oyster | not sorted | ✓ PASS |

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
| ----------- | ----------- | ----------- | ------ | -------- |
| GAME-01 | 01-05 | 6×7 grid visible | ✓ SATISFIED | Board.tsx renders 7 rows × 6 tiles |
| GAME-02 | 01-03, 01-05 | Two-pass color-coded feedback | ✓ SATISFIED | scoreTiles() two-pass verified; Board renders scored guesses |
| GAME-03 | 01-04, 01-05 | On-screen keyboard best-color-state | ✓ SATISFIED | upgradeKeyStatus() + Keyboard.tsx + Key.tsx |
| GAME-04 | 01-04, 01-05 | Physical keyboard without `<input>` | ✓ SATISFIED | useKeyboardListener on document.keydown |
| DAILY-01 | 01-03 | UTC-based day-index, no server | ✓ SATISFIED | getDayIndex() + getDailyAnswer() + EPOCH |
| DAILY-02 | 01-03 | Date.UTC() exclusively | ✓ SATISFIED | No local-time date calls in wordSelection.ts |
| DAILY-03 | 01-04, 01-05 | Win/loss message, input disabled | ✓ SATISFIED | EndGameBanner + isAnimating/gameStatus guard |
| DAILY-04 | 01-04, 01-05 | Shake + toast on invalid guesses | ✓ SATISFIED | showToast() + triggerShake() + Toast.tsx |
| DAILY-05 | 01-04 | localStorage restore on refresh | ✓ SATISFIED | Zustand persist + onRehydrateStorage stale-day check |
| WORDS-01 | 01-02 | ~1000-2000 answer list from corpus | ✓ SATISFIED | 1800 entries from hello-wordl targets.json |
| WORDS-02 | 01-02 | ~8000-15000 valid guess list | ✓ SATISFIED | 15787 entries from hello-wordl dictionary.json |
| WORDS-03 | 01-02 | ANSWERS not alpha-sorted | ✓ SATISFIED | Seeded Fisher-Yates shuffle; verified not sorted |
| WORDS-04 | 01-03 | Deterministic daily cycle via modulo | ✓ SATISFIED | `ANSWERS[dayIndex % ANSWERS.length]` |

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
| ---- | ---- | ------- | -------- | ------ |
| `Board.tsx` | 47, 58 | `statuses={[]}` for active row and empty rows | ℹ️ Info | Not a stub — active row tiles are in-flight (unscored), empty rows have no letters. `Row.tsx` defaults unset statuses to `'empty'` or `'active'`. Data-flow is correct. |
| `styles/tiles.css` | row--shake, row--win | `/* Phase 3 will define @keyframes */` | ℹ️ Info | CSS animation stubs intentionally deferred to Phase 3 (THEME-02/03). Classes toggle correctly in Phase 1; no @keyframes yet. Expected per plan. |

No blockers found.

### Human Verification Required

#### 1. Full end-to-end play-through in browser

**Test:** Run `npm run dev`, open `http://localhost:5173`, and manually verify all of the following:
1. Page shows header "Longdle" + 7 rows × 6 empty tiles + QWERTY on-screen keyboard with Q-W-E-R-T-Y-U-I-O-P / A-S-D-F-G-H-J-K-L / ENTER-Z-X-C-V-B-N-M-⌫
2. Type 3 letters via physical keyboard — tiles show letters with active border styling
3. Press Backspace — last tile clears
4. Type `qzxqzx` + Enter — toast "Not in word list" appears for ~1.5 seconds, tiles do not advance
5. Type 5 letters + Enter — toast "Not enough letters" appears
6. Submit a known valid 6-letter word — row tiles render with green/yellow/gray fills correctly (verify duplicate-letter handling)
7. On-screen keyboard keys update with correct best-color styling after submission
8. Click on-screen keys — they mutate the active row identically to physical keys
9. Win the game (use DevTools Console: `useGame.getState().getAnswer()`) — "You got it!" banner appears, typing has no effect
10. In a new private window: type 6 letters, refresh — in-progress state restores
11. Check DevTools > Application > Local Storage: `longdle-game-state`, `longdle-settings` present (both with `version: 1`); `longdle-stats` present after game end

**Expected:** All 11 steps pass with no visual glitches or console errors.

**Why human:** Plan 05 Task 3 (the D-14 step 9 smoke test gate) was marked "auto-approved" in the SUMMARY without documenting that a human actually played through the game. Automated checks only verified `npm run build` exit 0 and HTTP 200 from the dev server. Visual rendering, tile color logic in the browser, clipboard behavior, and user interaction flows require human eyes to confirm.

### Gaps Summary

No automated gaps found. All 5 ROADMAP success criteria are verified in code. All 13 Phase 1 requirements are satisfied by substantive, wired implementations.

The only open item is the human verification of the visual play-through — an observation that applies even when all automated checks pass, because the plan's own smoke test (Task 3, Plan 05) was designed as a blocking human gate and was bypassed.

**Minor WARNING (not a blocker):** There is no explicit integration test for the 7-wrong-guesses → `gameStatus='lost'` path in `useGame.test.ts`. The code path is present and correct (`const lost = !won && nextGuesses.length >= MAX_GUESSES`), but a future regression could silently break loss detection. Consider adding this test in Phase 2 when the EndGameModal is built.

---

_Verified: 2026-05-05T08:53:00Z_
_Verifier: Claude (gsd-verifier)_
