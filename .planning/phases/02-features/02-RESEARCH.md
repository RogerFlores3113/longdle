# Phase 2: Features - Research

**Researched:** 2026-05-05
**Domain:** React modal system, clipboard API, Zustand store extension, CSS custom property overrides, share mechanic
**Confidence:** HIGH

---

## Summary

Phase 2 builds every social and settings feature on top of Phase 1's complete game engine. All architectural decisions are locked in CONTEXT.md — the research validates those decisions against the actual codebase and identifies the precise integration points, implementation patterns, and pitfalls a planner needs to produce executable tasks.

The core challenge is not complexity — each individual feature is straightforward — but **sequencing and integration discipline**. App.tsx must grow from a thin shell to a modal orchestrator without breaking the game loop. The `useSettings` store must gain `hasSeenHowToPlay` without triggering a schema migration reset. The share mechanic must honor the iOS Safari synchronous clipboard constraint exactly as specified.

The codebase is in excellent shape for Phase 2: all Phase 1 requirements are complete, the CSS custom property system is ready for colorblind overrides, `readStats()` and the Stats interface already exist, and `useSettings` already uses `persist` middleware — adding one field is mechanical.

**Primary recommendation:** Build in strict dependency order: share lib first (pure, testable), then settings store extension, then Modal wrapper, then individual modals (HowToPlay, Settings, Stats, EndGame), then App.tsx integration, then header evolution.

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

- **D-01:** App.tsx owns `activeModal: 'howToPlay' | 'stats' | 'settings' | 'endGame' | null` as React useState. No Zustand for UI modal state.
- **D-02:** Shared `<Modal>` wrapper handles fixed overlay backdrop, close-on-backdrop-click, close-on-Escape, `onClose` prop.
- **D-03:** EndGame modal auto-opens when `gameStatus` transitions from `'playing'` to `'won'` or `'lost'`. `EndGameBanner` replaced entirely.
- **D-04:** Share button primary in EndGame modal, secondary in Stats modal.
- **D-05:** Emoji — Normal: 🟩🟨⬛ / Colorblind: 🟧🟦⬛
- **D-06:** Share text: `Longdle #${dayIndex + 1} ${won ? guessCount : 'X'}/7\n\n${emojiGrid}`
- **D-07:** Synchronous clipboard write per CLAUDE.md: generate text synchronously, call `writeText` synchronously (no `await` before the call), `.catch()` fallback opens modal showing text.
- **D-08:** `generateShareText(guesses, dayIndex, colorblindMode)` is a pure function in `src/lib/share.ts`.
- **D-09:** Stats modal reads from `readStats()` directly. No Zustand for stats.
- **D-10:** Histogram bars: `<div>` with `width: {pct}%` inline style. Minimum 8% width so empty bars are visible. Current game's bar highlighted with `.stats-bar--highlight`.
- **D-11:** Stats displayed: Games Played, Win %, Current Streak, Max Streak, Guess Distribution rows 1–7.
- **D-12:** `hasSeenHowToPlay: boolean` (default `false`) added to `useSettings` store. App.tsx opens HowToPlay on mount if `!hasSeenHowToPlay`, sets true immediately on open.
- **D-13:** HowToPlay example tiles: simplified `<div>` elements, not actual Tile component.
- **D-14:** Hard mode toggle disabled (grayed, `cursor-not-allowed`) if `guesses.length > 0`. Not hidden.
- **D-15:** Colorblind mode toggle enabled at any time.
- **D-16:** `document.documentElement.classList.toggle('colorblind', colorblindMode)` in App.tsx `useEffect`.
- **D-17:** CSS override in `tiles.css`: `html.colorblind { --color-correct: #f5793a; --color-present: #85c0f9; }`.
- **D-18:** Header refactored: left = help icon, center = "Longdle" title, right = stats icon + settings icon. Layout: flex `justify-content: space-between`.
- **D-19:** Inline SVG React components, no icon library.
- **D-20:** WinAnimation interface: `{ dayIndex: number; won: boolean; guessCount: number }`. Renders null. JSDoc documents v3 integration.
- **D-21:** WinAnimation placed inside EndGame modal, rendered only when `gameStatus === 'won'`.

### Claude's Discretion

- Exact SVG paths for 3 header icons
- Modal backdrop z-index values and stacking order
- Exact CSS class naming for modal, stats bars, settings toggles
- Whether to use `<dialog>` element or `<div role="dialog">` for modals
- Modal fade-in — deferred to Phase 3; Phase 2 modals appear instantly

### Deferred Ideas (OUT OF SCOPE)

- Modal fade-in/fade-out CSS animations — Phase 3
- Dark green jungle theme — Phase 3
- Toast appear/dismiss animation — Phase 3
- localStorage migration function — before first real deployment
- Sound effects — v2
- Practice mode — v2
- Score comparison UI — v2
- Red panda pixel art / animations — v3
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| SHARE-01 | Copy emoji grid to clipboard after game completion, format `Longdle #N X/7\n\n[emoji grid]`, puzzle number from day-index | `generateShareText()` pure function; `navigator.clipboard.writeText()` called synchronously in click handler |
| SHARE-02 | Clipboard write synchronous in user gesture handler (no `await` before `writeText`), `.catch()` fallback showing text in modal | iOS Safari constraint confirmed; pattern: generate text → call `writeText(text)` — no await between them |
| SHARE-03 | Stats modal: games played, win %, current streak, max streak, guess distribution histogram | `readStats()` + `Stats` interface already implemented in `src/lib/storage.ts`; histogram via inline-width divs |
| SHARE-04 | Stats persist in localStorage, updated only on game end | `recordGameEnd()` already called in `useGame.onKey` on game end; `STATS_KEY = 'longdle-stats'` key exists |
| ONBOARD-01 | How-to-play modal auto-shown on first visit; accessible via header help icon | `hasSeenHowToPlay` field added to `useSettings`; App.tsx opens on mount if false |
| ONBOARD-02 | How-to-play explains 6-letter/7-guess rules with visual tile examples (green/yellow/gray) | Simplified `<div>` tile examples; no dependency on Tile component |
| SETTINGS-01 | Hard mode toggle stored in localStorage, only togglable before game starts | `hardMode` already in `useSettings`; disable toggle when `guesses.length > 0` |
| SETTINGS-02 | Colorblind mode toggle stored in localStorage, togglable at any time | `colorblindMode` already in `useSettings`; CSS custom property override pattern verified |
| SETTINGS-03 | Share emoji grid uses colorblind palette when colorblind mode enabled | `generateShareText(guesses, dayIndex, colorblindMode)` receives mode as param; selects emoji set accordingly |
| V3-01 | No-op `<WinAnimation />` component slot in EndGame modal, documented interface | Renders null; interface `{ dayIndex, won, guessCount }`; JSDoc marks v3 integration point |
</phase_requirements>

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Modal orchestration (open/close) | Frontend (App.tsx React state) | — | Modal is UI state, not game state; useState keeps Zustand focused on game logic |
| Share text generation | lib layer (src/lib/share.ts) | — | Pure function; no React dependency; testable in isolation |
| Clipboard write | UI event handler (click handler) | — | Must be synchronous within user gesture context for iOS Safari |
| Clipboard fallback modal | Frontend (App.tsx activeModal) | — | Fallback text display is modal state, same system as other modals |
| Stats reading | Component (StatsModal reads directly) | lib/storage.ts | `readStats()` already in storage lib; no Zustand needed for read-only data |
| Stats writing | lib layer (storage.ts recordGameEnd) | — | Already called in useGame on game end; no changes to game store |
| Colorblind CSS class | Frontend (App.tsx useEffect) | tiles.css override | Class on `<html>` element; CSS cascade does the rest |
| Settings persistence | Zustand useSettings + persist | localStorage | Existing pattern; just adding one field |
| First-visit detection | Zustand useSettings | App.tsx useEffect | `hasSeenHowToPlay` persisted in settings store |
| Header icon actions | App.tsx event handlers | — | Icons set activeModal; same pattern as all modal triggers |

---

## Standard Stack

### Core (already installed — no new dependencies needed)

| Library | Version | Purpose | Notes |
|---------|---------|---------|-------|
| React | 19.2.5 | Component model, useState, useEffect | All Phase 2 patterns are standard React |
| Zustand | 5.0.13 | Settings store extension | Add `hasSeenHowToPlay` field; existing persist middleware handles it |
| Tailwind CSS v4 | 4.2.4 | Utility classes for modal layout | Zero-config utility classes available |
| TypeScript | 6.0.2 | Type safety | All new files fully typed |

[VERIFIED: package.json in project root]

### New Files (no new npm packages required)

| File | Purpose |
|------|---------|
| `src/lib/share.ts` | `generateShareText()` pure function |
| `src/components/Modal.tsx` | Shared modal wrapper |
| `src/components/HowToPlayModal.tsx` | First-visit onboarding |
| `src/components/StatsModal.tsx` | Lifetime stats + share button |
| `src/components/SettingsModal.tsx` | Hard mode + colorblind toggles |
| `src/components/EndGameModal.tsx` | Replaces EndGameBanner; primary share CTA + WinAnimation slot |
| `src/components/WinAnimation.tsx` | No-op stub, v3 integration point |
| `src/components/icons/` | Inline SVG icon components (HelpIcon, StatsIcon, SettingsIcon) |

**No new npm packages are required for Phase 2.** [VERIFIED: all capabilities (clipboard, CSS class toggling, modals) are native browser APIs or already-installed deps]

---

## Architecture Patterns

### System Architecture Diagram

```
User gesture (button click)
         │
         ▼
   App.tsx onClick
         │
    setActiveModal('stats') ──────────┐
         │                            │
         ▼                            ▼
  [share path]                  [modal path]
         │                            │
  generateShareText()      <Modal onClose={() => setActiveModal(null)}>
  (synchronous, pure)           └── <StatsModal />
         │                           └── <SettingsModal />
         │                           └── <HowToPlayModal />
         │                           └── <EndGameModal />
         │                                 └── <WinAnimation />
         ▼
  navigator.clipboard.writeText(text)
  .catch(() => setActiveModal('copyFallback'))
         │
         ▼
  [fallback modal shows text for manual copy]


useGame store (gameStatus)
         │
         ▼ (useEffect in App.tsx)
  gameStatus 'won'|'lost' → setActiveModal('endGame')

useSettings store (colorblindMode)
         │
         ▼ (useEffect in App.tsx)
  document.documentElement.classList.toggle('colorblind', colorblindMode)
         │
         ▼
  tiles.css: html.colorblind { --color-correct, --color-present overridden }
```

### Recommended Project Structure

```
src/
├── components/
│   ├── Board.tsx           (Phase 1 — unchanged)
│   ├── EndGameBanner.tsx   (Phase 1 — DELETE, replaced by EndGameModal)
│   ├── EndGameModal.tsx    (Phase 2 — new)
│   ├── HowToPlayModal.tsx  (Phase 2 — new)
│   ├── Keyboard.tsx        (Phase 1 — unchanged)
│   ├── Key.tsx             (Phase 1 — unchanged)
│   ├── Modal.tsx           (Phase 2 — new, shared wrapper)
│   ├── Row.tsx             (Phase 1 — unchanged)
│   ├── SettingsModal.tsx   (Phase 2 — new)
│   ├── StatsModal.tsx      (Phase 2 — new)
│   ├── Tile.tsx            (Phase 1 — unchanged)
│   ├── Toast.tsx           (Phase 1 — unchanged)
│   ├── WinAnimation.tsx    (Phase 2 — new, no-op stub)
│   └── icons/
│       ├── HelpIcon.tsx    (Phase 2 — new)
│       ├── StatsIcon.tsx   (Phase 2 — new)
│       └── SettingsIcon.tsx (Phase 2 — new)
├── hooks/
│   └── useGame.ts          (Phase 1 — add hasSeenHowToPlay to useSettings)
├── lib/
│   ├── hardMode.ts         (Phase 1 — unchanged)
│   ├── scoring.ts          (Phase 1 — unchanged)
│   ├── share.ts            (Phase 2 — new, pure function)
│   ├── storage.ts          (Phase 1 — unchanged)
│   └── wordSelection.ts    (Phase 1 — unchanged)
├── styles/
│   └── tiles.css           (Phase 1 + Phase 2 colorblind override block)
└── App.tsx                 (Phase 1 → Phase 2 evolution)
```

### Pattern 1: Modal Wrapper

The `<Modal>` component owns backdrop, Escape handling, and the close-on-backdrop-click behavior. Individual modals render inside it without knowing about overlay mechanics.

```tsx
// src/components/Modal.tsx
import { useEffect } from 'react'

interface ModalProps {
  onClose: () => void
  children: React.ReactNode
}

export function Modal({ onClose, children }: ModalProps) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-panel" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
        {children}
      </div>
    </div>
  )
}
```

[ASSUMED: `<div role="dialog">` rather than `<dialog>` element — CONTEXT.md marks this as Claude's discretion. Both are valid; `<div role="dialog">` avoids Safari `<dialog>` quirks.]

### Pattern 2: App.tsx Modal Orchestration

```tsx
// src/App.tsx (Phase 2 shape)
import { useState, useEffect } from 'react'
import { useGame, useSettings } from './hooks/useGame'

type ActiveModal = 'howToPlay' | 'stats' | 'settings' | 'endGame' | 'copyFallback' | null

function App() {
  const [activeModal, setActiveModal] = useState<ActiveModal>(null)
  const gameStatus = useGame((s) => s.gameStatus)
  const { colorblindMode, hasSeenHowToPlay, setHasSeenHowToPlay } = useSettings()

  // Auto-open HowToPlay on first visit
  useEffect(() => {
    if (!hasSeenHowToPlay) {
      setActiveModal('howToPlay')
      setHasSeenHowToPlay(true)
    }
  }, []) // run once on mount

  // Auto-open EndGame modal when game ends
  useEffect(() => {
    if (gameStatus === 'won' || gameStatus === 'lost') {
      setActiveModal('endGame')
    }
  }, [gameStatus])

  // Colorblind class on <html>
  useEffect(() => {
    document.documentElement.classList.toggle('colorblind', colorblindMode)
  }, [colorblindMode])

  // ...render modals conditionally
}
```

[VERIFIED: React useEffect dependency array behavior — standard React 19]

### Pattern 3: Synchronous Clipboard Write (iOS Safari)

This is the critical iOS Safari pattern from CLAUDE.md. The failure mode is: any `await` expression between the user gesture and the `writeText()` call causes Safari to revoke the clipboard permission.

```tsx
// Correct: no await before writeText
function handleShare() {
  const { guesses, dayIndex } = useGame.getState()
  const { colorblindMode } = useSettings.getState()
  // generateShareText is synchronous (pure function, no async)
  const text = generateShareText(guesses, dayIndex, colorblindMode)
  // writeText called synchronously within the click gesture context
  navigator.clipboard.writeText(text).catch(() => {
    // fallback: show text in modal for manual copy
    setCopyFallbackText(text)
    setActiveModal('copyFallback')
  })
}
```

```tsx
// WRONG — do not do this:
async function handleShare() {
  const text = await generateShareText(...) // ❌ breaks iOS Safari
  navigator.clipboard.writeText(text)
}
```

[VERIFIED: CLAUDE.md §"Clipboard (iOS Safari)" — explicit project requirement]

### Pattern 4: Zustand Store Extension (adding hasSeenHowToPlay)

Add one field and one setter to `SettingsState`. Because the `persist` middleware uses schema `version` + `migrate` for compatibility, adding a new field with a default value does NOT require bumping `SCHEMA_VERSION` — the persisted object simply won't have the field, Zustand merges it with the default from the initializer.

```ts
// src/hooks/useGame.ts — SettingsState (updated)
export interface SettingsState {
  version: number
  hardMode: boolean
  colorblindMode: boolean
  hasSeenHowToPlay: boolean        // NEW
  setHardMode: (v: boolean) => void
  setColorblindMode: (v: boolean) => void
  setHasSeenHowToPlay: (v: boolean) => void  // NEW
}

// In create() initializer:
hasSeenHowToPlay: false,
setHasSeenHowToPlay: (v) => set({ hasSeenHowToPlay: v }),
```

**Schema version note:** No SCHEMA_VERSION bump needed. Adding a field with a default is backward-compatible — existing persisted state missing the field gets the default on hydration. A version bump + migrate reset would lose the user's `hasSeenHowToPlay: true` state, which is the wrong behavior.

[VERIFIED: Zustand persist middleware docs via Context7 — new fields not in stored JSON get default values from the initializer on hydration]

### Pattern 5: Colorblind CSS Override

```css
/* src/styles/tiles.css — add at end of file */
html.colorblind {
  --color-correct: #f5793a;  /* orange */
  --color-present: #85c0f9;  /* blue */
}
```

The two overridden custom properties cascade down to all `.tile--correct`, `.tile--present`, `.key--correct`, `.key--present` selectors automatically — no component changes needed.

[VERIFIED: tiles.css read directly; 8 custom properties declared in `:root`; override pattern is standard CSS cascade]

### Pattern 6: Stats Histogram

```tsx
// StatsModal.tsx — histogram rendering
const stats = readStats()
const maxCount = Math.max(...stats.guessDistribution, 1) // avoid divide-by-zero
const currentGuessCount = gameStatus !== 'playing' ? guesses.length : -1

{stats.guessDistribution.map((count, i) => {
  const pct = Math.max(8, Math.round((count / maxCount) * 100))
  const isHighlighted = i === currentGuessCount - 1 && gameStatus === 'won'
  return (
    <div key={i} className="stats-row">
      <span className="stats-label">{i + 1}</span>
      <div
        className={`stats-bar ${isHighlighted ? 'stats-bar--highlight' : ''}`}
        style={{ width: `${pct}%` }}
      >
        {count}
      </div>
    </div>
  )
})}
```

**Note on loss highlighting:** `guessDistribution[6]` (index 6) represents losses per storage.ts design. The highlight only applies when `gameStatus === 'won'` — a loss doesn't highlight any bar.

[VERIFIED: `guessDistribution: number[]` — length 7, indices 0..5 = wins in 1..6 guesses, index 6 = losses — read from `src/lib/storage.ts`]

### Pattern 7: generateShareText Pure Function

```ts
// src/lib/share.ts
import type { ScoredGuess } from '../types/game'

const EMOJI_NORMAL = { correct: '🟩', present: '🟨', absent: '⬛' }
const EMOJI_COLORBLIND = { correct: '🟧', present: '🟦', absent: '⬛' }

export function generateShareText(
  guesses: ScoredGuess[],
  dayIndex: number,
  colorblindMode: boolean
): string {
  const emoji = colorblindMode ? EMOJI_COLORBLIND : EMOJI_NORMAL
  const won = guesses.length > 0 && guesses[guesses.length - 1].statuses.every(s => s === 'correct')
  const guessCount = guesses.length
  const score = won ? String(guessCount) : 'X'
  const grid = guesses
    .map(({ statuses }) =>
      statuses.map(s => {
        if (s === 'correct') return emoji.correct
        if (s === 'present') return emoji.present
        return emoji.absent
      }).join('')
    )
    .join('\n')
  return `Longdle #${dayIndex + 1} ${score}/7\n\n${grid}`
}
```

[VERIFIED: Share text format from CONTEXT.md D-06; emoji sets from D-05; TileStatus values from src/lib/scoring.ts]

### Anti-Patterns to Avoid

- **Async clipboard write:** Never `await` before `navigator.clipboard.writeText()` — iOS Safari revokes gesture context on any `await`
- **Zustand for modal state:** Modal open/close is UI state, not game state. Keep it in App.tsx `useState`
- **Schema version bump for additive field:** Adding a field with a default doesn't need a version bump; a bump would cause `migrate()` to reset ALL settings, including `hasSeenHowToPlay`
- **Tile component in HowToPlay:** Don't use the actual `<Tile>` component — it depends on `ScoredGuess` state. Use simplified `<div>` elements
- **Modifying useGame for modal:** Phase 2 must not touch game logic in `useGame.onKey`. Modal state lives in App.tsx
- **stats in Zustand:** `readStats()` is synchronous localStorage read; no Zustand store needed

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| CSS cascade for colorblind | Custom JS color mapper | `html.colorblind` class + CSS override | CSS cascade handles all 20+ affected selectors automatically |
| Clipboard fallback detection | Complex feature-detect | `.catch()` on `writeText()` promise | The `.catch()` fires on permission denial AND API absence |
| Stats persistence | Custom serialization | Existing `readStats()` / `writeStats()` from storage.ts | Already implemented, schema-versioned, error-handled |
| Escape key handling | Per-modal event listeners | Single listener in `<Modal>` wrapper | One place to maintain; no listener leaks |
| Modal stacking | z-index arithmetic per modal | Single `activeModal` string in App.tsx | Only one modal open at a time — no stacking needed |

---

## Common Pitfalls

### Pitfall 1: iOS Safari Clipboard Permission Revocation
**What goes wrong:** `navigator.clipboard.writeText()` silently fails or throws `NotAllowedError` on iOS Safari.
**Why it happens:** Safari only allows clipboard writes in the synchronous execution context of a user gesture. Any `await` — even an innocuous one — causes the browser to consider the gesture "consumed" before `writeText` is called.
**How to avoid:** `generateShareText()` must be a synchronous pure function. Call `writeText(text)` immediately after generating the text — no `await`, no `Promise.then()` chains, no `setTimeout()` between them.
**Warning signs:** Share works on Chrome/Firefox but fails silently on iOS Safari.

### Pitfall 2: Schema Version Reset on hasSeenHowToPlay Addition
**What goes wrong:** Developer bumps `SCHEMA_VERSION` when adding `hasSeenHowToPlay`, triggering `migrate()` which returns `undefined`, resetting all settings to defaults including `hasSeenHowToPlay: false`. Every returning user sees the HowToPlay modal again.
**Why it happens:** `migrate()` in useSettings is intentionally destructive — it resets on version mismatch.
**How to avoid:** Do NOT bump `SCHEMA_VERSION`. Zustand's persist middleware merges persisted state with the initializer's defaults — a missing field in persisted JSON gets the default value (`false`) on hydration. This is backward-compatible.
**Warning signs:** Returning users see HowToPlay modal on every page load after deploy.

### Pitfall 3: EndGame Modal Auto-Open Race Condition
**What goes wrong:** EndGame modal auto-opens but the game state hasn't fully settled — e.g., the winning tile score animation might not have run yet (Phase 3 concern, but the pattern should be safe now).
**Why it happens:** `useEffect` watching `gameStatus` fires synchronously after render, potentially before any animation timing.
**How to avoid:** In Phase 2 there are no tile animations (Phase 3 adds those), so the useEffect pattern is correct. When Phase 3 adds `isAnimating`, the EndGame modal's auto-open useEffect should additionally check `!isAnimating` OR use a brief delay. Document this in the Phase 3 handoff.
**Warning signs:** Modal appears before user sees their last tile color (Phase 3 issue, not Phase 2).

### Pitfall 4: Histogram Divide-by-Zero
**What goes wrong:** `Math.max(...guessDistribution)` returns `0` when no games have been played, causing `(count / maxCount) * 100` to produce `NaN` or `Infinity`.
**Why it happens:** `Math.max(0, 0, 0, 0, 0, 0, 0)` returns `0`.
**How to avoid:** `const maxCount = Math.max(...stats.guessDistribution, 1)` — the trailing `1` ensures a minimum of 1.
**Warning signs:** Stats modal shows `NaN%` bars on fresh install.

### Pitfall 5: Modal Backdrop onClick Propagating Through Panel
**What goes wrong:** Clicking inside the modal panel triggers `onClose()`.
**Why it happens:** Click event bubbles from panel children up through the backdrop's `onClick` handler.
**How to avoid:** `<div className="modal-panel" onClick={(e) => e.stopPropagation()}>` — stop propagation at the panel level.
**Warning signs:** Closing modal when clicking any button inside it.

### Pitfall 6: Hard Mode Toggle Not Disabled During Game
**What goes wrong:** Hard mode enabled mid-game — subsequent guesses enforce hard mode rules against guesses made before hard mode was enabled.
**Why it happens:** Toggle is wired but the `guesses.length > 0` disable condition is forgotten.
**How to avoid:** `<input type="checkbox" disabled={guesses.length > 0} ...>` plus visual `cursor-not-allowed` + grayed style. Include subtitle text: "Hard mode can only be enabled at the start of a game."
**Warning signs:** Hard mode toggle responsive mid-game.

### Pitfall 7: Escape Key Listener Leak
**What goes wrong:** Closing a modal doesn't clean up the Escape key listener; opening and closing multiple modals accumulates listeners.
**Why it happens:** `addEventListener` without corresponding `removeEventListener` in cleanup.
**How to avoid:** The `Modal` wrapper's `useEffect` must return a cleanup function: `return () => window.removeEventListener('keydown', handler)`.
**Warning signs:** Multiple Escape presses needed to close subsequent modals.

---

## Build Order / Dependency Sequence

This sequence minimizes integration risk by building pure/independent pieces first:

```
Wave 1 — Pure library (no React, testable in isolation)
  1. src/lib/share.ts — generateShareText() pure function
     Depends on: ScoredGuess type (Phase 1) ✓

Wave 2 — Store extension (no new components)
  2. src/hooks/useGame.ts — add hasSeenHowToPlay + setter to useSettings
     Depends on: existing useSettings store ✓

Wave 3 — CSS extension (no React changes)
  3. src/styles/tiles.css — add html.colorblind override block
     Depends on: existing :root custom properties ✓

Wave 4 — Icon components (no state dependencies)
  4. src/components/icons/HelpIcon.tsx
  5. src/components/icons/StatsIcon.tsx
  6. src/components/icons/SettingsIcon.tsx
     Depends on: nothing

Wave 5 — Modal wrapper (no game state dependencies)
  7. src/components/Modal.tsx — backdrop, Escape, close-on-backdrop-click
     Depends on: React ✓

Wave 6 — Individual modals (depend on Modal wrapper, game state)
  8. src/components/WinAnimation.tsx — no-op stub
  9. src/components/HowToPlayModal.tsx
  10. src/components/StatsModal.tsx — reads readStats() + share button
  11. src/components/SettingsModal.tsx — reads useSettings
  12. src/components/EndGameModal.tsx — reads useGame, includes WinAnimation + share button
     Depends on: Modal wrapper ✓, useGame ✓, useSettings ✓, generateShareText ✓

Wave 7 — App.tsx integration (depends on everything)
  13. src/App.tsx — activeModal state, useEffects, header refactor, import all modals
      Remove EndGameBanner import; add all modal imports
     Depends on: all above ✓
```

---

## Integration Points with Phase 1 Code

### App.tsx Changes (additive, not destructive)
- **Add:** `useState<ActiveModal>(null)` for modal orchestration
- **Add:** `useEffect` watching `gameStatus` to auto-open EndGame modal
- **Add:** `useEffect` watching `colorblindMode` to toggle `html.colorblind` class
- **Add:** `useEffect` on mount to auto-open HowToPlay if `!hasSeenHowToPlay`
- **Remove:** `EndGameBanner` import and `<EndGameBanner />` usage
- **Add:** All modal imports, conditional rendering
- **Change:** `<header>` from static text to flex with icon buttons

### useGame.ts Changes (minimal, settings store only)
- **Add:** `hasSeenHowToPlay: boolean` field to `SettingsState` interface
- **Add:** `setHasSeenHowToPlay: (v: boolean) => void` to `SettingsState` interface
- **Add:** Field + setter to `useSettings` store initializer
- **No changes to:** `GameState`, `useGame`, `onKey`, `partialize`, `migrate`, `SCHEMA_VERSION`

### tiles.css Changes (additive only)
- **Add:** `html.colorblind { --color-correct: ...; --color-present: ...; }` block at end of file
- **No changes to:** Any existing rules — the override is purely additive

### EndGameBanner.tsx
- **Delete:** This file is replaced entirely by `EndGameModal.tsx`

---

## Tailwind v4 / React 19 Specific Patterns

### Tailwind v4 — No Config File
Tailwind v4 uses `@tailwindcss/vite` plugin with zero config. There is no `tailwind.config.js`. Custom CSS goes in `tiles.css` (already the pattern for this project). Utility classes work as expected.

**Do not create `tailwind.config.js`** — it's not the v4 pattern and will conflict.

[VERIFIED: package.json — `@tailwindcss/vite: ^4.2.4`; vite.config has `tailwindcss()` plugin]

### React 19 — No Breaking Modal Patterns
React 19's concurrent mode and new hooks don't affect modal patterns in Phase 2. `useState`, `useEffect`, and standard event handling all behave identically to React 18 for this use case. No `use()` hook or Server Components are involved.

[ASSUMED: React 19 changelog — concurrent features don't affect modal/useState patterns; no React 19-specific pitfalls identified for this feature set]

### Dialog vs div[role="dialog"]
The HTML `<dialog>` element provides native backdrop, focus trap, and Escape handling. However, its `showModal()` method and styling API have Safari quirks (particularly around backdrop pseudo-element and `position: fixed` stacking contexts). For Phase 2's "appears instantly, no animation" requirement, a `<div role="dialog" aria-modal="true">` with a backdrop div is simpler and more predictable across browsers.

The `Modal` wrapper handles Escape manually via `useEffect` — equivalent to native `<dialog>` behavior.

[ASSUMED: Safari `<dialog>` quirks — based on known browser compatibility history; CONTEXT.md marks this as Claude's discretion]

---

## Testing Approach for Share Mechanic

`nyquist_validation` is `false` in `.planning/config.json` — no mandatory test coverage gate. However, `generateShareText()` is a pure function and should have unit tests consistent with the Phase 1 pattern (scoring, wordSelection, hardMode all have unit tests).

### What to test

| Test | Type | File |
|------|------|------|
| `generateShareText` with normal emoji | unit | `src/lib/share.test.ts` |
| `generateShareText` with colorblind emoji | unit | `src/lib/share.test.ts` |
| `generateShareText` won game (score = guessCount) | unit | `src/lib/share.test.ts` |
| `generateShareText` lost game (score = 'X') | unit | `src/lib/share.test.ts` |
| `generateShareText` puzzle number = dayIndex + 1 | unit | `src/lib/share.test.ts` |

### What NOT to test in unit tests

- `navigator.clipboard.writeText()` — requires real browser gesture context; mock in unit tests would give false confidence
- Modal open/close — integration test territory; not in Phase 2 test scope
- `hasSeenHowToPlay` persistence — covered by existing Zustand persist behavior

### Testing the synchronous clipboard constraint

The safest validation is manual smoke test on a real iOS Safari device or iOS Simulator. Automated tests of clipboard permission behavior are unreliable in jsdom. Include this in the Phase 2 verification checklist.

---

## UI-SPEC Coverage Needed

The planner should produce a UI-SPEC covering:

### Modal Dimensions and Backdrop
- `modal-backdrop`: fixed, full viewport, z-index (recommend 100 to sit above game, below nothing), semi-transparent dark background (e.g., `rgba(0,0,0,0.5)`)
- `modal-panel`: centered (flexbox or absolute centering), max-width (~400px), background `var(--color-bg)`, border-radius, padding, shadow
- Close button (X) placement: top-right of modal panel

### Header Layout
- `app__header` update: `justify-content: space-between` (currently `center`)
- Left zone: `<button>` with HelpIcon SVG
- Center: "Longdle" text
- Right zone: two `<button>` elements — StatsIcon, SettingsIcon
- Icon button size: recommend 36px × 36px touch targets for mobile usability
- Icon SVG size: 24px × 24px

### Stats Modal
- Layout: title "Statistics", 4 stat number displays (Games Played, Win %, Current Streak, Max Streak), then "Guess Distribution" label, then 7 histogram rows
- Histogram row: row number (1–7) left-aligned, bar div, count inside bar
- Highlighted bar: different background color (suggest `var(--color-correct)`)
- Share button: prominent, at bottom of modal

### Settings Modal
- Layout: title "Settings", two toggle rows (Hard Mode, Colorblind Mode)
- Toggle row: label (with subtitle for hard mode), toggle switch on right
- Disabled state visual: opacity 50%, cursor-not-allowed
- Toggle: styled `<input type="checkbox">` or custom CSS toggle

### EndGame Modal
- Layout: result headline ("Brilliant!" / "The word was ANSWER"), WinAnimation slot, Share button, Stats button
- WinAnimation: empty div slot (renders nothing in Phase 2)
- Auto-opens: no explicit open button needed

### HowToPlay Modal
- Layout: title "How To Play", rules text, three example tile rows
- Example tiles: simplified divs, 40px × 40px (not full 56px), with colored backgrounds and labels
- Close button visible (users may arrive here before playing their first game)

### CSS Class Naming (planner decides — suggestions)
```
.modal-backdrop
.modal-panel
.modal-close
.stats-row
.stats-label
.stats-bar
.stats-bar--highlight
.settings-row
.settings-toggle
.settings-toggle--disabled
.howtoplay-example-tile
.howtoplay-example-tile--correct
.howtoplay-example-tile--present
.howtoplay-example-tile--absent
.endgame-modal__result
.endgame-modal__actions
```

---

## Environment Availability

Step 2.6: SKIPPED — Phase 2 is purely code/config changes. No external tools, CLIs, databases, or services beyond the project's existing npm dependencies are required.

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | `<div role="dialog">` preferred over `<dialog>` element due to Safari quirks | Architecture Patterns | Low — either works; CONTEXT.md marks this as Claude's discretion |
| A2 | React 19 concurrent features don't affect useState/useEffect modal patterns | Tailwind v4 / React 19 Patterns | Low — standard hooks are unaffected by concurrent mode |
| A3 | Adding `hasSeenHowToPlay` without SCHEMA_VERSION bump is safe (additive field gets default on hydration) | Pattern 4 | Medium — if Zustand 5 behavior differs from expectation, returning users may see HowToPlay on every visit |
| A4 | Modal z-index 100 is sufficient (no other fixed elements above z-50 except toast at z-50) | UI-SPEC | Low — toast is z-50, modal at 100 will stack above it correctly |

---

## Open Questions (RESOLVED)

1. RESOLVED: **EndGame modal delay after game end**
   - What we know: `gameStatus` transitions to 'won'/'lost' on Enter key press in `useGame.onKey`
   - What's unclear: Should the EndGame modal auto-open immediately or after a brief delay (to let the user "see" their last row)? In Phase 3, tile flip animations will delay the reveal — the modal should wait for animation completion.
   - Recommendation: Phase 2 — open immediately (no animations yet). Add a `TODO: Phase 3 — wait for isAnimating = false before opening EndGame modal` comment in App.tsx.

2. RESOLVED: **Copy fallback modal identity**
   - What we know: `.catch()` should show the share text for manual copy. CONTEXT.md D-07 says "fallback opens a modal showing the text."
   - What's unclear: Is this a 6th modal type (`'copyFallback'`) or inline text in the EndGame/Stats modal?
   - Recommendation: Add `'copyFallback'` to the `ActiveModal` union type with its own simple modal showing the text in a `<textarea>` or `<pre>`. Keeps the fallback self-contained.

---

## Sources

### Primary (HIGH confidence)
- `src/hooks/useGame.ts` — SettingsState interface, persist middleware pattern, SCHEMA_VERSION, existing fields
- `src/lib/storage.ts` — Stats interface, readStats(), writeStats(), recordGameEnd(), guessDistribution semantics
- `src/styles/tiles.css` — all 8 CSS custom properties, existing class conventions, z-index of toast (z-50)
- `src/App.tsx` — current wiring, EndGameBanner usage, header structure
- `src/types/game.ts` — TileStatus, ScoredGuess, GameStatus types
- `src/components/EndGameBanner.tsx` — component to replace
- `.planning/phases/02-features/02-CONTEXT.md` — all locked decisions (D-01 through D-21)
- `package.json` — installed versions: React 19.2.5, Zustand 5.0.13, Tailwind v4.2.4, Vitest 4.1.5
- `CLAUDE.md` — iOS Safari clipboard rule, keyboard guard rule, localStorage key schema rule

### Secondary (MEDIUM confidence)
- Context7 `/pmndrs/zustand` — persist middleware `partialize` behavior; additive field hydration with defaults
- `vite.config.ts` — vitest config (jsdom environment, setupFiles)

### Tertiary (LOW confidence)
- Safari `<dialog>` element compatibility — based on training knowledge of known browser quirks; not verified in this session

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all packages verified from package.json; no new packages needed
- Architecture: HIGH — all decisions locked in CONTEXT.md; integration points verified from actual source files
- Pitfalls: HIGH (iOS clipboard, schema version) / MEDIUM (Safari dialog) — clipboard and schema pitfalls verified from CLAUDE.md and Zustand docs; dialog quirk is training knowledge
- Build order: HIGH — derived from verified dependency graph of actual files

**Research date:** 2026-05-05
**Valid until:** 2026-06-05 (stable stack; no fast-moving dependencies)
