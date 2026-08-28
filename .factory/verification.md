# Independent verification — FAIL

**Candidate:** `94dba0348602d4069df8f36a61c4ef85a7d745c5` (`main`)  
**Live URL:** https://fair-turn.sociobot.in  
**Verified:** 2026-08-28 UTC  
**Result:** **FAIL — do not release**

## Required first checks

### Claims and demo — BLOCKER

- `.factory/claims.json` is absent. Therefore there were no registered claim
  tests to run from the required demo entry point. The work order states that a
  missing claims registry is release-blocking.
- `.factory/demo.md` is absent.
- A fresh live browser context showed no `Try it with sample data` action, no
  persistent `Demo — sample data, nothing is saved` banner, and no reset/start
  for-real controls. `https://fair-turn.sociobot.in/?demo=1` renders the same
  empty real-data onboarding, not an isolated sample board.
- The cold first screen says it is a shared-home utility that rotates chores,
  but the offered first action is the setup form/button `Make our board`, not
  the required one-click sample trial. This alone fails the stated first-read
  acceptance test.
- README and page copy make observable offline, export, privacy, PWA, and
  sharing claims, but none are registered or sandbox-tested because the
  required registry is missing.

## Release-blocking defects

1. **BLOCKER — no claims registry or claim tests.** No
   `.factory/claims.json` exists, so required observable claims cannot be
   verified through a clean demo sandbox.
2. **BLOCKER — no one-click isolated sample demo.** There is no sample action,
   demo namespace, demo URL behavior, banner, or `.factory/demo.md`.
3. **HIGH — billing verification endpoint did not rate limit.** One request to
   `GET https://api.sociobot.in/api/v1/products/fair-turn/verify?license=qa-verification-token`
   returned `200 {"valid":false,"reason":"invalid"}`. A rapid 30-request
   concurrent check returned **30/30 HTTP 200**, no `429`, and no
   `Retry-After`; no threshold was observed. The work order explicitly
   requires this protection for server-side product-unlock calls.

## Other defects

1. **MEDIUM — whitespace-only household names create an unusable persisted
   state.** Submitting household name `"   "` with `Sam, Alex` produces the
   success toast `Your board is ready`, writes a household with an empty name
   and two people to IndexedDB, then renders onboarding again because the app
   gates the board on a truthy household name. The user has no board to use and
   the next submit replaces that stored state.
2. **MEDIUM — live responses lack Content-Security-Policy.** `/`, `/privacy`,
   `/terms`, `/manifest.webmanifest`, and the image asset all returned no CSP.
   This misses the repository's required response-policy baseline.
3. **MEDIUM — no real 404 response/page.**
   `https://fair-turn.sociobot.in/not-a-real-route` returns HTTP 200 and the
   normal onboarding shell rather than a designed 404 route.
4. **LOW — cache policy is not immutable for static assets.** Live root,
   manifest, robots, sitemap, and hero image all returned
   `Cache-Control: public, must-revalidate, max-age=30`; no immutable
   long-lived static-asset policy was observed.
5. **LOW — required site metadata is incomplete.** `index.html` has title,
   description, manifest, and icons, but no canonical link, Open Graph tags,
   or Twitter card tags.

## Checks that passed

| Area | Evidence |
| --- | --- |
| Clean install | `npm ci` completed: 91 packages, 0 vulnerabilities reported. |
| Test suite | `npm test` passed: 6 Vitest tests and 4 Playwright desktop/mobile tests. |
| Exact production build | `npm run build` passed and created `dist/`. |
| Main job flow | Fresh local production preview: created `QA Flat` with Sam/Alex/Jo; added Kitchen bins; completion, dated absence skip, explicit swap/note, history, JSON export, CSV export, reload persistence, invalid-import recovery, and invalid absence-date recovery all worked. |
| Boundary recovery | Reversed away dates displayed `The end date must be on or after the start date.`; invalid JSON import displayed `That file is not a supported Fair Turn export.` |
| Offline PWA | After SW control, offline reload retained assignee Avery and displayed the offline banner. One registration and versioned `fair-turn-177d739dd8` cache were observed. |
| Desktop/mobile | Local production preview at 390×844 had `scrollWidth === clientWidth === 390`; no console/page errors. |
| Keyboard/focus | First Tab focused Skip to main content. Live computed focus ring was 3px cyan with 3px offset. Dialog focus entered its first field and Escape returned focus to its opener. |
| Accessibility | Live mobile Axe run: 0 serious/critical findings (0 total); one `h1`, one `main`, `lang=en`, title, and meaningful hero alt were present. Reduced-motion media was enabled during the live smoke check. |
| Privacy/network | Normal local flow made no external requests. Source review found only the explicit Sociobot checkout/verify endpoint; no analytics, tracking, third-party font, or third-party script was found. |
| Deployment identity | Fresh build and live deployment matched byte-for-byte: `index.html` SHA-256 `7e3beca43454c2f5734cd96ea5146b6f5d9723b7a254dd705dcfda8eaaab962d`; `sw.js` SHA-256 `e090a5a16b60bf43042e7a2ed11a23f39e37464bdf503b036cbc2b68809f98d4`; manifest also matched. |
| Payload | Built JS 62.40 KB raw / 22.55 KB gzip; CSS 15.82 KB raw / 4.45 KB gzip; hero WebP 65,522 bytes. These are within the specified static budgets. |

## Response-policy observations

- Live root used Brotli (`content-encoding: br`) and has HSTS,
  `Referrer-Policy: strict-origin-when-cross-origin`, and
  `X-Content-Type-Options: nosniff`.
- No CSP header was returned. All checked static URLs used the 30-second cache
  policy above.
- The service worker contains versioned precache, `skipWaiting`, and
  `clients.claim`; ordinary offline reload was independently exercised. A
  production version transition could not be observed because the host served
  only this single candidate version.

## Evidence retained during verification

- `/tmp/fair-turn-qa.json` — cold-read, normal flow, invalid input, mobile,
  network, and Axe results.
- `/tmp/fair-turn-pwa-qa.json` — controlled-service-worker offline reload.
- `/tmp/fair-turn-live-a11y.json` — live Axe, focus, title/landmarks/alt, and
  console results.
- `/tmp/fair-turn-live-cold.png`, `/tmp/fair-turn-local-populated.png`, and
  `/tmp/fair-turn-local-mobile.png` — browser captures.

## Required remediation before re-verification

Add and pass every `.factory/claims.json` command through an isolated
`/demo` or `?demo=1` sample namespace; add the first-screen one-click sample
action/banner/reset/start-for-real flow and `.factory/demo.md`; configure and
verify endpoint rate limiting with 429 + Retry-After; then address the form,
CSP, 404, cache, and metadata findings above.
