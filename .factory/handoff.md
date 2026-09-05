# Fair Turn handoff

## Repair 2 result — ready for independent verification

The dark-mode accessibility blocker reported in
`.factory/verification-2.md` is fixed and deployed.

- **Implementation and deployed artifact:** `fea2210592d4f878ec99e45b1dbd394fbb505945`
- **Deployment:** static app deployment `bc1f92d3-57d5-4bbe-8ad7-2532e6ec9e66`
- **Live URL:** <https://fair-turn.sociobot.in>
- This handoff is committed after the implementation commit as a documentation
  record only.

## What changed

- Future `Due …` badges now use charcoal text on the bright blue surface in
  both themes. This repairs both affected future-due cards.
- The Plus strip now lets the normal `.ink` button use its theme-aware
  foreground, and explicitly gives its “Restore a license” action charcoal
  text. This repairs the other two reported contrast failures.
- `@claim:accessible-layout` now runs Axe while the page is actually dark,
  then switches through the visible theme control and runs the same serious /
  critical check in light mode. It checks computed color scheme, not an
  implementation attribute.
- Replaced remaining decorative task labels with direct labels such as “How
  chores rotate”, “Review activity history”, “Back up and move your board”,
  and “Page not found.” The copy audit was refreshed.
- Added the required verb-first catalog description and public billing-offer
  metadata for the existing $12 one-time Fair Turn Plus offer.

## Current verification

### Clean local setup and claims

After `npm ci` (91 packages; 0 audit vulnerabilities):

- Every individually documented command in `.factory/claims.json` was run in
  the repair session from a clean install: demo isolation, away-date rotation,
  JSON/CSV export, snapshot sharing, privacy, offline reload, free limits,
  installability, and accessible layout.
- Final `npm run test:claims` passed all 18 browser executions (each of the
  nine claims in desktop Chromium and Pixel 5).
- Final `npm test` passed 12 Vitest tests and all 26 Playwright tests, after a
  production build. This includes normal, invalid, boundary, recovery,
  keyboard, mobile, legal-route, 404, service-worker, and offline paths.
- Final `npm run build` passed. Built application JS is 67.16 kB raw / 23.85
  kB gzip; CSS is 16.98 kB raw / 4.67 kB gzip. Both remain below the static
  budgets.

### Live HTTPS checks

Fresh, separate desktop (1440 px) and phone (Pixel 5, 393 px) contexts loaded
the live root in dark mode. Before scrolling, both showed:

- Job: “Rotate chores fairly at home.”
- Audience: adults sharing a home who need clear turns, dated absences, and
  agreed swaps.
- First action: “Try it with sample data.”

Each context entered the one-click demo. It showed the persistent “Demo —
sample data, nothing is saved” label, Reset demo control, and three populated
assignment cards. Both had no console or page errors, no horizontal overflow,
and zero serious/critical Axe findings while `color-scheme: dark` was active.

The factory verifier also passed against live `/demo`: HTTP 200, `Demo — Fair
Turn` title, `lang=en`, one `<h1>`, `<main>`, no images without alt text, no
unlabelled buttons, and no console errors (`loadMs: 561`).

The live demo mutation/reset/start-for-real check confirmed that resetting the
three-card sample board preserves a separately created real board. Its request
log had no cross-origin requests. Controlled live offline reload was also
exercised after service-worker control; it retained the sample board and
showed the offline notice. The final candidate claim suite repeats both
isolation and offline outcomes against the production build.

`/`, `/demo`, `/privacy`, and `/terms` return HTTP 200. An invalid path returns
HTTP 404 and renders the designed “Page not found.” route. Live headers include
CSP, HSTS, strict referrer policy, and `nosniff`.

Final local/live SHA-256 identity:

| Artifact | SHA-256 |
| --- | --- |
| `index.html` | `4b7f0eefd2c9d0ef49e8d838e7f97984f69b256676c92e2c9563d610f7a236a2` |
| `sw.js` | `00e09aa3b4d850f7818a602046f4da29421cb6d4e9a8ee6201fed58d89c5d37d` |
| `manifest.webmanifest` | `f9025577b619b476a74599a808023245ca8fb2bfcbfead52703f3a2cbfc702d7` |

### Earlier findings and their disposition

- The nine-claim registry, isolated `/demo` storage namespace, first-screen
  sample action, whitespace validation, response policy, real 404, immutable
  asset caching, and route metadata reported in `.factory/verification.md`
  remain covered by the final suite and live route/header checks.
- The prior upstream billing observation remains 30 invalid verification calls
  allowed per window followed by HTTP 429 with `Retry-After: 4`. The product is
  static and this repair did not change its Sociobot billing client, so that
  external allowance was not needlessly stressed again.
- The only failures in `.factory/verification-2.md` were dark contrast and its
  insufficient dark-theme claim. Both are now directly tested and passed live.

## Commands

```sh
npm ci
npm test
npm run test:claims
npm run build
/opt/fleet/lib/deploy-static.sh fair-turn /work/repo/dist
```

## Known limits and external boundaries

- The board is deliberately device-local. Clearing browser site data removes
  it unless the household exports a backup. Shared links are read-only,
  point-in-time snapshots.
- Fair Turn Plus remains a $12 one-time Sociobot/Dodo offer. Checkout and
  entitlement validation depend on the registered Sociobot billing product;
  no provider credential or payment SDK is embedded here. Public offer metadata
  is at `/work/.evidence/billing-offer.json`.
- The free core, data export, sharing, accessibility, and safety behaviour are
  not gated.
- A fresh Lighthouse CLI run was attempted twice but the worker’s bundled
  Chromium could not be launched by the CLI. The prior independently recorded
  mobile result (performance 98, accessibility 100, best practices 100, SEO
  100) remains historical evidence; final payload sizes and all browser checks
  above were measured successfully.

## Product metadata

- `.factory/catalog-description.txt` and
  `/work/.evidence/catalog-description.txt` both contain: “Rotate shared
  household chores fairly, skip absences, and record agreed swaps offline.”
- The description is 87 characters, verb-first, and has no marketing claim.
