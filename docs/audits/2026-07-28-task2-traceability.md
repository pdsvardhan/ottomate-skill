# Task 2 — requirements-traceability audit: envisioned vs materialised

**Date:** 2026-07-28 · **Track A** · **Scope: Task 2 only** (owner ruling this session — Task-1/Task-3
passes deliberately out).
**Source of truth:** `docs/specs/TASK2-UI-DESIGN-SPEC.md` (the canonical plugin copy, **incl. the §11b
CSS-interactive amendment** — the earlier 2026-07-27 clause audit scored the superseded Desktop copy,
which lacked §11b; this audit supersedes it in freshness and spec-fidelity).
**Method:** each spec clause given one state and a firsthand evidence anchor. Where the anchor is a test
run, it is `docs/audits/2026-07-28-task2-final-test-run.md` (the same-day cross-parameter pass); where it
is code, a file path. **A register claim is not evidence** — every "materialised" below was run or read
this session, not taken from `SKILL-REGISTER.md`.

**States:** ✅ **materialised** (built + demonstrated) · 🟡 **materialised-with-gap** (works, named
shortfall) · 🟠 **partial** (some of the clause) · ⛔ **not materialised** · ➖ **deferred by design**.

---

## A. Acceptance criteria (§12) — the formal bar

| # | Criterion | State | Envisioned → materialised, and the gap |
|---|---|---|---|
| 1 | Context gate captured before any visual | ✅ | `contextGate` blocks a cold start (all 4 keys), passes once answered, is **not** re-asked (fires once) — scenario 6. Blocks at **every** profile since N1. `ui-mode:none` skips (deferring UI is the default). **Gap: none functionally** — the one nuance is the live screenroom project stores its context in `ui_master_plan.design_ledger.context`, and a project that never captured it would be blocked from any round, which is the intent. |
| 2 | Worklist decomposed; owner picks order/granularity | 🟡 | `buildWorklist` + the `driver`/`order` fields exist and the live ledger carries a real worklist (poster-card → ownership-indicator → …). **Gap: order/granularity is data the owner supplies, not a gated step** — nothing enforces that the owner actually chose; it is honoured if present. |
| 3 | 2–4 real interactive variants; pick/mix; **same URL**; locked carry forward | ✅ | Rounds render 3 variants in the app at a stable `/api/previews/…` URL (in-app design surface, republished in place). Pick/mix → `picks-to-ledger` (`mixed_from`); locked axes omitted from later rounds (`buildRoundInput`, demonstrated round 2). "Interactive" = **CSS-interactive** per §11b (DSD panels; JS inert) — honoured and disclosed. |
| 4 | Self-contained, `data:` URIs, CSP-safe, real content, interactive, **light/dark**, primary-screen-tuned | 🟡 | Self-contained/CSP-safe ✅ (preview pipeline, placeholder guard fires). Real content ✅ (`fillCardSlots`, real posters). Primary-screen ✅ (renders at the measured 2194×1234). **Gap (D-4): light/dark is asserted (`assertBothSchemes`) but the only real round output is single-world dark** — the light≠dark path is exercised by unit test, never by a real round. AC4 permits single-world, so this is a coverage gap, not a violation. |
| 5 | Ledger records every lock + rationale; survives session + reloads on resume | ✅ | `design_decisions` (36 live rows), uncapped rationale (2160-char round-trip), `resumeSummary` reload-on-resume, lock-earned/unlock-reason **422s demonstrated live** this run. |
| 6 | Output = agreed design spec (tokens + per-component specs + preview URL) → Stage 3 | 🟡 | `emit-design-artifacts` resolves locked decisions to token/structural/unresolved and writes `design/ottomate/{tokens.css,spec.json}` on the project branch, never pushing. **Demonstrated GREEN on the 15 live locked decisions → 15 structural entries, 0 unresolved.** **Gap: on this project 0 tokens are emitted** — every locked decision is page-scope/enum, so the "tokens" half of the output is proven only on a throwaway (C1's earlier token run), not on real locked data. The spec is real; a token file with content awaits a project that locks token-shaped axes. |
| 7 | Anti-slop + ask-on-primary enforced | ✅ | `primaryDecisionGate` blocks recording a foundational/promoted axis with no owner choice; `adv-no-slop-tells` fires on our own templates. Both mechanical (C6/C8). |
| 8 | Core mechanic locked **before** whole-page work; each set isolates one decision (open axis) | ✅ | `coreMechanicGate` blocks page/site scope without a locked rung-1 (demonstrated: cold page blocks, page with the 8 real locked mechanics passes — C5). Isolation gate enforces axis-diff/control-diff (one open axis) — GATE PASS 8/8 on r1. |
| 9 | Colour-budget stated + honoured — accent on ≤ few surfaces, neutral elsewhere, not monochrome | 🟡 | **Stated** half ✅ (`validateColourBudget` makes the budget mandatory before build). **Honoured** half is where the gap lives (**D-2/D-3**): the computed `colourBudget` check that enforces "honoured" **over-counts** (keys accents by rgba string, so one hue at N opacities = N accents; a dark neutral miscounted), producing a **false BLOCK** on r1; and the pixel accent-share found r1 ~10× *under* budget by area. So "honoured" is enforced by two checks that disagree, one of which over-counts. |
| 10 | One command (fetch→extract→inject→publish-same-URL); ledger stores **full** decisions (no cap) | 🟡 | `design-round.mjs` is the one command (build→gate→check→computed→publish, fail-closed at the seam), and the ledger is uncapped ✅. **Gap (D-5):** the committed r1 manifest lacks T5 labels, so the one command refuses it at the publish step (correct fail-closed, but the shipped manifest is not directly one-command-publishable); and the "fetch→extract" front of the pipeline (`asset-fetch`, `theme-extract`) is not wired *into* `design-round` — it is a separate stage. So "one command" covers build→publish, not the full fetch→publish arc the clause names. |

**Acceptance summary: 4 fully materialised (1,3,5,7,8 → actually 5), 5 materialised-with-gap
(2,4,6,9,10).** No criterion is un-materialised. Every gap is a named shortfall on a working mechanism,
not a missing capability — which is the honest shape of "built, with edges".

---

## B. Decisions locked (§2, D1–D6)

| D | State | Note |
|---|---|---|
| D1 Home = Stage 2 + Stage 4.4.6 | ✅ | Method lives in `stage-2-*` + wired at stage-4 §4.4.6 taste gate. |
| D2 Real interactive variants, mixing is the point | ✅ | 3 real variants/round; `mixed_from` round-trips a per-item mix. |
| D3 One evolving preview, stable URL | ✅ | In-app design surface republishes in place at `/api/previews/…`. |
| D4 Variants render real `master_components`, tagged by source | 🟠 | Source **tagging** materialised (`source:{kind,mc_id\|why}`, blocks a source-less variant). **But the catalog is bypassed in practice (D-8):** 5 real media-card candidates exist, yet r1's variants are all bespoke declaring "candidates: none". Tagging is honest; consultation is not happening. |
| D5 Output = spec + preview → Stage 3 | 🟡 | As AC6 — spec materialised, token content thin on real data. |
| D6 Theme-from-content is the core differentiator | 🟡 | Materialised and valuable (extracts a varied accent per poster), **but the contrast guarantee it promises is not universal (D-1)** — 2/349 below 3:1. |

---

## C. The core loop (§4) & component design (§5)

| Clause | State | Evidence / gap |
|---|---|---|
| §4.1 Show don't tell | ✅ | Rounds are built and rendered, never described. |
| §4.2 Options not one answer (2–4, mix) | ✅ | Count-by-rung enforced; mixing via `picks-to-ledger`. |
| §4.3 Real + interactive, respect reduced-motion | ✅ | Real posters; `floor-reduced-motion` enforced (and fired on our own panels, since fixed). |
| §4.4 One evolving preview (same URL) | ✅ | Republish in place. |
| §4.5 Precise reaction → precise rebuild | ✅ | Fresh-context round fed ledger+rejected+frozen; restated before acting. |
| §4.6 Lock explicitly, never silently revisit | ✅ | Lock-earned 422; locked axes omitted from later rounds. |
| §5A Context gate (mandatory) | ✅ | AC1. |
| §5B Worklist decomposition, owner picks order/granularity | 🟡 | AC2 — data, not a gated choice. |
| §5C Fidelity ladder A→A½→B→C | ✅ | Directions (rung 0, `design-directions.json`), core mechanic (rung 1, `coreMechanicGate`), component showcase (rung 2), cluster→page (routing). Rung-A boards render + gate (C4). **Gap (D-6):** rung-A distinctness is palette-only. |
| §5C "vary on the open axis" | ✅ | Isolation gate axis-diff/control-diff. |
| §5D Preview pipeline A–F, fold A→D into one command | 🟡 | A `asset-fetch` ✅ · B `theme-extract` ✅ · C inject+placeholder-guard ✅ · D publisher ✅ · E ledger ✅ · F `master_components` (bypassed, D-4/D-8). **Gap:** A→D is not folded into `design-round` — `design-round` is build→publish; fetch/extract are upstream stages (AC10). |
| §5E Preview requirements | ✅ | Self-contained, `data:` URIs, real content, primary-screen; light/dark per D-4. |
| §5F Anti-slop guardrails | ✅ | `adv-no-slop-tells`, forbidden-technique detectors, direction commitment. |
| §5F Colour-budget rule (hard) | 🟡 | Stated ✅; honoured over-counts (D-2). |
| §5F Pressure-test before presenting | ✅ | `pressureTest` refuses to present until contrast·reduced-motion·colour-budget have **run** — but see D-3: if computed never runs, "colour-budget has run" can be vacuously satisfied at the source layer while the computed block is skipped. |
| §5G Anti-gaslight (ask-on-primary, restate, never regress, locked/open list) | ✅ | `primaryDecisionGate`, fresh-context restate, locked-carry-forward. |

---

## D. Real assets + theme-from-content (§7) and phasing (§8)

- **§7 poster-derived tokens as identity** — ✅ materialised (`theme-extract` on real radarr posters,
  varied accents), 🟡 with **D-1** (2/349 below the 3:1 floor the section's method promises).
- **§8 Phase 1 (the method)** — ✅ context gate + worklist + A→B→C + previews + ledger + guardrails all
  present and demonstrated this run.
- **§8 Phase 2 (identity layer, wire early)** — ✅ `asset-fetch` (fs + api, retry/backoff, all-or-nothing)
  + `theme-extract` + per-project asset config. Wired as a stage, not into the one command (AC10 gap).

---

## E. The through-line: what is envisioned but not yet real

Three gaps recur across the criteria and are the honest state of Task 2:

1. **The catalog is described but bypassed (D4/D-8).** Every variant is tagged with a source and a
   source-less variant is blocked — but real candidates exist that rounds declare absent, so
   "library-first" is a convention the rounds do not actually follow. *Highest-value gap to close.*
2. **The computed layer is real but not load-bearing at publish (D-2/D-3).** The pass exists, runs in
   Chromium, and blocks — but a round can (and the live one did) publish without it ever running, and
   when it does run, its colour-budget check over-counts. "MUST NOT be presented" is not yet a wired
   guarantee.
3. **The output's token half is thin on real data (AC6/D5).** Emit resolves and writes, but every real
   locked decision is structural/enum, so a tokens file with real content is proven only on throwaways.

None of these is a missing feature. Each is a built mechanism whose *reach* falls short of what the spec
envisioned — which is exactly the distinction "envisioned vs materialised" is meant to draw. The
scenario/leg that exposed each, and the fix scoping, are in
`docs/audits/2026-07-28-task2-final-test-run.md` §5.

## F. Verdict

Task 2's method is **materialised end-to-end** — a real component can go intake → anatomy → round →
gate → check → computed → publish → pick → lock → emit, and did this session, on real data, with every
fail-closed guard biting when tripped. Of the 10 acceptance criteria, **all 10 are met at least in
part; 5 fully, 5 with a named, non-blocking gap.** The spec is not aspirational relative to the code;
the code is slightly narrower than the spec at three edges (catalog consultation, computed-at-publish,
token output), each logged as a defect with the test that found it. Nothing here needs re-building — it
needs three edges widened.
