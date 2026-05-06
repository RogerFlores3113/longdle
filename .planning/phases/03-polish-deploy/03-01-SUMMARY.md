---
phase: 03-polish-deploy
plan: 01
subsystem: ui
tags: [css, animations, theme, responsive, dark-mode, keyframes]

# Dependency graph
requires:
  - phase: 02-features
    provides: "html.colorblind override block in tiles.css; .row--shake, .row--win plumbed classes; Toast component; isAnimating guard"
provides:
  - "Dark jungle CSS palette overriding all 8 :root custom property tokens"
  - "@keyframes tile-flip (rotateY 3D flip, 350ms), shake (horizontal, 350ms), bounce (vertical, 800ms)"
  - ".tile--flip consumer class with forwards fill-mode"
  - "3D context: perspective:600px on .row, transform-style+backface-visibility on .tile with -webkit- prefixes"
  - "Toast fade: opacity transition + .toast--hiding rule"
  - "clamp() fluid sizing for tile, key, key--wide; max-width constraints for keyboard and board"
  - "touch-action: manipulation on .key for iOS double-tap prevention"
  - "prefers-reduced-motion media query disabling all three animations"
affects:
  - "03-02 (Row.tsx flip class application uses .tile--flip and animation-delay)"
  - "03-03 (App.tsx EndGame guard uses isAnimating, Toast.tsx uses .toast--hiding)"
  - "03-04 (vercel.json deploy — visual contract from this plan is the game's final appearance)"

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "CSS custom property theming: override :root tokens, cascade handles all consumers automatically"
    - "CSS-only 3D animation: perspective on parent, preserve-3d + backface-visibility on child"
    - "clamp() fluid sizing without @media breakpoints"

key-files:
  created: []
  modified:
    - src/styles/tiles.css

key-decisions:
  - "Used fallback D-02 palette values (#0d1b0d bg, #1a2f1a surface, #538d4e correct, etc.) — no owner site URL provided"
  - "Included prefers-reduced-motion guard as recommended by UI-SPEC — one-block addition, no risk"
  - "Added -webkit-transform-style and -webkit-backface-visibility for older iOS Safari (Pitfall 2 compliance)"
  - "tile--flip uses forwards fill-mode to prevent animation reset flicker if class lingers"
  - "No @media layout breakpoints — all responsiveness via clamp() per anti-pattern note in RESEARCH.md"

patterns-established:
  - "CSS cascade theming: html.colorblind block must remain AFTER :root block (verified via awk line-order check)"
  - "3D flip pattern: perspective on .row, transform-style+backface-visibility on .tile, animation class on tile"
  - "Fluid sizing: clamp(min, vw, max) for tile/key dimensions; min() for container max-widths"

requirements-completed: [THEME-01, THEME-02, THEME-03, THEME-04, THEME-05]

# Metrics
duration: 20min
completed: 2026-05-05
---

# Phase 3 Plan 01: CSS Theme, Animations, and Mobile Sizing Summary

**Dark jungle palette (#0d1b0d bg) + three CSS @keyframes (tile-flip, shake, bounce) + clamp() fluid sizing applied to tiles.css in a single-file CSS pass**

## Performance

- **Duration:** ~20 min
- **Started:** 2026-05-05T00:00:00Z
- **Completed:** 2026-05-05
- **Tasks:** 3
- **Files modified:** 1

## Accomplishments
- Replaced all 8 :root CSS custom property values with the dark green jungle palette, preserving the Phase 2 html.colorblind override block in its correct cascade position
- Added @keyframes tile-flip (3D rotateY flip), shake (horizontal row animation), and bounce (vertical win animation) with working consumer classes (.tile--flip, .row--shake, .row--win)
- Converted tile/key/keyboard/board sizing to clamp() fluid values; added max-width constraints and touch-action: manipulation for mobile
- Added toast fade-out CSS (opacity transition + .toast--hiding rule) and prefers-reduced-motion guard disabling all three animations

## Task Commits

Each task was committed atomically:

1. **Task 1: Override :root tokens to dark jungle palette** - `9cd31d2` (feat)
2. **Task 2: Add three @keyframes + 3D context + .tile--flip + reduced-motion guard** - `c8c6bbb` (feat)
3. **Task 3: Toast fade + clamp() mobile sizing** - `74857a9` (feat)

## Files Created/Modified
- `src/styles/tiles.css` — Dark jungle palette tokens, three @keyframes, .tile--flip/.toast--hiding rules, 3D context, clamp() sizing, touch-action, prefers-reduced-motion guard

## Decisions Made
- Used the D-02 fallback palette values since no owner personal site URL was provided. #0d1b0d (near-black dark green) as bg, #1a2f1a as surface, #538d4e as correct, #b59f3b as present, #3a3a3c as absent, #3d5a3d as border, #f0f0e8 as text.
- Included prefers-reduced-motion media query (recommended, not required by plan) — trivial one-block addition meeting accessibility best practice.
- Vendor prefixes (-webkit-transform-style, -webkit-backface-visibility) included per Pitfall 2 for older iOS Safari compatibility.
- tile-flip animation uses `forwards` fill-mode to hold final state if the class lingers before Row.tsx removes it.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
- The acceptance criterion checking `grep -E 'width: 40px'` returns 1 due to `.howtoplay-tile { width: 40px }` — this is a separate element unrelated to `.key` and explicitly out of scope per the plan ("Do not touch any modal, stats, settings, share-button, or icon-button rules"). The `.key` rule correctly uses `clamp(32px, 8.5vw, 40px)` instead of the old `40px` fixed value.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- CSS contract is complete. The .tile--flip class is ready for Row.tsx to apply per tile index with inline animation-delay.
- .toast--hiding class is ready for Toast.tsx to apply via setTimeout after 1200ms.
- The colorblind override block is preserved and correctly cascades on top of the new dark palette.
- Build succeeds with all new CSS; no regressions.

---
*Phase: 03-polish-deploy*
*Completed: 2026-05-05*
