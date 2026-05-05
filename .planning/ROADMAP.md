# Roadmap: Longdle

## Overview

Three phases deliver a complete, playable daily 6-letter Wordle clone. Phase 1 builds the entire data layer and game engine — algorithms unit-tested before any UI is touched, game fully playable at the end. Phase 2 adds every social and settings feature that transforms a working game into a shareable daily ritual. Phase 3 applies the dark green jungle theme, CSS animations, mobile polish, and ships to Vercel.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [x] **Phase 1: Foundation** - Data layer, algorithms, useGame hook — game is fully playable
- [ ] **Phase 2: Features** - Modals, sharing, stats, settings, accessibility, v3 stub
- [ ] **Phase 3: Polish + Deploy** - Theme, CSS animations, mobile polish, Vercel deploy

## Phase Details

### Phase 1: Foundation
**Goal**: The core game is fully playable — correct tile scoring, daily word selection, keyboard input, win/loss detection, and localStorage persistence all work correctly
**Depends on**: Nothing (first phase)
**Requirements**: GAME-01, GAME-02, GAME-03, GAME-04, DAILY-01, DAILY-02, DAILY-03, DAILY-04, DAILY-05, WORDS-01, WORDS-02, WORDS-03, WORDS-04
**Success Criteria** (what must be TRUE):
  1. User can type 6-letter guesses using physical keyboard (A-Z, Backspace, Enter) and submit them against the day's word
  2. User sees correctly color-coded tile feedback including duplicate-letter edge cases — the two-pass scoring algorithm is verified by unit tests before any UI is wired
  3. User sees the on-screen keyboard keys update to their best color state (green > yellow > gray, never downgrade)
  4. User sees a win message after a correct guess or the answer revealed after 7 failed attempts, with all input disabled
  5. User resumes exactly where they left off after a page refresh — in-progress state restores from localStorage
**Plans**: 5 plans
  - [x] 01-01-PLAN.md — Bootstrap Vite + React 19 + TS + Tailwind v4 + Vitest scaffold
  - [x] 01-02-PLAN.md — Curate ANSWERS + VALID_GUESSES from hello-wordl, emit src/data/words.ts
  - [x] 01-03-PLAN.md — TDD pure libs: scoring (two-pass), wordSelection (UTC), hardMode, storage
  - [x] 01-04-PLAN.md — Zustand stores (useGame + useSettings) with persist + physical keyboard listener
  - [x] 01-05-PLAN.md — UI shell (Board/Row/Tile/Keyboard/Key/Toast/EndGameBanner) + wire-up + smoke checkpoint

### Phase 2: Features
**Goal**: All social and settings features work — players can share emoji grids, view lifetime stats, configure hard mode and colorblind mode, and get onboarded via a how-to-play modal
**Depends on**: Phase 1
**Requirements**: SHARE-01, SHARE-02, SHARE-03, SHARE-04, ONBOARD-01, ONBOARD-02, SETTINGS-01, SETTINGS-02, SETTINGS-03, V3-01
**Success Criteria** (what must be TRUE):
  1. User can copy an emoji grid to clipboard after game completion in the format "Longdle #N X/7" — works on iOS Safari (synchronous clipboard write)
  2. User can view lifetime stats (games played, win %, current streak, max streak, guess distribution) in a modal that persists across sessions
  3. User sees the how-to-play modal automatically on first visit and can open it again via the header help icon
  4. User can enable hard mode (locked hints must be reused) and colorblind mode (orange/blue palette) via a settings modal, with preferences stored in localStorage
  5. A no-op WinAnimation component slot exists in the EndGame modal, documented and ready for v3 red panda integration
**Plans**: 7 plans
  - [ ] 02-01-PLAN.md — TDD generateShareText pure function (share lib + tests)
  - [ ] 02-02-PLAN.md — Settings store extension (hasSeenHowToPlay) + colorblind CSS override
  - [ ] 02-03-PLAN.md — Inline SVG icon components (HelpIcon, StatsIcon, SettingsIcon) + Modal wrapper
  - [ ] 02-04-PLAN.md — HowToPlayModal, StatsModal, SettingsModal, WinAnimation stub
  - [ ] 02-05-PLAN.md — EndGameModal (primary share CTA + WinAnimation slot)
  - [ ] 02-06-PLAN.md — CopyFallbackModal (clipboard .catch path)
  - [ ] 02-07-PLAN.md — App.tsx integration + header evolution + EndGameBanner deletion + smoke checkpoint

### Phase 3: Polish + Deploy
**Goal**: The game looks and feels like a natural extension of the owner's personal site — dark green jungle theme, smooth CSS animations, mobile-responsive layout — and is live on Vercel under a personal site subdomain
**Depends on**: Phase 2
**Requirements**: THEME-01, THEME-02, THEME-03, THEME-04, THEME-05, DEPLOY-01, DEPLOY-02
**Success Criteria** (what must be TRUE):
  1. The game displays a dark green jungle-themed UI using CSS custom properties matching the owner's personal site aesthetic
  2. Tile flip animations reveal color at the flip midpoint (not at React state update time); invalid rows shake; winning row bounces
  3. Toast notifications appear and auto-dismiss without blocking input
  4. The layout is fully usable on mobile — on-screen keyboard is the primary input method and the game fits without horizontal scrolling
  5. The app is live on Vercel as a static SPA accessible via a personal site subdomain
**Plans**: TBD
**UI hint**: yes

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Foundation | 5/5 | Complete | 2026-05-05 |
| 2. Features | 0/7 | Not started | - |
| 3. Polish + Deploy | 0/TBD | Not started | - |
