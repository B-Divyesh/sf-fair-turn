# Fair Turn visual thesis

## Direction: household dispatch board

Fair Turn uses a **neo-brutalist utility** language inspired by masking tape,
index cards, and the shared noticeboard by a kitchen door. Thick black rules,
offset hard shadows, terse labels, and clipped corners make assignments feel
specific and auditable without feeling managerial. The interface is deliberately
not a dashboard of scores: names, dates, and actions carry the hierarchy.

The light theme resembles warm uncoated paper; the dark theme resembles a
charcoal-painted noticeboard with bright paper slips. Both are first-class and
are selected from the operating-system preference, with an explicit toggle.

## Tokens

- Paper / background: `#F4EEDF`; dark `#171713`
- Card / surface: `#FFFDF6`; dark `#25251F`
- Ink / text: `#171713`; dark `#F7F0DF`
- Muted ink: `#5B594F`; dark `#BDB8AA`
- Signal yellow / primary: `#FFD447` with `#171713` text
- Pool blue / secondary: `#77D4E8` with `#171713` text
- Done green: `#277A48` (pale backing `#D9F2D8`)
- Attention orange: `#A64B16` (pale backing `#FFE0C2`)
- Remove red: `#A52B32` (pale backing `#FFDADD`)
- Rules and focus: current ink; focus uses a 3 px cyan/yellow double treatment

All text/background combinations target WCAG AA at 4.5:1; pale semantic colors
are backings, never the sole state indicator.

## Type and spacing

The display face is the self-hosted/system `Arial Black`, `Arial Narrow Bold`,
and sans-serif fallback: condensed, blunt, and label-like. Body copy uses
`Inter`-shaped system UI (`ui-sans-serif`, system fonts) to avoid a network or
font payload. Numbers use tabular figures. The scale is 14, 16, 20, 26, 36,
and clamp(42–68) px. Spacing follows a 4 px base: 4, 8, 12, 16, 24, 32, 48,
and 64. Reading measures stop at 68 characters.

## Composition and interaction grammar

- A slim masthead and oversized wordmark establish place; the live board is
  the first working surface, never hidden behind marketing.
- Independent assignment slips are bordered cards with 4 px offset shadows.
  Configuration sections are grouped by proximity instead of nested cards.
- Primary actions are yellow with black borders; secondary actions are plain
  paper; destructive actions use red text plus explicit words.
- Pressed controls lose their offset shadow and translate 2 px, like pressing
  a physical label maker key. New/reassigned slips enter from 8 px below over
  180 ms. Toasts arrive from their edge of origin.
- Mobile stacks all columns, keeps actions full-width where helpful, and
  replaces wide tables with definition-list rows. Nothing essential is dropped.

## Motion policy

Motion is short (150–220 ms) and limited to transform/opacity for press,
dialog, toast, and changed-assignment feedback. Nothing loops. Under
`prefers-reduced-motion: reduce`, transitions and smooth scrolling are removed;
state changes remain visible through labels and color-independent text.

## Original asset plan and provenance

The hero/empty-state illustration is a generated editorial still life: three
chunky paper duty tokens moving around a circular track on a kitchen noticeboard,
with a small suitcase-shaped absence marker lifting one token out of sequence.
It explains rotation and absence skipping without depicting or stereotyping
household members.

Prompt sheet: **subject** — three distinct blank chore cards around a circular
rotation track, one temporarily lifted by a tiny suitcase marker; **world** —
hand-built kitchen noticeboard; **materials** — cut paper, black marker lines,
masking tape, plywood grain; **light** — crisp editorial side light; **lens** —
slightly top-down 50 mm still life; **palette words** — warm paper, signal yellow,
pool blue, tomato red, charcoal ink; **negative list** — people, hands, faces,
legible words, letters, numbers, logos, brands, gradients, glossy 3D UI,
watermarks.

Generation prompt (2026-08-28): “Editorial neo-brutalist paper-collage still life
for a household rotation utility. Three blank chunky chore cards circulate around
a bold circular black track on a warm plywood kitchen noticeboard; a small
suitcase-shaped paper marker gently lifts one card out of the sequence while the
other two continue. Cut paper, masking tape, black marker rules, tactile imperfect
edges, crisp side light, slightly top-down 50 mm composition, warm ivory, signal
yellow, pool blue, tomato red, charcoal ink. No people, hands, faces, readable
text, letters, numbers, logos, brands, gradients, glossy UI, watermark.”

Generated with the factory image deployment via `/opt/fleet/lib/gen-image.sh`.
The output is original for this product. Source PNG and prompt sidecar are kept
in `assets/src/`; optimized WebP and JPEG fallback are shipped in `public/assets/`.
The 1200×630 social card is a center crop of that same generated source, with
no added symbols or third-party material. The 180px touch icon is derived from
the original hand-authored Fair Turn icon.

Icons are original inline SVG line drawings using the same squared stroke and
are treated as decorative where adjacent labels already provide the name.
