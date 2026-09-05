# Review: rotate household chores fairly

**Verdict: FAIL — 6 findings and 3 untested public claims.**

- **Implementation reviewed:** `fea2210592d4f878ec99e45b1dbd394fbb505945`
- **Documentation baseline:** `02aa2a8c1970acb42aa2e2493506574324e5986f`
- **Live URL:** <https://fair-turn.sociobot.in>
- **Reviewed:** 2026-09-05 UTC

The two commits after the implementation candidate change only
`.factory/handoff.md` and `.factory/verification-3.md`. A clean build at the
documentation baseline matches the live `index.html`, `sw.js`, and manifest
byte for byte. The findings below therefore apply to the implementation
candidate deployed at the live URL.

## Findings

### HIGH — the phone first screen does not state the job, audience, or first action

In a fresh 393×851 touch context, before scrolling, the page shows the header,
the full generated illustration, and its caption. The audience starts at
1,137 px and “Try it with sample data” starts at 1,241 px. Neither is in the
851 px viewport. The job heading is also below the first viewport.

This fails the work order’s pre-scroll check and the plain-words first-screen
contract. The desktop 1440×900 view passes; this is a phone-specific layout
defect caused by placing the illustration before the copy below 820 px.

Evidence: `/work/.evidence/fair-turn-review-1-phone-first.png` and
`/work/.evidence/fair-turn-review-1-live.json`.

### HIGH — three public claim proofs are incomplete

All nine declared commands exit successfully in both configured projects, but
three commands do not prove their complete public promise:

| Claim | Missing proof |
| --- | --- |
| `exports` | The test checks only the JSON household name and chore count, plus the CSV header and line count. It does not compare people, absences, activity values, or a valid import round trip. README also says JSON imports work across devices, but no registered claim test imports a backup. |
| `free-limits` | The test proves the free gates and displayed $12 offer. It never supplies a fixture license, adds a fifth person or seventh chore while unlocked, or checks the eight-week outlook. “Plus removes those limits” is untested. |
| `accessible-layout` | The test proves first-Tab focus on the skip link, not keyboard operation through the app. A live section change drops focus to `BODY`, contradicting the broader keyboard-navigation promise. |

Under the claims contract, a passing process is not enough when the asserted
observable outcome is narrower than the public statement. Untested public
claim count: **3**.

### MEDIUM — section changes drop keyboard and screen-reader position

From “Own your data,” focusing and activating the “Board” tab rerenders the
shell. The active element becomes `BODY`; neither the new h1 nor main receives
focus, and there is no route-change live region. The same rendering pattern is
used for all five app sections.

This leaves a keyboard or screen-reader user at an undefined position after a
successful action. It also shows why the current keyboard claim check is
insufficient.

### MEDIUM — the landing page omits required site structure

The live landing main contains one section and only the h1. It has no “How it
works,” privacy/what-it-does-not-do, or paid-tier section. The header has no
navigation, and the footer omits “Built by Param Factory” and a version/build
identifier.

These are explicit parts of the attached standard site skeleton. The working
app exposes some of this material only after a board exists, which does not
satisfy the landing-page order.

### MEDIUM — footer links are smaller than the required touch target

On fresh desktop and phone demo pages, the visible Privacy and Terms links
measure 58×24 px and 47×24 px. Their height is below the required 44 px touch
target. Other checked demo controls meet the size requirement.

### LOW — malformed imports show a parser error instead of a recovery instruction

Importing a malformed JSON file leaves the current board intact, but the toast
says `Expected property name or '}' in JSON at position 1 (line 1 column 2)`.
This is a raw parser message and does not tell the user to choose a Fair Turn
backup. The plain-words contract requires an error to say what happened and
what to do next.

## Job, audience, and first action

On desktop before scrolling:

- Job: “Rotate chores fairly at home.”
- Audience: adults sharing a home who need clear turns, dated absences, and
  agreed swaps.
- First action: “Try it with sample data,” followed by “See a working household
  board in one click.”

The desktop view passes. The phone view fails as described in the first
finding.

## Demo and real-data isolation

A fresh live demo shows the persistent “Demo — sample data, nothing is saved”
label, Reset demo, Start for real, and three populated cards:

- Take bins out — Avery
- Clean the bathroom — Riley
- Water shared plants — Avery

Marking the first chore done changes Avery to Morgan. Reset demo restores Avery
and all three cards. Starting for real returns to the separately created board
with Sam and Alex. No demo person appears in real data. The interactive demo
request log contains only same-origin document and image requests.

## Clean setup and command results

A detached clean worktree at the documentation baseline was used.

- `npm ci`: PASS — 91 packages, 0 reported vulnerabilities.
- `npm test`: PASS — 12 Vitest tests and 26 Playwright tests.
- `npm run build`: PASS — `dist/index.html` produced.
- All nine exact `.factory/claims.json` commands: process PASS, two browser
  executions each. The three insufficient assertions are findings above.

| Declared claim command | Process result | Claim result |
| --- | --- | --- |
| `npm run test:claims -- --grep @claim:demo-sandbox` | PASS (2) | PASS |
| `npm run test:claims -- --grep @claim:rotation-away` | PASS (2) | PASS |
| `npm run test:claims -- --grep @claim:exports` | PASS (2) | INCOMPLETE |
| `npm run test:claims -- --grep @claim:share-snapshot` | PASS (2) | PASS |
| `npm run test:claims -- --grep @claim:privacy-local-only` | PASS (2) | PASS |
| `npm run test:claims -- --grep @claim:offline-reload` | PASS (2) | PASS |
| `npm run test:claims -- --grep @claim:free-limits` | PASS (2) | INCOMPLETE |
| `npm run test:claims -- --grep @claim:installable-pwa` | PASS (2) | PASS |
| `npm run test:claims -- --grep @claim:accessible-layout` | PASS (2) | INCOMPLETE |

## Paths that passed

- Normal: made Recovery Home, added Take bins out, assigned Sam, skipped Sam
  for today, swapped the turn to Jo with a note, completed it, and saw Sam take
  the next turn.
- Invalid and recovery: whitespace household and chore names show announced
  errors and return focus. Reversed away dates show the correct correction.
  A malformed import does not replace current data, though its wording is a
  finding.
- Boundary: the declared free-limit command reaches four people and six chores
  and confirms both next additions are gated.
- Persistence: the resulting real assignment survives reload.
- Offline: a fresh controlled `/demo` context reloads offline with Juniper
  House and the offline notice. Cache `fair-turn-489b7bf9af` is versioned.
- Accessibility: fresh phone and desktop demo pages have zero serious or
  critical Axe violations in dark and light modes. Reduced motion computes to
  instant scrolling, the first Tab reaches the designed skip link, and there
  is no horizontal overflow.
- Routes: `/`, `/demo`, `/privacy`, and `/terms` return 200 with route-specific
  titles, one h1, and one main. `/not-a-real-route` deliberately returns HTTP
  404 and renders “Page not found.” The browser’s expected failed-document
  console entry for that deliberate 404 is not a defect.
- Privacy: the live demo completion/reset flow makes no cross-origin request.
  Source contains no analytics, remote font, or remote script.
- Billing allowance: 35 concurrent invalid checks produce 30 HTTP 200 results,
  then 5 HTTP 429 results. Every 429 has `Retry-After: 4`.
- Checkout: the Fair Turn checkout URL returns the expected hosted-checkout
  redirect. No purchase was attempted.
- Response policy: CSP is delivered as a header with `frame-ancestors 'none'`;
  HSTS, `nosniff`, strict referrer policy, and restrictive permissions policy
  are present. The hero asset is immutable for one year; `sw.js` is no-store.
- Update handling: release tests confirm versioned precache, `SKIP_WAITING`,
  `clients.claim`, update detection, notice, and activation. A real version
  transition is not available from a single live candidate.

## Performance and artifact identity

Lighthouse mobile: performance 100, accessibility 100, best practices 100,
SEO 100. LCP is 1.35 s, CLS is 0, and total blocking time is 82 ms. Lighthouse
does not provide a lab INP value.

| Artifact | Clean build SHA-256 | Live SHA-256 |
| --- | --- | --- |
| `index.html` | `4b7f0eefd2c9d0ef49e8d838e7f97984f69b256676c92e2c9563d610f7a236a2` | same |
| `sw.js` | `00e09aa3b4d850f7818a602046f4da29421cb6d4e9a8ee6201fed58d89c5d37d` | same |
| `manifest.webmanifest` | `f9025577b619b476a74599a808023245ca8fb2bfcbfead52703f3a2cbfc702d7` | same |

Built JavaScript is 67.16 kB raw / 23.85 kB gzip. CSS is 16.98 kB raw /
4.67 kB gzip. The hero WebP is 65,522 bytes. These meet the static budgets.

## Earlier findings and current disposition

| Earlier finding | Current disposition |
| --- | --- |
| Missing claims registry and isolated one-click demo | Fixed; registry, demo, reset, and real-data isolation work. Three claim assertions remain incomplete as a new finding. |
| Billing endpoint lacked 429 and `Retry-After` | Fixed; 30 allowed, then 5 rate-limited with `Retry-After: 4`. |
| Whitespace household name persisted a broken board | Fixed; rejected, announced, focused, and recovery works. |
| Missing CSP | Fixed on live responses. |
| Missing designed HTTP 404 | Fixed; expected 404 response and styled recovery link verified. |
| Static assets lacked immutable caching | Fixed; hero is one-year immutable and worker is no-store. |
| Canonical, Open Graph, and Twitter metadata missing | Fixed in the matching live artifact. |
| Dark-theme due badges and Plus controls lacked contrast | Fixed; dark phone and desktop Axe have zero serious/critical findings. |
| Accessibility claim switched to light before checking dark | Fixed for color coverage; dark is checked before light. Its keyboard coverage is still incomplete. |
| Decorative labels and catalog/billing metadata | Fixed; direct task labels and explicit $12 one-time copy are present. |

## Final decision

**FAIL — 6 findings and 3 untested public claims. Do not declare this candidate
accepted until every finding is repaired and every public claim has a complete
tagged proof.**
