# Longdle — Project Instructions

## What This Is

Longdle is a 6-letter daily Wordle clone built as a static React SPA deployed to Vercel. Two people play the same daily puzzle and compare results via emoji grid. No backend, no accounts — localStorage only.

## Stack

- **Vite 8 + React 19 + TypeScript** — scaffold: `npm create vite@latest -- --template react-ts`
- **Zustand 5** with `persist` middleware — all game state + settings + stats in one store
- **Tailwind CSS v4** + `@tailwindcss/vite` — CSS custom properties carry the dark green palette
- **Vitest 4** + `@testing-library/react` — test the scoring algorithm before touching UI
- **Vercel** — auto-detects Vite; needs a `vercel.json` SPA rewrite for all paths → `index.html`

## Critical Correctness Rules

### Tile Scoring (duplicate letters)
**Always use a two-pass algorithm.** Single-pass scoring mis-colors tiles when a letter appears more times in the guess than the answer.
1. Green pass: mark all exact matches, consume those letter slots
2. Yellow pass: from remaining unmatched slots, mark letters present elsewhere (but not already matched green)

### Day-Index (timezone)
**Use `Date.UTC()` exclusively — never `new Date()` local time.** Two players must always see the same daily word.
```ts
const EPOCH = new Date('2026-05-04T00:00:00Z').getTime()
const getDayIndex = () => {
  const now = new Date()
  const utcToday = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())
  return Math.floor((utcToday - EPOCH) / 86_400_000)
}
```

### Clipboard (iOS Safari)
**No `await` before `navigator.clipboard.writeText()`** — Safari revokes the gesture context. Generate share text synchronously, then call `writeText` synchronously. Include a `.catch()` fallback showing the text in a modal.

### Keyboard Input
Guard all key handlers: `if (isAnimating || gameOver) return` — prevents input during tile flip animations and after game end.

### localStorage
Three namespaced keys, each with a `version` field:
- `longdle-game-state` — session resume (overwritten every guess)
- `longdle-stats` — lifetime stats (written only on game end)
- `longdle-settings` — preferences (written on toggle)

## Build Order (dependency sequence)

1. `src/data/words.ts` — ANSWERS + VALID_GUESSES (answer list NOT sorted alphabetically)
2. `src/lib/scoring.ts` — `scoreTiles()` — **unit-test before any UI**
3. `src/lib/wordSelection.ts` — `getDayIndex()` — **unit-test timezone correctness**
4. `src/lib/hardMode.ts` — `validateHardModeGuess()` pure function
5. `src/lib/storage.ts` — three namespaced keys, schema version
6. `src/hooks/useGame.ts` — connects lib functions to React state
7. Static UI shell (Tile, Row, Board, Key, Keyboard) — against hardcoded stub data
8. Wire useGame to shell — game is playable
9. Modals (HowToPlay, Settings, EndGame) + share mechanic
10. Theme + CSS animations + mobile polish
11. `<WinAnimation />` no-op stub — documented interface for v3 red panda assets

## Word List Curation

- **ANSWERS** (~1,000–2,000 words): start from cfreshman's Wordle corpus filtered to 6 letters; remove plurals, proper nouns, obscure words per Wordle-style philosophy
- **VALID_GUESSES** (~8,000–15,000 words): broader 6-letter word list for guess validation
- Answer list must NOT be sorted alphabetically in source

## Roadmap

- **Phase 1: Foundation** — data layer, algorithms, useGame, playable game (GAME-01–04, DAILY-01–05, WORDS-01–04)
- **Phase 2: Features** — share, stats, modals, settings, v3 stub (SHARE-01–04, ONBOARD-01–02, SETTINGS-01–03, V3-01)
- **Phase 3: Polish + Deploy** — dark green theme, CSS animations, mobile, Vercel deploy (THEME-01–05, DEPLOY-01–02)

See `.planning/ROADMAP.md` for full phase details and success criteria.
See `.planning/REQUIREMENTS.md` for complete requirement list with REQ-IDs.
See `.planning/research/SUMMARY.md` for architecture patterns and pitfalls.

## GSD Workflow

This project uses GSD (Get Shit Done) for structured planning and execution.
- Plan a phase: `/gsd-plan-phase <N>`
- Execute a phase: `/gsd-execute-phase <N>`
- Check progress: `/gsd-progress`
