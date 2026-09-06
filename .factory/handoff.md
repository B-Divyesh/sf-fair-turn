# Fair Turn handoff

## Result

**PASS — all six strict-review findings are repaired and all nine public claims
have complete outcome tests.**

- Implementation SHA: `f01235d377ee8b0d6602ee623f46f8ef21348d9d`
- Prior report-only baseline: `2bd7e4ead73d5ad3d8e9df6d84ed4820fb0b40b0`
- Live URL: <https://fair-turn.sociobot.in>
- Verified and deployed: 2026-09-06 UTC

This handoff is the report-only change after the implementation SHA above.

## Repairs

| Strict-review finding | Current disposition |
| --- | --- |
| Phone first screen hid the job, audience, and action | Fixed. At 393×851, the job ends at 369 px, audience at 466 px, sample action at 534 px, and three facts at 798 px. The illustration now follows the copy on phones. |
| Export claim was incomplete | Fixed. The claim compares every exported JSON field with IndexedDB, every CSV activity value, and a valid import in a separate clean browser context. |
| Plus claim was incomplete | Fixed. The claim proves both free gates, verifies a fixture license, adds a fifth person and seventh chore, and checks the displayed outlook reaches eight weeks. |
| Keyboard claim and section focus were incomplete | Fixed. Section changes focus the new h1 and announce it. The claim uses Tab, Shift+Tab, Enter, and Escape across sections and a named dialog. |
| Required landing structure was missing | Fixed. The landing page now has primary navigation, a working-board preview, three-step explanation, privacy limits, exact paid offer, Param Factory credit, and a version label. |
| Footer links were 24 px high | Fixed. Privacy and Terms are at least 44×44 CSS px; the phone regression measures them. |
| Malformed import exposed a parser error | Fixed. The board stays intact and the message tells the user to choose a Fair Turn JSON backup and retry. |

The related form paths now also focus and describe invalid household, person,
chore, eligibility, and away-date fields. File-input focus is visibly drawn on
its label. Dialogs expose their visible heading as the accessible name.

## Clean verification

A detached clean checkout of `f01235d` was used.

- `npm ci`: PASS — 91 packages, 0 reported vulnerabilities.
- `npm test`: PASS — 12 Vitest tests and 28 Playwright executions.
- `npm run build`: PASS — `dist/index.html` produced.
- Built JavaScript: 70.97 kB raw / 24.84 kB gzip.
- Built CSS: 20.07 kB raw / 5.24 kB gzip.
- Mobile hero WebP: 65,522 bytes.

Every command in `.factory/claims.json` was run separately from that checkout:

| Claim | Result |
| --- | --- |
| `@claim:demo-sandbox` | PASS (desktop and mobile) |
| `@claim:rotation-away` | PASS (desktop and mobile) |
| `@claim:exports` | PASS (desktop and mobile) |
| `@claim:share-snapshot` | PASS (desktop and mobile) |
| `@claim:privacy-local-only` | PASS (desktop and mobile) |
| `@claim:offline-reload` | PASS (desktop and mobile, isolated contexts) |
| `@claim:free-limits` | PASS (desktop and mobile) |
| `@claim:installable-pwa` | PASS (desktop and mobile) |
| `@claim:accessible-layout` | PASS (desktop and mobile) |

## Live verification

- Fresh 393×851 phone and 1440×900 desktop contexts identify the job, audience,
  and sample action before scrolling. Both have no horizontal overflow or
  console/page errors.
- The live demo starts with three populated cards and a persistent sample-data
  label. Completion changes the assignee, reset restores Avery and all three
  cards, and leaving the demo preserves a separately created real board.
- Fresh dark and light Axe runs report zero serious or critical violations.
  Reduced motion, visible focus, named dialogs, section focus/announcement, and
  44 px footer targets were checked in the browser.
- A new service-worker context reloads `/demo` offline with the board and
  offline notice. Release tests cover versioned precaching, activation, and the
  update notice.
- `/`, `/demo`, `/privacy`, and `/terms` return 200 with route-specific titles,
  one h1, and one main. `/not-a-real-route` deliberately returns HTTP 404 and
  renders the designed recovery page. All internal links resolve; checkout
  returns its expected 303 redirect.
- CSP, HSTS, `nosniff`, referrer policy, and permissions policy are present.
  Product assets are immutable for one year; `sw.js` is not cached.
- The billing verifier returned 30 HTTP 200 invalid responses, then five HTTP
  429 responses with `Retry-After: 4`. No purchase was attempted.
- Lighthouse mobile: performance 100, accessibility 100, best practices 100,
  SEO 100; LCP 1.36 s, CLS 0, total blocking time 39 ms, total transfer 97,463
  bytes. Lighthouse does not provide lab INP.
- Factory URL checks pass for `/` and `/demo` with titles, `lang=en`, one h1,
  main landmarks, image alt text, labelled buttons, and no console errors.

Live files match the clean final build:

| Artifact | SHA-256 |
| --- | --- |
| `index.html` | `c1d4714be44731c4563efbfaf381f93538e3a696138e37198730ba61480e2f5a` |
| `sw.js` | `e7ecc6f1b8113cef58422b8cd596f6548de69f8533859b1e3adcfd9a7a79f418` |
| `manifest.webmanifest` | `f9025577b619b476a74599a808023245ca8fb2bfcbfead52703f3a2cbfc702d7` |

Evidence is under `/work/.evidence/fair-turn-repair-3-*`. The catalog copy is
at `/work/.evidence/catalog-description.txt`, and the registered live offer is
described at `/work/.evidence/billing-offer.json` without credentials.

## Earlier findings

Earlier demo isolation, claims registration, whitespace validation, billing
throttling, CSP, designed 404, immutable caching, metadata, dark-theme
contrast, and dark-theme claim coverage remain fixed and were covered again by
the clean suite or live checks.

## Known boundaries

- Boards remain device-local. Clearing site data removes a real board unless a
  backup was exported.
- Shared links are read-only point-in-time snapshots, not live sync.
- Plus entitlement depends on the registered Sociobot billing service. The
  free board, accessibility, sharing, and export continue without it.
