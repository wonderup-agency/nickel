# Tech Stack

## Runtime & Language

- **JavaScript (ES modules)** — all source uses `import`/`export`, `type: "module"` in package.json
- **Node.js** — scripts, build tooling
- **Browser target** — components run in the browser, loaded as ES modules via `<script type="module">`

## Bundler

- **Rollup** — two configs: `rollup.config.dev.js` (dev) and `rollup.config.prod.js` (prod)
  - `@rollup/plugin-node-resolve` — resolves node_modules imports
  - `@rollup/plugin-commonjs` — converts CJS dependencies to ESM
  - `@rollup/plugin-terser` — minification (prod only)
  - `rollup-plugin-delete` — cleans `dist/` before prod builds
  - `rollup-plugin-postcss` — CSS processing and extraction

## CSS

- **PostCSS** with `postcss-preset-env` (stage 2) — nesting, autoprefixer
- CSS is extracted to `dist/styles.css` in both dev and prod
- CSS is imported directly in JS files — no separate CSS build step

## Linting & Formatting

- **ESLint** (v9, flat config) — `eslint.config.js` uses `@eslint/js` recommended + `eslint-config-prettier`
- **Prettier** — default config (no `.prettierrc` file, uses Prettier defaults)
- Runs automatically before prod builds via `prebuild` script

## Dev Server

- **http-server** — serves `dist/` on `http://127.0.0.1:8080` with CORS enabled
- **concurrently** — runs Rollup watch + http-server in parallel for `npm run dev`

## CDN & Deployment

- **jsDelivr** — serves production assets from GitHub via `cdn.jsdelivr.net/gh/owner/repo@version/dist/`
- Tagged releases (`@v1.0.0`) for instant cache invalidation
- `@main` branch reference available but aggressively cached

## Tunneling

- **Cloudflare Tunnel** (`cloudflared`) — exposes local server for testing on real devices/Webflow preview

## Dependencies

- **Runtime**:
  - `picocolors` — used by Node scripts only, not bundled to the browser
  - `intl-tel-input` (v28) — international phone input with country picker. Bundled via Rollup; consumed by `connect-form.js`. CSS is extracted into `dist/styles.css`; the flag sprite is loaded at runtime from `cdn.jsdelivr.net/npm/intl-tel-input@28/dist/img/` via CSS-variable overrides set on `document.documentElement`.
  - `lenis` (v1.3) — site-wide smooth scroll. Initialized in `src/components/global.js`. RAF is driven by `gsap.ticker` so the scroll position is in sync with every ScrollTrigger / GSAP tween. Exposed on `window.__lenis` so other components can call `lenis.scrollTo(target)`. Disabled when `prefers-reduced-motion: reduce` matches.
- **Dev**: All other deps are devDependencies (Rollup, ESLint, Prettier, etc.)
- No frontend framework — vanilla JavaScript only

## CDN Libraries (loaded in Webflow)

- **GSAP** — loaded natively by Webflow on every page. Used as global `gsap`.
- **Swiper** (v11) — loaded from jsDelivr CDN (`swiper-bundle.min.js` + `swiper-bundle.min.css`). Used as global `Swiper`. Add to pages that need a carousel.
