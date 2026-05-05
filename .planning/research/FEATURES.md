# Features Research — Longdle

**Domain:** Daily 6-letter Wordle clone, static React app, 2-person audience
**Researched:** 2026-05-04
**Confidence:** HIGH (all core features verified against original Wordle design and multiple clone implementations)

---

## Table Stakes

Features users expect from any Wordle clone. Missing or broken = game feels unfinished.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| 6x7 guess grid | Visual contract of the game format | Low | 6 columns (letters) × 7 rows (guesses); active row highlighted |
| Color-coded tile feedback | Core mechanic — green (correct position), yellow (present, wrong position), gray (absent) | Low | Must handle duplicate letters correctly: green is assigned first, then yellow from remaining pool — a non-obvious edge case |
| On-screen keyboard with key state | Players expect the keyboard to reflect what they know | Medium | Keys update to best color seen for that letter (green > yellow > gray); never downgrade a key's color |
| Physical keyboard input | Standard input behavior; absence is jarring on desktop | Low | Handle A-Z letters, Backspace (and Delete), Enter; prevent non-alpha characters |
| Day-indexed daily word | The "daily ritual" is the whole point | Low | Deterministic: `wordList[daysSinceEpoch % wordList.length]`; no server needed |
| Win/loss detection + end state | Game must end and communicate outcome | Low | Show success message on win; reveal word on loss; disable further input |
| Invalid word handling — shake + toast | Gentle error feedback without punishment | Low | Row shakes on invalid submission; brief toast ("Not in word list", "Not enough letters"); NO aggressive error state |
| Already-guessed word prevention | Prevents obvious cheating / accidental resubmit | Low | Block resubmission silently or with subtle toast |
| How-to-play modal | Required for any first-time player | Low | Show automatically on first visit (check localStorage flag); dismissible; accessible via header icon on return visits |
| Emoji grid share-to-clipboard | The sharing mechanic is the entire social loop for this game | Medium | Format: "Longdle #N X/7\n[emoji grid]"; ⬛/⬜ for absent, 🟨 for present, 🟩 for correct; dark/light mode affects absent square color; hard mode adds asterisk |
| localStorage persistence | Game state must survive page refresh | Low | Persist: current game state (guesses so far), win/loss status for today, all-time stats |
| Stats tracking | Players expect to see their history | Low | Track: games played, win %, current streak, max streak, guess distribution (histogram by guess number, 1–7 plus failures) |
| Stats modal | Standard display after game ends | Low | Show after win/loss; also accessible via header icon |
| Colorblind mode (high contrast) | Accessibility baseline for a color-dependent game | Low | Replace green/yellow with orange/blue; store preference in localStorage |
| Hard mode | Expected settings option in any Wordle variant | Medium | Any green letter must stay in that position in subsequent guesses; any yellow letter must appear somewhere in subsequent guesses; validate on submission not on typing; store preference in localStorage |
| Mobile-responsive layout | Most players will use phones | Medium | Keyboard and grid must fit within viewport without scrolling; on-screen keyboard is the primary input on mobile; avoid native keyboard popping up |
| Dark/themed UI | The aesthetic IS the product differentiation for Longdle | Low | Dark green jungle palette; applied globally; affects tile colors (absent tiles are dark on dark backgrounds) |

---

## Differentiators

Features above the Wordle baseline that are appropriate for Longdle's specific context.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| 6-letter word / 7-guess balance | Longdle's core identity twist — harder word length gets one compensating guess | Low | Already decided in PROJECT.md; the design rationale should be surfaced in the how-to-play modal |
| Dark green jungle theme | Feels like a natural extension of owner's personal site; not a generic Wordle clone | Low | CSS custom properties make this straightforward; the "personal" feel is meaningful for a 2-person audience |
| Curated 6-letter word bank | Word quality matters more than quantity for a tiny audience playing daily | Medium | Words should follow Wordle's curation philosophy: common, unambiguous, no proper nouns, no obscure technical terms; a curated list of ~1,000–2,000 words provides years of daily puzzles |
| Placeholder hook for v3 pixel art | Owner has red panda assets coming; designing in the hook now costs nothing and avoids a painful refactor later | Low | A no-op component slot (e.g., `<WinAnimation />`) that renders nothing until assets arrive; document its intended behavior in comments |
| Win animation slot | Even before pixel art assets, a tile-bounce win animation ("juice") creates a satisfying moment | Low | Standard Wordle bounce can occupy the slot; replaced by pixel art gif in v3 |

---

## Anti-Features (deliberately out of scope)

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| Backend / API server | Adds cost, complexity, and a failure surface for a 2-person game | Day-index word selection on the client; word list baked into the bundle |
| User accounts / auth | Zero value for 2 users; adds auth complexity, password management, and a security surface | localStorage per device; each player has their own stats naturally |
| Built-in score comparison UI | The emoji-grid-via-chat is the entire social mechanic; building a comparison screen adds complexity and duplicates the chat | Ship clipboard copy; let players paste into their chat app |
| Leaderboards / rankings | No audience for it; 2 players do not need a ranked system | Not applicable |
| Practice / unlimited mode | Wordle's scarcity is a feature — one puzzle daily creates ritual and anticipation | Intentionally no practice mode; game ends when daily puzzle is complete |
| Multiple simultaneous puzzles (Quordle-style) | Dramatically increases complexity with no audience need | Single daily puzzle only |
| Hints / reveal-a-letter mechanics | Undermines the game's integrity for a 2-person competitive context | Hard mode actually goes the opposite direction |
| Push notifications / email reminders | No infra, tiny audience, over-engineered for the use case | The daily ritual is self-sustaining for engaged players |
| Server-side word validation | Adds a network dependency and latency for zero security benefit with 2 users | Client-side word list validation only |
| Animated pixel art theming (v3 assets) | Assets not yet provided; implementing placeholder UI around missing content wastes time | Design a no-op component slot; implement in v3 when assets are ready |
| Sound effects | Adds asset management, raises accessibility concerns, and is not standard Wordle behavior | Silent interactions; the visual feedback is sufficient |
| Social login / share-to-Twitter button | Adds OAuth complexity; the game's audience uses direct chat for sharing | Plain clipboard copy; players decide where to paste |

---

## Feature Dependencies

Build order is constrained by these dependencies. Lower items cannot be built before the items above them.

```
Word bank (curated 6-letter list)
  └── Day-index selection logic
        └── Core game state (current guess, all guesses, turn count, win/loss)
              ├── Guess grid rendering (reads game state)
              ├── On-screen keyboard (reads + writes game state)
              │     └── Physical keyboard event listener (wraps on-screen keyboard actions)
              ├── Tile flip animation (triggered on guess submission)
              │     └── Staggered color reveal (tiles flip one by one with delay)
              ├── Invalid word validation (shake + toast)
              │     └── Word list for validation (separate from answer list — all valid 6-letter guesses)
              ├── Win/loss detection
              │     ├── End state UI (message, word reveal)
              │     ├── Stats update (write to localStorage)
              │     ├── Stats modal (reads localStorage)
              │     └── Emoji grid share mechanic (reads game state)
              └── Hard mode validation (wraps guess submission, reads prior guesses)

localStorage layer (must exist before stats, settings, and game state persistence)
  ├── Stats tracking (games played, win %, streaks, distribution)
  ├── Colorblind mode preference
  ├── Hard mode preference
  └── First-visit flag (controls how-to-play modal auto-show)

How-to-play modal (reads first-visit flag; otherwise independent)

Theme / dark green jungle CSS (independent of all game logic; can be applied at any point)

Placeholder v3 animation component (independent; no-op stub, documented for future use)
```

### Critical dependency note — double-letter coloring

The tile coloring algorithm has a non-obvious dependency: green assignments must be computed before yellow assignments across all positions. Implement this as a single pass algorithm (not letter-by-letter) before building the keyboard state update logic, because both systems consume the same coloring output.

### Critical dependency note — hard mode + letter validation

Hard mode validation must be implemented as a layer on top of the base submission handler. It reads previous guess results to enforce constraints. This means the guess result data structure must be designed up front to support constraint extraction — retrofit is painful.

---

## Implementation Notes for Roadmap

### Tile animation timing (verified from Wordle)
- Flip animation: staggered per tile, approximately 300ms per tile with a 100ms delay between tiles
- Bounce win animation: sequential bounce starting from first tile after all flips complete
- Shake invalid: 600ms horizontal shake on the active row, no color change
- Key color transitions: 300ms CSS transition after tile flip sequence completes

### Sharing format for Longdle
```
Longdle #42 4/7*
⬛🟨⬛⬛⬛⬛
🟩⬛🟨⬛🟨⬛
🟩🟩🟩⬛🟩⬛
🟩🟩🟩🟩🟩🟩
```
- `*` suffix on guess count when hard mode is active
- `X/7` when the puzzle is lost
- Absent tile: ⬛ (dark theme) or ⬜ (light theme) — since Longdle is dark-themed, always use ⬛
- Number sign and puzzle index require the epoch date and day-index to be accessible at share time

### Stats structure (localStorage schema to agree on early)
```json
{
  "gamesPlayed": 14,
  "gamesWon": 12,
  "currentStreak": 5,
  "maxStreak": 8,
  "guessDistribution": [0, 1, 3, 4, 2, 1, 1],
  "lastPlayedDate": "2026-05-04",
  "lastWonDate": "2026-05-03"
}
```
- `guessDistribution` index 0 = solved in 1 guess, index 6 = solved in 7 guesses
- `lastPlayedDate` determines whether today's game is already complete on page load

### Word list sizing guidance
- Answer list: ~1,000–2,000 curated common 6-letter words (years of daily puzzles)
- Valid guess list: larger set (~8,000–15,000) of any valid English 6-letter words for input validation
- Both lists ship as static JS arrays in the bundle — no fetch required

---

## Sources

- [Why Wordle Works: A UX Breakdown (Design Bootcamp)](https://medium.com/design-bootcamp/why-wordle-works-a-ux-breakdown-485b1dbba30b)
- [Wordle: How a Simple UX Design Just Feels Right (Ikangai)](https://www.ikangai.com/wordle-how-a-simple-ux-design-just-feels-right/)
- [Build a Wordle-like Game Using React (OpenReplay)](https://blog.openreplay.com/build-a-wordle-like-game-using-react/)
- [Wordle in React: Part 2 — Animations (Cup of Code)](https://cupofcode.blog/wordle-in-react-part-2/)
- [Wordle Wikipedia](https://en.wikipedia.org/wiki/Wordle)
- [Hacker News: Wordle Tile Flipping Animation Discussion](https://news.ycombinator.com/item?id=30436902)
- [How Wordle Scoring Works — Streaks & Stats](https://wordle0.com/how-wordle-scoring-works-streaks-stats-2026/)
- [Wordle Hard Mode Guide (Phrazle)](https://phrazle.co.uk/blog/wordle-hard-mode-guide/)
- [Wordle Colorblind Mode (HardReset.info)](https://www.hardreset.info/devices/apps/apps-wordle/enable-color-blind-mode/)
- [6-Letter Wordle / Lingle](https://www.thewordfinder.com/6-letter-wordle/)
