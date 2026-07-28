# Design-method TEST — findings audit (cointrail) · 2026-07-29

The cointrail spending-analysis TEST (`docs/test-runs/2026-07-28-cointrail-run1.md`) exposed 17 findings
(F-1…F-17). This audit records each finding's **resolution status** after the design-system rebuild (Phase
0–2 this session), and confirms the test round was rolled back.

## Rollback — DONE + VERIFIED
On the owner's code word "skill test done", the parked round was reversed via the manifest (surgical,
backup-first — `backup-1785276527657.db`):
- decisions **67–72 deleted** → cointrail design-decisions **count=0** ✅
- `design_ledger` restored to **null** (palettes/fonts preserved via the partial PUT) ✅
- preview dir removed → **404** ✅ · server temp dir `/home/pdsv/cointrail-designtest/` **gone** ✅
cointrail is at baseline.

## Findings → resolution
| # | Finding | Status | How / evidence |
|---|---|---|---|
| **F-13** | app unreachable / publish prints `127.0.0.1` | **FIXED** | WS0.1 — `publish-round` prints the reachable `ottomate.vault7a.xyz` URL; client-side 200 vs dead loopback (`f218dfc`/`014995c`) |
| **F-14** | JS-inert static preview can't show interactivity | **FIXED** | WS1.1 — a grid of `sandbox=allow-scripts` live iframes, deployed; verified on the real design page (`6c1449e`) |
| **F-15** | no decomposition intelligence; scope assumed | **FIXED** | WS1.3 — `decompose` from `data-role` stamps + `requireExplicitScope` (always-ask) (`3cf50bb`) |
| **F-17** | round not legible (what's decided/held?) | **FIXED** | WS1.2 — the legibility banner (decided/held/deferred + assent), rendered live (`54fe71d`) |
| **F-8** | colour budget miscounts slate; blocks a legit palette | **FIXED** | WS0.2 per-theme contrast gate replaces it; WS1.0 colourBudget→advisory. cointrail's 4 hues + slate now PASS (`f218dfc`) |
| **F-10** | compare view squeezes wide sections | **FIXED** | WS1.1 — each variant renders full-width in its own iframe |
| **F-4** | derive returns semantically-empty parts | **ADDRESSED** | WS1.3 decompose reads `data-role`/`data-oid` stamps, not name-guessing; older components still need a stamping pass (backlog) |
| **F-16** | the rule system caps ambition | **ADDRESSED** | anti-slop → advisory for this owner (WS0.3); colourBudget→advisory (WS1.0); live preview lifts the interactivity ceiling (WS1.1) |
| **F-9** | isolation ↔ divergence tension | **ADDRESSED** | WS1.3 scope drives whole-direction OR one-property variants by the owner's explicit choice |
| **F-6** | motion silently deferred | **ADDRESSED** | WS1.2 — deferral is named and needs assent (`assentRequired`); no silent round-2 |
| **F-7** | checker advisory false-positives | **ADDRESSED** | the per-theme contrast gate is correct (decorative/chart advisory); colourBudget no longer blocks |
| **F-11** | publish needs registry surgery | **PARTIAL** | the theming/dictionary layers are token-and-graph based (Phase 0/2); the archetype registry still exists — a novel component can be decomposed (F-15) but the anatomy registry is not yet fully graph-driven |
| **F-5** | packer merges channels into one round | **PARTIAL** | `composeRounds` still greedy-packs; the banner now makes what's decided explicit, so a wide round is at least legible |
| **F-1** | routing doc vs code drift | **MINOR** | doc-clarity only; code was self-healing (context gate). Not separately fixed |
| **F-2** | ledger `palette_dark:null` vs shipped dark theme | **MINOR** | named; the DTCG theme now carries both schemes explicitly (WS0.2) |
| **F-3** | source-art already carries the owner's ask | **GOOD (n/a)** | a positive signal — the rebuild builds on cointrail's own utilities |
| **F-12** | enum values minted as CSS custom-property values | **OPEN** | a low-severity emit defect in `emit-design-artifacts`; not addressed this session (backlog) |

## Summary
**7 fixed** (the four HIGH/owner-sharpest — F-13/F-14/F-15/F-17 — plus F-8/F-10 and the F-8 root), **6
addressed**, **2 partial**, **2 minor**, **1 open** (F-12, low). The method that reported green while
shipping unreachable/static/illegible output has been rebuilt into one that is reachable, live, legible, and
fail-closed on legibility — verified with evidence, not claims (§7).
