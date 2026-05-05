# Stack Research — Longdle

**Project:** Longdle — 6-letter daily Wordle clone  
**Researched:** 2026-05-04  
**Mode:** Ecosystem — static React SPA on Vercel, no backend

---

## Recommended Stack

| Library / Tool | Version | Purpose | Rationale | Confidence |
|---|---|---|---|---|
| **Vite** | 8.x (`create vite@latest`) | Build tool + dev server | De facto standard for React SPAs in 2025. Zero-config Vercel detection, HMR, native ESM. CRA is unmaintained. | HIGH |
| **React** | 19.x | UI framework | Owner requirement. React 19 is stable; Vite scaffold defaults to 18 — manually bump to 19 or pin to 18 (both work). | HIGH |
| **TypeScript** | 5.x | Type safety | Use `--template react-ts`. Catches word-list index mistakes and game-state shape errors at compile time. For a small game this is low overhead with high payoff. | HIGH |
| **Tailwind CSS** | 4.x (`@tailwindcss/vite`) | Styling | v4 ships a first-class Vite plugin — zero `tailwind.config.js` needed. Custom CSS variables in `:root` for the dark green jungle palette. Better DX than CSS Modules for utility-heavy game tiles. | HIGH |
| **Zustand** | 5.x | Game state | Lightweight store (< 2 kB). Built-in `persist` middleware writes to `localStorage` with schema versioning and partial-state selectors — eliminates a custom localStorage wrapper entirely. Better than React Context for tile re-render granularity on every keypress. | HIGH |
| **Motion** (`motion/react`) | 12.x | Tile animations | Formerly Framer Motion; renamed `motion` in 2025. Import from `motion/react`. Declarative variant system handles flip, bounce, and shake sequences with 3–4 lines. Lighter than GSAP for this scope. Alternative: pure CSS `@keyframes` (zero dependency, see below). | MEDIUM |
| **Vitest** | 4.x | Unit testing | Vite-native — reuses the same config, no Babel pipeline. Jest-compatible API so all existing Wordle test examples translate directly. | HIGH |
| **@testing-library/react** | 16.x | Component testing | Pairs with Vitest for rendering components + firing keyboard events. Standard for React component tests. | HIGH |
| **jsdom** | 25.x | DOM environment for Vitest | `environment: 'jsdom'` in `vitest.config.ts`. Required for DOM assertions in unit tests. | HIGH |
| **Vercel CLI** | latest | Deploy | `vercel` command auto-detects Vite. No additional Vercel config needed beyond the SPA rewrite (see below). | HIGH |

---

## Animation Decision: Motion vs Pure CSS

This is the one genuinely optional choice:

**Use Motion if:** You want timeline-sequenced multi-tile reveals (stagger rows on game end), exit animations on the modal, or reduced-motion support out of the box. API is declarative and beginner-friendly.

**Use pure CSS `@keyframes` if:** You want zero dependencies and maximum control. Wordle's flip and shake effects are achievable in ~30 lines of CSS. Many open-source React Wordle clones ship this way successfully. Add a `data-state` attribute to tiles (`correct`, `present`, `absent`, `tbd`) and drive all visual state from CSS.

**Recommendation for Longdle:** Start with pure CSS `@keyframes` for tile flip and keyboard bounce. Add Motion only if the v3 pixel art animation phase requires sequenced or spring-physics effects. This keeps the initial bundle smaller and avoids a dependency for two users.

---

## What NOT to Use

| Tool | Why Not |
|---|---|
| **Create React App (CRA)** | Unmaintained since 2023. Dead ecosystem, slow builds, no ESM. |
| **Next.js** | SSR/SSG overhead for a fully static game with no server routes. Adds deploy complexity (Vercel Edge Functions invoked unnecessarily) and forces Next-specific mental model. Pure Vite SPA is the right shape. |
| **Redux / Redux Toolkit** | Massive boilerplate for a game with ~10 state fields. Zustand handles this in 50 lines. |
| **React Query / SWR** | No async data fetching in this app. Word list is a static import. Adding a fetching library is pure overhead. |
| **Styled Components / Emotion** | CSS-in-JS runtime overhead not justified. Tailwind v4 covers all styling needs including the themed palette. |
| **`localStorage` raw wrappers (`use-local-storage-state`, etc.)** | Zustand `persist` middleware does this natively with version migration built in. No extra package needed. |
| **`framer-motion` (old package)** | Unmaintained alias; the package is now `motion`. If you add animation, install `motion` directly. |
| **React 18 + React Spring** | React Spring's physics model is overkill for tile flips; Motion or CSS is simpler. React Spring 10 also has a larger bundle than Motion 12. |

---

## Scaffold Command

```bash
npm create vite@latest longdle -- --template react-ts
cd longdle
npm install
npm install zustand
npm install -D vitest @testing-library/react @testing-library/jest-dom jsdom
npm install tailwindcss @tailwindcss/vite
# Only if adding animations beyond CSS:
# npm install motion
```

Tailwind v4 + Vite config addition (`vite.config.ts`):
```ts
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
})
```

---

## Vercel Deploy Notes

Vercel auto-detects Vite projects. No framework preset selection needed — it infers build command (`npm run build`) and output directory (`dist`).

**Required for SPA deep-linking:** Create `vercel.json` at the repo root:

```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

This is documented directly on Vercel's Vite page (last updated 2026-03-09). Without it, direct URL navigation and page-refresh on any non-root path returns 404. For Longdle specifically (single route, no React Router), this is still worth adding defensively for future-proofing.

**Subdomain mapping:** Configure via Vercel dashboard → Project → Domains. Point `longdle.yourpersonalsite.com` (or any subdomain) at the Vercel deployment. No server config needed.

**Environment variables:** None required for this project. Word list is a static import. If you add VITE_-prefixed env vars later, they are exposed at build time only — safe for public config, not for secrets.

**CI/CD:** Push to `main` → Vercel auto-deploys to production. Push to any other branch → Vercel generates a preview URL. Zero additional config.

---

## Confidence: High

All recommendations are sourced from official documentation (Vercel docs updated 2026-03-09, Vite official guide, Context7 Zustand/Vitest docs) and cross-verified against current npm versions. The only MEDIUM confidence item is the Motion vs CSS animation decision — both are valid and the recommendation to start with CSS is a judgment call, not a technical constraint.

---

## Sources

- [Vite official guide — Getting Started](https://vite.dev/guide/)
- [Vercel Vite framework docs](https://vercel.com/docs/frameworks/frontend/vite) (updated 2026-03-09)
- [Vercel SPA rewrite config](https://vercel.com/docs/project-configuration/vercel-json)
- [Zustand README — persist middleware](https://github.com/pmndrs/zustand/blob/main/README.md)
- [Motion for React — Installation](https://motion.dev/docs/react-installation)
- [Motion for React — Upgrade guide from framer-motion](https://motion.dev/docs/react-upgrade-guide)
- [Vitest — DOM environment setup](https://github.com/vitest-dev/vitest/blob/main/docs/guide/features.md)
- [Tailwind CSS v4 dark mode](https://github.com/tailwindlabs/tailwindcss/discussions/16925)
- [State management comparison 2025](https://dev.to/themachinepulse/do-you-need-state-management-in-2025-react-context-vs-zustand-vs-jotai-vs-redux-1ho)
