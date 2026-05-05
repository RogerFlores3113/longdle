---
phase: 02-features
fixed_at: 2026-05-05T23:30:00Z
review_path: .planning/phases/02-features/02-REVIEW.md
iteration: 1
findings_in_scope: 8
fixed: 8
skipped: 0
status: all_fixed
---

# Phase 02: Code Review Fix Report

**Fixed at:** 2026-05-05T23:30:00Z
**Source review:** .planning/phases/02-features/02-REVIEW.md
**Iteration:** 1

**Summary:**
- Findings in scope: 8 (3 Critical + 5 Warning)
- Fixed: 8
- Skipped: 0

## Fixed Issues

### CR-01: Stats histogram highlight uses wrong index

**Files modified:** `src/components/StatsModal.tsx`
**Commit:** d116d43
**Applied fix:** Extracted `highlightIndex = gameStatus === 'won' ? guesses.length - 1 : -1` to make the intent explicit and decouple the highlight from the inline comparison. Combined with WR-03 fix in the same commit.

---

### CR-02: `useGame.getState()` called inside JSX — bypasses reactivity

**Files modified:** `src/components/EndGameModal.tsx`
**Commit:** 00ae9f2
**Applied fix:** Added `const dayIndex = useGame((s) => s.dayIndex)` and `const guessCount = useGame((s) => s.guesses.length)` Zustand selectors at the top of the component. Replaced the inline `useGame.getState()` calls in the WinAnimation JSX with the reactive selector values. Also updated `handleShare` to use the reactive `dayIndex` value instead of destructuring from `getState()` (kept `useGame.getState()` only for `guesses` inside the non-reactive share handler, which is iOS-safe per CLAUDE.md).

---

### CR-03: Module-level timer variables create state leakage across HMR reloads

**Files modified:** `src/hooks/useGame.ts`
**Commit:** bf983f0
**Applied fix:** Added `import.meta.hot.dispose()` registration after the timer declarations to clear `toastTimer` and `shakeTimer` when Vite replaces the module during HMR. Added comment documenting the dev-only nature of the risk and that it is acceptable for a two-person game in production.

---

### WR-01: Modal dialog missing `aria-labelledby`

**Files modified:** `src/components/Modal.tsx`, `src/components/HowToPlayModal.tsx`, `src/components/SettingsModal.tsx`, `src/components/StatsModal.tsx`, `src/components/EndGameModal.tsx`, `src/components/CopyFallbackModal.tsx`
**Commit:** fb1e1ee
**Applied fix:** Added optional `ariaLabel` and `ariaLabelledBy` props to the `Modal` interface. The dialog div now sets `aria-labelledby` when provided, and `aria-label` (defaulting to `"Dialog"`) when `ariaLabelledBy` is absent. Updated all modal callers: HowToPlayModal, SettingsModal, StatsModal, and CopyFallbackModal each add an `id` to their `<h2>` and pass it as `ariaLabelledBy`. EndGameModal uses `ariaLabel` with a dynamic value since it has no static heading. Combined with WR-02 fix in the same commit.

---

### WR-02: Modal `onClose` stale-closure risk when `onClose` identity changes

**Files modified:** `src/components/Modal.tsx`
**Commit:** fb1e1ee
**Applied fix:** Added a `useRef` to hold the latest `onClose` callback, kept current via a sync `useEffect`. The keydown listener effect now runs once on mount with an empty dependency array and always calls `onCloseRef.current()`. This eliminates the brief window between `removeEventListener` and `addEventListener` that occurred on every parent re-render that produced a new `closeModal` function reference.

---

### WR-03: `readStats()` called on every render of StatsModal

**Files modified:** `src/components/StatsModal.tsx`
**Commit:** d116d43
**Applied fix:** Moved `readStats()` call from the render body into a `useState` initializer: `const [stats] = useState(() => readStats())`. This reads localStorage once on mount, is Strict Mode safe (double-invoke of the component body does not re-read), and captures the post-game stats snapshot since `recordGameEnd` writes synchronously before the modal renders. Combined with CR-01 fix in the same commit.

---

### WR-04: Double-toast UI — parallel shareToast state conflicts with game-store Toast

**Files modified:** `src/App.tsx`, `src/hooks/useGame.ts`
**Commit:** 88206ef
**Applied fix:** Exported `showGameToast(msg)` from `useGame.ts` — a thin wrapper that calls the existing `showToast` helper via `useGame.setState`, routing the message through the Zustand store. In App.tsx: removed `shareToast` state, removed the inline `<div className="toast" style={{ top: 80 }}>` element, and updated `handleShareSuccess` to call `showGameToast('Copied to clipboard!')`. Share success feedback now uses the single `<Toast />` component with consistent styling.

---

### WR-05: Double-tap can call `recordGameEnd` twice

**Files modified:** `src/hooks/useGame.ts`
**Commit:** 309dd73
**Applied fix:** Added `isAnimating: gameStatus !== 'playing'` to the `set()` call that records the guess and updates `gameStatus`. On a game-ending guess, `isAnimating` is set to `true` in the same synchronous state update as `gameStatus`. The existing guard at the top of `onKey` (`if (s.isAnimating || s.gameStatus !== 'playing') return`) now blocks any rapid second Enter press that arrives before the React re-render — preventing `recordGameEnd` from being called twice.

---

## Skipped Issues

None — all findings were fixed.

---

_Fixed: 2026-05-05T23:30:00Z_
_Fixer: Claude (gsd-code-fixer)_
_Iteration: 1_
