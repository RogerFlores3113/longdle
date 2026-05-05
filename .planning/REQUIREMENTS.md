# Requirements — Longdle

**Project:** Longdle — 6-letter daily Wordle clone
**Version:** v1
**Last updated:** 2026-05-04

---

## v1 Requirements

### Core Game Loop

- [ ] **GAME-01**: User can see a 6×7 grid (6 letter columns, 7 guess rows) with the active row visually highlighted
- [x] **GAME-02**: User receives color-coded tile feedback on submission — green (correct position), yellow (wrong position), gray (not in word) — using a two-pass algorithm that correctly handles duplicate letters
- [x] **GAME-03**: User can interact with an on-screen keyboard whose keys update to show the best color state seen (green > yellow > gray; never downgrade from green)
- [x] **GAME-04**: User can type letters using the physical keyboard (A-Z, Backspace/Delete, Enter) without a native `<input>` element capturing focus

### Daily Word Mechanic

- [x] **DAILY-01**: The daily word is deterministically selected from a curated answer list using UTC-based day-index arithmetic off a fixed epoch (2026-05-04), requiring no server
- [x] **DAILY-02**: The day-index calculation uses `Date.UTC()` exclusively — never `new Date()` local time — so both players always receive the same puzzle regardless of timezone
- [x] **DAILY-03**: User sees a win message on correct guess or the answer revealed on loss (after 7 failed attempts), with all input disabled afterward
- [x] **DAILY-04**: User receives shake animation on the active row and a brief toast notification for invalid guesses ("Not in word list", "Not enough letters")
- [x] **DAILY-05**: User's in-progress game state persists in localStorage and is restored on page refresh — they resume exactly where they left off

### Word List

- [x] **WORDS-01**: The answer list (~1,000–2,000 words) is sourced from a public 6-letter word corpus (e.g., filtered from cfreshman's Wordle lists or equivalent), then hand-curated to remove plurals, proper nouns, obscure words, and words not conforming to Wordle-style curation philosophy
- [x] **WORDS-02**: A broader valid-guess list (~8,000–15,000 words) exists for guess validation; it includes the answer list plus common 6-letter words
- [x] **WORDS-03**: The answer list is NOT sorted alphabetically in source (sorting would leak upcoming words to anyone reading the bundle)
- [x] **WORDS-04**: The answer list cycles deterministically — each day maps to exactly one word, and the same word does not repeat until the full list is exhausted

### Sharing & Stats

- [ ] **SHARE-01**: User can copy an emoji grid to clipboard after game completion, formatted as `Longdle #N X/7\n\n[emoji grid]`, with puzzle number derived from the day-index
- [ ] **SHARE-02**: The clipboard write is synchronous within the user gesture handler (no `await` before `writeText`) with a `.catch()` fallback showing the text in a modal — required for iOS Safari compatibility
- [ ] **SHARE-03**: User can view lifetime stats in a modal: games played, win percentage, current streak, max streak, and a guess distribution histogram
- [ ] **SHARE-04**: Stats persist in localStorage across sessions and are updated only on game end (win or loss)

### Onboarding

- [ ] **ONBOARD-01**: A how-to-play modal is automatically shown on the user's first visit and is accessible via a help icon in the header on subsequent visits
- [ ] **ONBOARD-02**: The how-to-play modal explains the 6-letter/7-guess rules and includes a visual example of green/yellow/gray tile feedback

### Settings & Accessibility

- [ ] **SETTINGS-01**: User can enable hard mode (revealed hints must be used in subsequent guesses) — stored in localStorage settings, togglable only before a game starts
- [ ] **SETTINGS-02**: User can enable colorblind mode (high-contrast orange/blue palette replacing green/yellow) — stored in localStorage settings, togglable at any time
- [ ] **SETTINGS-03**: Share emoji grid uses the colorblind palette when colorblind mode is enabled

### Theme & Polish

- [ ] **THEME-01**: The game uses a dark green jungle-themed UI — CSS custom properties carry the color palette matching the owner's personal site aesthetic
- [ ] **THEME-02**: Tile flip animation reveals color at the midpoint of the flip (face-down position), not at React state update time
- [ ] **THEME-03**: Invalid guess rows shake with a brief CSS animation; winning row has a bounce/celebration animation
- [ ] **THEME-04**: Toast notifications appear and auto-dismiss without blocking gameplay
- [ ] **THEME-05**: The layout is mobile-responsive — on-screen keyboard is the primary mobile input method

### Deployment

- [ ] **DEPLOY-01**: The app is deployed to Vercel as a static SPA with a `vercel.json` rewrite routing all paths to `index.html`
- [ ] **DEPLOY-02**: The app is accessible via a subdomain of the owner's personal site (configured in Vercel dashboard, not code)

### v3 Placeholder

- [ ] **V3-01**: A no-op `<WinAnimation />` component slot exists in the EndGame modal with a documented interface, ready for future red panda pixel art integration — currently renders nothing

---

## v2 Requirements (Deferred)

- Sound effects — add immersion (deferred: out of scope for v1 audience size)
- Practice mode — play past puzzles or random words (deferred: daily ritual is the core value)
- Score comparison UI — visual side-by-side comparison (deferred: emoji grid via chat is the comparison mechanic)

---

## Out of Scope

- **Backend / API server** — word list is baked into frontend, day-indexed; no server needed
- **User accounts / auth** — localStorage is sufficient for a 2-person audience
- **Built-in score comparison** — emoji grid shared via chat is the comparison mechanic
- **Red panda animations / pixel art theming** — deferred to v3 (assets not yet provided); v3 stub is in scope
- **Multiplayer or real-time features** — this is a solo daily game
- **PWA / offline mode** — not needed for target audience

---

## Key Decisions

| Decision | Rationale |
|----------|-----------|
| Epoch: 2026-05-04 | Launch date = today; puzzle numbering starts from first real play session |
| Word list: curated hybrid | Start from public 6-letter corpus, hand-curate to remove plurals, proper nouns, obscure words (Wordle-style philosophy) |
| No-sort answer list | Sorting alphabetically leaks upcoming words to bundle readers |
| Two-pass tile scoring | Single-pass mis-handles duplicate letters — correctness requirement, not optimization |
| UTC-only day-index | `Date.UTC()` everywhere; epoch as UTC midnight; two players always get the same puzzle |
| Synchronous clipboard | Safari requires clipboard write in synchronous gesture context; no `await` before `writeText` |

---

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| GAME-01 | Phase 1 | Pending |
| GAME-02 | Phase 1 | Complete (01-03) |
| GAME-03 | Phase 1 | Complete (01-04) |
| GAME-04 | Phase 1 | Complete (01-04) |
| DAILY-01 | Phase 1 | Complete (01-03) |
| DAILY-02 | Phase 1 | Complete (01-03) |
| DAILY-03 | Phase 1 | Complete (01-04) |
| DAILY-04 | Phase 1 | Complete (01-04) |
| DAILY-05 | Phase 1 | Complete (01-04) |
| WORDS-01 | Phase 1 | Complete (01-02) |
| WORDS-02 | Phase 1 | Complete (01-02) |
| WORDS-03 | Phase 1 | Complete (01-02) |
| WORDS-04 | Phase 1 | Complete (01-02) |
| SHARE-01 | Phase 2 | Pending |
| SHARE-02 | Phase 2 | Pending |
| SHARE-03 | Phase 2 | Pending |
| SHARE-04 | Phase 2 | Pending |
| ONBOARD-01 | Phase 2 | Pending |
| ONBOARD-02 | Phase 2 | Pending |
| SETTINGS-01 | Phase 2 | Pending |
| SETTINGS-02 | Phase 2 | Pending |
| SETTINGS-03 | Phase 2 | Pending |
| V3-01 | Phase 2 | Pending |
| THEME-01 | Phase 3 | Pending |
| THEME-02 | Phase 3 | Pending |
| THEME-03 | Phase 3 | Pending |
| THEME-04 | Phase 3 | Pending |
| THEME-05 | Phase 3 | Pending |
| DEPLOY-01 | Phase 3 | Pending |
| DEPLOY-02 | Phase 3 | Pending |
