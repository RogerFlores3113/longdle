---
phase: 04-ux-polish
reviewed: 2026-05-06T00:00:00Z
depth: standard
files_reviewed: 4
files_reviewed_list:
  - src/styles/tiles.css
  - src/components/Key.tsx
  - src/lib/wordSelection.ts
  - src/lib/wordSelection.test.ts
findings:
  critical: 1
  warning: 3
  info: 2
  total: 6
status: issues_found
---

# Phase 04: Code Review Report

**Reviewed:** 2026-05-06T00:00:00Z
**Depth:** standard
**Files Reviewed:** 4
**Status:** issues_found

## Summary

Four files were reviewed: the main stylesheet (`tiles.css`), the `Key` component, the `wordSelection` library, and its test suite. The most serious finding is a **direct contradiction between `wordSelection.ts` and the documented contract in CLAUDE.md**: the implementation uses `America/Los_Angeles` timezone pinning instead of the UTC-only approach mandated by the project's critical correctness rules. This is a functional correctness issue — two players in different timezones will see the same word (since LA is always the reference), but the implementation departs from the explicit architectural requirement and uses a timezone that will shift between UTC-7 and UTC-8 seasonally, making the LA-midnight boundary move depending on DST. The test suite validates the LA-timezone behavior, so tests pass, but they validate the wrong specification. Additional warnings cover a CSS animation conflict, a missing `transition` property on keyboard color changes, and an accessibility gap on the `Key` component.

---

## Critical Issues

### CR-01: `getDayIndex` uses LA timezone, violating the UTC-only contract in CLAUDE.md

**File:** `src/lib/wordSelection.ts:6-18`
**Issue:** The project's CLAUDE.md states under "Critical Correctness Rules / Day-Index (timezone)": **"Use `Date.UTC()` exclusively — never `new Date()` local time."** The reference implementation shown in CLAUDE.md is:

```ts
const utcToday = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())
return Math.floor((utcToday - EPOCH) / 86_400_000)
```

The actual implementation instead uses `Intl.DateTimeFormat` with `timeZone: 'America/Los_Angeles'`, deriving the day boundary from LA midnight (UTC-7 in summer, UTC-8 in winter). This means the "day" rolls over at 00:00 LA time, not 00:00 UTC. While this may be an intentional design decision (LA-relative daily puzzle), it directly contradicts the written spec and introduces DST-aware behavior that the stated contract explicitly excludes. The test suite was then written to validate the LA behavior (not UTC), so all tests pass — but both implementation and tests diverge from the spec. If the spec is correct, this is a correctness bug; if the design was intentionally changed to LA-time, CLAUDE.md must be updated to reflect it.

**Fix (if UTC was intended):**
```ts
export function getDayIndex(now: Date = new Date()): number {
  const utcToday = Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate()
  )
  return Math.floor((utcToday - EPOCH) / MS_PER_DAY)
}
```

**Fix (if LA timezone is intentional):** Update CLAUDE.md to document the LA-timezone design decision and remove the "Use `Date.UTC()` exclusively" rule, replacing it with the actual rationale.

---

## Warnings

### WR-01: `tile--flip` and `tile--active` animations conflict on the active tile during flip

**File:** `src/styles/tiles.css:73-74` and `src/styles/tiles.css:100-101`
**Issue:** A tile in the active row has class `tile--active` applied while the letter is being typed (for the pop animation). When the row is submitted and flip begins, the `tile--flip` class is added. CSS does not compose two `animation` declarations on the same element — the second `animation` property overwrites the first. If both classes are simultaneously present on a tile at the moment flip starts, only one animation fires (whichever is declared last in the cascade, i.e. `tile--flip` wins since it appears later in the file). This is likely fine in practice because `tile--active` is removed when the guess is submitted, but the timing window between submission and React's re-render is non-zero. If the active class is not removed atomically before the flip class is added, the pop animation is silently dropped. No defensive comment or ordering guarantee is documented.

**Fix:** Ensure the tile state machine makes `active` and `flip` mutually exclusive at the component level (only one of these classes should ever be on a tile at one time), or add a comment confirming the removal ordering is guaranteed by the React render cycle.

### WR-02: Keyboard key color transitions are missing on colored states

**File:** `src/styles/tiles.css:150-195`
**Issue:** The `.key` base rule has no `transition` property. When a key transitions from the default surface color to `.key--correct`, `.key--present`, or `.key--absent` (after a guess is scored), the color change is instantaneous. The tile flip has an explicit 350ms animation, but after the flip the keyboard updates snap — which is jarring visually. For comparison, the `.settings-toggle` at line 352 has a `transition: background 0.15s ease, border-color 0.15s ease` applied. The keyboard keys have no equivalent.

**Fix:**
```css
.key {
  /* ...existing properties... */
  transition: background 0.2s ease, color 0.2s ease;
}
```

### WR-03: `Key` component `aria-label` uses `value` (internal key name), not `label` (display text)

**File:** `src/components/Key.tsx:27`
**Issue:** The `aria-label` is set to `{value}` (the internal key value such as `"Enter"`, `"Backspace"`, or a lowercase letter like `"a"`). For letter keys this is fine, but the Backspace key is rendered with `label="⌫"` and `value="Backspace"` — so `aria-label="Backspace"` is correct there. However, for the Enter key (`label="ENTER"`, `value="Enter"`) both are acceptable. The real problem is: for letter keys, the `aria-label` will be the lowercase letter (e.g. `"a"`) while `label` is also `"a"`, so they agree. But the `aria-label` gives no hint of the key's current game status (`"correct"`, `"present"`, `"absent"`). Screen-reader users cannot perceive the color feedback conveyed visually. This is not catastrophic for a two-person casual game, but it degrades accessibility.

**Fix:** Include the key status in `aria-label` when a status is present:
```tsx
const ariaLabel = status ? `${value}, ${status}` : value
// ...
<button aria-label={ariaLabel} ...>
```

---

## Info

### IN-01: `getDailyAnswer` has no guard for negative `dayIndex`

**File:** `src/lib/wordSelection.ts:21-23`
**Issue:** `getDailyAnswer(dayIndex % ANSWERS.length)` — when `dayIndex` is negative (as the test at line 12 of the test file confirms is possible: `getDayIndex` returns `-1` for UTC midnight on the epoch day under the LA implementation), the modulo of a negative number in JavaScript returns a negative result. For example, `(-1) % 1500` returns `-1`, which used as an array index returns `undefined`. This means calling `getDailyAnswer()` before LA midnight on epoch day would return `undefined` instead of a string, breaking the game silently.

**Fix:**
```ts
export function getDailyAnswer(dayIndex: number = getDayIndex()): string {
  const index = ((dayIndex % ANSWERS.length) + ANSWERS.length) % ANSWERS.length
  return ANSWERS[index]
}
```

### IN-02: `tile-flip` animation does not visually reveal the scored color

**File:** `src/styles/tiles.css:104-108`
**Issue:** The `tile-flip` keyframe rotates from 0° to 90° and back to 0°. The color class (`.tile--correct`, `.tile--present`, `.tile--absent`) must be applied at the 50% point (when the tile is edge-on and invisible) for the flip to appear to "reveal" the new color, which is the standard Wordle-style effect. If the color class is applied at the same time as `.tile--flip` (before the animation starts), the color will be visible from frame 0 — the tile will start already colored and just rotate in place. The CSS alone cannot enforce the timing; it depends on the component applying the color class with the correct delay. This is a coordination contract between CSS and `Row.tsx`/`Tile.tsx` that is not documented or enforced here. If the component applies both classes simultaneously, the reveal effect is broken.

**Fix:** Add a comment documenting the contract: color classes must only be added after the 50% point of the flip animation (i.e., after `175ms` stagger delay per tile). Alternatively, use a CSS custom property or `animation-delay` to enforce the reveal timing purely in CSS.

---

_Reviewed: 2026-05-06T00:00:00Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
