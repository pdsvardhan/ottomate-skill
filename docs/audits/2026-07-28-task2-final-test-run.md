# Task 2 — the final cross-parameter test run · results

**Run 2026-07-28** on VAULT7A (Track A). Executes `docs/plans/2026-07-28-TASK2-FINAL-TEST-PLAN.md`
against the finished build: the six §12 scenarios, the deferred browser legs, and the parameter matrix.
Method: the plugin `scripts/`+`data/`+`docs/` staged to `/tmp/ottoskill` (plugin-root layout so every
fixture resolves), `node_modules` symlinked from `/opt/homeserver/ottomate`, real fixtures throughout
(screenroom source, 349 radarr posters, the 116-row live catalog, the live 36-row ledger). Every
result below is firsthand output, not a register claim. **No threshold was moved to make anything pass.**

## Headline

- **6/6 §12 scenarios** end in a working round or a correct named refusal.
- **5/6 browser legs pass; C10 (theme-extract) is a recorded FAILURE** — 2 of 349 real posters yield an
  accent below the 3:1 floor.
- **The parameter matrix passes** across scope, entry, profile, source and stack idioms.
- **The test pass earned its keep:** it found a live-shipped computed block that never ran at publish,
  a colour-budget over-count, and the theme-extract contrast miss. See **Defects** below.

## 0. Ground truth — suites, measured this run

| Suite | Windows (this machine) | VAULT7A (real host) |
|---|---|---|
| design-check | 123/124 (1 = the browser test, needs Chromium) | **124/124** (browser + regressions incl.) |
| generation | 293/293 | **293/293** |
| preview-build | 36/36 | **36/36** |
| pixel | 22/22 | **22/22** |
| isolation-gate | 36/36 | **36/36** |

**511 tests green on the real host, 0 failures.** The counts have grown past the register's older
figures (design-check 118/119, preview-build 29/29) — every added test passes, so the register
*under*-counts (the safe direction); it should be refreshed. Two design-check regression tests
(`adv-plain-language`, `adv-action-label-specific`) read a fixture at `<plugin-root>/docs/rounds/…`; a
staging that copies only `scripts/`+`data/` makes them ENOENT — a **recipe note**, not a defect (fixed
by staging `docs/` too).

## 1. The six §12 scenarios

| # | Scenario | Verdict | Evidence |
|---|---|---|---|
| 1 | Single component, start to finish | **PASS (with findings)** | intake→anatomy→build→gate→check→computed→publish→pick→lock→emit all exercised. Intake refuses "new button here" (`ask`), runs "premium poster card". Anatomy: media-card → composite, 7 parts, 5 states. One-command `design-round --dry-run`: GATE PASS (8/8), constraint check PASS (130 ran, 0 blocking), source policy PASS. **Computed stage surfaced a BLOCK — see D-2/D-3.** Publish→pick→lock→unlock demonstrated LIVE on a throwaway project (below). Emit: 15 locked screenroom decisions → 15 structural entries, **0 unresolved → GREEN** (reproduces C1). |
| 2 | ~40-component pairing (widened) | **PASS — no regression** | `collectEvidence→inferTier→proposeRecord→validateRecord` over the 6-category superset (40 comps). tier **primitive 7 · composite 33 · surface 0**; **all six pre-U2b hard failures now validate** (button/badge→primitive; avatar/tabs/hover-card/CountUp→composite). 39/40 derive to a valid record; the 1 "failure" is `ModalPortal` — a pure `createPortal` passthrough with no visual parts, **correctly refused** ("nothing to vary"). surface 0 is the known D5 route-shell gap. |
| 3 | New component on existing project | **PASS** | `routeEntry('stage-4-item')` → `contextGate:inherit, reInterview:false`; `contextGate` **passes on the stored context** (audience/use_cases/brand_tone/primary_screen all present in the live `ui_master_plan.design_ledger.context`) — inherited, not re-interviewed. `priorArtByAxis` consulted **23 ledger axes** (corner-radius/elevation/meta-density/accent-usage all cite related decisions). |
| 4 | Unseen archetype forcing derive | **PASS** | folded into scenario 2 — 39/40 real shadcn/Tailwind/Radix components with **no hand-written entry** derive to a valid record; the derive refuses only where there is genuinely nothing to vary (ModalPortal). U2b hardening holds on real source. |
| 5 | Redesign of built UI | **PASS** | `scanSourceArt` extracts **175 declared tokens** from real `globals.css`, 0 intra-source conflicts. Controlled conflict path **names both values** (`ledger 999px` vs `code 0.625rem`) and **seeds neither**. Honest limit recorded: over the *real* ledger, reconcile finds no conflict (already-built 2, none 6) because the 15 locked decisions are enum/structural, not token-shaped — and the `brand_tone: "away from gold-on-charcoal"` vs the built gold-on-charcoal is a *tone* conflict the token-level reconcile cannot see. |
| 6 | Cold start | **PASS** | `contextGate(empty)` → **block**, all 4 keys missing; once answered → **pass**, and a later round is **not re-asked** (fires once). `coreMechanicGate('page', [])` → **block** (no mechanic yet). |

### Scenario-1 live persistence tail (throwaway `zzz-t2-final`, backup-first, cleaned up)
`POST /api/backup` 200 → create project 201 → POST proposed decision 201 (id 66) →
**PATCH locked without `confirmed` → 422 `lock_not_earned`** → PATCH locked+confirmed → 200 (locked) →
**PATCH unlock without reason → 422 `unlock_requires_reason`** → unlock+reason → 200 →
DELETE decision 200 → DELETE project 200 → verify **404**. The pick→lock→unlock state machine and both
earned-guards work on the finished build, fully reversed.

## 2. Deferred browser legs (real Chromium on VAULT7A)

| Leg | Verdict | Evidence |
|---|---|---|
| Full computed pass | **PASS** | `computed-checks.browser.test.mjs` green on VAULT7A Chromium (fails on Windows = unavailable, not a fail). |
| Light AND dark (C8) | **PASS (single-world caveat)** | Collected records twice per `prefers-color-scheme` in Chromium (101 text els each). `assertBothSchemes` → floor-contrast + floor-not-colour-alone **hold in both**. Caveat: the real round output is **single-world dark** (dark==light rendering identical — no `prefers-color-scheme` block), which AC4 permits; the light≠dark *divergence* path is exercised only by the unit test. |
| Real rung-A round | **PASS** | 4 palette-distinct directions (cyber-technical/luxury/playful/swiss) → `renderBoardSet` OK, self-contained; published to the previews volume, **serves HTTP 200**, 4 boards lay out in the app iframe at 2194×1234 (53 KB shot). Non-distinct set **refused** (differ 0); `<script>` direction **escaped**. Cleaned up (404 after). *Finding:* my first authored set (editorial/minimalism) was **correctly refused** for sharing the neutral+accent skeleton — distinctness is palette-only (D-6). |
| Real rung-C cluster (C5) | **PASS** | `routeRungs('cluster')` → `[component,cluster]`. `coreMechanicGate`: page cold → **block**; page with the **8 real locked rung-1 mechanics** → pass; cluster → pass (not gated). The 5 live `library-list.*` locked axes compose into **one per-item-viable cluster round** (widest 5, at the bound). Gate-passed set renders at **2194×1234** (12 cards, 387 KB). |
| theme-extract on real posters (C10) | **FAIL** | Across the **full 349-poster population**, **2 accents fall below 3:1** on `#101216` (#64 → 2.85:1, #78 → 2.80:1; deep-indigo raws). The normalise rescued 77 of 79 raw sub-floor picks — sound and valuable — but the register's "**every** accent clears 3:1" is falsified. See **D-1**. |
| Pixel comparison | **PASS** | Real r1 panels in Chromium: near-identity guard reads all 3 pairs as distinct (8.09/15.81/11.10%, peak 0.93); control (panel vs itself) 0.00% → not-differing. Gold accent share **0.72/0.51/1.11%** — reproduces the logged accent-under-budget finding exactly (owner-judgement item). |

## 3. Parameter matrix

- **scope × rung** (`routeRungs`): component→`[component,micro]`, cluster→`[component,cluster]`,
  page→`[page,component]`, site→`[direction,mechanic,component,cluster,page]`. All four route.
- **entry × context** (`routeEntry`): stage-2→full/reInterview, stage-4-item→inherit/no-reInterview,
  deferred-overhaul→run-now/reInterview, ui-mode:none→defer/skip. All four.
- **profile × floor** (`resolveFloor`): P1 **0 block** / 3 advise, P2 **3 block**, P3 **5 block**
  (P3 adds floor-contrast, floor-not-colour-alone, floor-reduced-motion, floor-target-size,
  hover-only-content). P1≠P3 confirmed. *(Note: at P1 the floor is entirely advisory — the owner's
  "solo owner pays for their own round" ruling; a P1 round can present a set no floor blocks.)*
- **source × {catalog hit, bespoke}** (`checkSourcePolicy`): catalog-hit **pass**, bespoke-with-why
  (≥15 chars) **pass**, no-source-declared **block** (fail-closed). `catalogCandidates(media-card,
  composite)` returns **5** (mc-3d-card, …) — see D-8.
- **tier / archetype / stack idioms**: covered by scenario 2 — primitive/composite/surface split,
  registered (media-card) ∪ derived (40 comps), shadcn `cn`/`cva` + Radix `<X.Y>` + Tailwind-only all
  exercised (U2b).

## 4. Cross-cutting assertions

- **Fail-closed everywhere:** the isolation gate, constraint checker, computed pass, T5 label guard,
  board checker, source policy, and both lock/unlock 422s each blocked and wrote nothing when tripped.
- **Never invent:** derive refuses an out-of-registry part (ModalPortal → "nothing to vary"); emit
  resolves 15 locked decisions with 0 unresolved and would STOP on any unresolved; source-art names a
  conflict and seeds neither side.
- **Provenance honest:** emit marks all 15 `derived:true` structural; source policy blocks a source-less
  variant.

## 5. Defects the test pass exposed

| # | Sev | Defect | Exposed by |
|---|---|---|---|
| D-1 | Medium | **theme-extract's 3:1 contrast guarantee is not universal.** 2/349 real posters land at 2.80–2.85:1 on `#101216`. `normaliseForContrast` only raises HSV *value*; a saturated deep blue caps its luminance at V=1 without ever desaturating, so it cannot always reach the floor. Fix: desaturate toward the floor when V maxes out. The register row claiming "0 below 3:1" (spot-checked 6/6) must be corrected — it overclaims on the full population. | C10 leg (full 349) |
| D-2 | Medium | **computed `colourBudget` over-counts distinct accents.** `computed-checks.js:201` keys accents by the full resolved rgba string, so one hue at N opacities (`rgba(233,184,76,0.1)` vs `…,0.45`) counts as N accents, and a borderline dark neutral (`rgb(26,30,40)`, sat 0.35, max 40) slips past the neutral filter. On the live r1 output this produces a **false BLOCK** ("5 distinct accents vs budget 4") for a set that uses a single gold hue. Fix: quantise to hue (ignore alpha) and widen the neutral cutoff. | scenario 1 computed stage |
| D-3 | Medium | **the computed pass is not fail-closed at publish.** A round config that omits `computed.cwd` (or a host without Chromium) publishes in the `UNAVAILABLE` state without the pass ever running. The live r1 round shipped with `computed:null` (decisions 55–60, republished 2026-07-28); when the pass finally runs it is BLOCKED (by D-2, real or artifact) — so "MUST NOT be presented" never gated the live publish. The register half-acknowledges this ("a post-render pass, not auto-inlined in the harness yet"); the test pass makes the consequence concrete. | scenario 1 |
| D-4 | Low | **C8's real output is single-world dark**, so the light≠dark divergence path is only ever exercised by the unit test, never by real round output. Not an AC4 violation (single-world is permitted), but a coverage gap for the browser leg. | C8 leg |
| D-5 | Low | **`design-round --dry-run` refuses the committed r1 `round.json` at publish** — the manifest carries no T5 variant labels (they are derived at republish time), so the write-guard fires. Correct fail-closed behaviour, but the committed manifest is not directly one-command-publishable. | scenario 1 one-command |
| D-6 | Low | **rung-A distinctness is palette-only.** Two named directions that differ in type-voice/mood/philosophy but share a neutral+single-accent palette skeleton are refused as "one direction with a swatch changed" (editorial vs minimalism). Arguably the intended samey-trap guard, but type/mood/hero contribute nothing to distinctness, so a single-world app must diversify neutrals to show 4 directions. | rung-A leg |
| D-7 | Low | **source-art reconcile is token-only.** On the real screenroom ledger it finds no conflict because the 15 locked decisions are enum/structural, and the stored `brand_tone` vs the built appearance is a tone conflict it cannot represent. Conflict-naming works (controlled input); it just does not fire on this project's real data. | scenario 5 |
| D-8 | Low | **the catalog is bypassed (corroboration).** The r1 round declared bespoke with "candidates: none", but `catalogCandidates(media-card, composite)` on the live 116-row catalog returns **5** (mc-3d-card, mc-3d-card-hover, mc-3d-cutout-card, …). Concrete number for the standing "catalog is bypassed" defect. | matrix source cell |

Plus lower-severity computed advisories on r1 (all `advise` tier, non-blocking): `adv-derivation-contrast-guarantee` (gold chips at 1.23:1), `floor-target-size` (info buttons 22×22 < 24px).

## 6. What this run did NOT change

Judgement pass. No thresholds moved, no code changed, no live design decision picked or locked (the
screenroom rounds remain the owner's to decide). The one live write (throwaway `zzz-t2-final`) was
backup-first and fully deleted. Defects above are logged into the register Known-defects; fixes are a
separate unit.
