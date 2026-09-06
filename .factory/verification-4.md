# Verify recurring household chore rotation

**Verdict: PASS — zero findings and zero untested public claims.**

- Implementation reviewed: `f01235d377ee8b0d6602ee623f46f8ef21348d9d`
- Documentation reviewed: `17c43dfd07c06f04103d15995f117bcc996dd139`
- Live URL: <https://fair-turn.sociobot.in>
- Verified: 2026-09-06 UTC

The documentation commit changes reports only. A detached clean checkout of
the implementation commit was built and tested. The deployed `index.html`,
`sw.js`, and manifest have the same SHA-256 values as that clean build.

## Job, audience, and first action

Before scrolling, fresh desktop and 393×851 phone browsers state:

- Job: “Rotate chores fairly at home.”
- Audience: adults sharing a home who need clear turns, dated absences, and agreed swaps.
- First action: “Try it with sample data,” followed by “See a working household board in one click.”

On the 393×851 phone, the job ends at 369 px, audience at 466 px, action at
534 px, and all three product facts at 798 px. There is no horizontal overflow.

## Clean checkout and claims

`npm ci` completed in a detached checkout of `f01235d` with 91 packages and
no reported vulnerabilities. `npm test` passed 12 unit tests and 28 browser
tests. `npm run build` produced `dist/`; JavaScript is 70.97 kB raw / 24.84 kB
gzip and CSS is 20.07 kB raw / 5.24 kB gzip.

Every declared command in `.factory/claims.json` was run separately from that
checkout. Each passed in the configured desktop and mobile projects.

| Claim | Result |
| --- | --- |
| Demo isolation | PASS (2) |
| Rotation and absence skip | PASS (2) |
| JSON/CSV export and import | PASS (2) |
| Read-only shared snapshot | PASS (2) |
| Local-only privacy | PASS (2) |
| Offline reload | PASS (2) |
| Free limits, Plus price, and unlock | PASS (2) |
| Installable PWA | PASS (2) |
| Keyboard, reduced motion, dark theme, and phone layout | PASS (2) |

The live page and README claims match this registry. No unlisted public claim
was found.

## Live product checks

- Fresh desktop and phone contexts loaded without console or page errors.
  Factory URL checks passed for `/` and `/demo`: HTTP 200, route titles,
  `lang=en`, one h1, one main landmark, image alt text, and labelled buttons.
- The live one-click demo showed Juniper House, three populated chores, the
  persistent “Demo — sample data, nothing is saved” notice, Reset demo, and
  Start for real. Completing bins changed Avery to Morgan; reset restored
  Avery and all three sample cards. A separately created real board remained
  present after leaving demo, with no Juniper House data in it.
- The normal live path created a board, assigned Sam, skipped Sam for an away
  date, recorded a swap to Jo with its note, and showed that swap in history.
  Whitespace-only household and one-person input returned focused correction
  messages. A malformed import kept the three-card sample board and said to
  choose a Fair Turn JSON backup and retry.
- Fresh live Axe checks found zero serious or critical violations on desktop
  and on a dark, reduced-motion phone context. Keyboard checks reached the
  skip link, changed a section with focus on its h1 and a live announcement,
  opened and escaped a named dialog, and confirmed 44 px legal links. The
  phone has no horizontal overflow and uses `scroll-behavior: auto` under
  reduced motion.
- A fresh service-worker-controlled `/demo` context reloaded while offline
  with the Juniper House board and offline notice visible.
- `/`, `/demo`, `/privacy`, and `/terms` returned 200 with route-specific
  titles, one h1, and one main. `/not-a-real-route` deliberately returned
  HTTP 404 and rendered the designed “Page not found” recovery page.
  All internal links on these routes resolved to 200.
- Live headers include CSP with `frame-ancestors 'none'`, HSTS, `nosniff`,
  strict referrer policy, and restrictive permissions policy. The hero WebP
  is one-year immutable and `sw.js` is `no-cache, no-store, must-revalidate`.

## Candidate identity

| Artifact | SHA-256 |
| --- | --- |
| `index.html` | `c1d4714be44731c4563efbfaf381f93538e3a696138e37198730ba61480e2f5a` |
| `sw.js` | `e7ecc6f1b8113cef58422b8cd596f6548de69f8533859b1e3adcfd9a7a79f418` |
| `manifest.webmanifest` | `f9025577b619b476a74599a808023245ca8fb2bfcbfead52703f3a2cbfc702d7` |

## Earlier findings

| Earlier finding | Current disposition |
| --- | --- |
| Missing claims registry and isolated one-click demo | PASS — nine complete, separately executed claim proofs and live isolation check. |
| Incomplete export, Plus, and keyboard claim proofs | PASS — the current claim tests compare full exports/imports, exercise a verified fixture unlock through fifth/seventh items and eight weeks, and operate keyboard focus, Enter, Shift+Tab, and Escape. |
| Phone hid job, audience, and action | PASS — all required first-read content ends within the 393×851 viewport. |
| Section changes lost focus or announcement | PASS — live keyboard change focuses the new h1 and announces it. |
| Landing structure and footer target size | PASS — required landing sections, primary navigation, factory/version footer, and 44 px legal links are live. |
| Malformed import exposed parser details | PASS — live recovery copy is plain and the board remains intact. |
| Dark contrast and dark-mode claim coverage | PASS — fresh dark phone Axe is clear before a separate light-mode check. |
| Whitespace board, CSP, metadata, designed 404, and static caching | PASS — live validation, headers, metadata regression tests, real 404, and immutable asset header cover all five. |
| Billing-rate-limit finding | Not applicable to this static PWA: it has no product backend or tenant store. The client license retry/coalescing tests passed; no product data service was contacted. |
| Decorative labels and catalog/offer wording | PASS — current copy uses direct task labels, verb-first catalog text, and explicit $12 one-time offer. |

## Evidence

Evidence is under `/work/.evidence/fair-turn-verify-4-*`, including clean test
logs, each declared claim command, live browser output, screenshots, URL checks,
header captures, and candidate hashes.

**Final verdict: PASS.**
