# Phase 4: UX Polish - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-06
**Phase:** 4-UX Polish
**Areas discussed:** Color palette, Toast redesign, Mobile key latency, LA timezone rollover

---

## Color Palette (POLISH-01)

| Option | Description | Selected |
|--------|-------------|----------|
| I have target hex values | User provides exact hex values | ✓ (then deferred to Claude) |
| Match my personal site | Researcher scrapes site for colors | |
| Trust the researcher | Researcher picks sensible lighter values | |

**User's choice:** Initially "I have target hex values", then changed to "use your own reasonable values — a smidge lighter, like +5 to each RGB value at most"
**Notes:** Very intentional constraint — not a redesign, just a minimal readability nudge. +5 RGB applied: `#0d1b0d` → `#122012`, `#1a2f1a` → `#1f341f`.

---

## Toast Redesign (POLISH-02)

| Option | Description | Selected |
|--------|-------------|----------|
| Hardcode in .toast rule | Add bg/color directly to .toast in tiles.css | ✓ |
| New CSS custom properties | Add --color-toast-bg and --color-toast-text to :root | |

**Color-only vs pill redesign:**

| Option | Description | Selected |
|--------|-------------|----------|
| Color only | Fix the unreadable text color only | ✓ |
| Full pill redesign | Rounded pill shape, adjusted padding | |

**User's choice:** Hardcode + color fix only
**Notes:** This is a bug fix (text was white-on-white due to `color: var(--color-text-inverse)` = `#ffffff` against `background: var(--color-text)` = `#f0f0e8`). No new CSS variables. No shape changes.

---

## Mobile Key Latency (POLISH-03)

| Option | Description | Selected |
|--------|-------------|----------|
| onPointerDown instead of onClick | Replace onClick in Key.tsx — fires immediately on touch | ✓ |
| Keep onClick, add onTouchStart | Add onTouchStart with e.preventDefault() | |
| You decide | Let researcher/planner pick | |

**User's choice:** onPointerDown
**Notes:** CSS already has `touch-action: manipulation` which eliminated the 300ms iOS delay. The remaining gap is the ~50ms between `pointerdown` and `click`. `onPointerDown` is cleaner than `onTouchStart` — no `preventDefault` needed, no scroll suppression risk.

---

## LA Timezone Rollover (DAILY-06)

| Option | Description | Selected |
|--------|-------------|----------|
| LA midnight is canonical | Use Intl.DateTimeFormat with America/Los_Angeles | ✓ |
| Keep UTC midnight | Leave getDayIndex() as-is | |

**In-place vs new function:**

| Option | Description | Selected |
|--------|-------------|----------|
| Update getDayIndex() in-place | All callers get LA timezone automatically | ✓ |
| New getLADayIndex() function | Callers opt in explicitly | |

**User's choice:** LA midnight canonical + in-place update
**Notes:** User initially asked about using the user's local date. Clarified that per-user local dates break the "same word for both players" guarantee (core value). LA midnight is the canonical reference for all players. `Intl.DateTimeFormat` needs no library.

---

## Claude's Discretion

- Exact hex arithmetic for +5 RGB nudge (user approved the concept, Claude applied the math)

## Deferred Ideas

None — discussion stayed within phase scope.
