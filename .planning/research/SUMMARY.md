# Research Summary — Longdle

**Project:** Longdle — 6-letter daily Wordle clone
**Domain:** Static React SPA, client-side game, no backend
**Researched:** 2026-05-04
**Confidence:** HIGH

## Executive Summary

Longdle is a well-scoped personal project with a tiny audience (2 players) and a completely static architecture. The patterns for building this type of game are mature and extensively documented — multiple open-source React Wordle clones exist, the core algorithms (tile scoring, day indexing, localStorage persistence) are solved problems. There is no novel engineering here; the value is entirely in the curation, theming, and product feel.

The recommended approach is Vite + React 19 + TypeScript + Zustand + Tailwind CSS v4, deployed to Vercel with a `vercel.json` SPA rewrite. Skip a JS animation library for Phase 1 — pure CSS `@keyframes` handles all tile and keyboard effects with zero dependencies, and the pixel art animation slot (v3 requirement) can be stubbed as a no-op component from the start. The architecture is a single `useGame` custom hook owning all game logic, feeding into pure rendering components. Build the data layer first (word lists, scoring algorithm, day-index math), unit-test it before touching React, then build the UI shell against mocked data, then wire them together.

The two genuinely dangerous risks are: (1) the duplicate-letter tile-scoring bug, present in the majority of amateur Wordle clones and breaking the game for any word with repeated letters — must be caught with unit tests before the UI is built; and (2) timezone drift in the day-index calculation, which would cause the two players to see different daily words — a direct failure of the game's core value proposition. Both are fully preventable with the algorithms specified in the research.

---

## Recommended Stack

| Technology | Version | Role |
|------------|---------|------|
| Vite | 8.x | Build tool, dev server, HMR |
| React | 19.x | UI framework (owner requirement) |
| TypeScript | 5.x | Type safety |
| Tailwind CSS | 4.x + `@tailwindcss/vite` | Styling — CSS custom properties for dark green palette |
| Zustand | 5.x | Game state + `persist` middleware for localStorage |
| Vitest | 4.x | Unit tests — Vite-native, Jest-compatible API |
| @testing-library/react | 16.x | Component tests |
| Vercel | latest | Deploy — auto-detects Vite, no config needed beyond `vercel.json` |

**Do not use:** Next.js (SSR overkill), Redux (overkill), CRA (dead), `framer-motion` (use `motion` package if needed).

---

## Table Stakes Features

Must ship in v1. Missing or broken = game feels unfinished.

- **6x7 guess grid** — 6 columns × 7 rows; active row highlighted
- **Color-coded tile feedback** — green/yellow/gray; two-pass duplicate letter handling (non-trivial)
- **On-screen keyboard with key state** — keys update to best color seen; never downgrade from green
- **Physical keyboard input** — A-Z, Backspace/Delete, Enter; no native `<input>` elements
- **Day-indexed daily word** — deterministic UTC-based calculation; cycles curated word list
- **Win/loss detection and end state** — success message, word reveal on loss, input disabled
- **Invalid guess feedback** — row shake + brief toast ("Not in word list", "Not enough letters")
- **How-to-play modal** — auto-shown on first visit; accessible via header on return
- **Emoji grid share-to-clipboard** — `Longdle #N X/7` format; core social mechanic
- **localStorage persistence** — game state survives refresh; stats survive sessions
- **Stats tracking + modal** — played, win %, streaks, guess distribution histogram
- **Colorblind mode** — high-contrast palette stored in settings
- **Hard mode** — green letters locked, yellow letters must reappear; stored in settings
- **Mobile-responsive layout** — on-screen keyboard is primary mobile input
- **Dark green jungle theme** — CSS custom properties matching owner's personal site

---

## Architecture at a Glance

State is unidirectional. A single `useGame` hook owns all mutations. Components are pure renderers.

```
App
├── useGame (all game logic: input → validation → scoring → persistence)
├── Header (HelpButton, SettingsButton)
├── Board → Row × 7 → Tile × 6
├── Keyboard → Key × 28
├── HowToPlayModal
├── SettingsModal (HardModeToggle, ColorblindModeToggle)
└── EndGameModal (ResultSummary, GuessDistributionChart, ShareButton)
```

**Build order:**
1. `src/data/words.ts` — ANSWERS + VALID_GUESSES (never sorted alphabetically)
2. `src/lib/scoring.ts` — dual-pass `scoreTiles()` — unit-test before touching React
3. `src/lib/wordSelection.ts` — UTC day-index math — unit-test for timezone correctness
4. `src/lib/hardMode.ts` — `validateHardModeGuess()` pure function
5. `src/lib/localStorage.ts` — three namespaced keys with schema version
6. `useGame` hook — connects all lib functions to React state
7. Static UI shell (Tile, Row, Board, Key, Keyboard) — against hardcoded stub data
8. Wire `useGame` to shell — game playable at this point
9. Modals (HowToPlay, Settings, EndGame) + share mechanic
10. Theme and polish — CSS animations, toasts, colorblind palette
11. `<WinAnimation />` stub — no-op, documented for v3

**localStorage keys:** `longdle-game-state` (session), `longdle-stats` (lifetime), `longdle-settings` (preferences). All include a `version` field.

---

## Critical Pitfalls to Avoid

**1. Duplicate letter scoring (single-pass bug)**
The naive algorithm mis-colors tiles when a letter appears more times in the guess than the answer. Two-pass required: green pass first (consuming matched positions), then yellow pass on remaining slots. Write unit tests before building UI. #1 correctness bug in open-source clones; more frequent with 6-letter words.

**2. UTC timezone drift in day-index**
`new Date()` uses device local time — two players in different timezones see different daily words, breaking the core value proposition. Define epoch as `new Date('2026-01-01T00:00:00Z').getTime()` and compute using `Date.UTC()` exclusively. Lock before building localStorage persistence.

**3. Clipboard API silent failure on iOS Safari**
`navigator.clipboard.writeText()` fails silently if any `await` precedes the call (gesture context consumed). Generate share text synchronously, call `writeText` synchronously, add `.catch()` fallback showing text in a modal. Test on a real iPhone.

**4. Keyboard input not blocked during animation or after game end**
Add `isAnimating` boolean to game state; guard all key handlers with `if (isAnimating || gameOver) return`.

**5. localStorage schema drift**
Add a `version` field to every stored object from day one; write a migration function before the first real deployment.

**Bonus:** Apply color CSS classes at the 50% keyframe midpoint of the flip, not at React state update time. Without this, color is visible before the tile "reveals" it.

---

## Open Questions

Decisions needed before Phase 1 starts:

1. **Word list source** — Where do ANSWERS (~1,000-2,000 words) and VALID_GUESSES (~8,000-15,000 words) come from? This is the foundation — must be resolved before coding begins.
2. **Launch epoch date** — The EPOCH constant must be set to the actual launch date and never changed post-launch.
3. **Animation scope for v1** — Pure CSS vs. adding `motion`. Research recommends CSS-only for v1.
4. **Colorblind emoji in share text** — Confirm exact high-contrast emoji set (e.g., 🟧🟦) before implementing share.
5. **Vercel subdomain config** — `longdle.personalsite.com` mapping done via Vercel dashboard, not code.

---

## Research Confidence

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | Official docs, verified npm versions |
| Features | HIGH | Cross-verified against original Wordle and open-source clones |
| Architecture | HIGH | Consistent patterns across many documented implementations |
| Pitfalls | HIGH | Each sourced from real bugs in published clones or official API docs |

**Overall: HIGH** — Wordle has been cloned hundreds of times publicly. The algorithms are fully specified. The main uncertainty is word list sourcing (a one-time manual task).

---

*Last updated: 2026-05-04*
