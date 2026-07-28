# Phase 2 — COMPLETION NOTE (the intelligence layer) · 2026-07-29

Applies §7 (build → verify → record → plan). Phase 2 built the design-intelligence the AI loads on
activation — the dictionaries + the onboarding intake. All data files + a pure loader/query API, unit-tested
with must-pass + must-fail. **generation suite 355/355.**

## Built + verified
- **P2.1 Motion dictionary** — `data/dictionaries/motion-patterns.json` (20 patterns) + `dictionaries.mjs`
  (`recommendMotion`/`motionAffinity`/`reducedMotionSwap`). Each pattern: role productive|expressive, SEMANTIC
  motion tokens only, good-with/avoid, and a REQUIRED reduced-motion swap. **Must-fail:** a pattern missing
  its reduced-motion swap fails validation (rich-by-default is non-negotiable); a raw ms/easing token fails.
  Expressive-first for this owner. (8 tests)
- **P2.2 Chart-by-data dictionary** — `chart-by-data.json` (FT Visual Vocabulary, CC-BY): 9 data-relationships
  → charts ranked by Cleveland–McGill encoding accuracy, with Datawrapper avoid notes.
  `chartsForRelationship`/`bestChart`/`chartAvoids`. **Grounding check:** cointrail's 5-category breakdown →
  `stacked-bar` (length), pie flagged >5-slices — matches the real panel. **Must-fail:** unknown encoding
  channel / missing relationship fail validation. (5 tests)
- **P2.3 Pattern/combination dictionary** — `patterns.json`: `app_archetypes → layout_templates →
  section_patterns → component_refs` (role names → master_components via the catalog; nothing false
  asserted) + **combination_rules** (`{a,b,relation,why}` good/avoid facts). `sectionsFor`/`checkCombinations`
  (occurrence-counted, so nested glass fires only on 2) / `combinationAdvice`. **Two real bugs the tests
  caught + fixed:** 7 undefined sections; a self-pair set-membership check. (5 tests)
- **P2.4 Onboarding intake** — `data/onboarding-intake.json` (5 stages, ~29 questions, enum+default) +
  `intake.mjs`. Real **pre-fill**: repo/ledger/taste/token evidence resolves each default (source-tagged),
  so onboarding is "confirm", not "answer 30 blanks". `askableStages` hides the silent constraints;
  `applicableQuestions` drops unmet conditionals; `questionsForRebuild` re-runs only what changed.
  **Must-fail:** a default outside its enum fails validation. (7 tests)

## Wiring
- The generator loads the dictionaries on activation (method-doc `stage-2-generation.md` input #9): pick
  motion from the motion dict (expressive-first), the chart from the data relationship, and run
  `checkCombinations` over the chosen sections/styles/motions before generating.
- The intake result persists at `design_ledger.intake` per project (same door as the context gate) and
  seeds the round packet's context. Full app-UI surfacing of the intake is a later polish; the data + reader
  exist and are read now.

## NOT done (named)
- **Mobbin MCP** (live section/flow reference, 621k screens) — needs licensing + auth review (owner,
  external). Everything else ships without it.
- The intake's **live repo-reading** at onboarding time (walking a project's actual files/package.json to
  build the `evidence` object) is a thin adapter over `prefillIntake` — the reader + rules exist; the file
  walk is wired when onboarding runs on a real project (Phase 3 / a real onboarding).
- Dictionaries are seeded starters (20 motion / ~40 charts / 15 combination rules) — grow with use.

## Plan Phase 3 (catalog + graduation)
- **P3.1 Directory (Pillar B):** the faceted type×project catalog — Screens→Blocks→Parts rollup, status
  pill + version + provenance badge (Authored/Imported/Project-local, legacy greyed) + view-live. Reuses the
  N2/N3 boards + `master_components` + the `design_decisions` ledger.
- **P3.2 Graduation (Pillar C):** promote a Finalised (locked-round) Block into the shared themed library —
  tokenise it, run the contrast gate + ban-raw-values, record provenance. Reuses `graduate.mjs`.
- **P3.3 (optional early):** a read-only inventory can ship first for visibility.
- Acceptance + must-fail per WS; verify with evidence; then a Phase 3 completion note.
