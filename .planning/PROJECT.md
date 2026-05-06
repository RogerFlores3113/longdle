# Longdle

## What This Is

Longdle is a daily 6-letter Wordle clone built as a standalone React app hosted on Vercel. Players get 7 attempts to guess the day's word, with a new word automatically selected each day from a curated word bank. It's designed for two people to play the same daily puzzle and compare results via a shareable emoji grid.

## Core Value

Two people play the same daily 6-letter word and share their emoji grid result — that daily ritual must work flawlessly every day.

## Current Milestone: v1.1 Day-One Polish + Practice Mode

**Goal:** Fix the four most visible UX rough edges and add a /random practice mode before the game gets shared.

**Target features:**
- Color tokens nudged lighter (background + keyboard surface too dark)
- Toast redesigned as high-contrast near-white pill with dark green text
- Mobile key input: instant response via onPointerDown (no inter-keypress delay)
- Daily rotation: America/Los_Angeles DST-aware midnight rollover
- /random practice mode: random word, no stats impact, Practice Mode banner

## Requirements

### Validated

(None yet — ship to validate)

### Active

- [ ] 6-letter daily word game with 7 guesses
- [ ] Pre-seeded word list, day-indexed (no backend required)
- [ ] Color-coded tile feedback (correct / present / absent)
- [ ] On-screen keyboard with color state
- [ ] Emoji grid share-to-clipboard mechanic
- [ ] Win/loss detection with end-of-game state
- [ ] Stats tracking via localStorage (streak, guess distribution)
- [ ] Hard mode (revealed hints must be used in subsequent guesses)
- [ ] Colorblind mode (high-contrast palette)
- [ ] How-to-play modal for first-time visitors
- [ ] Dark green jungle-themed UI matching owner's personal site aesthetic
- [ ] Deployed to Vercel, accessible via subdomain of personal site

### Out of Scope

- Backend / API server — word list is baked into frontend, day-indexed; no server needed
- User accounts / auth — localStorage is sufficient for one-person-per-device use
- Built-in score comparison — emoji grid shared via chat is the comparison mechanic
- Red panda animations / pixel art theming — deferred to v3 (assets not yet provided)
- Multiplayer or real-time features — this is a solo daily game

## Context

- Owner has an existing personal site (dark green background, red panda + jungle pixel art theme) and wants Longdle to feel like a natural extension of it
- The game is for two people (owner + one other) playing daily — audience is tiny but meaningful
- Word bank should use reasonable English 6-letter words similar to Wordle's curation philosophy (common, not obscure)
- Future v3 will incorporate pixel art red panda animations and gifs the owner already has — placeholder hook should be designed in
- No backend simplifies deployment significantly and eliminates ongoing cost

## Constraints

- **Hosting**: Vercel (frontend only) — no server costs, must be static/SSG/CSR
- **Framework**: React — owner's preference
- **Word selection**: Day-indexed from a client-side word list — no API calls for the word
- **Audience**: Effectively 2 users — no scale concerns, localStorage is fine
- **Theme**: Must match dark green jungle aesthetic of personal site

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| No backend | Word list day-indexing handles daily reset; no server cost; Vercel-only deploy | — Pending |
| 7 guesses for 6 letters | One extra guess to compensate for the longer word vs standard Wordle | — Pending |
| localStorage for stats | No accounts needed for 2-person audience; simple, private, free | — Pending |
| Emoji grid sharing | Standard Wordle sharing pattern; lets players compare via chat without building comparison UI | — Pending |
| React on Vercel | Owner's preference; excellent Vercel support | — Pending |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd-transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd-complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-05-04 after initialization*
