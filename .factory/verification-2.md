# Independent verification 2 — FAIL

**Candidate:** `b368b7f1ae6a7e6deaad143ee5053ba527862d79`  
**Live URL:** https://fair-turn.sociobot.in  
**Verified:** 2026-08-28 UTC  
**Result:** **FAIL — do not release**

## Release-blocking defect

### BLOCKER — dark theme has serious contrast failures

A fresh 390×844 Chromium context, with `prefers-color-scheme: dark` and
reduced motion, ran Axe against the live `/demo` board. Axe 4.10.2 reported
one serious `color-contrast` rule with four affected nodes:

| Node | Measured contrast |
| --- | --- |
| Two future `Due …` badges | 1.87:1 (`#f7f0df` on `#59bfd5`) |
| “Buy once” Plus button | 1.01:1 (`#f4eedf` on `#f7f0df`) |
| “Restore a license” button | 1.87:1 (`#f7f0df` on `#59bfd5`) |

These are normal-sized text and require 4.5:1. This violates the mandatory
accessibility baseline and the required zero serious/critical Axe result.
The finding reproduced against the fresh local production preview, so it is
not a hosting-only difference.

### HIGH — the registered accessibility claim does not test its dark-theme promise

`@claim:accessible-layout` passes, but its test calls `Change color theme`
before running Axe. Starting from dark preference, that action switches the
page to light, so the test proves Axe only for light mode while claiming dark
theme support. The claim test therefore does not assert the promised observable
outcome. This must be corrected alongside the contrast defect.

## Mandatory claims and first read

- `.factory/claims.json` exists and contains the nine required claim entries.
- After `npm ci` in this clean candidate checkout, every listed command was
  run against fresh production demo output and passed in both Chromium projects:
  `demo-sandbox`, `rotation-away`, `exports`, `share-snapshot`,
  `privacy-local-only`, `offline-reload`, `free-limits`, `installable-pwa`,
  and `accessible-layout`. The last command is marked insufficient above,
  because it tests the wrong color state.
- Cold live first read passed. The screen says it rotates chores fairly at home,
  identifies adults sharing a home, and offers **“Try it with sample data”**
  with the adjacent explanation “See a working household board in one click.”
  The cold request log contained only the document and same-origin hero image;
  there were no page or console errors.

## Checks that passed

| Area | Fresh evidence |
| --- | --- |
| Install and full suite | `npm ci` installed 91 packages with 0 audit vulnerabilities. `npm test` passed 12 Vitest tests and 26 Playwright tests. |
| Type, production build, and budgets | `npm run build` passed repeatedly. Built JS is 67.19 KB raw / 23.91 KB gzip; CSS is 16.97 KB raw / 4.67 KB gzip; hero WebP is 65,522 bytes. |
| Core live workflow and recovery | Created a real board; whitespace household and chore names were rejected with focused/announced errors; valid recovery assigned Sam; reversed absence dates showed the correct error. Existing full-suite browser coverage also passed completion, absence skip, swap, history, JSON/CSV, import, free limits, and sharing. |
| Demo and privacy | Live `/demo` showed the persistent sample-data banner and three populated assignment cards. The registered privacy claim passed with no cross-origin household-data request. Cold live and interactive request logs contained same-origin product requests only. |
| Desktop/mobile/keyboard | At 390 px, `scrollWidth === clientWidth === 390`; reduced motion computed to `scroll-behavior: auto`; first Tab focused the skip link with a 3 px visible outline and 3 px offset. No browser console/page errors occurred. |
| PWA offline/update path | Live `/demo` gained service-worker control, registered cache `fair-turn-7884d2eb51`, and reloaded offline with both the sample board and offline banner visible. The passing release regression verifies versioned precache, `SKIP_WAITING`, `clients.claim`, and the update notice. A real version transition cannot be generated against a single live candidate. |
| Response policy and routing | `/`, `/demo`, `/privacy`, and `/terms` were 200; the invalid route was a real 404. Live responses supplied CSP, HSTS, `nosniff`, and strict referrer policy. `/assets/rotation-board.webp` is immutable for one year; `/sw.js` is no-store. |
| Deployment identity | Local and live SHA-256 matched exactly: `index.html` `69563ab906c3d4f02b5409ac4eb81d07121ec4321f9776b1582ca683d81ccae8`; `sw.js` `23e3b85a56138b99aa489f01b5fcfed66c38382506498d4d610b469c25eaf604`; manifest `f9025577b619b476a74599a808023245ca8fb2bfcbfead52703f3a2cbfc702d7`. |
| Billing allowance | From one client, 35 concurrent invalid-license verification requests produced 30 HTTP 200 responses followed by 5 HTTP 429 responses. Every 429 contained `Retry-After: 4`; observed allowance: 30 requests per window. No sign-in flow exists. |

## Required remediation

1. Correct all dark-theme foreground/background pairs to at least 4.5:1,
   including the due badges and Plus strip actions.
2. Make `@claim:accessible-layout` run Axe while dark theme is active (and
   retain a light-theme check separately if desired).
3. Re-run all registered claims, the full suite, and live dark-mode Axe before
   submitting another candidate.
