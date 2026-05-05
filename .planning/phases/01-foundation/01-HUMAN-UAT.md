---
status: partial
phase: 01-foundation
source: [01-VERIFICATION.md]
started: 2026-05-05T08:53:00Z
updated: 2026-05-05T08:53:00Z
---

## Current Test

[awaiting human testing]

## Tests

### 1. Full play-through in browser (D-14 step 9 smoke test)
expected: Physical keyboard input, tile coloring, on-screen keyboard coloring, toast for invalid guesses, win/loss banner, and localStorage restore on refresh all work correctly in the browser
result: [pending]

Steps:
1. Run `npm run dev` and open http://localhost:5173
2. Verify: header "Longdle" + 7 rows × 6 empty tiles + QWERTY on-screen keyboard
3. Type 3 letters via physical keyboard — verify tile--active border appears
4. Press Backspace — verify last tile clears
5. Type 6-char non-word (e.g. `qzxqzx`) + Enter — verify "Not in word list" toast for ~1.5s
6. Type 5 chars + Enter — verify "Not enough letters" toast
7. Submit a valid 6-letter word — verify green/yellow/gray tile coloring
8. Verify on-screen keyboard keys update colors (green > yellow > gray)
9. Click on-screen keys — verify they work identically to physical keys
10. Win the game (use DevTools: `useGame.getState().getAnswer()`) — verify "You got it!" + input blocked
11. Open private window, type some letters, refresh — verify in-progress state restores
12. Check DevTools localStorage: `longdle-game-state`, `longdle-settings`, `longdle-stats` all have `version: 1`

## Summary

total: 1
passed: 0
issues: 0
pending: 1
skipped: 0
blocked: 0

## Gaps
