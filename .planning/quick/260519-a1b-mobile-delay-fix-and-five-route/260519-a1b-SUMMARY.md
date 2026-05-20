---
id: 260519-a1b
date: 2026-05-19
title: Fix mobile keyboard delay + add /five route
status: complete
commits:
  - 8e0c795
  - ec4f415
---

# Summary: Fix Mobile Keyboard Delay + Add /five Wordle Route

## What Was Done

Two independent improvements shipped in two atomic commits.

### Task 1: Mobile Keyboard Fix (commit 8e0c795)

Added `touch-action: manipulation` to `.keyboard` container in `src/styles/tiles.css`. Mobile browsers were applying scroll-intent detection latency to the entire keyboard area because the container was inside `overflow-y: auto` — even though individual `.key` buttons already had the property, it needed to be on the container too.

Replaced `createJSONStorage(() => localStorage)` with a debounced adapter that batches writes with a 300ms delay. This prevents blocking the main thread on every letter press. The adapter wraps a real `Storage` object and passes through `createJSONStorage` so Zustand gets the correct `StorageValue<T>` types. Both `useGame` and `useSettings` stores share the debounced adapter.

**Files modified:**
- `src/styles/tiles.css` — `touch-action: manipulation` on `.keyboard`
- `src/hooks/useGame.ts` — debounced localStorage adapter for both stores

### Task 2: /five Route (commit ec4f415)

Generated `src/data/fiveWords.ts` from the raw corpus (3,238 answers, 12,971 valid guesses — all 5-letter words). Created `src/data/fiveConfig.ts` for daily manual updates.

Added `wordLength` prop (default 6, backward-compatible) to `Row.tsx` and `Board.tsx` so the same components render 5-tile rows without code duplication.

Created `useFiveGame.ts` Zustand store — in-memory only (no persist), fixed answer from `fiveConfig.ts`, 5-letter word validation, 1000ms flip total (vs 1150ms for 6-letter game), no hard mode.

Created `FiveGame.tsx` with simple inline end-game modal (won/lost message + word reveal). No separate modal component needed.

Added `/five` pathname route in `main.tsx`.

**Files created:**
- `src/data/fiveWords.ts` (auto-generated, 3,238 answers + 12,971 valid)
- `src/data/fiveConfig.ts` (FIVE_ANSWER = 'dusty', FIVE_PUZZLE_NUMBER = 1795)
- `src/hooks/useFiveGame.ts`
- `src/components/FiveGame.tsx`

**Files modified:**
- `src/components/Row.tsx` — `wordLength` prop added
- `src/components/Board.tsx` — `wordLength` prop added, passed to Row
- `src/main.tsx` — `/five` route added

## Deviations from Plan

**Debounced storage type fix (Rule 1 - Bug):** Initial implementation of `debouncedStorage` returned raw `string | null` from `getItem`, which is incompatible with Zustand's `PersistStorage<T>` type. Fixed by wrapping the debounced backend in a proper `Storage` interface object and passing it through `createJSONStorage()`, which handles JSON serialization and returns the correct `StorageValue<T>` type. Build confirmed passing after fix.

## How to Update Daily

Edit `src/data/fiveConfig.ts`:
```ts
export const FIVE_ANSWER = 'newword'
export const FIVE_PUZZLE_NUMBER = 1796
```

Then commit and deploy.
