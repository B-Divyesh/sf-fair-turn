# Fair Turn repair handoff

## Status

The static PWA repairs are complete and locally release-ready. One verifier
finding remains outside this repository: the shared Sociobot billing API still
does not rate-limit 30 concurrent invalid-license requests. Repository rules
explicitly forbid changing billing infrastructure here. Exact evidence and the
required owner action are below.

## Repaired findings

- Added `.factory/claims.json` with nine observable claims. Every listed command
  passes independently on desktop Chromium and the Pixel 5 profile.
- Added the one-click `/demo` and `/?demo=1` sample board. Demo data uses the
  separate `fair-turn-demo` IndexedDB database; leaving demo deletes it and
  preserves the real `fair-turn` database. The persistent banner includes
  “Reset demo” and “Start for real”. `.factory/demo.md` documents the contract.
- Rejects whitespace-only household, person, and chore names with focused,
  announced errors. A regression test confirms a rejected household is not
  persisted.
- Added Azure Static Web Apps response policy: a CSP with exact build-generated
  hashes, permissions/referrer/content-type headers, immutable one-year asset
  caching, no-store service-worker caching, explicit route rewrites, and a real
  HTTP 404 response with a designed page.
- Added canonical, Open Graph, Twitter, 1200×630 social-image, and 180px touch
  metadata. Each route now sets a descriptive title and canonical URL.
- Corrected page heading semantics so every rendered route has one task-level
  `<h1>` and an ordered outline; the wordmark is no longer the page heading.
- Added client billing back-pressure: 30 concurrent verification calls coalesce
  to one request, and upstream `429` responses honor `Retry-After` with clear
  user feedback. Unit regressions cover both paths.
- Preserved the versioned service worker, offline shell, current product flows,
  local storage, export/import, sharing, free limits, and paid-license contract.

## Verification evidence — 2026-08-28

- Clean install: `npm ci` installed 91 packages; audit reported 0 vulnerabilities.
- Full gate: `npm test` passed 12 Vitest tests and 26 Playwright tests across
  desktop Chromium and Pixel 5. The production build is part of this command.
- Claims: all nine `.factory/claims.json` commands were also run separately;
  each passed in both browser projects from a fresh context.
- Type/build: strict `tsc --noEmit` and Vite production build passed. `dist/`
  contains root, demo, privacy, terms, and 404 documents.
- Payload: app JS 67.19 KB raw / 23.91 KB gzip; CSS 16.97 KB raw / 4.69 KB
  gzip; mobile hero WebP 65.52 KB. All are below factory budgets.
- Browser coverage: setup, rotation, absence skip, swap, completion, history,
  JSON/CSV export, import recovery, real/demo isolation, free limits, sharing,
  legal routes, 404, metadata, and offline reload passed on desktop and mobile.
- Keyboard/accessibility: skip link is first focus, form errors receive focus and
  are announced, dialog journeys remain keyboard-operable, 390px has no page
  overflow, reduced motion resolves to `scroll-behavior: auto`, and Playwright
  Axe found 0 serious/critical issues.
- Privacy: the full demo mutation/reset flow made zero cross-origin requests.
  Demo mode skips license storage and verification.
- Offline/update: controlled offline reload retained the sample board in both
  browser projects. Regression checks cover versioned precache, clients claim,
  `SKIP_WAITING`, update discovery, and the visible update notice. Deployment
  control files are excluded because Azure intentionally does not serve them.
- Host-policy emulator: `/`, `/demo`, `/privacy`, and `/terms` returned 200 with
  the hashed CSP; `/not-a-real-route` returned 404 and the designed document;
  `/assets/rotation-board.webp` returned
  `Cache-Control: public, max-age=31536000, immutable`; `/sw.js` returned
  `Cache-Control: no-cache, no-store, must-revalidate`.
- Factory smoke script: title, `lang=en`, one `<h1>`, `<main>`, image alt text,
  labeled buttons, and zero console errors passed live (`loadMs: 565`).
- Lighthouse 12.8.2 mobile on `/demo`: performance 98, accessibility 100, best
  practices 100, SEO 100; LCP 1.7 s, TBT 150 ms, CLS 0.
- Visual review: 1440×1000 desktop and 390×844 mobile demo captures showed the
  full board, persistent demo controls, correct stacking, and no horizontal
  page overflow.

## Deployment evidence

- Repair artifact commit: `2661c92` on `main`, pushed to `origin/main`.
- Deployed through the work-order static deployment tool to
  `https://fair-turn.sociobot.in` (Azure deployment
  `af7228ab-6e5c-47c7-883b-dcb508aec81e`).
- Fresh live desktop and 390px contexts loaded `/demo` with one `<h1>`, no
  horizontal overflow, no console errors, and 0 Axe violations.
- Live offline reload passed with cache `fair-turn-7884d2eb51` and the heading
  “Here’s the next turn.” visible.
- Live `/not-a-real-route` returns HTTP 404 and renders “This turn went
  missing.” `/`, `/demo`, `/privacy`, and `/terms` return HTTP 200 with CSP.
- Local/live SHA-256 identity matches: `index.html`
  `69563ab906c3d4f02b5409ac4eb81d07121ec4321f9776b1582ca683d81ccae8`;
  `sw.js` `23e3b85a56138b99aa489f01b5fcfed66c38382506498d4d610b469c25eaf604`;
  manifest `f9025577b619b476a74599a808023245ca8fb2bfcbfead52703f3a2cbfc702d7`.

## External billing boundary

- Checkout identity is correct: the Fair Turn Sociobot checkout returned HTTP
  303 to its hosted Dodo checkout session.
- The app-side limiter is fixed and tested. However, a direct concurrent check
  of `https://api.sociobot.in/api/v1/products/fair-turn/verify` still returned
  30 HTTP 200 responses, zero HTTP 429 responses, and no `Retry-After` header.
- Required factory action: the Sociobot billing API owner must add per-client or
  per-token verification throttling with HTTP 429 and `Retry-After`, then rerun
  the verifier’s direct 30-request check. This cannot be changed from a static
  PWA without violating `AGENTS.md` (“Never touch infra, DNS, or billing from
  this repo”).

## Run and deploy

```sh
npm ci
npm test
npm run test:claims -- --grep @claim:offline-reload
npm run build
/opt/fleet/lib/deploy-static.sh fair-turn /work/repo/dist
```

There is no package/consumer surface for this static PWA. Known product
limitations remain unchanged: data is device-local, shared links are point-in-
time snapshots, and browser storage can be cleared by the browser or device.
