---
status: partial
phase: 05-practice-mode
source: [05-VERIFICATION.md]
started: 2026-05-07T00:00:00.000Z
updated: 2026-05-07T00:00:00.000Z
---

## Current Test

[awaiting human testing]

## Tests

### 1. Practice route loads
expected: Visiting /random renders the full game with a "Practice Mode" banner above the board and a link "→ Play today's puzzle"
result: [pending]

### 2. Practice game plays and shows EndGame modal
expected: Completing a practice game (win or lose) shows a modal with only a "Play Again" button — no Share, no Stats
result: [pending]

### 3. Play Again resets the board
expected: Clicking Play Again clears all tiles, picks a new random word, and the game is immediately playable again without page reload
result: [pending]

### 4. Daily stats isolation
expected: Playing a full practice game does NOT increment games played, win %, or streaks in the Stats modal on the daily game
result: [pending]

### 5. Daily game regression
expected: Visiting / shows no Practice Mode banner; the daily game plays normally with no behavioral changes
result: [pending]

## Summary

total: 5
passed: 0
issues: 0
pending: 5
skipped: 0
blocked: 0

## Gaps
