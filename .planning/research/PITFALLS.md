# Pitfalls Research — Longdle

**Domain:** Daily word game (6-letter Wordle clone, React CSR, Vite, Vercel, no backend)
**Researched:** 2026-05-04

---

## Critical Pitfalls

These will definitely bite you and may require rewrites if ignored.

---

### 1. Duplicate Letter Evaluation: Wrong Yellow/Gray Assignment

**What goes wrong:** When the target word contains fewer copies of a letter than the guess, naive implementations mark ALL instances of that letter yellow. Example: target is BOTTLE, guess is LETTER — both Ts should not both be yellow if the target only has one unmatched T remaining after greens are resolved.

**Why it happens:** Two-pass logic is not implemented. Developers write a single loop that checks "is this letter in the target?" without tracking which target-letter slots have already been "consumed" by green or yellow assignments.

**Correct algorithm (two-pass required):**
1. First pass: mark exact-position matches green. Remove matched target-letter slots from the pool.
2. Second pass: for remaining (non-green) positions, check if the guessed letter exists in the remaining target-letter pool. If yes, mark yellow and consume that slot. If no, mark gray.

**Consequences:** Players get incorrect feedback on every guess containing repeated letters. Hard mode becomes unplayable since valid strategies appear to give wrong information. For a 6-letter word, the incidence of duplicate letters is higher than in the original 5-letter Wordle, making this more frequently visible.

**Warning signs:** Test case — target: MAMMAL, guess: MAMMAE. Greens at positions 0,1,2,3. Remaining unmatched guess letters: M and A (positions 4 and 5). Only one M and one A remain in target pool. The result must be M=yellow, A=yellow — not both yellow twice.

**Prevention:** Implement the two-pass algorithm from day one. Write unit tests for the evaluation function covering: (a) letter appears once in target but twice in guess, (b) letter appears twice in target and twice in guess (one green, one yellow), (c) letter appears zero times in target but appears in guess. Do not ship without these test cases passing.

**Phase:** Core game logic (Phase 1 foundation).

---

### 2. Day-Index Timezone Drift: Players See Different Words

**What goes wrong:** The day index is calculated from `new Date()`, which uses the device's local timezone. A player in Tokyo and a player in New York will compute different dates for part of each day, meaning they see different "daily" words during the overlap window. For a game explicitly designed for two people to compare results, this is a core-value failure.

**Why it happens:** JavaScript's `new Date()` returns local time. Computing `Math.floor((Date.now() - EPOCH_MS) / 86400000)` appears correct but actually computes days elapsed in UTC, which can diverge from local midnight.

**The specific failure mode:** The epoch date must be calculated in a fixed timezone (UTC or a named timezone like America/New_York). If the epoch is defined as "midnight Jan 1 2026 in UTC" but the day boundary is computed using local time, a player 12 hours ahead will see the next day's word at their local noon.

**Additional drift vector:** If `EPOCH_MS` is ever hardcoded as a local-time timestamp (e.g., `new Date('2026-01-01')` evaluated in the developer's timezone), the epoch itself is wrong for users in other timezones.

**Warning signs:** Manually set device clock to a timezone 12+ hours ahead and verify you get the same word as UTC-0.

**Prevention:**
- Define epoch as a UTC ISO string: `new Date('2026-01-01T00:00:00Z').getTime()`
- Compute day index using UTC date components: `new Date().getUTCFullYear()`, `getUTCMonth()`, `getUTCDate()` — not local time methods
- Or compute as: `Math.floor((Date.now() - EPOCH_UTC_MS) / 86400000)` which is inherently UTC-based
- Add `% wordList.length` to prevent out-of-bounds when the day count exceeds word list size (critical for long-running games)

**Phase:** Day-index and word selection (Phase 1 foundation). Must be locked before localStorage persistence is built.

---

### 3. Clipboard API Failure on iOS Safari: Silent Share Failure

**What goes wrong:** `navigator.clipboard.writeText()` silently fails or throws on Safari/iOS in certain conditions, leaving the player with no feedback and no copied text. They tap Share, nothing happens, and have nothing to paste.

**Why it happens:** Safari enforces that the Clipboard API must be called synchronously within a user gesture handler. The moment you `await` anything before calling `writeText`, Safari considers the user gesture consumed and rejects the call. Also, the API requires HTTPS (fails on `http://` even localhost without dev flags).

**The async trap:** Common implementation pattern is:
```javascript
const handleShare = async () => {
  const text = await generateShareText(); // await breaks gesture context
  navigator.clipboard.writeText(text); // fails silently on Safari
};
```

**Correct pattern:** Generate the text synchronously (or pre-generate it), then call `writeText` synchronously within the click handler:
```javascript
const handleShare = () => {
  const text = generateShareText(); // synchronous
  navigator.clipboard.writeText(text).catch(() => {
    // Fallback: show text in a modal/textarea for manual copy
    showFallbackModal(text);
  });
};
```

**Warning signs:** Share works in Chrome dev tools mobile emulation but breaks when tested on a real iPhone.

**Prevention:**
- Keep share text generation synchronous (it is pure computation, no async needed)
- Always attach a `.catch()` with a visible fallback (show text in a modal with a "Copy" instruction)
- Verify on a real iOS device before shipping the share feature
- Vercel deploys to HTTPS automatically — but verify the subdomain also serves HTTPS

**Phase:** Share mechanic (whichever phase implements emoji grid sharing).

---

## Common Mistakes

Mistakes seen in many Wordle clone implementations, often caught later in development.

---

### 4. Hard Mode: Incomplete Constraint Enforcement

**What goes wrong:** Hard mode is implemented but only partially enforces its rules. Typically: green letters are correctly re-required, but yellow letters are not checked to confirm they still appear somewhere in the next guess. Or, both green and yellow are enforced but in the wrong position (e.g., blocking yellow letters from appearing in their revealed position, which is optional rather than required).

**The rules to enforce (precisely):**
- Green at position N: next guess must have the same letter at position N
- Yellow (letter L revealed): next guess must contain L somewhere (position doesn't matter, but NOT at the position where it was yellow — this last part is what the original Wordle does NOT enforce, interestingly)
- Gray letters: not enforced in the original Wordle hard mode — do not block them

**Warning signs:** A player can submit a guess that doesn't include a previously found yellow letter without getting an error message.

**Prevention:** Build a `validateHardModeGuess(guess, previousGuesses, previousResults)` function with explicit tests. Test case: first guess reveals E is yellow at position 2; subsequent guess must contain E somewhere but is allowed to be at position 2 again (the NYT version does NOT block reusing the yellow position).

**Phase:** Hard mode implementation. Test thoroughly before enabling this flag.

---

### 5. localStorage Schema Drift: Silently Broken Persistence

**What goes wrong:** Stats or game state stored in localStorage stops working when the data shape changes during development, or worse, after initial deployment when real player data exists. The app either reads corrupt state (causing JS errors), silently drops old data (resetting streak to 0), or crashes on load.

**Common schema changes that break things:**
- Renaming a localStorage key (old key is orphaned, new key starts empty)
- Changing the shape of the stored object (e.g., adding a required field that old saves lack)
- Changing how the day index is stored (epoch reference change makes old "lastPlayed" dates invalid)

**Warning signs:** After deploying an update, you lose your streak. Old browser tabs still have old data.

**Prevention:**
- Define a `SCHEMA_VERSION` constant stored alongside stats (e.g., `{ version: 1, streak: 5, ... }`)
- On load, read the stored version and run a migration function if the version doesn't match
- Never rename a key mid-flight; write a migration that reads the old key, copies to new key, deletes old key
- In early development: clear localStorage aggressively between schema changes rather than patching around stale data
- For this project (2-person audience), document the localStorage structure clearly — if a schema change happens, manually clearing is acceptable as a one-time migration

**Phase:** Stats and persistence phase. Lock schema before first real deployment.

---

### 6. Word List Exposed in Client-Side Bundle

**What goes wrong:** The answer list — the subset of words that can actually be the daily word — is trivially readable in the browser's developer tools by anyone who opens the Network tab and inspects the JS bundle. Players can look up tomorrow's word.

**Reality check:** For a 2-person audience of friends, this is low stakes. The original Wordle had the same issue and it was widely discussed without NYT considering it a blocker. However, it's worth acknowledging the trade-off explicitly.

**What to do instead of pretending it's hidden:**
- Keep two separate lists: `ANSWER_WORDS` (curated subset, is the daily word pool) and `VALID_GUESSES` (full accepted dictionary). The answer list being "guessable" from bundle inspection doesn't spoil game play unless actively cheated.
- Accept that client-side-only games cannot fully hide answers. For a personal project with 2 users, this is fine.
- If it bothers you: shuffle/obfuscate the answer list order or use a keyed cipher. Not worth the complexity for this project.

**Phase:** Word list setup (Phase 1). Make the decision explicitly and document it.

---

### 7. Keyboard Input Not Disabled During Animations or Modal Open

**What goes wrong:** The player types or presses Enter while a flip animation is playing, or while a modal (How to Play, game over) is open. The keystrokes register against game state, causing: letters entered behind a modal filling tile rows, Enter pressed at end-of-game submitting a new guess into a winning state, or animations fighting state updates mid-flight.

**Warning signs:** Keyboard mashing during the reveal animation corrupts the current row. Pressing Enter immediately after winning starts a new (invalid) turn.

**Prevention:**
- Maintain an `isAnimating` boolean in game state; block all input processing while true
- On modal open, block keyboard game input (not focus — the modal should receive focus, not the game board)
- Trap focus inside modals so Tab and Enter operate on the modal's controls, not the game
- Use `disabled` input state or event guard (`if (gameOver || isAnimating) return`) at the top of all key handlers

**Phase:** Animation and modal implementation phases.

---

### 8. Vercel CSR Deploy: No `vercel.json` Rewrite Rule

**What goes wrong:** React SPA deployed to Vercel without a `vercel.json` rewrite returns 404 for any URL that isn't the root `/`. Direct navigation to `/stats` or refresh on any non-root route fails with Vercel's default 404 page.

**Why it happens:** Vercel serves files by filesystem path. `/stats` has no corresponding file, so the server returns 404 before React's client-side router can handle it.

**For Longdle specifically:** The game is a single-page app at `/`. If there are no routes other than `/`, this may never trigger. But if a How-to-Play URL, stats page, or share link is ever added as a route, this becomes a live issue.

**Prevention:** Add `vercel.json` from day one:
```json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
}
```
This is a zero-cost guard against the problem regardless of whether you currently use routes.

**Phase:** Initial Vercel deployment setup (Phase 1 or infrastructure phase).

---

### 9. Animation Timing Desync: State Updates Before Flip Completes

**What goes wrong:** The game reveals letter states (green/yellow/gray) by updating React state immediately when a guess is submitted. The CSS flip animation then reads the updated state at the start of its animation — meaning the tile shows its final color before the flip visually "reveals" it, breaking the surprise reveal effect.

**The correct sequence:**
1. Player submits guess → row locks (no more input)
2. Tiles begin flip animation, starting from position 0 with staggered delays
3. At the midpoint of each tile's flip (when it's face-down), the color class is applied
4. Tile continues flipping to reveal the color
5. After the last tile's animation completes, keyboard colors update and game state advances

**Why it's hard:** React state updates are synchronous from the component's perspective. You must either: (a) use `animation-delay` + CSS class application timed to the midpoint, or (b) apply color classes with a JS timeout offset to each tile.

**Warning signs:** Letters show their color immediately when submitted, then flip but the color was already visible.

**Prevention:** Use CSS `animation-fill-mode: both` with a keyframe that applies the color class exactly at the 50% mark of the flip. Alternatively, maintain a separate "revealed" state that lags behind game state by the animation duration.

**Phase:** Tile animation implementation.

---

### 10. Mobile: Physical vs. On-Screen Keyboard Conflict

**What goes wrong:** On mobile, the game shows an on-screen keyboard (required for touch input). But on some Android devices and in certain browser modes, the physical/system keyboard also appears or intercepts key events. Input events fire twice, letters double-enter, or the viewport jumps due to the system keyboard changing the viewport height.

**Additional mobile viewport problem:** When a soft keyboard appears (if any focusable input element exists), the game board can reflow or get pushed off-screen. Wordle-style games solve this by not using real `<input>` elements — the board is purely visual, key input is captured via `document.addEventListener('keydown')` (for physical keyboard), and the on-screen keyboard buttons dispatch the same handler.

**Warning signs:** On mobile, tapping the game board opens the system keyboard. Typing on the on-screen keyboard causes duplicate letters.

**Prevention:**
- Do not use `<input>` elements for the game board. Use `<div>` tiles that are non-interactive.
- Capture physical keyboard via `document.addEventListener('keydown', handler)` at app level.
- On-screen keyboard buttons call the same handler directly.
- Prevent default on all keyboard events to stop browser from doing anything with them.
- Test on a real iOS Safari and Android Chrome before shipping.

**Phase:** Core board and keyboard implementation (Phase 1).

---

### 11. Share Text Edge Cases: Streak Numbers and Hard Mode Flag

**What goes wrong:** The share text is generated with incorrect data: the guess count is off (e.g., shows 7 for a loss instead of "X"), the hard mode asterisk is missing or misplaced, the day number is computed from a different epoch than the game uses, or the emoji grid rows don't match what the player saw (happens when results are read from state in the wrong order).

**The expected format:**
```
Longdle #42 4/7*

🟩⬛🟨🟩⬛⬛
🟩🟩⬛🟩⬛🟨
🟩🟩🟩🟩⬛🟩
🟩🟩🟩🟩🟩🟩
```

**Edge cases to handle:**
- Loss: show `X/7` not `7/7`
- Hard mode enabled: append `*` after the score
- Colorblind mode enabled: use high-contrast emoji (🟧🟦⬛ or equivalent) instead of green/yellow
- Partial board: only include rows that were actually played (don't pad with empty rows)
- The day number in the header must match what the player sees elsewhere in the UI

**Phase:** Share mechanic implementation.

---

## Prevention Checklist

Organized by development phase.

### Phase 1: Core Game Logic and Word Selection

- [ ] Implement duplicate letter evaluation using a two-pass algorithm (green first, then yellow)
- [ ] Write unit tests for the letter evaluation function covering all duplicate cases
- [ ] Define epoch as a UTC ISO timestamp: `new Date('2026-01-01T00:00:00Z').getTime()`
- [ ] Compute day index using UTC date math, not local timezone
- [ ] Add `% wordList.length` guard on day index to prevent out-of-bounds
- [ ] Separate `ANSWER_WORDS` (daily pool) from `VALID_GUESSES` (full dictionary) in word list files
- [ ] Add `vercel.json` with SPA rewrite rule from the start
- [ ] Use `<div>` tiles, not `<input>` elements; capture physical keyboard at document level
- [ ] Block all keyboard input while `isAnimating` is true or game is over

### Phase 2: Persistence and Stats

- [ ] Define localStorage schema with a version field before first save
- [ ] Write a migration function that handles missing or old-version data gracefully
- [ ] Test: manually corrupt localStorage entries and verify app doesn't crash
- [ ] Verify that "last played date" comparison uses UTC, not local date, to avoid double-play on timezone boundary

### Phase 3: Animation

- [ ] Apply color classes at the midpoint of the flip animation (50% keyframe), not at state update time
- [ ] Stagger tile reveal delays: `0.3s * position` for 6 tiles = 1.5s total max — adjust to feel right
- [ ] Use `transform` and `opacity` for animations (GPU-composited); avoid animating `width`, `height`, `background-color`
- [ ] Use `will-change: transform` sparingly — only on actively animating tiles, not permanently
- [ ] Test on a mid-range Android device; animations should not jank

### Phase 4: Share Mechanic

- [ ] Generate share text synchronously (pure computation from game state)
- [ ] Call `navigator.clipboard.writeText()` synchronously within the click handler — no `await` before it
- [ ] Add `.catch()` fallback that shows the share text in a modal with copy instructions
- [ ] Verify share output on real iOS Safari device
- [ ] Include hard mode asterisk when hard mode is active
- [ ] Use colorblind emoji variants when colorblind mode is active
- [ ] Day number in share text must use the same epoch/calculation as the game

### Phase 5: Hard Mode

- [ ] Implement `validateHardModeGuess()` as a pure function testable in isolation
- [ ] Enforce green constraints: same letter required at same position
- [ ] Enforce yellow constraints: letter must appear somewhere in next guess
- [ ] Do NOT enforce gray constraints (original Wordle does not; don't be stricter)
- [ ] Write test case: yellow at position 2 → next guess CAN still place it at position 2 (not blocked)

### Phase 6: Accessibility and Mobile Polish

- [ ] Modals (How to Play, game over) must trap focus with Tab cycling inside
- [ ] Modals must return focus to the trigger element on close
- [ ] Modals need `role="dialog"`, `aria-modal="true"`, `aria-labelledby`
- [ ] Keyboard state changes (green/yellow/gray keys) must have accessible labels, not just color
- [ ] Test on real iOS Safari; verify on-screen keyboard doesn't trigger system keyboard
- [ ] Verify share button works on real iPhone (not just Chrome mobile emulation)

---

## Sources

- [Duplicate letter algorithm — Bryan Chen's Wordle guide](https://thesilican.com/articles/make-a-wordle-clone/)
- [Duplicate letter bug PR — anuragl94/wordle-clone](https://github.com/anuragl94/wordle-clone/pull/4)
- [Timezone drift — Leif Thoughts: Playing Wordle for a different day](https://leif.io/blog/2022/01/12/play-wordle-for-a-different-day/)
- [Clipboard API Safari async context restriction — Wolfgang Rittner](https://wolfgangrittner.dev/how-to-use-clipboard-api-in-safari/)
- [Clipboard API Safari failures — Apple Developer Forums](https://developer.apple.com/forums/thread/691873)
- [Share button on iPhone broken — cwackerfuss/react-wordle Issue #94](https://github.com/cwackerfuss/react-wordle/issues/94)
- [Wordle subtle design decisions — Hacker News discussion](https://news.ycombinator.com/item?id=30435522)
- [localStorage migration — NYT Wordle streak loss context](https://dev.to/timothee/how-wordle-kept-your-streak-alive-when-it-migrated-to-the-nyts-website-170b)
- [Vercel SPA 404 routing fix — DEV Community](https://dev.to/rohantgeorge/how-to-fix-404-error-on-vercel-with-react-router-and-client-side-routing-1n52)
- [CSS GPU animation performance — Smashing Magazine](https://www.smashingmagazine.com/2016/12/gpu-animation-doing-it-right/)
- [Answer list exposed in JS source — Screen Rant](https://screenrant.com/wordle-source-code-hack-every-word-revealed/)
- [Hard mode rules — Mental Floss](https://www.mentalfloss.com/posts/wordle-hard-mode-how-it-works)
- [Keyboard input bugs in Wordle clones — general mobile UX research](https://github.com/richardkentng/wordle-clone)
