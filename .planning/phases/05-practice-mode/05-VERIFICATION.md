---
phase: 05-practice-mode
verified: 2026-05-07T09:00:00Z
status: human_needed
score: 9/9 must-haves verified
overrides_applied: 0
human_verification:
  - test: "Visit /random in browser — verify practice game loads with banner"
    expected: "Full-width 'Practice Mode' banner visible above board; banner contains '→ Play today's puzzle' link; board is empty and playable"
    why_human: "Routing is pathname-based (window.location.pathname) — cannot simulate browser navigation in test environment"
  - test: "Play a full practice game to win or loss, verify EndGame modal"
    expected: "Modal appears after tile flip animation with ONLY a 'Play Again' button — no Share button, no See Stats button"
    why_human: "Modal auto-open is triggered by gameStatus/isAnimating state after animation timer — requires real browser interaction"
  - test: "Click 'Play Again' in practice EndGame modal"
    expected: "Modal closes, board resets to empty, new (likely different) word loaded, game immediately playable"
    why_human: "resetPractice() picks a new random word — correctness requires seeing board clear and new game start"
  - test: "Play a complete practice game, then check daily stats at /"
    expected: "Daily stats (games played, win %, streaks) are identical before and after practice play"
    why_human: "localStorage isolation is structurally enforced (no persist middleware) but the behavioral guarantee requires verifying no stats increment occurred during practice"
  - test: "Visit / — verify daily game is completely unchanged"
    expected: "No 'Practice Mode' banner; daily game loads and plays as before Phase 5; in-progress session restores from localStorage"
    why_human: "Daily game regression check requires visual/behavioral confirmation"
---

# Phase 5: Practice Mode Verification Report

**Phase Goal:** Players can visit /random to play an unlimited practice game against a random word — fully isolated from daily stats, streaks, and localStorage game state
**Verified:** 2026-05-07T09:00:00Z
**Status:** human_needed
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | /random route renders PracticeGame, not App | ✓ VERIFIED | `main.tsx` line 9: `const isPractice = window.location.pathname === '/random'`; line 13: `{isPractice ? <PracticeGame /> : <App />}` |
| 2 | Practice game is playable with a random word from ANSWERS | ✓ VERIFIED | `usePracticeGame.ts`: `answer: pickRandom()` at store init; `pickRandom()` returns `ANSWERS[Math.floor(Math.random() * ANSWERS.length)]`; full `onKey` handler handles Backspace/Enter/letter input |
| 3 | "Practice Mode" banner is always visible above the board | ✓ VERIFIED | `PracticeBanner.tsx` exists with `Practice Mode` text; rendered unconditionally in `PracticeGame.tsx` line 76 (`<PracticeBanner />` between header and `GameContext.Provider`) |
| 4 | Banner contains link to daily puzzle at / | ✓ VERIFIED | `PracticeBanner.tsx` line 14: `<a href="/" className="practice-banner__link">&rarr; Play today&apos;s puzzle</a>` |
| 5 | Practice EndGame modal has Play Again but no Share/Stats buttons | ✓ VERIFIED | `PracticeEndGameModal.tsx` contains exactly one action button (`Play Again`); grep for `share\|Share\|clipboard` returns only `.share-btn` CSS class reuse — no share function calls or stats imports |
| 6 | Play Again resets board and picks a new random word | ✓ VERIFIED | `resetPractice()` in `usePracticeGame.ts` lines 137-146: resets all state fields and calls `pickRandom()` for a fresh `answer`; wired in `PracticeGame.tsx` lines 93-96: `onPlayAgain={() => { resetPractice(); closeModal() }}` |
| 7 | Practice guesses never touch daily stats or localStorage | ✓ VERIFIED | `usePracticeGame.ts`: zero occurrences of `persist`, `recordGameEnd`, `STATS_KEY`, `GAME_STATE_KEY`, `getDailyAnswer`, `getDayIndex`; flipTimer callback (line 120) has comment explicitly documenting omission of `recordGameEnd` |
| 8 | Board/Keyboard/Key/Toast are store-agnostic via GameContext | ✓ VERIFIED | All four components import `useGameContext` from `../contexts/GameContext` — no direct `useGame` imports remain in any of them |
| 9 | Daily game at / is structurally unchanged | ✓ VERIFIED | `App.tsx` provides `GameContext.Provider` with values from `useGame` selectors; `useKeyboardListener(useGame.getState().onKey)` wired correctly; TypeScript compiles clean (exit 0); 52/52 tests pass |

**Score:** 9/9 truths verified

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `src/lib/gameCore.ts` | Shared pure helpers | ✓ VERIFIED | Exports `upgradeKeyStatus`, `showToast`, `triggerShake`; no storage.ts imports (comment on line 5 only) |
| `src/contexts/GameContext.ts` | Store-agnostic context | ✓ VERIFIED | Exports `GameContextValue` (8 fields), `GameContext`, `useGameContext`; throws if called outside Provider |
| `src/hooks/useKeyboardListener.ts` | Accepts onKey param | ✓ VERIFIED | Signature: `useKeyboardListener(onKey: (key: string) => void): void`; no useGame import |
| `src/hooks/usePracticeGame.ts` | In-memory practice store | ✓ VERIFIED | `create<PracticeGameState>()` with no middleware; exports `usePracticeGame` and `PracticeGameState` |
| `src/components/PracticeGame.tsx` | /random route root | ✓ VERIFIED | Provides `GameContext.Provider` with `usePracticeGame` values; includes `PracticeBanner` |
| `src/components/PracticeBanner.tsx` | Practice Mode banner | ✓ VERIFIED | Renders "Practice Mode" text + link to / |
| `src/components/PracticeEndGameModal.tsx` | Practice EndGame modal | ✓ VERIFIED | Play Again button; no Share/Stats buttons |
| `src/main.tsx` | Pathname-based routing | ✓ VERIFIED | `window.location.pathname === '/random'` gates PracticeGame vs App |

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `src/main.tsx` | `PracticeGame.tsx` | `isPractice ? <PracticeGame />` | ✓ WIRED | Conditional render present; both branches covered |
| `PracticeGame.tsx` | `usePracticeGame.ts` | `usePracticeGame((s) => ...)` selectors | ✓ WIRED | All 9 state fields and actions selected; `GameContext.Provider` value built from them |
| `PracticeGame.tsx` | `gameCore.ts` | indirect via `usePracticeGame` | ✓ WIRED | `usePracticeGame.ts` imports `upgradeKeyStatus, showToast, triggerShake` from `../lib/gameCore` |
| `PracticeEndGameModal.tsx` | `resetPractice()` | `onPlayAgain` prop | ✓ WIRED | `PracticeGame.tsx` passes `() => { resetPractice(); closeModal() }` as `onPlayAgain` |
| `Board/Keyboard/Key/Toast` | `GameContext.ts` | `useGameContext()` | ✓ WIRED | All 4 components import and call `useGameContext()` |
| `App.tsx` | `GameContext.ts` | `GameContext.Provider value={gameContextValue}` | ✓ WIRED | Provider wraps `<main>` and `<Toast />` in App.tsx |
| `vercel.json` | `/random` path | `"source": "/(.*)"` catch-all | ✓ WIRED | Rewrite covers all paths including /random |

### Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
|----------|---------------|--------|-------------------|--------|
| `PracticeGame.tsx` | `answer` | `usePracticeGame` → `pickRandom()` → `ANSWERS[random index]` | Yes — draws from curated answer list | ✓ FLOWING |
| `PracticeGame.tsx` | `guesses` | `usePracticeGame.onKey` Enter handler → `scoreTiles()` | Yes — computed from real word scoring | ✓ FLOWING |
| `PracticeBanner.tsx` | static text | N/A — static component | N/A | ✓ FLOWING |

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| TypeScript compiles clean | `npx tsc --noEmit` | exit 0, no output | ✓ PASS |
| All tests pass | `npm test -- --run` | 52/52 passed | ✓ PASS |
| No persist in usePracticeGame | `grep -c 'persist' usePracticeGame.ts` | 0 | ✓ PASS |
| No recordGameEnd in practice path | `grep -c 'recordGameEnd\|STATS_KEY\|GAME_STATE_KEY' usePracticeGame.ts` | 0 | ✓ PASS |
| No getDailyAnswer/getDayIndex in practice path | `grep -c 'getDailyAnswer\|getDayIndex' usePracticeGame.ts` | 0 | ✓ PASS |
| vercel.json covers /random | `grep -c '"source": "/(.*)"' vercel.json` | 1 | ✓ PASS |

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|------------|-------------|--------|----------|
| PRACTICE-01 | 05-01, 05-02, 05-04 | Visiting /random loads a practice game with a randomly selected word | ✓ SATISFIED | `main.tsx` pathname routing + `usePracticeGame` with `pickRandom()` + `PracticeGame.tsx` assembled |
| PRACTICE-02 | 05-04 | Practice mode displays a visible "Practice Mode" banner | ✓ SATISFIED | `PracticeBanner.tsx` rendered unconditionally in `PracticeGame.tsx`; contains "Practice Mode" text and link to / |
| PRACTICE-03 | 05-01, 05-02, 05-04 | Guesses in practice mode do not affect daily stats, streaks, or localStorage game state | ✓ SATISFIED | `usePracticeGame.ts`: no `persist()`, no `recordGameEnd`, no storage.ts imports; structurally isolated at store level |

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| `PracticeEndGameModal.tsx` | 35 | `.share-btn` CSS class on Play Again button | Info | CSS class reuse for styling only — no share behavior wired; acceptable |
| `gameCore.ts` | 5 | Comment mentions `recordGameEnd` and `storage.ts` | Info | Documentation comment only — not an import or call; correct |
| `usePracticeGame.ts` | 120 | Comment mentions `recordGameEnd intentionally omitted` | Info | Documentation comment only — correct and intentional |

No blockers. No warnings.

### Human Verification Required

All automated checks passed. The following behavioral tests require a running browser to verify:

#### 1. Practice Route Loads

**Test:** `npm run dev`, then visit `http://localhost:5173/random`
**Expected:** Full-width "Practice Mode" banner appears between header and board; banner shows "→ Play today's puzzle" link; board is empty; game is ready to play
**Why human:** Pathname-based routing and DOM rendering require a real browser

#### 2. Practice Game Plays Correctly and EndGame Modal Appears

**Test:** On /random, type a 6-letter word using physical keyboard and press Enter; continue guessing until win or loss
**Expected:** Tiles color correctly; keyboard key colors update; after game ends a modal appears with ONLY "Play Again" — no Share button, no See Stats button
**Why human:** Animation timer chain (FLIP_TOTAL_MS = 1150ms) triggers modal auto-open; requires real-time execution

#### 3. Play Again Resets the Game

**Test:** In the practice EndGame modal, click "Play Again"
**Expected:** Modal closes immediately; board resets to empty; key colors clear; a new (likely different) word is loaded; typing immediately works
**Why human:** `resetPractice()` picks a new random word; correct behavior requires observing board clear and new game start

#### 4. Daily Stats Are Not Affected by Practice Play

**Test:** Before playing practice, note daily stats at /. Play a full practice game at /random. Return to / and check stats again.
**Expected:** Games played, win percentage, current streak, and max streak are identical before and after practice play
**Why human:** localStorage isolation is structurally enforced (no `persist()`) but behavioral confirmation requires comparing stats before and after

#### 5. Daily Game Regression Check

**Test:** Visit `/`, play a guess, verify behavior is identical to pre-Phase-5 state
**Expected:** No "Practice Mode" banner; tiles color correctly; keyboard updates; toast for invalid words works; in-progress state restores on refresh
**Why human:** Visual/behavioral regression requires seeing the daily game render and interact correctly

### Gaps Summary

None. All 9 automated truths are VERIFIED. All 3 requirements (PRACTICE-01, PRACTICE-02, PRACTICE-03) have satisfactory structural evidence. The phase goal is architecturally achieved — the remaining 5 items are behavioral confirmation tests requiring a browser, not fixes.

---

_Verified: 2026-05-07T09:00:00Z_
_Verifier: Claude (gsd-verifier)_
