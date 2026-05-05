---
phase: 1
slug: foundation
status: draft
shadcn_initialized: false
preset: none
created: 2026-05-04
---

# Phase 1 — UI Design Contract

> Structural and interaction contract for the Foundation phase. This phase ships a functional, unstyled-baseline game shell. The dark green jungle theme, CSS flip/shake/bounce animations, and mobile polish are deferred to Phase 3 (THEME-01–05). Phase 1 establishes the CSS class conventions, layout primitives, and copywriting that Phase 3 styles on top of.

---

## Design System

| Property | Value |
|----------|-------|
| Tool | none (greenfield; no shadcn) |
| Preset | not applicable |
| Component library | none — hand-built primitives (Tile, Row, Board, Key, Keyboard) |
| Icon library | none in Phase 1 (Phase 2 introduces help/settings icons) |
| Font | system UI stack — `ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif` (Phase 3 may revisit) |

**Rationale:** Phase 1 is a foundation phase. No design system is initialized because the project does not use React component libraries (per RESEARCH/STACK: hand-built primitives are the chosen pattern, with Tailwind v4 utilities + CSS custom properties for theming). The conventions established here become the baseline all later phases extend.

---

## Spacing Scale

Declared values (multiples of 4 only):

| Token | Value | Usage |
|-------|-------|-------|
| xs | 4px | Tile-to-tile gap within a row, key-to-key gap within a keyboard row |
| sm | 8px | Row-to-row gap on the board, keyboard-row to keyboard-row gap |
| md | 16px | Board-to-keyboard separation, app horizontal padding |
| lg | 24px | Section padding, modal inner padding (Phase 2+) |
| xl | 32px | Page-level vertical rhythm, header-to-board separation |
| 2xl | 48px | Reserved (no use in Phase 1) |
| 3xl | 64px | Reserved (no use in Phase 1) |

**Tile sizing (interaction target requirement):**
- Tile: 56px × 56px (desktop) — exceeds 44px minimum touch target
- Letter key: 40px wide × 56px tall (letter rows); Enter / Backspace keys: 64px wide × 56px tall
- Tile-row width derived: `6 × 56px + 5 × 4px = 356px`

**Exceptions:** None. All measurements snap to the 4px grid. Mobile-responsive resizing (using `min()` / viewport math) is deferred to Phase 3 (THEME-05); Phase 1 ships fixed desktop measurements.

---

## Typography

| Role | Size | Weight | Line Height |
|------|------|--------|-------------|
| Tile letter | 32px | 600 (semibold) | 1 |
| Key label (letter) | 16px | 600 (semibold) | 1 |
| Key label (Enter / Backspace) | 12px | 600 (semibold) | 1 |
| Body / toast text | 16px | 400 (regular) | 1.5 |
| End-game heading | 24px | 600 (semibold) | 1.2 |

Font family: system UI stack (see Design System table). Exactly **3 sizes** in normal text flow (12, 16, 24) plus the dedicated tile display size (32). Exactly 2 weights: 400 (regular), 600 (semibold). At 32px on a 56×56px tile, semibold is visually strong and legible.

**Letter casing:** All letters render in uppercase via `text-transform: uppercase` on `.tile` and `.key`. Game state stores letters lowercase (per ARCHITECTURE `keyStatuses: 'a' → 'correct'`); CSS handles display casing.

---

## Color

Phase 1 ships a neutral grayscale baseline. The dark green jungle palette is applied in Phase 3 (THEME-01) by overriding the CSS custom properties declared here. **All Phase 1 colors are declared as CSS custom properties** so Phase 3 can reskin without touching component code.

| Role | Value | Usage |
|------|-------|-------|
| Dominant (60%) | `--color-bg: #ffffff` | App background, board surface |
| Secondary (30%) | `--color-surface: #f3f4f6` (gray-100) | Empty tile fill, idle key fill, toast background-contrast |
| Accent (10%) — correct | `--color-correct: #6aaa64` (Wordle-green baseline) | Tile + key when scored `correct` |
| Accent (10%) — present | `--color-present: #c9b458` (Wordle-yellow baseline) | Tile + key when scored `present` |
| Accent (10%) — absent | `--color-absent: #787c7e` (gray) | Tile + key when scored `absent` |
| Border | `--color-border: #d3d6da` | Empty tile border, idle key border |
| Text on light | `--color-text: #1a1a1b` | Tile letter (empty/active states), key label, body text |
| Text on scored | `--color-text-inverse: #ffffff` | Tile letter + key label after `correct`/`present`/`absent` fill |
| Destructive | not used in Phase 1 | (no destructive actions) |

**Accent reserved for:** Tile and Key elements in the three scored states only (`correct`, `present`, `absent`). The accent palette must NOT bleed into UI chrome (header, modals, toasts) — those use the dominant/secondary tokens. This rule is what gives the scored tiles visual primacy.

**CSS class contract (load-bearing — Phase 3 depends on these names verbatim):**

| Class | Applied to | Phase 1 effect | Phase 3 evolution |
|-------|------------|----------------|-------------------|
| `tile` | `<div>` per cell | Base tile box + border | Adds flip animation root |
| `tile--empty` | tile with no letter | Border only, transparent fill | Unchanged |
| `tile--active` | tile with typed letter, row not yet submitted | Filled border, no color fill | Adds pop-in scale animation |
| `tile--correct` | scored green | `--color-correct` background + inverse text | Reveals at 50% flip keyframe |
| `tile--present` | scored yellow | `--color-present` background + inverse text | Reveals at 50% flip keyframe |
| `tile--absent` | scored gray | `--color-absent` background + inverse text | Reveals at 50% flip keyframe |
| `row` | `<div>` per row | Flex row, xs gap | Unchanged |
| `row--shake` | active row on invalid guess | (toggled, but no animation in Phase 1) | CSS `@keyframes shake` |
| `row--win` | winning row after `gameStatus === 'won'` | (toggled, but no animation in Phase 1) | CSS `@keyframes bounce` |
| `key` | `<button>` per key | Base key box | Unchanged |
| `key--correct` | best status seen | `--color-correct` background | Unchanged |
| `key--present` | best status seen | `--color-present` background | Unchanged |
| `key--absent` | best status seen | `--color-absent` background | Unchanged |
| `toast` | `<div>` rendered when `toastMessage !== null` | Fixed-position pill, secondary surface | Adds fade in/out animation |

In Phase 1, classes with `--shake`, `--win`, and `--active` are toggled at the correct lifecycle moments (per D-09 for shake, per `gameStatus` for win) but their associated keyframes are not yet defined. This is intentional: it lets Phase 3 add animations purely in CSS without React changes.

---

## Layout Contract

**Primary focal point:** the 7×6 game Board, vertically centered between the header and keyboard, is the dominant visual element.

### Board grid

- 7 rows × 6 columns, fully pre-allocated (per ARCHITECTURE `board: TileState[][]`)
- Outer `Board` container: `display: flex; flex-direction: column; gap: 8px (sm)`
- Each `Row`: `display: flex; flex-direction: row; gap: 4px (xs)`
- Each `Tile`: 56 × 56, 2px border (idle), centers letter via flexbox

### On-screen keyboard

Three rows, exactly mirroring the standard QWERTY 6-letter layout with Enter and Backspace flanking the bottom row:

```
Row 1 (10 keys):  Q W E R T Y U I O P
Row 2 (9 keys):    A S D F G H J K L
Row 3 (9 keys):  ENTER  Z X C V B N M  ⌫
```

- `Keyboard` container: `flex-direction: column; gap: 8px (sm); padding: 8px (sm)`
- Each keyboard row: `flex-direction: row; gap: 4px (xs); justify-content: center`
- Letter `Key`: 40 × 56
- `Enter` / `Backspace` Key: 64 × 56
- `Backspace` label: rendered as the unicode character `⌫` (U+232B)
- `Enter` label: rendered as the literal text `ENTER`

### App vertical layout

```
[ Header — placeholder div, height 56px, padding 16px ]    ← xl gap below
[ Board                                              ]    ← md gap below
[ Keyboard                                           ]
[ Toast — fixed, top: 80px, centered horizontally    ]    ← Z-index above board, below modals
```

In Phase 1 the Header is a placeholder `<header>` with the app name (plain text "Longdle"). Header buttons (Help, Settings) are added in Phase 2.

---

## Interaction Contract

### Input sources (single seam)

Per ARCHITECTURE: physical keyboard events and on-screen Key clicks both funnel through `useGame.onKey(key: string)`. This is the only input mutation path.

- Physical keys handled: `A–Z` (case-insensitive), `Enter`, `Backspace`, `Delete` (treated identically to Backspace)
- All other physical keys: ignored (no `preventDefault`)
- On-screen key click → `onKey('a')` … `onKey('Enter')` … `onKey('Backspace')`

### Input guards (per CLAUDE.md — load-bearing)

Every `onKey` invocation MUST guard:
```ts
if (state.isAnimating || state.gameStatus !== 'playing') return
```

- `isAnimating` stays `false` for all of Phase 1 (D-12). Phase 3 toggles it during flip sequences.
- `gameStatus !== 'playing'` blocks input on win/loss.

### Active row visualization

Only the row at index `currentRow` accepts input. Tiles in earlier rows show their scored status (`tile--correct/present/absent`). Tiles in later rows render empty (`tile--empty`). Tiles in the active row show typed letters with `tile--active` until submission.

### Submission flow (visual perspective)

1. User presses Enter with 6 letters typed.
2. `useGame` validates length (must be 6) and word membership (`VALID_WORDS.has(...)`).
3. **Invalid:**
   - `toastMessage` set to one of the copywriting-contract strings below.
   - `row--shake` class added to the active row (no animation in Phase 1; class is toggled for Phase 3 to hook).
   - Class removed after 350ms via `setTimeout` or `animationend` listener (per D-09).
   - `toastMessage` cleared after 1500ms (per D-08).
   - `currentRow`, `currentInput` unchanged.
4. **Valid:**
   - `scoreTiles` runs, board mutates immutably, `keyStatuses` updates with priority `correct > present > absent`.
   - Scored tiles render their `tile--correct/present/absent` classes immediately (no flip animation in Phase 1, per D-07).
   - `currentRow` increments; `currentInput` resets to empty.
   - On win/loss, `gameStatus` updates; end-game message renders inline below the board (Phase 1) or in a modal (Phase 2 onwards).

### End-game presentation (Phase 1)

Phase 1 does NOT have an EndGameModal (that's Phase 2). The end-game state renders as plain text below the board:
- On win: a heading reading the win message (see copywriting).
- On loss: a heading reading the loss message including the answer revealed.

Input is disabled via the standard guard. The user can refresh and resume the same end-state via `longdle-game-state` persistence (DAILY-05).

---

## Copywriting Contract

All Phase 1 strings, verbatim. These are load-bearing — the planner and executor must match them exactly so Phase 2/3 can reskin without re-translating semantics.

| Element | Copy |
|---------|------|
| App name (header text) | `Longdle` |
| Toast: guess too short | `Not enough letters` |
| Toast: word not in list | `Not in word list` |
| End-game heading on win | `You got it!` |
| End-game heading on loss | `The word was {ANSWER}` (where `{ANSWER}` is rendered uppercase) |
| Primary CTA | not applicable in Phase 1 (Phase 2 introduces "Share" CTA) |
| Empty state | not applicable (the board is always pre-allocated; there is no empty state) |
| Error state | not applicable (no async errors in Phase 1) |
| Destructive confirmation | not applicable (no destructive actions in Phase 1) |

**Why these strings:** They mirror the canonical Wordle messages so users with prior Wordle experience read them at a glance. The end-game copy stays minimal in Phase 1 because the rich EndGameModal arrives in Phase 2.

---

## Registry Safety

| Registry | Blocks Used | Safety Gate |
|----------|-------------|-------------|
| shadcn official | none | not applicable (no shadcn initialized) |
| third-party | none | not applicable |

No third-party UI registries are used in this phase. All components are hand-built primitives owned by this codebase.

---

## Phase 1 → Phase 3 Handoff Notes

These conventions are the contract Phase 3 (THEME-01–05) extends:

1. **CSS custom properties** carry every color value. Phase 3's dark green palette overrides `:root` declarations only — component code stays untouched.
2. **CSS class names** (`tile--correct`, `row--shake`, `row--win`, `key--*`, `toast`) are stable. Phase 3 adds `@keyframes` definitions and pairs them with these classes; it does NOT rename classes or restructure markup.
3. **`isAnimating` boolean** is wired through every input handler in Phase 1 even though it stays `false`. Phase 3 sets it `true` during flip sequences and back to `false` after the last tile reveals (per D-12).
4. **`row--shake` and `row--win`** classes are toggled at the correct lifecycle moments in Phase 1 even though the `@keyframes` are not yet defined. Phase 3 only adds CSS.
5. **Tile color reveal** is immediate in Phase 1 (D-07). Phase 3 (THEME-02) introduces the flip animation and shifts the color-class application to the 50% keyframe midpoint via CSS — not React.

---

## Checker Sign-Off

- [ ] Dimension 1 Copywriting: PASS
- [ ] Dimension 2 Visuals: PASS
- [ ] Dimension 3 Color: PASS
- [ ] Dimension 4 Typography: PASS
- [ ] Dimension 5 Spacing: PASS
- [ ] Dimension 6 Registry Safety: PASS

**Approval:** pending
