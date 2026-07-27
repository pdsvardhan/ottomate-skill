# C12 scenario 2 — the 20-component pairing run · findings

**Run 2026-07-28** against 23 real components from `/mnt/storage/websites/screenroom/components`,
spanning `ui/ shared/ detail/ home/ lists/ queue/`. Harness: `collectEvidence → inferTier →
proposeRecord → validateRecord → composeRounds`, read-only. This is scenario 2 of C12 — the routing
and pairing test across *variety*, whose whole purpose is to find what breaks. It found plenty.

## The table (summary)

| metric | result |
|---|---|
| components | 23 |
| tier distribution | composite **16** · primitive **7** · surface **0** |
| validate ok | **17 / 23** (6 hard failures) |
| has a stylesheet | **0 / 23** (every component is Tailwind) |
| composition regime | expect-panel-level **13** · per-item-viable **10** |
| "density alone > bound" over-wide warnings | **13 / 23** |

## Six defects, each demonstrated on named components

**D-C12-1 — the derive path is blind to `cn()` / `cva()` class composition.** button, badge, avatar,
tabs, hover-card, CountUp collected **zero parts** and failed validation outright. `collectEvidence`'s
className matcher reads only string and template-literal attributes; shadcn's
`className={cn(buttonVariants({…}))}` (button.tsx:54) and the class strings inside `cva(…)` are call
expressions it never sees. **Any shadcn/cva project defeats the derive path** — and shadcn is the
catalog's own idiom.

**D-C12-2 — the derive path is blind to namespaced JSX children `<X.Y>`.** avatar (`<AvatarPrimitive.Root>`)
and dialog (`<DialogPrimitive.Content>`) name their children the Radix/shadcn way; the `childComponents`
regex requires whitespace/`/`/`>` right after the capitalised name, so `.Root` is missed. Tier
inference under-counts orchestration and mis-tiers as a result.

**D-C12-3 — a single imported passthrough inflates the tier.** button and badge classify **composite**
purely because they render `<Slot>` (a Radix passthrough), not because they orchestrate anything — and
a composite is then handed the full 10-question composite set. Tier-by-import is too blunt.

**D-C12-4 — no-stylesheet (Tailwind) projects always derive at `low` confidence with polluted parts.**
0/23 had a stylesheet, so the "class names the stylesheet actually styles" filter never fires. The raw-
class fallback mixes real semantic classes (`chip`, `cardbase`, `dhero`) with Tailwind utilities
(`bg-primary`, `absolute`, `top-4`, `mt-4`, `h-2`, `rounded-full`) — a round cannot "vary the `absolute`
part." Confidence is `low` for **every** component on this stack, by construction.

**D-C12-5 — tier inference under-detects `surface`.** Zero of 23 classified surface, though DetailHero,
SpotlightHero, FilmsList and QueueView are page-level. `inferTier` keys on landmark tags/roles, and
landmark-poor `<div>` JSX never trips it, so whole pages read as composites.

**D-C12-6 — weak derivation and the composition bound fight each other.** When fewer than 3 questions
are evidenced, `proposeRecord` chooses **all** tier questions; for a composite that is 6 density-channel
axes, which `composeRounds` then flags as an over-wide round every single time (13/23). The honest "I'm
not sure, here is everything" is exactly what the composition rule is built to reject — so the two
mechanisms disagree on real input rather than composing.

## Reading

The common root is that `anatomy-derive` (U2) was only ever exercised on a hand-authored fixture (a
literal-className card + a CSS string) and on Screenroom's one `PosterCard.tsx`. **None of shadcn's
`cn`/`cva`, Radix's `<X.Y>`, or a stylesheet-free Tailwind project was in its test corpus** — and
those three are the actual shape of the catalog and of every real target. The derive path is the
load-bearing half of "a round can open on a component with no hand-written entry"; on this stack it is
currently unreliable. **None of this blocks the 15 emitted decisions** (they resolved structurally,
never needing derive), so it is a capability defect, not a live regression.

## Recommendation

Treat these as one unit — **U2b: harden `anatomy-derive` against real shadcn/Tailwind/Radix source**
(read `cn`/`cva` string arguments; match `<X.Y>` children; a Tailwind-utility stop-list so utilities
are never parts; landmark-independent surface signals; and reconcile the weak-evidence → all-questions
fallback with the composition bound).

## U2b — done 2026-07-28. Before → after on the same 23 components

Re-ran the identical harness against the hardened module (plan: `docs/plans/2026-07-28-U2b-derive-hardening.md`).

| metric | before | after |
|---|---|---|
| validate ok | 17 / 23 | **23 / 23** — the six hard failures are gone |
| findings | 45 | **9** |
| over-wide (`expect-panel-level`) | 13 | **9** |
| button / badge tier | composite (via `<Slot>`) | **primitive** (D3) |
| parts | raw classes incl. Tailwind utilities | **semantic** where present (WatchCard 10, Facets 9, OwnChip 7) |

- **D1/D2/D3/D4/D6 fixed and demonstrated** — shadcn `cn`/`cva` classes are collected, Radix `<X.Y>`
  children are seen (avatar/progress/tabs/hover-card now read composite), a lone `<Slot>` no longer
  inflates the tier, Tailwind utilities are excluded from parts, and weak evidence chooses only the
  evidenced questions (over-wide down from 13 to 9).
- **The residual 9 are honest, not bugs.** They are composites with **zero** exactly-evidenced
  questions (PeoplePills, CollectionCells, avatar, …) whose full question set is legitimately too wide
  for one round — the composition rule's "narrow before running" signal, working as intended — plus
  the truly utility-only primitives (button/badge, which are *registered* archetypes anyway, so derive
  is never used for them in practice).
- **D5 is correct but did not fire here:** the page-level components (FilmsList, QueueView, DetailHero)
  do not carry `min-h-screen` themselves — that lives in the route shell — so they still read composite.
  The fix generalises correctly; this corpus just does not exercise it. Left as a known, honest gap.
