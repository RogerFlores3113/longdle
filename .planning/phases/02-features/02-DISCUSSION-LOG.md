# Phase 2: Features - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-05
**Phase:** 2-Features
**Mode:** --auto (all areas auto-selected; Claude picked recommended option for each)
**Areas discussed:** Modal architecture, EndGameBanner evolution, Colorblind palette, Header icons, Share emoji format, Stats histogram, First-visit detection, WinAnimation stub

---

## Modal Architecture

| Option | Description | Selected |
|--------|-------------|----------|
| App.tsx useState | Single `activeModal` state in App.tsx; all modals rendered from root | ✓ |
| Zustand UI store | Separate Zustand store for modal visibility | |
| Each modal self-manages | Each modal has its own open state via context | |

**Auto-selected:** App.tsx useState `activeModal: 'howToPlay' | 'stats' | 'settings' | 'endGame' | null`
**Notes:** Simplest approach for 3 modals in a 2-person app. Keeps game state store focused on game logic. A shared `<Modal>` wrapper handles backdrop/Escape/onClose.

---

## EndGameBanner Evolution

| Option | Description | Selected |
|--------|-------------|----------|
| Full modal overlay | Replace EndGameBanner with EndGame modal; share + WinAnimation slot | ✓ |
| Inline banner | Keep EndGameBanner inline; add share button inline | |
| Hybrid | Banner stays; separate modal for share/stats | |

**Auto-selected:** Full modal overlay
**Notes:** ROADMAP.md success criteria and V3-01 both say "EndGame modal". Auto-opens when gameStatus transitions to won/lost.

---

## Colorblind Palette Application

| Option | Description | Selected |
|--------|-------------|----------|
| CSS class on `<html>` | `html.colorblind { --color-correct: orange; --color-present: blue }` | ✓ |
| data-attribute | `document.documentElement.setAttribute('data-colorblind', 'true')` | |
| Inline styles | Pass colorblind flag as prop; apply inline styles | |

**Auto-selected:** CSS class on `<html>` + custom property overrides in tiles.css
**Notes:** Consistent with Phase 3 theming contract (`:root` overrides in tiles.css only). The `html.colorblind` override survives Phase 3's dark green theme cleanly. Managed via `useEffect` in App.tsx.

---

## Header Icons

| Option | Description | Selected |
|--------|-------------|----------|
| Inline SVG | Hand-coded SVG React components; no library | ✓ |
| lucide-react | Icon library (adds ~20KB); cleaner authoring | |
| Emoji/text | Unicode emoji or text labels | |

**Auto-selected:** Inline SVG, no new library
**Notes:** Minimal deps for a 2-person app. Three icons: help (?), stats (bar chart), settings (gear). Claude selects exact SVG paths.

---

## Share Emoji Format

| Option | Description | Selected |
|--------|-------------|----------|
| Standard Wordle | Normal: 🟩🟨⬛ / Colorblind: 🟧🟦⬛ | ✓ |
| Block variants | Normal: 🟫🟡🟥 | |

**Auto-selected:** Normal: 🟩🟨⬛ / Colorblind: 🟧🟦⬛
**Notes:** Standard convention; recipients recognize it immediately. Black square (⬛) for absent is unambiguous in both modes. SETTINGS-03 requires colorblind palette in share output.

---

## Stats Histogram

| Option | Description | Selected |
|--------|-------------|----------|
| CSS width-percentage divs | Inline `width: {pct}%`; no library | ✓ |
| Canvas chart | Draw bars on canvas | |
| SVG bars | SVG rect elements | |

**Auto-selected:** CSS-only width-percentage divs with inline styles
**Notes:** Minimum 8% width so empty bars are visible. Current game's row highlighted via `.stats-bar--highlight` class. No chart library needed.

---

## First-Visit Detection

| Option | Description | Selected |
|--------|-------------|----------|
| useSettings Zustand | Add `hasSeenHowToPlay: boolean` to settings store; persisted automatically | ✓ |
| Separate localStorage key | `localStorage.getItem('longdle-visited')` | |
| sessionStorage | Resets every tab open | |

**Auto-selected:** Add `hasSeenHowToPlay` to useSettings Zustand store
**Notes:** Reuses persist middleware; stays consistent with the three-key schema. App.tsx opens HowToPlay on mount if `!hasSeenHowToPlay`, sets to `true` immediately.

---

## WinAnimation Stub Interface

| Option | Description | Selected |
|--------|-------------|----------|
| `{ dayIndex, won, guessCount }` | Minimal props; enough for v3 to know result context | ✓ |
| No props | Fully empty stub | |
| Full game state | Pass entire ScoredGuess[] | |

**Auto-selected:** `interface WinAnimationProps { dayIndex: number; won: boolean; guessCount: number }`
**Notes:** dayIndex lets v3 select the right animation per puzzle. guessCount enables victory animations that scale with performance. Component renders null in Phase 2.

---

## Claude's Discretion

- Exact SVG paths for 3 header icons
- Modal backdrop z-index and stacking
- CSS class names for modal, stats bars, settings toggles
- `<dialog>` vs `<div role="dialog">` (accessibility tradeoff)
- Modal enter/exit animations deferred to Phase 3

## Deferred Ideas

- Modal animations (fade-in/fade-out) → Phase 3 THEME-* scope
- Sound effects → v2
- Practice mode → v2
- Score comparison UI → v2
- Red panda pixel art → v3 (WinAnimation stub is the hook; assets are v3)
