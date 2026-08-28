# Fair Turn

Fair Turn is a private, offline-first household chore rotation for adults sharing
a home. It answers whose turn it is, skips people during dated absences, and
records swaps without points, streaks, nagging, or surveillance.

Live: <https://fair-turn.sociobot.in>

## What it does

- Keeps an independent round-robin for every recurring chore.
- Skips an eligible person only when a due date falls inside their away range.
- Records completions, swaps, and automatic absence skips in a local history.
- Shares a read-only current-board snapshot by link or QR code.
- Exports a full JSON backup and a human-readable activity CSV; JSON imports
  work across devices.
- Installs as a PWA and continues working offline after the first visit.
- Supports system light/dark themes, keyboard navigation, reduced motion, and
  a 390 px mobile layout.

The free edition supports four people and six chores. Fair Turn Plus is a $12
one-time license for unlimited people and chores plus an eight-week outlook.
Checkout and license verification use only the Sociobot billing API; there is
no payment-provider code in this repository.

## Privacy

Household names, people, chores, absences, and history live in browser IndexedDB.
Fair Turn has no user account, tracking, analytics, or sync service. A shared
link embeds only the visible board snapshot in its URL fragment. See `/privacy`
and `/terms` in the built app.

## Develop and verify

Requires Node.js 20+ and npm.

```sh
npm ci
npm run dev
```

Run all unit, production-build, desktop/mobile browser, offline, and automated
accessibility checks:

```sh
npm test
```

Build exactly what static hosting deploys:

```sh
npm run build
```

The build output is `dist/`, with `dist/index.html` at its root and static route
entries for `/privacy` and `/terms`. To inspect it locally, run `npm run preview`.

## Project map

- `src/rotation.ts` — deterministic recurrence, eligibility, and absence logic
- `src/storage.ts` — IndexedDB persistence and import validation
- `src/license.ts` — Sociobot license capture, daily verification, and restore
- `src/share.ts` — compact read-only board snapshots
- `public/sw.js` — versioned app-shell and runtime cache
- `.factory/design.md` — visual system and generated-asset provenance
- `.factory/handoff.md` — verification record and release notes

## Deployment

Deploy the contents of `dist/` to the static host. The factory owns DNS,
infrastructure, and product registration; this repository does not configure
them. The production hostname is `fair-turn.sociobot.in`.

## License

MIT. See [LICENSE](./LICENSE).
