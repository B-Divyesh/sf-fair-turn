# Fair Turn handoff

## Review result

**FAIL — 6 findings and 3 untested public claims.**

- Implementation reviewed: `fea2210592d4f878ec99e45b1dbd394fbb505945`
- Documentation baseline: `02aa2a8c1970acb42aa2e2493506574324e5986f`
- Live URL: <https://fair-turn.sociobot.in>
- Full report: `.factory/review-1.md`

No product code, deployment, infrastructure, billing configuration, or data
was changed. This handoff records review evidence only.

## Required work

1. Put the job, audience, and “Try it with sample data” action in the first
   393×851 viewport. The current phone layout places all three below the art.
2. Complete the registered export, paid-limit/outlook, and keyboard claim
   proofs. Include a valid JSON round trip, full field comparisons, a fixture
   unlock that exceeds both free limits and shows the outlook, and real
   keyboard navigation through app sections.
3. Preserve or deliberately move focus after app-section changes and announce
   the new h1.
4. Add the required landing sections, header navigation, Param Factory credit,
   and build/version label.
5. Give the footer Privacy and Terms links at least 44×44 px targets.
6. Replace raw malformed-JSON parser text with a plain recovery instruction.

## Verification completed

From a detached clean worktree:

```sh
npm ci
npm test
npm run build
npm run test:claims -- --grep @claim:demo-sandbox
npm run test:claims -- --grep @claim:rotation-away
npm run test:claims -- --grep @claim:exports
npm run test:claims -- --grep @claim:share-snapshot
npm run test:claims -- --grep @claim:privacy-local-only
npm run test:claims -- --grep @claim:offline-reload
npm run test:claims -- --grep @claim:free-limits
npm run test:claims -- --grep @claim:installable-pwa
npm run test:claims -- --grep @claim:accessible-layout
```

The full suite passes 12 unit and 26 browser tests. Each claim command exits
successfully in both configured projects, but three assertions are incomplete
as described in the report.

Fresh live desktop and phone checks covered first read, one-click demo,
populated output, persistent sample label, reset, real-data isolation, normal
rotation, invalid inputs, boundary gates, recovery, persistence, keyboard,
focus, both themes, reduced motion, touch targets, Axe, offline reload,
requests, legal routes, links, expected 404, headers, cache policy, service
worker, billing allowance, and checkout redirect.

Lighthouse mobile scores are 100 performance, 100 accessibility, 100 best
practices, and 100 SEO. LCP is 1.35 s, CLS is 0, and total blocking time is
82 ms. Built JS is 67.16 kB raw / 23.85 kB gzip; CSS is 16.98 kB raw / 4.67
kB gzip; the hero WebP is 65,522 bytes.

## Evidence

- `/work/.evidence/qa-report.md`
- `/work/.evidence/qa-result.json`
- `/work/.evidence/fair-turn-review-1-live.json`
- `/work/.evidence/fair-turn-review-1-phone-first.png`
- `/work/.evidence/fair-turn-review-1-desktop-first.png`
- `/work/.evidence/fair-turn-review-1-phone-demo.png`
- `/work/.evidence/fair-turn-review-1-lighthouse.json`
- `/work/.evidence/fair-turn-review-1-root/`
- `/work/.evidence/fair-turn-review-1-demo/`

## Earlier findings

Earlier demo, billing throttling, whitespace validation, CSP, 404, caching,
metadata, and dark-contrast findings are fixed and were rechecked. The prior
PASS did not detect the phone first-screen layout, focus loss, touch-target,
landing-structure, parser-wording, or claim-coverage gaps recorded here.

## Known product boundaries

The board is intentionally device-local. Clearing site data removes it unless
the household exported a backup. Shared links are read-only point-in-time
snapshots. Fair Turn Plus depends on the registered Sociobot billing product.
