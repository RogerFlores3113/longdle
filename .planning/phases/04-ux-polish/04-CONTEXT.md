# Phase 4: UX Polish - Context

**Gathered:** 2026-05-06
**Status:** Ready for planning

<domain>
## Phase Boundary

Phase 4 fixes 4 visible UX rough edges — no new features, no new components:
- **POLISH-01**: Nudge background and keyboard surface tokens slightly lighter (+5 RGB each)
- **POLISH-02**: Fix the unreadable toast (both background and text were near-white)
- **POLISH-03**: Eliminate mobile key tap latency by switching from `onClick` to `onPointerDown`
- **DAILY-06**: Change word rollover from UTC midnight to LA midnight (DST-aware via `Intl.DateTimeFormat`)

All 4 changes are small, surgical, and isolated to `src/styles/tiles.css`, `src/components/Key.tsx`, and `src/lib/wordSelection.ts`.

**Not in Phase 4:** New features, new components, Practice Mode (/random), red panda animations.

</domain>

<decisions>
## Implementation Decisions

### Color Tokens (POLISH-01)
- **D-01:** Update `--color-bg` from `#0d1b0d` → `#122012` (+5 on each RGB channel: 13→18, 27→32, 13→18)
- **D-02:** Update `--color-surface` from `#1a2f1a` → `#1f341f` (+5 on each RGB channel: 26→31, 47→52, 26→31)
- **D-03:** Only these two tokens change. All other 6 custom properties (`--color-correct`, `--color-present`, `--color-absent`, `--color-border`, `--color-text`, `--color-text-inverse`) stay the same.

### Toast Fix (POLISH-02)
- **D-04:** Replace the `.toast` color assignments with hardcoded values in `tiles.css`:
  - `background: #f0f0e8` (near-white — what `--color-text` resolves to, but explicit)
  - `color: #0d1b0d` (dark green — readable against the light background)
- **D-05:** No shape, size, or positioning changes — color fix only. Border-radius stays at `4px`.
- **D-06:** Do NOT add new CSS custom properties (`--color-toast-bg`, `--color-toast-text`). Hardcode in the rule.

### Mobile Key Latency (POLISH-03)
- **D-07:** In `Key.tsx`, replace `onClick` with `onPointerDown`. This fires immediately on touch, eliminating the ~50ms gap between finger-down and the `click` event.
- **D-08:** Physical keyboard input is unaffected — it uses the `keydown` listener in `useGame`, not `Key.tsx` click handlers.
- **D-09:** No `e.preventDefault()` needed — `onPointerDown` doesn't trigger double-fire on mobile.

### LA Timezone Rollover (DAILY-06)
- **D-10:** Update `getDayIndex()` in-place in `src/lib/wordSelection.ts`. All callers get LA timezone automatically — no new function, no parallel implementation.
- **D-11:** Use `Intl.DateTimeFormat('en-US', { timeZone: 'America/Los_Angeles' })` to extract the current LA calendar date. No external library needed — Intl is available in all modern browsers and Node.js.
- **D-12:** LA midnight is the canonical rollover for all players. A player in NYC sees the new word at 3am ET (PST) or 2am ET (PDT). This is correct and intentional — it preserves the "same word for both players" guarantee.
- **D-13:** Tests for `getDayIndex()` need updating to use fixed LA dates (e.g., mock `new Date()` to a specific UTC timestamp that corresponds to a known LA date).

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Core files being modified
- `src/styles/tiles.css` — CSS custom properties and `.toast` rule (D-01 through D-06)
- `src/components/Key.tsx` — `onPointerDown` change (D-07 through D-09)
- `src/lib/wordSelection.ts` — `getDayIndex()` LA timezone update (D-10 through D-13)

### Requirements and roadmap
- `.planning/REQUIREMENTS.md` — POLISH-01, POLISH-02, POLISH-03, DAILY-06 definitions
- `.planning/ROADMAP.md` — Phase 4 success criteria

### Prior context
- `.planning/STATE.md` — key decisions including UTC-only rule (established in Phase 1, now superseded by DAILY-06)
- `.planning/phases/03-polish-deploy/03-CONTEXT.md` — Phase 3 theming contract: tokens live in `tiles.css` `:root` only

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/styles/tiles.css` `:root` block — all 8 color tokens defined here; only `--color-bg` and `--color-surface` change
- `src/components/Key.tsx` — single-file component, ~30 lines; `onClick` → `onPointerDown` is a one-line change
- `src/lib/wordSelection.ts` — `getDayIndex()` is ~8 lines; the `Intl.DateTimeFormat` approach is a drop-in replacement
- `src/lib/wordSelection.test.ts` (or similar) — existing timezone unit tests need updating for LA date logic

### Established Patterns
- Phase 3 theming contract: only override `:root` custom properties in `tiles.css`. No component changes for visual tweaks.
- Toast already has `.toast--hiding` class for fade-out — the hiding mechanism stays unchanged
- `touch-action: manipulation` already on `.key` — eliminates old 300ms iOS tap delay; `onPointerDown` eliminates the remaining ~50ms `click` fire delay

### Integration Points
- `getDayIndex()` is called by `getDailyAnswer()` and by `useGame` store initialization — both get LA timezone automatically after the in-place update
- `Key.tsx` `onPointerDown` must still call `onKey(value)` from `useGame` — the store API is unchanged

</code_context>

<specifics>
## Specific Ideas

- Color nudge is intentionally minimal: exactly +5 on each RGB channel, not a redesign
- Toast color is a bug fix (text was white-on-white), not a style preference
- `onPointerDown` preferred over `onTouchStart` to avoid needing `e.preventDefault()` and the associated scroll suppression risk

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 4-UX Polish*
*Context gathered: 2026-05-06*
