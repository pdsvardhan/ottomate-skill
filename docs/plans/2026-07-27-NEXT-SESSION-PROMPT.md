# NEXT SESSION — start here. Owner decisions captured 2026-07-27 (end of session).

Paste the block below as the opening prompt. Everything in it is a decision the owner has already
made; do not re-litigate any of it.

---

```
Continue the Ottomate skill work. P1-P4 are DONE (79 of 79 round-scope rules enforced, 0 pending).

READ THESE FOUR FIRST, IN THIS ORDER:
1. ~/.claude/plugins/ottomate/docs/plans/2026-07-27-SESSION-HANDOFF.md
2. ~/.claude/plugins/ottomate/SKILL-REGISTER.md
3. ~/.claude/plugins/ottomate/docs/audits/2026-07-27-spec-clause-audit.md   <- 148 clauses, the work list
4. ~/.claude/plugins/ottomate/docs/plans/2026-07-27-NEXT-SESSION-PROMPT.md  <- this file, for the owner's rulings

THIS SESSION HAS TWO MODES. Do not mix them up.
  BUILD  -> the pre-Stage-4 fixes A1-A7 below. Actually implement these.
  PLAN   -> Stage 4, and the Task-1/Task-3 remainder. WRITE PLAN DOCS ONLY. Do NOT build these.

=== BUILD: pre-Stage-4 fixes (do all seven) ===

A1  Task 1 acceptance criterion 5C. The spec names `command-routing.md` and `output-style.md` by
    name; neither was ever touched, so a `*-comments-*.zip` drop routes nowhere.
    ** FIRST INVESTIGATE, DO NOT ASSUME (owner ruling): ** look at how visual-QA rounds have
    ACTUALLY been run in recent sessions (transcripts, docs/rounds, the DOM-commenter export shape),
    then RECOMMEND either (a) build the routing as specced, or (b) amend the spec to match the real
    workflow. Put the recommendation to the owner before implementing either.
A2  `stage-4-visual-qa.md` still lists `data-oid` stamping under "Status - all shipped". The claim
    was WITHDRAWN 2026-07-27 (grep -rc data-oid on Screenroom returns 0). Fix the doc.
A3  `stage-2-design-method.md` BUILD STATUS says "61 of 91 rules pending". Measured today:
    79 enforced, 0 round-scope pending. Fix it.
A4  Resolve Task 1's 14 UNKNOWN clauses by running `visual-qa-import.feature-verify.spec.ts` on
    VAULT7A. They are unknowable from Windows because the app lives on the server. Cheapest
    information gain in the program.
A5  `scripts/feature-verify/` has ZERO unit tests, including the fail-closed `Matrix.verdict()` that
    the whole Task-3 gate rests on. Add them, must-fail AND must-pass.
A6  The three specs (`~/Desktop/Skills CC/Ottomate/TASK*-SPEC.md`) live outside version control.
    Bring them under git.
A7  ** THE URGENT ONE - it bit in production today. ** The anatomy covers only 3 archetypes
    (media-card, button, data-table-row). The owner's real locked decision on
    `screenroom.library-lists` was SILENTLY SKIPPED by the emitter: "question not in the registry".
    `anatomy-derive.mjs` exists (13/13) but has never been exercised on an unseen component in a
    live round. Make an unregistered target work end to end, or fail loudly - never skip silently.

=== PLAN ONLY (write docs, build nothing) ===

Stage 4 - graduation. H1 is the spec. Plan S1-S10:
  S1  LIVE-STATE CHECK FIRST: what columns does `master_components` actually have, and do the 179
      rows carry provenance? Most were AUTHORED (library='ottomate'), so the gap may be far narrower
      than H1 implies. DO NOT plan a migration before knowing this.
  S2  Hand-written migration + hand-added journal entry (spdx, author, attribution, licence_url,
      source_url, retrieved_at, trademark, grade). NEVER drizzle-kit.
  S3  Provenance captured at ingest or lost forever; no provenance -> quarantine.
  S4  GREEN/AMBER/RED licence tiers; -NC/-ND/unknown rejected. Encode exclusions: Shadertoy
      (CC BY-NC-SA, non-commercial AND viral), unDraw (forbids repackaging + AI-training), Rive (WASM).
  S5  Strip framework coupling; tokenise on ingest (a baked-in #fff is a downgrade, not an entry).
  S6  A-F grading runner; only A/B ship.
  S7  Dedupe structurally AND visually. NOTE: P2's pixel comparison (scripts/design-check/pixel/) is
      already the visual-dedupe instrument. Unplanned synergy - use it.
  S8  NOTICES ledger assembled into output.
  S9  `graduate.mjs` currently never writes (draft hook, 6/6). Plan making it write.
  S10 Wire into `stage-4-mini-pipeline.md`.

Also PLAN (not build): the Task-1 remainder and the Task-3 remainder from the audit
(Task 3: 14 NOT BUILT + 17 PARTIAL, no browser-driving spec, no case generator, no red case ever
produced).

=== OWNER RULINGS - settled, do not re-litigate ===

* DO NOT run the real emit yet. The dry-run is green (5 namespaced tokens from 6 locked rows, 1
  correctly skipped). The owner wants to LOCK MORE AXES FIRST so the first real commit carries a
  fuller token set. Re-run the dry-run and show the diff when they say go.
* The live Screenroom rounds were NOT republished after P3 fixed their prefers-reduced-motion gap.
  Waiting on the owner's word.
* Ask the owner as many questions as needed, using the AskUserQuestion tool. They said so explicitly.

=== THE TASK-2 END-TO-END TEST the owner wants (plan it, don't run it yet) ===

Scenarios, all of them:
  1. A single component, start to finish.
  2. ** ~20 DIFFERENT COMPONENTS ** - the owner's own ask: run many components through and observe
     HOW THE SYSTEM PAIRS EACH COMPONENT WITH WHAT IT SHOWS. i.e. which archetype/tier it resolves
     to, which sub-decisions become the contested axes, how round-composition groups them by
     perceptual channel, and which render surface each tier gets. This is a test of the ROUTING and
     PAIRING logic across variety, not of one round's output.
  3. New component on an existing project.
  4. Unseen archetype, forcing anatomy-derive (this is A7).
  5. Redesign of already-built UI, where prior-art must reconcile "already decided" vs "already built".
  6. Cold start: a brand-new project, Stage 0 -> Stage 3, no spec, no ledger, no components.

=== DISCIPLINE (unchanged) ===
Verify live state before changing it; demonstrate, don't assert (run it, show output). Every rule
flipped to `enforced` names a test with BOTH a must-fail and a must-pass case. NEVER lower a
threshold to make something pass - log the defect. Plan doc before each unit. The plugin has NO
package.json by design. Update SKILL-REGISTER.md in the same commit as the change it describes.
ONE DOOR (all DB access via the API) - POST /api/backup before any DB change - never drizzle-kit -
typecheck before any container rebuild - git status AFTER committing - commit + push every surface
you touch. Do NOT bulk-read docs/research/.

GOTCHA worth knowing up front: on this Node, `node --test <dir>` fails - use a glob
("design-check/*.test.mjs"). isolation-gate has its OWN runner: node preview-build/isolation-gate.test.mjs.
The browser test needs Playwright and only runs on VAULT7A; symlink node_modules there because ESM
resolves bare specifiers from the FILE's own location.
```

---

## Why the emit is held

Dry-run against `/mnt/storage/websites/screenroom` on 2026-07-27, nothing written:

```
locked rows fed to the emitter: 6
tokens: 5   structural: 0   skipped: 1
  --poster-card-selected-treatment  fill
  --poster-card-hover-transition    none-edge-tint
  --poster-card-badge-radius        corner-ribbon
  --poster-card-actions-reveal      hover-reveal
  --poster-card-accent              ownership-chip-only
  SKIPPED library-list.surface-strategy — question not in the registry
would write design/ottomate/ottomate-tokens.css
```

The skip is **A7 showing up in production**: a real owner lock was dropped because `library-list` has
no anatomy entry. The emitter was right to refuse to invent a token name — but silently skipping an
owner's locked decision is the wrong failure mode, and fixing that is the urgent item.
