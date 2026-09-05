# Independent verification 3 — PASS

**Verdict: PASS — zero findings; zero untested public claims.**

- **Implementation reviewed:** `fea2210592d4f878ec99e45b1dbd394fbb505945`
- **Documentation reviewed:** `5c9e677d3a6ca47ebc17c4e400133773402dadd9`
- **Live URL:** <https://fair-turn.sociobot.in>
- **Verified:** 2026-09-05 UTC

The implementation candidate was tested from a detached clean worktree at the
documentation commit above. The implementation commit is its product-image
candidate; the later commit changes the handoff only. Local and live artifact
hashes match, so the live application is this candidate.

## First screen and sample sandbox

Fresh dark-mode desktop (1440 px) and Pixel 5 (393 px) contexts both showed,
before scrolling:

- Job: “Rotate chores fairly at home.”
- Audience: “For adults sharing a home who need clear turns, dated absences,
  and agreed swaps.”
- First action: “Try it with sample data,” with “See a working household board
  in one click.”

Both entered the visible demo. It showed the persistent “Demo — sample data,
nothing is saved” notice, **Reset demo**, **Start for real**, and three
realistic populated assignment cards. A live isolation check created a real
`Private Flat` board, changed and reset the demo, then returned to real data:
the reset restored Juniper House with three cards; real data still contained
Sam and no demo Avery entry.

The fresh phone and desktop demo boards had no console/page errors. Their
scroll widths equalled their viewport widths. The phone screenshot and URL
checker evidence are retained under `/work/.evidence/fair-turn-verify-3-*`.

## Clean setup and declared claims

`npm ci` in `/tmp/fair-turn-verify-3` installed 91 packages with 0 reported
vulnerabilities. `npm run build` passed and produced `dist/`. `npm test`
passed 12 Vitest tests and 26 browser tests.

Every command declared in `.factory/claims.json` was run separately from that
clean worktree. Each passed in both configured browser projects (18 claim
executions total).

| Claim | Exact declared command | Result |
| --- | --- | --- |
| Demo isolation | `npm run test:claims -- --grep @claim:demo-sandbox` | PASS (2) |
| Rotation and absence skip | `npm run test:claims -- --grep @claim:rotation-away` | PASS (2) |
| JSON/CSV export | `npm run test:claims -- --grep @claim:exports` | PASS (2) |
| Read-only shared snapshot | `npm run test:claims -- --grep @claim:share-snapshot` | PASS (2) |
| Local-only privacy | `npm run test:claims -- --grep @claim:privacy-local-only` | PASS (2) |
| Offline reload | `npm run test:claims -- --grep @claim:offline-reload` | PASS (2) |
| Free limits and Plus price | `npm run test:claims -- --grep @claim:free-limits` | PASS (2) |
| Installable PWA | `npm run test:claims -- --grep @claim:installable-pwa` | PASS (2) |
| Keyboard, reduced motion, dark theme, mobile | `npm run test:claims -- --grep @claim:accessible-layout` | PASS (2) |

The public interface and README were cross-checked against this registry. The
observable privacy, offline, export, sharing, rotation, free-limit, PWA, and
accessibility statements all have a matching tested claim. No unlisted public
claim was found.

## Live product checks

- Dark-mode Axe on fresh desktop and Pixel 5 `/demo` boards found zero serious
  or critical violations. The phone check also proved reduced-motion
  `scroll-behavior: auto`, visible skip-link keyboard focus, and no horizontal
  overflow. After the visible theme switch, live light-mode Axe also had zero
  serious or critical violations.
- The factory `verify-url.sh` passed against both `/` and `/demo`: HTTP 200,
  title, `lang=en`, one h1, main landmark, no missing image alt attributes,
  no unlabeled buttons, and no console errors. Measured loads were 625 ms and
  567 ms respectively.
- A fresh live service-worker context became controlled, went offline, and
  reloaded `/demo` with the Juniper House board and offline notice intact.
- A live demo request log covering completion and reset contained zero
  cross-origin requests. Source inspection found no analytics, tracking,
  remote fonts, or third-party scripts. The only product external endpoint is
  the disclosed Sociobot checkout/license path.
- Normal live creation made a `Recovery Home` board and assigned Bins to Sam.
  Whitespace-only household input displayed “Enter a household name with at
  least one visible character.” and returned focus to that input. Reversed
  away dates displayed “The end date must be on or after the start date.”
- `/`, `/demo`, `/privacy`, and `/terms` returned 200 with route-specific
  titles. `/not-a-real-route` deliberately returned HTTP 404 and rendered
  “Page not found.” This is the required designed 404, not a defect. Internal
  links resolved successfully; the paid checkout link returned its expected
  hosted-checkout redirect.
- Responses provide CSP with `frame-ancestors 'none'` as a header, HSTS,
  `nosniff`, strict referrer policy, and a restrictive permissions policy.
  The hero asset is immutable for one year and `sw.js` is no-store.
- The product billing verify endpoint was independently checked using an
  invalid test value: 30 requests returned 200 invalid responses and the next
  5 returned 429 with `Retry-After: 4`. The client regression tests also pass
  its coalescing and retry-after behavior.

## Candidate identity and budgets

| Artifact | Local SHA-256 | Live SHA-256 |
| --- | --- | --- |
| `index.html` | `4b7f0eefd2c9d0ef49e8d838e7f97984f69b256676c92e2c9563d610f7a236a2` | `4b7f0eefd2c9d0ef49e8d838e7f97984f69b256676c92e2c9563d610f7a236a2` |
| `sw.js` | `00e09aa3b4d850f7818a602046f4da29421cb6d4e9a8ee6201fed58d89c5d37d` | `00e09aa3b4d850f7818a602046f4da29421cb6d4e9a8ee6201fed58d89c5d37d` |
| `manifest.webmanifest` | `f9025577b619b476a74599a808023245ca8fb2bfcbfead52703f3a2cbfc702d7` | `f9025577b619b476a74599a808023245ca8fb2bfcbfead52703f3a2cbfc702d7` |

The production build contains 67.16 kB raw / 23.85 kB gzip JavaScript and
16.98 kB raw / 4.67 kB gzip CSS, within the static budgets. The 65,522-byte
WebP hero is also within budget.

## Earlier findings, now verified

| Earlier finding | Current disposition |
| --- | --- |
| Missing claims registry and one-click isolated demo | PASS — nine registered, separately executed claim commands; live isolated demo verified. |
| Missing billing throttling | PASS — live invalid requests rate-limit at 30 with 429 and `Retry-After: 4`. |
| Whitespace household created a broken board | PASS — rejected with announced error and returned focus; normal recovery works. |
| Missing CSP, real 404, immutable assets, and social metadata | PASS — live headers/routes and the clean release regression cover all four. |
| Dark future-badge and Plus-action contrast | PASS — fresh dark desktop and phone Axe both have zero serious/critical findings. |
| Accessibility claim only checked light mode | PASS — the claim now runs Axe in dark mode before a separate light-mode check. |
| Decorative labels and catalog/billing metadata | PASS — current labels use direct task wording; catalog description is verb-first and the live $12 one-time offer is explicit. |

## Note on Lighthouse

The existing handoff records the worker-image Lighthouse CLI launch limitation.
It is an environment limitation, not an untested public claim: this review
independently checked the required runtime accessibility, responsive layout,
console, offline, payload, and route basics. No product finding remains.

## Conclusion

**PASS — zero findings of every severity and zero untested claims.**
