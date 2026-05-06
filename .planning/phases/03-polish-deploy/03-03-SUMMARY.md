---
phase: 03-polish-deploy
plan: 03
subsystem: infra
tags: [vercel, deploy, spa, vite, rewrite, config]

# Dependency graph
requires:
  - phase: 03-polish-deploy-01
    provides: CSS theme, animations, clamp sizing
  - phase: 03-polish-deploy-02
    provides: JS wiring for tile flip, toast fade, EndGame guard
provides:
  - vercel.json with canonical SPA rewrite rule (all paths -> /index.html)
  - index.html with browser tab title "Longdle"
  - Local production build verified (dist/ ready for Vercel to ship)
affects: [deploy, dns]

# Tech tracking
tech-stack:
  added: [vercel.json SPA rewrite config]
  patterns: ["Vercel static SPA deploy: rewrites only, no buildCommand/outputDirectory override"]

key-files:
  created:
    - vercel.json
  modified:
    - index.html

key-decisions:
  - "Use rewrites (not routes or redirects) in vercel.json — avoids legacy syntax and prevents open-redirect"
  - "No buildCommand/outputDirectory in vercel.json — Vercel auto-detects Vite from package.json"
  - "Task 3 (Vercel project import + DNS) is a human-action checkpoint — cannot be automated"

patterns-established:
  - "SPA rewrite pattern: { source: '/(.*)', destination: '/index.html' } — single rule, no headers block needed"

requirements-completed: [DEPLOY-01, DEPLOY-02]

# Metrics
duration: 5min
completed: 2026-05-06
---

# Phase 3 Plan 03: Vercel Deploy Config Summary

**vercel.json with single SPA rewrite rule and Longdle browser title committed; Vercel project import and DNS configuration pending user action (Task 3 checkpoint)**

## Performance

- **Duration:** ~5 min
- **Started:** 2026-05-06T00:50:00Z
- **Completed:** 2026-05-06T00:51:14Z
- **Tasks:** 2 of 3 auto tasks complete; Task 3 is a human-action checkpoint (pending)
- **Files modified:** 2

## Accomplishments
- Created vercel.json at project root with canonical `rewrites` rule mapping `(.*)` to `/index.html`
- Updated index.html `<title>` from `longdle-scaffold` to `Longdle`; all other tags (viewport, favicon, charset, module script) preserved unchanged
- Local `npm run build` produces clean dist/ — verified both before and after each change

## Task Commits

Each auto task was committed atomically:

1. **Task 1: Create vercel.json with SPA rewrite rule** - `a56bb46` (chore)
2. **Task 2: Update index.html title to Longdle** - `0bbe98a` (chore)
3. **Task 3: Vercel project import + DNS** - PENDING (human-action checkpoint — not committed)

## Files Created/Modified
- `vercel.json` - Created: canonical Vercel SPA rewrite; $schema for IDE validation; no buildCommand/outputDirectory (Vercel auto-detects Vite)
- `index.html` - Modified: `<title>longdle-scaffold</title>` -> `<title>Longdle</title>` (one-line change only)

## Decisions Made
- Used `rewrites` array (not legacy `routes`, not `redirects`) — per Vercel docs and RESEARCH.md Pitfall 5/6
- Omitted `buildCommand`, `outputDirectory`, `installCommand`, `framework` — all auto-detected from `vite` in package.json devDependencies
- Omitted `cleanUrls` — interacts unexpectedly with SPA fallback; not needed
- Included `$schema` reference for IDE validation if the user later edits vercel.json
- Threat T-03-09 mitigated: destination is `/index.html` (internal serve), not an external redirect URL

## Deviations from Plan

None - plan executed exactly as written for Tasks 1 and 2.

## Issues Encountered

None.

## Task 3 Checkpoint: Human Action Required

**Task 3 (Vercel project import + custom subdomain DNS) is a `checkpoint:human-action` gate.**

Tasks 1 and 2 created the only code artifacts Vercel needs:
- `vercel.json` — SPA rewrite rule active on deploy
- `index.html` — browser tab title reads "Longdle"

The remaining work (DEPLOY-01 and DEPLOY-02) requires manual browser steps that cannot be automated without the user's Vercel and DNS-provider credentials:

**Step 1 — Verify local build:**
```bash
npm run build       # must produce dist/index.html and dist/assets/...
npm run preview     # visit http://localhost:4173 — confirm dark theme + animations
```

**Step 2 — Vercel project import (DEPLOY-01):**
1. Visit https://vercel.com/new
2. Sign in with GitHub; import the `longdle` repository
3. On configuration screen: confirm Vercel auto-detected "Vite" — do NOT override Build Command, Output Directory, or Install Command
4. No environment variables needed (Phase 3 has none)
5. Click "Deploy" — wait ~30-60s
6. Visit `https://<project-name>.vercel.app`
7. Verify deep-link: visit `https://<project-name>.vercel.app/anypath` — must serve the SPA, not 404

**Step 3 — Custom subdomain (DEPLOY-02):**
1. Vercel Dashboard -> Settings -> Domains -> add `longdle.<your-domain>.com`
2. Copy the CNAME target Vercel shows (typically `cname.vercel-dns.com`)
3. At your DNS provider: add CNAME record with Host=`longdle`, Value=`cname.vercel-dns.com`, TTL=300
4. Wait 1-10 min for propagation; Vercel auto-provisions TLS

**If DNS access is unavailable:** Accept `*.vercel.app` URL as the production URL. DEPLOY-02 can be revisited later — no code change required.

**Verification checklist:**
- [ ] `https://<project>.vercel.app/` loads the dark-theme game
- [ ] `https://<project>.vercel.app/anything` loads the SPA (does NOT 404) — proves vercel.json rewrite is active
- [ ] Browser tab title reads "Longdle"
- [ ] Tile flip + toast fade + responsive layout work on deployed site
- [ ] (If DNS configured) custom subdomain serves the same site over HTTPS

**Resume signal:** Reply with one of:
- `deployed: <url>` — share the production URL
- `dns-pending: <vercel-url>` — Vercel deploy succeeded, DNS propagating
- `blocked: <reason>` — describe the blocker

## User Setup Required

**External service requires manual configuration for Task 3.**

- Vercel account with GitHub OAuth access to the `longdle` repo
- DNS provider access if configuring custom subdomain (DEPLOY-02)

## Known Stubs

None — vercel.json and index.html title changes are complete and functional.

## Threat Flags

No new threat surface introduced by Tasks 1-2 beyond what was already in the threat model. T-03-09 (vercel.json open-redirect) is mitigated: destination is `/index.html` (internal), not an external URL.

## Self-Check

- vercel.json exists at project root: PASS (a56bb46)
- index.html title is "Longdle": PASS (0bbe98a)
- No legacy keys in vercel.json: PASS
- npm run build succeeds: PASS

## Self-Check: PASSED

## Next Phase Readiness

- All code artifacts committed and build-verified; Vercel can import the repo as-is
- After Task 3 (human deploy step), the site will be live at a `*.vercel.app` URL
- DEPLOY-02 (custom subdomain) can land immediately after or be deferred — no code change needed

---
*Phase: 03-polish-deploy*
*Completed: 2026-05-06 (Tasks 1-2 done; Task 3 pending human action)*
