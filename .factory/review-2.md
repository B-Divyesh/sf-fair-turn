# Review: rotate household chores fairly

**Verdict: PASS — 0 findings and 0 untested public claims.**

- **Implementation reviewed:** `f01235d377ee8b0d6602ee623f46f8ef21348d9d`
- **Documentation baseline:** `8c4921ed2dc45b455b3a8f9df18fe6e1fb34573c`
- **Live URL:** <https://fair-turn.sociobot.in>
- **Reviewed:** 2026-09-06 UTC

The documentation commits after the implementation candidate are report-only.
A detached clean checkout of `f01235d` built to the exact live `index.html`,
`sw.js`, and `manifest.webmanifest` SHA-256 values. This review therefore
covers the deployed implementation.

## Job, audience, and first action

Before scrolling, fresh desktop and 393×851 phone browsers state:

- **Job:** “Rotate chores fairly at home.”
- **Audience:** adults sharing a home who need clear turns, dated absences,
  and agreed swaps.
- **First action:** “Try it with sample data,” with the result stated as a
  working household board in one click.

On the phone, the job ends at 369 px, audience at 466 px, action at 534 px,
and all three product facts at 798 px. The 851 px viewport has no horizontal
overflow. Desktop, phone, and demo loads had no browser console or page errors.

## Clean checkout and claims

`npm ci` completed with 91 packages and no reported vulnerabilities. `npm
test` passed: 12 unit tests, the production build, and 28 Playwright tests.
`npm run build` produced `dist/` with JavaScript at 70.97 kB raw / 24.84 kB
gzip and CSS at 20.07 kB raw / 5.24 kB gzip.

Every exact command declared in `.factory/claims.json` was run separately from
the clean checkout. Each passed in the configured desktop and mobile projects.

| Claim | Result |
| --- | --- |
| `@claim:demo-sandbox` | PASS (2) |
| `@claim:rotation-away` | PASS (2) |
| `@claim:exports` | PASS (2) |
| `@claim:share-snapshot` | PASS (2) |
| `@claim:privacy-local-only` | PASS (2) |
| `@claim:offline-reload` | PASS (2) |
| `@claim:free-limits` | PASS (2) |
| `@claim:installable-pwa` | PASS (2) |
| `@claim:accessible-layout` | PASS (2) |

The landing page and README claims map to that registry. No unlisted public
claim was found, so the untested-claim count is **0**.

## Live checks

- The live one-click demo loaded Juniper House with three populated cards and
  the persistent “Demo — sample data, nothing is saved” label. Completing bins
  reassigned it from Avery to Morgan. Reset restored Avery. Leaving demo kept a
  separately created real board with Sam and Alex and no demo person.
- The normal live path created a board, added a chore, skipped Sam for an away
  date, recorded a swap to Jo with “Traded for dinner,” completed the chore,
  and retained the note in history. Whitespace household input and a one-person
  roster gave focused, plain correction messages. A malformed JSON import kept
  the sample board and instructed the user to choose a Fair Turn JSON backup.
- The free boundary stopped the fifth person and seventh chore with the stated
  Plus explanations. The separately executed Plus claim also verified the
  fixture unlock, fifth/seventh additions, and eight-week outlook.
- Fresh dark, reduced-motion phone Axe reported zero serious or critical
  violations. Keyboard testing reached the skip link, focused and announced a
  changed section, opened a named dialog, focused its field, and returned focus
  to its opener after Escape. `verify-url.sh` passed on `/` and `/demo` with a
  title, `lang=en`, one h1, main landmark, alt text, labelled buttons, and no
  console errors.
- A fresh service-worker-controlled `/demo` context reloaded offline with the
  Juniper House board and offline notice.
- `/`, `/demo`, `/privacy`, and `/terms` return 200 with route-specific browser
  titles, one h1, and one main. `/not-a-real-route` deliberately returns HTTP
  404 and renders the designed recovery page. Internal links resolve to 200;
  the registered checkout link returns its expected 303 redirect.
- Live responses deliver CSP with `frame-ancestors 'none'`, HSTS, `nosniff`,
  strict referrer policy, and a restrictive permissions policy. No backend or
  product tenant store exists for this static PWA, so tenant/restart/health
  checks do not apply.

## Candidate identity

| Artifact | SHA-256 |
| --- | --- |
| `index.html` | `c1d4714be44731c4563efbfaf381f93538e3a696138e37198730ba61480e2f5a` |
| `sw.js` | `e7ecc6f1b8113cef58422b8cd596f6548de69f8533859b1e3adcfd9a7a79f418` |
| `manifest.webmanifest` | `f9025577b619b476a74599a808023245ca8fb2bfcbfead52703f3a2cbfc702d7` |

The clean build and the live artifact hashes match for all three files.

## Earlier findings

| Earlier finding | Current disposition |
| --- | --- |
| Missing claims registry and isolated demo | PASS — nine registered proofs, one-click demo, persistent label, reset, and separate storage all verified. |
| Incomplete export, Plus, and keyboard proofs | PASS — current exact claim tests cover complete export/import, verified unlock/limits/outlook, and keyboard operation/focus. |
| Phone first read hid the job and action | PASS — all required first-read content fits in the fresh 393×851 viewport. |
| Section focus, landing structure, and legal touch targets | PASS — focus and announcement work; required sections/navigation/footer are present; legal links meet the target requirement. |
| Raw malformed-import error | PASS — recovery wording is plain and leaves the board intact. |
| Dark contrast and dark-mode coverage | PASS — fresh dark-phone Axe is clear before light-theme checks. |
| Whitespace validation, CSP, metadata, 404, and caching | PASS — live path, headers, route rendering, and clean release tests cover these repairs. |
| Billing rate-limit concern | Not applicable to the static PWA: it has no product backend or tenant store. |

## Evidence

Evidence includes clean command output, candidate hashes, live browser checks,
and screenshots under `/work/.evidence/fair-turn-review-2-*` and the URL-check
directories `/work/.evidence/fair-turn-review-2-url-root` and
`/work/.evidence/fair-turn-review-2-url-demo`.

**Final verdict: PASS — 0 findings and 0 untested public claims.**
