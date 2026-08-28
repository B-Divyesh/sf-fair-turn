# Fair Turn v1 handoff

## Independent verification status — FAIL (2026-08-28)

Candidate `94dba0348602d4069df8f36a61c4ef85a7d745c5` was independently checked
against https://fair-turn.sociobot.in and **must not be released**. The live
deployment matches the freshly built candidate, but it is blocked by a missing
`.factory/claims.json`, no required one-click isolated sample demo or
`.factory/demo.md`, and no observed 429/Retry-After rate limit after 30 rapid
requests to the Sociobot product verification endpoint. A whitespace-only
household name also persists an unusable state; live CSP, a real 404 response,
immutable static caching, and canonical/social metadata are absent. See
`.factory/verification.md` for exact commands, evidence, successful checks,
and remediation requirements.

## What shipped

- A complete Vite + vanilla TypeScript offline PWA for adult household chore
  rotation, with a responsive neo-brutalist “household dispatch board” system.
- Local onboarding, people management, dated absences, recurring chores (days,
  weeks, or months), per-chore equitable round-robin assignment, automatic
  absence skipping, completion advancement, explicit swaps with optional notes,
  and a chronological local history.
- A read-only QR/link board snapshot. Snapshot data lives in the URL fragment
  and includes only household name, current assignments, and due dates.
- IndexedDB persistence, JSON backup/import, CSV history export, deletion
  controls, offline/status feedback, empty states, and light/dark themes.
- A $12 one-time Plus unlock through the Sociobot billing contract. Free is a
  useful 4-person/6-chore household; Plus removes limits and adds an eight-week
  outlook. License returns, daily verification caching, offline reconciliation,
  and paste-to-restore are implemented. Accessibility, data export, and safety
  controls are never gated.
- Install manifest, maskable 192/512 icons, generated service-worker precache,
  static `/privacy` and `/terms` entries, robots/sitemap, README, and MIT license.
- Original paper-collage hero artwork generated for this product, reviewed, and
  shipped as a 64 KB WebP with a 136 KB JPEG fallback. Source and prompt sidecar
  are under `assets/src/`; provenance is in `.factory/design.md`.

## How to verify

From a clean checkout with Node.js 20+:

```sh
npm ci
npm test
```

`npm test` runs six rotation unit tests, the exact production build, and four
Playwright journeys across desktop Chromium and a Pixel 5 profile. Browser tests
cover onboarding, assignment, absence skipping, swapping, completion, history,
390 px/legal rendering, offline reload, and axe serious/critical checks.

Build only:

```sh
npm run build
```

Output lands in `dist/`; `dist/index.html` is the deployment entry point.

## Verification results — 2026-08-28

- `npm test`: pass (6 unit tests and 4 Playwright journeys)
- TypeScript strict check and production build: pass
- Production payload: 62.40 KB JS (22.55 KB gzip), 15.82 KB CSS (4.45 KB
  gzip), 64 KB hero WebP; all under the factory budgets
- Playwright desktop + mobile journeys: 4/4 pass in the final run
- Offline reload after service-worker control: pass in desktop and mobile runs
- axe serious/critical issues: 0 in onboarding, populated app, privacy, and
  terms paths
- Lighthouse 12.8.2 mobile (local production preview): performance 98,
  accessibility 100, best practices 100, SEO 100; LCP 1.7 s, TBT 140 ms,
  CLS 0. Lighthouse did not emit a lab INP value; TBT remained below the
  200 ms interaction budget proxy.
- Browser smoke check: title, `lang="en"`, one `<h1>`, one `<main>`, image alt,
  and zero console/page errors all pass.

## Known gaps and release notes

- Data is intentionally device-local. Sharing is a point-in-time, read-only
  snapshot rather than live synchronization; recipients must receive a new link
  to see later changes.
- The factory must register the `fair-turn` billing product and set its return
  URL before launch. No product ID or payment-provider credential is embedded.
- License verification depends on the Sociobot API when online. A recently
  verified license remains available offline and is reconciled at most daily.
- Browser storage can be cleared by device/browser settings, so the app makes
  JSON backup prominent. There is no remote recovery by design.
