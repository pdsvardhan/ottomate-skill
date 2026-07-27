# C12 scenario 2 — the ~20-component pairing run · unit plan

**Written 2026-07-28.** C12(2) is the cheapest way to find what else is broken after C1: run the
routing/pairing path across *variety* rather than one round's output. For ~20 real components, record
how the system pairs each with what it would show — archetype/tier resolution, which sub-decisions
become contested axes, how `round-composition` groups them by perceptual channel, which render surface
the tier gets. **The output is the comparison table**; a component that "mostly worked" is a finding.

With only 3 registered archetypes, most of the 20 exercise **C1's derive path** (`anatomy-derive` on
real unseen source) — which is the point.

## Corpus

~20 real components from `/mnt/storage/websites/screenroom/components`, chosen to span tiers:
`ui/` primitives (button, badge, avatar, progress, tabs, dialog, hover-card, drawer),
`shared/` (OwnChip, Facets, CountUp), `detail/` composites (WatchCard, FileCard, EpisodeRow,
RatingsRow, PeoplePills, DetailHero), `home/` (CollectionCells, SpotlightHero), `lists/`
(FilmsList, MusicRacks, ListStates), `queue/` (QueueView). Real Next.js + Tailwind source — no CSS
module for most, which itself tests the "no stylesheet → weak signal" path honestly.

## What is run per component (all mechanical, read-only)

1. `collectEvidence(source, css)` — elements, classes, child components, CSS props, landmarks, interactive.
2. `inferTier(ev)` → tier + why.
3. `proposeRecord(ev)` → parts, part_source, chosen questions, likely/possible, confidence.
4. `validateRecord(record, ev)` → ok / problems (fail-closed, rule 40).
5. Map chosen questions → `{id, channel, scope_hint}` via the registry → `composeRounds(...)` →
   rounds grouped by channel, `promote` (foundational axes), matrix regime, warnings.
6. Render surface = the tier's `render_surface` from `design-questions.json`.

## Acceptance

Every component produces **either** a coherent pairing **or** a named refusal. The deliverable is the
table + a findings list of every place the pairing is wrong, weak, or refuses — recorded as defects
(with the component that exposed each), not smoothed over. No prod writes; reads source, runs pure
functions. Findings feed the register's Known-defects table and reorder the remaining C-list.
