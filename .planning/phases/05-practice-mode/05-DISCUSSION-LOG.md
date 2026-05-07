# Phase 5: Practice Mode - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-06
**Phase:** 5-Practice Mode
**Areas discussed:** Routing approach, State isolation, Banner design, Restart + EndGame

---

## Routing Approach

### Detection method

| Option | Description | Selected |
|--------|-------------|----------|
| pathname check | `window.location.pathname === '/random'` in main.tsx — zero dependencies | ✓ |
| React Router v6 | Install react-router-dom, define routes — clean but adds a dependency for 2 routes | |
| Hash routing | `window.location.hash === '#/random'` — no dependency, ugly URLs | |

**User's choice:** pathname check
**Notes:** Simplest approach, no library needed for just two routes.

### Check location

| Option | Description | Selected |
|--------|-------------|----------|
| Check in main.tsx | Read pathname once at module load; render `<PracticeGame />` or `<App />` from root | ✓ |
| Check in App.tsx | Detect inside App, easier to share header/layout | |

**User's choice:** Check in main.tsx
**Notes:** Cleanest separation — two modes never share a component tree.

### Vercel config

| Option | Description | Selected |
|--------|-------------|----------|
| Add /random to vercel.json | Ensure hard refresh on /random works | ✓ |
| No change needed | Only if catch-all already covers it | |

**User's choice:** Confirm catch-all in place — no new config if `"source": "/(.*)"` already exists.

---

## State Isolation

### Isolation strategy

| Option | Description | Selected |
|--------|-------------|----------|
| New usePracticeGame hook | Zustand store with no persist middleware — daily store never touched | ✓ |
| Mode flag in useGame | isPractice flag skips persist/stats — risky coupling | |
| Plain React state | Local useState/useReducer — no Zustand, most duplicated logic | |

**User's choice:** New usePracticeGame hook (no persist)

### Code sharing strategy

| Option | Description | Selected |
|--------|-------------|----------|
| Shared core helpers | Extract game logic to `src/lib/gameCore.ts`; both hooks call it | ✓ |
| Full copy of useGame | Standalone copy with persist/stats stripped | |
| You decide | Claude picks during implementation | |

**User's choice:** Shared core helpers in gameCore.ts

### Word selection timing

| Option | Description | Selected |
|--------|-------------|----------|
| Once at module load | Fixed for session; refresh gets new word | ✓ |
| Re-randomized on restart | New word on Play Again — needed if restart supported | |

**User's choice:** Module load for initial; reset() re-rolls on Play Again

### Settings sharing

| Option | Description | Selected |
|--------|-------------|----------|
| Read useSettings | Practice respects colorblind/hard mode settings | ✓ |
| Always use defaults | Practice ignores settings | |

**User's choice:** Read useSettings — settings are user preferences, not game state.

---

## Banner Design

### Position

| Option | Description | Selected |
|--------|-------------|----------|
| Below header, above board | Full-width bar in main flow | ✓ |
| Inside header | Augment 'Longdle' title | |
| Sticky top bar | Fixed bar above everything | |

**User's choice:** Below header, above board

### Content

| Option | Description | Selected |
|--------|-------------|----------|
| Text + link back | "Practice Mode → Play today's puzzle" | ✓ |
| Text only | Just "Practice Mode", no link | |
| Text + disclaimer | "Practice Mode — results not saved" | |

**User's choice:** Text + link back to /

### Styling

| Option | Description | Selected |
|--------|-------------|----------|
| Subtle — same palette | --color-surface background, --color-text | ✓ |
| Accent color — warm tint | Amber/gold to signal different mode | |
| You decide | Claude picks styling | |

**User's choice:** Same palette with subtle visual distinction

---

## Restart + EndGame

### Play Again

| Option | Description | Selected |
|--------|-------------|----------|
| Play Again button | Resets practice game with new random word | ✓ |
| No restart | Refresh page for new word | |

**User's choice:** Play Again button — calls resetPractice(), re-rolls word

### Sharing

| Option | Description | Selected |
|--------|-------------|----------|
| Share disabled | No share button in practice EndGame | ✓ |
| Share with Practice label | Allow sharing with "Longdle Practice" text | |
| Same modal as daily | Reuse EndGameModal as-is | |

**User's choice:** Share disabled — practice results aren't meaningful to share

### Navigation from EndGame

| Option | Description | Selected |
|--------|-------------|----------|
| Show "Go to daily" link | Easy navigation to daily puzzle | |
| Just Play Again | Minimal modal; banner handles navigation | ✓ |

**User's choice:** No "Go to daily" link in modal — banner already provides this

---

## Claude's Discretion

- Banner CSS details: exact border, padding, font size within "subtle same-palette" direction
- gameCore.ts internal structure: how to factor shared helpers without over-abstracting

## Deferred Ideas

None — discussion stayed within phase scope.
