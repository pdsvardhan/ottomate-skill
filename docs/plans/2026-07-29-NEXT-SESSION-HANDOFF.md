# NEXT SESSION — start here (Ottomate design-system rebuild)

## ✅ STATUS 2026-07-29 (later): PHASE 0 IS BUILT + VERIFIED — next is PHASE 1
Phase 0 is complete. Read the record + forward plan first, then start Phase 1:
- **Completion note (evidence):** `docs/plans/2026-07-29-phase-0-completion.md` — WS0.1 reachable URL
  (client-side 200 vs dead 127.0.0.1), WS0.2 semantic-token seam + **per-theme contrast gate** (PASS
  cointrail / BLOCK broken theme) + **ban-raw-values lint** (PASS clean / BLOCK injected hex) + a Block
  refactored to token-only and rendered light+dark, WS0.3 taste parsed + injected + anti-slop flip (with a
  control). Suites: theming 23/23 · generation 306/306. New code: `skills/ottomate/scripts/theming/**` +
  `scripts/generation/taste-packet.mjs` + edits to `publish-round.mjs` / `method-routing.mjs`.
- **Phase 1 plan (do this next):** `docs/plans/2026-07-29-phase-1-plan.md` — WS1.0 wire the gates into the
  enforced pipeline (retire colourBudget/F-8) → WS1.1 Ladle live iframe-grid → WS1.2 legibility banner →
  WS1.3 decompose-and-ask + always-ask → WS1.4 the real cointrail re-run. Each with acceptance criteria.
- **Parked cointrail TEST round is STILL LIVE** (code word "skill test done" not yet given) — decisions
  67–72 locked, `design_ledger.context` P1, preview r1, temp dir. Roll back only on the code word, then
  write `docs/audits/2026-07-29-design-method-test-findings.md`. Natural moment to offer this is WS1.4.

---

## ► The original Phase-0 prompt (historical — Phase 0 now done)
> Continue the **Ottomate design-system rebuild**. Read, in order:
> `docs/plans/2026-07-29-ottomate-design-system-rebuild.md` (the SPEC — nomenclature, the 6 pillars, locked
> decisions, the governing phase rule §7, and the Phase 0 detailed plan §8) and
> `skills/ottomate/references/taste-profile.md` (the owner's taste — **bold, 3D, motion-first, effect-rich,
> playful**; the anti-slop rules are **advisory** for this owner, their words win). Also skim
> `docs/test-runs/2026-07-28-cointrail-run1.md` (findings F-1…F-17 — the problems this rebuild solves).
> Then **BUILD Phase 0** per §8, obeying the governing rule §7: **build → verify with real evidence (run it,
> show the output, include a must-fail case, render light + dark) → record what is/ isn't done → end by
> planning Phase 1**. **First**, handle the parked cointrail TEST round (below). Honor **ONE DOOR** (all DB
> via the API), **backup-first** before any DB write, and **never touch Track B** (`scripts/feature-verify/**`,
> `/tmp/fv`, `feature_verification_reports`). Do not re-litigate the locked decisions (below).

---

## Context (one paragraph)
A design-method TEST on cointrail exposed the current Stage-2 method as misaligned with the owner's needs:
it produced flat, static, unreachable, illegible output and never decomposed the component or asked what to
change. The owner wants a proper **design-system + design-intelligence layer** for Ottomate. This session
planned it (spec below), captured the owner's taste, and set the build sequence. Next up: build it, Phase 0
first.

## What EXISTS now (read these)
1. **SPEC** — `docs/plans/2026-07-29-ottomate-design-system-rebuild.md`: nomenclature (Styles/Parts/Blocks/
   Layouts/Screens/Behaviors/Patterns), the 6 pillars, locked decisions, §7 governing phase rule, §8 Phase 0.
   Grounded in 2 web-research passes (cited).
2. **Taste profile** — `skills/ottomate/references/taste-profile.md`: owner's A-graded curation → bold/3D/
   motion/effect-rich; anti-slop → advisory for this owner; default posture = expressive motion + depth +
   delight, within each project's theme.
3. **Test findings** — `docs/test-runs/2026-07-28-cointrail-run1.md`: F-1…F-17 + the full **mutation log**
   (the reverse-rollback plan for the parked test round).

## Phase 0 task (build) — from spec §8
- **WS0.1 Reachability:** publish surfaces the reachable `ottomate.vault7a.xyz` URL (not `127.0.0.1`); scope
  a project "design-mode" route for Phase 1's live preview.
- **WS0.2 Semantic-token theming + per-theme contrast gate** (the core): 3-tier tokens (primitive→**semantic
  (only layer components read)**→component); author cointrail's tokens as the pilot DTCG theme; refactor one
  Block to read only semantic tokens; a **ban-raw-values lint** (normalize skill); a **per-theme contrast
  gate** (fail-closed publish gate — REPLACES the broken colour-budget check F-8). Verify with pass + must-fail
  + both schemes.
- **WS0.3 Taste wired:** generator reads the taste profile; anti-slop → advisory. Verify the output reflects it.
- **Exit:** verify all three with evidence → record → **plan Phase 1** (Ladle live-preview engine + legibility
  banner + decompose-and-ask + always-ask scope, with acceptance criteria).

## ⚠ Parked cointrail TEST round — HANDLE FIRST
Still LIVE, not rolled back (owner never said the code word). In cointrail:
- **decisions 67–72** (locked) on target `cointrail.spending-analysis`;
- a **preview** on the volume (`…/previews/design-rounds/cointrail/cointrail.spending-analysis/r1/`);
- a **design_ledger.context** write (prior value was `null`);
- a **server temp dir** `/home/pdsv/cointrail-designtest/` incl. a TEST-ONLY registry patch (real plugin data
  untouched).
Full list + exact reverse-rollback commands are in the test manifest's **Mutation log** (rows 0–8).
**Rollback is owner-gated on the code word "skill test done".** If the owner says it: roll back in reverse per
the manifest, VERIFY cointrail returns to baseline (design-decisions **count=0, maxId=0**, `design_ledger`
null, preview 404, temp dir gone), show the check, then write
`docs/audits/2026-07-29-design-method-test-findings.md`. If NOT yet: the test rows coexist harmlessly with
Phase 0 (different target), but a clean cointrail is nicer for the pilot theme — offer to roll back first.

## Locked decisions (do NOT re-litigate)
- Shared library = **one component, auto-themed per project via tokens** (no forks).
- Directory click = **Ottomate detail page + "view live"**; **Finalised = a locked design round**.
- Nomenclature = **Styles · Parts · Blocks · Layouts · Screens · Behaviors · Patterns**.
- Build sequence **approved** (Phase 0 → live loop → intelligence → catalog).
- Taste: **anti-slop is advisory** for this owner; **per-theme contrast gate** replaces the colour-budget check.
- Live preview lives in the **project's own app** (real components); Ottomate is the hub.

## Constraints (always)
ONE DOOR (adr-018) · backup-first before any DB write · Track B untouched · **verify-with-evidence, no claimed
greens** (spec §7) · taste-first · previews reachable.
