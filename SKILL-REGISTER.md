# Skill register — what exists, what governs it, what is actually enforced

> **Resuming work?** Read this file, then **`docs/plans/2026-07-23-SESSION-HANDOFF.md`** — together
> they are the complete entry point. Do not bulk-read `docs/research/`.

**The single index of the Ottomate skill.** Structure · systems · rules · intelligence · improvements.
Created 2026-07-23 because knowledge had scattered across ~40 files with no index — which is how an
earlier session came to claim work was complete when it was not, and why status kept being
re-derived by hand instead of read.

> ## How to maintain this — read before editing
> 1. **Update it in the same commit as the change it describes.** A register that lags is worse than none.
> 2. **`Enforced?` is a field, not a claim.** `yes` means code executes it and a test proves it fires.
>    `spec` means written down and nothing runs it. `prose` means it exists only as English in a doc.
>    **Never write `yes` without naming the test.**
> 3. **Superseded things stay, struck through, with what replaced them.** Deleting history is how the
>    same mistake gets made twice.
> 4. **If you cannot fill a row honestly, write `unknown` and say so.** Do not infer.

**Legend:** ✅ proven (code + passing test) · 🟡 partial · 📋 spec only · ⬜ absent · ⛔ superseded

---

## 1. Structure — what each file owns

### Entry point
| File | Owns |
|---|---|
| `skills/ottomate/SKILL.md` | The router. Stage 0→4 dispatch, operating rules, HARD gates, bedrock claims |

### Method references (`skills/ottomate/references/`) — loaded per stage
| File | Owns | Task |
|---|---|---|
| `stage-0-overview.md` · `stage-1-internal.md` · `stage-1-verification.md` | Preprocessing, spec, spec verification | core |
| `stage-2-ui-master-plan.md` | The UI plan + **design-ledger home** (context, worklist, constraints) | 2 |
| `stage-2-design-method.md` | **The A→A½→B→C method.** Carries the ⚠ BUILD STATUS block | 2 |
| `stage-2-components.md` | Component pick from `master_components` + theme-from-content | 2 |
| `stage-2-tech-architecture.md` | Tech stack + architecture decisions | core |
| `design-doctrine.md` | **Durable design principles, cited.** Injected into every design round | 2 |
| `stage-3-*.md` (7 files) | Scaffolding, codegen, testing, pipeline, reformat, verifier, **feature-verifier** | core / 3 |
| `stage-4-mini-pipeline.md` | Iteration pipeline incl. 4.4.6 design-taste gate + 4.7 verifier gate | 2 / 3 |
| `stage-4-visual-qa.md` | DOM-commenter intake → classify → lock-in | 1 |
| `anti-gaslight-rules.md` · `sanity-check.md` · `propose-confirm.md` | Anti-gaslight discipline, gates, confirm protocol | core |
| `ledger-tables.md` · `ledger-writes.md` · `task-tracking.md` | Traceability ledger + todos | core |
| `tracker-api.md` · `tracker-api-inventory.md` · `credentials.md` | App API surface + auth | core |
| `command-routing.md` · `output-style.md` · `pack-up-ritual.md` | Routing, voice, session wrap | core |

### Data (`skills/ottomate/data/`)
| File | Owns | Read by |
|---|---|---|
| `design-doctrine.md` *(in references/)* | Principles a generator must know | a model, every round |
| `design-rules.json` | **Machine-readable rules + audience profiles + templated tax** | **code only, never a model** |
| `design-rubric.md` | G2's 4×25 self-critique + hard-gate overrides | the pressure-test pass |
| `design-directions.json` | 20 named directions + adjective→direction map | direction selection (rung 0) |
| `intent-templates.yaml` · `risk-rules.yaml` · `stub-patterns.md` | Stage 0/1 intent + risk | core |

### Executable (`skills/ottomate/scripts/`)
| Path | Owns | State |
|---|---|---|
| `preview-build/build-variant-set.mjs` | **The variant harness** — N variants, one page, one URL | ✅ |
| `preview-build/isolation-gate.mjs` | **G1 §4.3 as code** — the pre-display gate | ✅ 20/20 tests |
| `preview-build/isolation-gate.test.mjs` | The gate's test suite | ✅ |
| `preview-build/build-preview.mjs` | Single-design preview (no options) | ✅ |
| `preview-build/theme-extract.mjs` | Theme-from-content (ImageMagick dominant vibrant) | ✅ re-verified independently |
| `preview-build/template.variant-set.html` · `template.card-wall.html` | Preview shells | ✅ |
| `design-check/design-check.mjs` | **The constraint checker** — tier semantics + `resolveFloor()` | ✅ |
| `design-check/checks.mjs` | The source-method detectors (15 rules + 3 contract keys) | ✅ |
| `design-check/design-check.test.mjs` | Its suite — **a failing case AND a passing case per rule** | ✅ 29/29 |
| `feature-verify/**` | Task-3 Playwright harness | 🟡 API-level only, no browser spec |
| `import-master-components.ts` | Catalog seeding | ✅ |

### Docs
`docs/specs/` — the 3 locked task specs · `docs/plans/` — per-item build plans · `docs/research/` —
**24 raw research files, on-demand only, never loaded by default**

---

## 2. Systems — mechanisms and their real state

| System | What it does | State | Evidence |
|---|---|---|---|
| **Isolation gate** | Refuses to show a variant set not proven to differ on its axis and match on all others | ✅ | 20/20 tests; a samey set rejected with exit 2 and nothing written |
| **Variant harness** | N labelled variants → one page → one stable URL | ✅ | Real round, 12 posters, 0.87s, published |
| **Preview pipeline** | fetch → extract → inject → emit, self-contained, CSP-safe | ✅ | ~0.2s; placeholder guard genuinely fires |
| **Theme-from-content** | Content → machine-derived accent tokens | ✅ | Independent re-run produced byte-identical colours |
| **`design_decisions` ledger** | One row per decision; open/locked/rejected/graduation queries | ✅ | 21/21 live smoke; migration 0010, journal idx 5 |
| **Lock earned / unlock harder** | `locked` needs `confirmed:true`; reopening needs `unlock_reason` | ✅ | Both 422s verified live |
| **Uncapped rationale** | Design decisions never truncated | ✅ | 2160-char round-trip |
| **Named directions** | 20-direction catalogue + adjective disambiguation | ✅ data | JSON validated; **no consumer wired yet** |
| **Audience profiles P1/P2/P3** | Profile selects which floor rules bind | ✅ | `resolveFloor()` in `design-check.mjs`; test proves P1 and P3 return **different** sets, and that a per-project override beats the preset |
| **Constraint checker** | Mechanically enforce the rules | 🟡 | **15 of 89 rules + 3 of 5 contract keys now enforced**, each naming a failing-case test. Wired into `build-variant-set.mjs` after the gate, before emit; blocks exit 2 and write nothing. **The other 74 are still `pending` and enforce nothing** — the checker reports them as `skipped`, never as passing |
| **Feasibility gate** | Refuse a variant that cannot RUN | 🟡 | **4 of 6 enforced** (`no-eval` · `no-wasm` · `no-network` incl. the placeholder-service list · `no-inline-handlers`). `feas-baseline-gate` needs real `@supports` parsing; `feas-degradation-bottom-rung` is `computed`. Proven profile-invariant by test |
| **Cross-component coherence** | Same semantic role → same computed value across components; shared state vocab → same token delta | 📋 | `adv-cross-component-coherence`, C2 §3.10. **This is the mix-coherence check G1 requires and the per-item pick model (doctrine 38) depends on.** Needs a browser; no runner |
| **Rubric scoring pass** | Score variants before presenting | 📋 | Rubric written; no runner |
| **Templated-tax scorer** | F2's 18 binary rows | 📋 | Rows written; no runner |
| **Fresh-context rounds** | Each round in a clean sub-agent fed only ledger+constraints+rejected | ⬜ | Designed, unbuilt |
| **Golden-file regression gate** | Diff locked targets after every rebuild | 🟡 | `snapshot` column now exists; **no differ** |
| **Reload-on-resume** | Session start re-reads the ledger | ⬜ | Must be fetched explicitly |
| **Stage-3 handoff** | Stage 3 builds from the locked design spec | ⬜ | Stage-3 references never read the ledger |
| **Context gate** | No visuals before audience/use-case/tone/screen | 🟡 prose | Not in SKILL.md's HARD gate list |
| **Code verifier** | Independent sub-agent, proves the CODE | ✅ | Task-3 sibling; pre-existing |
| **Feature verifier** | Drives the REAL app, asserts system state | 🟡 | Sink + unicode recipe real; no browser-driving spec |
| **Visual-QA intake** | Comment → ingest → classify → lock-in | ✅ | Task 1 complete, dogfooded |

---

## 3. Rules — every rule and whether anything enforces it

### Tier definitions
- **BLOCK-owner** — the owner's own constraints + decision integrity. Never varies by profile. Fail closed.
- **BLOCK-floor** — the small hard floor. **Filtered by audience profile.**
- **ADVISE** — computed, annotated, shown.

### Enforced today (code runs, test proves it)
| Rule | Tier | Source | Enforced by |
|---|---|---|---|
| axis-diff — every pair differs on the named axis | BLOCK-owner | G1 §4.3 | `isolation-gate.mjs` ✅ |
| control-diff — nothing outside the axis moves | BLOCK-owner | G1 §4.3 | ✅ |
| blind-sort — each level nameable | BLOCK-owner | G1 §4.3 | ✅ |
| option count by rung; never 1, never 6+ | BLOCK-owner | G1 §4.4 | ✅ |
| neutral labels, nothing pre-recommended | BLOCK-owner | G3 §3.4/3.5 | ✅ |
| structural divergence for structural axes | BLOCK-owner | G1 §4.3 | ✅ |
| randomised slot order | BLOCK-owner | G3 §3.6 | ✅ harness |
| no unfilled placeholder ships | — | spec §5D-C | `build-*.mjs` ✅ |
| lock must be earned | BLOCK-owner | G3 §3.12 | PATCH 422 ✅ |
| unlock needs a reason | BLOCK-owner | G3 §3.13 | PATCH 422 ✅ |
| **no `eval` / `new Function` / string-timer / `javascript:`** | BLOCK-feasibility | H2 §3.3 | `design-check.test.mjs` ✅ |
| **no WebAssembly** (Rive, DRACOLoader, KTX2Loader by name) | BLOCK-feasibility | H2 §3.3 | ✅ |
| **no network reference** — incl. 12 named placeholder services | BLOCK-feasibility | H2 §3.2, D2 §3.9 | ✅ |
| **no inline `on*=` handlers** | BLOCK-feasibility | H2 §3.9 | ✅ |
| **no cross-variant id / class / `@keyframes` / `:root` collision** | BLOCK-owner | D2 §3.11 | ✅ — the static half of the Phase-1 blocker |
| **`must_use`** — every required `mc-id` present | BLOCK-owner | contract | ✅ |
| **`animation_vocab`** — nothing outside the declared vocabulary | BLOCK-owner | contract | ✅ |
| **`forbidden`** — glassmorphism · parallax · bounce · glow · gradient-text | BLOCK-owner | contract | ✅ 5 detectors, each tested |
| **`resolveFloor(profile)`** — which floor rules bind | mechanism | owner ruling | ✅ P1≠P3 proven; overrides honoured |
| 10 advisory rules — font-smoothing · action labels · error copy · implementation vocabulary · CSS architecture · inline styles · webkit prefixes · default typeface · hover/focus-within · weight budget | ADVISE | A2/C3/D1/E1/E2 | ✅ annotated, never blocking |

### Specified, enforcing nothing (`status:"pending"`) — **74 of 89** *(was: all of them)*
`source_policy` (needs a source-tagging convention that does not exist yet) · `colour_budget`
(needs rendered surfaces → `computed`) · `floor-contrast` · `floor-reduced-motion` ·
`floor-target-size` · `floor-not-colour-alone` · `hover-only-content` · all 18 templated-tax rows ·
`seq-parents-locked` · `lock-regression-gate` · `feas-baseline-gate` (needs real `@supports` parsing) ·
`feas-degradation-bottom-rung` · all 16 `computed` rules · the remaining `adv-*` rules

**Two rules can never be fully enforced by any method** and must never be listed as enforced:
`adv-glass-legibility` (the background behind glass is the blurred composite, invisible to
`getComputedStyle` — needs pixel sampling) and `adv-brand-mark-authentic` (no checker distinguishes an
authentic mark from a good imitation; it is a prompt-time constraint plus a provenance annotation).

**New: a fourth tier, `block_feasibility`** (6 rules). The other three tiers all answer *"is this good,
for this audience?"*; H2/E2 surfaced a class of failure that is not a taste question — **the artifact
does not render**. A blank panel is blank for everyone, so it can be neither profile-filtered nor
advised. This **extends** the owner's two-tier ruling (which governs *quality*) rather than revising it
(this governs *existence*). ⚠ **Flagged for owner confirmation**; nothing about the existing three
tiers changed.

**Rules now carry `method`** — `source` (static, **39** rules) or `computed` (needs a browser,
**16** rules). 34 pre-existing rules have no `method` yet; classify them when the checker is built.
The `source` majority is the good news for Phase 3a: most of the corpus is checkable without a browser.

**Two rules are honestly marked as not fully checkable, and must not be claimed as enforced even
once a runner exists:** `adv-glass-legibility` (the effective background behind glass is the blurred
composite, which `getComputedStyle` cannot report — needs pixel sampling) and
`adv-brand-mark-authentic` (a checker cannot tell an authentic mark from a good imitation — it is a
prompt-time constraint plus a provenance annotation).

### Prose only (nothing checks them)
Context gate · anti-slop tells · core-mechanic-before-page · colour-budget stated up front ·
harvest-before-ask · pressure-test-before-presenting

---

## 4. Intelligence — what the skill knows, and where

| Knowledge | Home | Source |
|---|---|---|
| **229** design doctrine rules, cited, `[CITED]` vs `[REASONED]` preserved | `references/design-doctrine.md` | **all 22 tracks** |
| Row-height bands · perceptual channel ranking · zero-baseline law · dashboard hierarchy · load patterns | doctrine §3¾ *Information design* | C3 §3.1–3.15 |
| Nav model by breadth×depth · the measured cost of hidden nav · wizard floor · modality rule · URL state | doctrine §3¾ *Navigation & flow* | B3 §3.1–3.15 |
| Voice vs tone · action-label law · error-copy shape · the three empty states · banned implementation vocabulary | doctrine §3¾ *UX writing* | D1 §3.1–3.15 |
| Weight budget · base64 +1/3 · CWV targets · `@layer` order · no IDs / no `!important` | doctrine §3¾ *Performance & CSS architecture* | E1 §3.1–3.15 |
| Provenance-at-ingest · GREEN/AMBER/RED licence tiers · tokenise-on-ingest · A–F grading · NOTICES ledger | doctrine §3¾ *Asset sourcing* | H1 §3.1–3.15 |
| **Three CITED myth-busters**: zebra striping unproven · "7±2" is folklore for menus · onboarding tutorials did not help | doctrine 165, 175, 183 | C3 §3.7, B3 §3.2, B3 §3.12 |
| Radius ladder + concentric nesting · 6-level elevation · dual-layer tinted shadows · glass recipe with a legibility floor | doctrine §3¾ *Shape, depth & material* | A4 §3.1–3.15 |
| Type class→mood map · 2-family ceiling · scale ratios · leading by role · numerals · dark-mode optical adjustment | doctrine §3¾ *Typography* | A2 §3.1–3.15 |
| One icon set · 24/2 grid · filled=active · **never hand-draw a brand mark** · trademark ≠ licence · deterministic seeded placeholders | doctrine §3¾ *Iconography* | D2 §3.1–3.14 |
| **L = 0.179 luminance crossover** — provably floors initials-avatar contrast at ≈4.58:1 on any solid background | doctrine 154 | D2 §3.10 |
| Token architecture: 3 layers, naming law, ≤3 alias hops, coherence tolerances | doctrine §3¾ *Tokens & coherence* | C2 §3.1–3.14 |
| Technique escalation ladder + what the sandbox forbids outright | doctrine §3¾ *Feasibility* | H2 §3.1–3.15 |
| Baseline tiers, CSP mechanics, cross-OS text rendering | doctrine §3¾ *Environment reality* | E2 §3.1–3.15 |
| **The owner's real screen:** 2194×1234 logical, not 3840 | doctrine rule 83 + P1 profile | measured 2026-07-23 |
| 20 named directions + adjective map | `data/design-directions.json` | F1 |
| Component taxonomy: primitive / composite / surface | doctrine §4¾ | C1 §4.1 |
| Full interaction state matrix | doctrine + B2 on demand | B2 §4.1 |
| 4×25 critique rubric + hard-gate overrides | `data/design-rubric.md` | G2 §4.6 |
| 18-row templated tax | `data/design-rules.json` | F2 §7 |
| Audience profiles P1/P2/P3 | `data/design-rules.json` | owner ruling |
| Decision-record schema | `design_decisions` table | G3 §5.2 |

### Research ingestion — ✅ **22 of 22 tracks distilled. SWEEP COMPLETE 2026-07-23.**
G1 · G2 · G3 · F2 · C1 · B2 · F1 · A5 · A1 · B1 · A3 · C2 · H2 · E2 · A4 · A2 · D2 ·
**C3 · B3 · D1 · E1 · H1** *(+ ZZ chatgpt)*

**229 doctrine rules · 89 machine-readable rules.** What remains in `docs/research/` is the *body* of
each track — worked examples, comparison tables, the reasoning behind each rule. Every §3 executive
rule is now in `design-doctrine.md`. Keep pulling bodies on demand for build knowledge; never bulk-read.

**Method that works:** `awk '/^## 3\./{p=1} /^## 4\./{p=0} p' <track>.md` extracts just the executive
rules — the corpus explicitly writes §3 to be applied without reading the body. ~20 lines per track
instead of ~1000. Distil and commit after every 2–4 tracks so progress survives a context boundary.

**What batch 1 (A5 · A1 · B1 · A3) changed, not just added:**
- A5 **independently confirmed** the earlier arbitration: WCAG 2.2 AA gates, **APCA is a draft and
  must never be cited as the compliance bar**.
- A1 **validated `theme-extract.mjs`** — "derive by role (vibrant), not by dominant" is exactly what
  it does. Outstanding upgrade: normalise L and clamp C at derivation time.
- B1 gave `animation_vocab` real numbers for the first time (the role-based duration ladder).
- A3 **corrected a foundational method assumption** — 4K ≠ 3840 CSS px. Now measured; see defects.

**What batch 2 (C2 · H2 · E2) changed, not just added:**
- C2 §3.10 **is the spec for the checker's measurement model** — and it says *computed-style at
  runtime*, not source text. That is the 5th instance of the pattern. See superseded.
- C2 §3.10 also **supplied the tolerances three existing rules were missing** —
  `adv-spacing-scale` / `adv-type-scale` / `adv-token-adherence` had thresholds but no answer to
  "how close counts as on-ramp?". Now ±0.5–1 px and ΔE2000 ≤1/≤2.
- C2 **filled the hole under the owner's per-item pick model.** Doctrine 38 lets the owner take the
  header from v1 and the card from v2; nothing proved the mix was still *one design*.
  `adv-cross-component-coherence` is that proof.
- H2 + E2 together **forced a fourth enforcement tier** (see §3) — the first structural change to the
  tier model since the owner's ruling.
- E2 §3.13 **found a real defect in our own two preview templates** (`-webkit-font-smoothing`),
  now removed.
- E2 §3.5 **sharpened, without overturning, arbitrated conflict #1.** Our live evidence (inline +
  `data:` render fine in the Artifact sandbox) still wins over the ChatGPT report's assertion — but
  E2 explains the mechanism (`'self'` does not cover `data:`; the scheme must be allowlisted), which
  is *why* it must be verified per-target rather than assumed either way.

**What batch 3 (A4 · A2 · D2) changed, not just added:**
- D2 §3.11 **exposed a latent high-severity defect in the variant harness** — SVG/CSS namespace
  collision across variants sharing one document. See defects; it blocks Phase 1.
- A4 §3.13 **conflicts with A5 §3.5 on focus rings** (`box-shadow` vs `outline`). **Arbitrated: A5
  wins for focus specifically**, because `forced-colors` deletes `box-shadow` and a High Contrast
  user is left with no visible focus at all. A4's non-layout ring stays correct for dividers and
  hairlines. Logged in doctrine §6 + `adv-focus-ring-not-shadow-only`.
- A4 §3.7 **added a fourth preference query** — `prefers-reduced-transparency`. Doctrine rule 58 said
  "three preference queries, not one" on A5's authority; A5 simply did not cover it. Rule 58 amended.
- A4 §3.12 + E2 §3.9 **together produced a keyword map neither states alone**: the WebKit mask
  prefixes are per-operation (`exclude`→`xor`, `add`→`source-over`, `intersect`→`source-in`), not one
  substitution. Cross-checking two tracks was what surfaced it.
- A4 §3.6 **independently corroborated A1 rule 65** — elevation on dark is +lightness, not shadow.
  Two tracks reaching the same conclusion by different routes.
- A2 §3.5 **supplied the missing half of rule 81**: we had the measure (45–75ch) but no leading, so
  nothing caught a single global `line-height` across a 12→48px range.
- A2 §3.12 and D2 §3.8 **both re-derived E2's CSP conclusions independently** (`font-src data:` for
  embedded fonts; inline SVG over icon fonts and `<img>`). Third-party confirmation of batch 2.

**What batch 4 (C3 · B3 · D1 · E1 · H1) changed, not just added:**
- **H1 is the spec for the `master_components` ingestion and graduation work in Phase 4** — provenance
  capture, GREEN/AMBER/RED licence tiers, tokenise-on-ingest, A–F grading, structural *and* visual
  dedupe, and a NOTICES ledger. **6th instance of the pattern.** See superseded.
- **E1 §3.8 corrects doctrine rule 141** (itself only written in batch 3): `unicode-range` and
  `font-display` exist to manage lazy download and FOIT/FOUT, and **offline there is neither** — so
  splitting a face into subsets saves nothing and adds parse blocks. Subset once, embed once.
- **E1 §3.2 finally puts a number on the render-surface defect** — ≤1 MB snappy, ≤2 MB acceptable,
  >2 MB a budget event. See defects: the 566 KB figure was *within* budget, so that defect is about
  the wrong **surface**, not weight.
- **C3 §3.6 split a row of the audience-profile table.** Hover-only *content* is discoverability (the
  owner's P1 ruling stands); hover-only *controls* is operability under WCAG 2.1.1 and is unreachable
  by the **solo owner** the moment they tab. Advised even at P1, because the fix is one selector.
- **E1 §3.12 pairs with C2 rule 89 into one architecture**: C2 orders the *values*
  (primitive→semantic→component), E1 orders the *cascade* (`@layer` reset→…→utilities). Neither track
  mentions the other; together they are the whole story.
- **Three CITED myth-busters** landed, each killing a rule we might otherwise have written from folk
  knowledge: zebra striping is **not** a proven accuracy win (244-participant study, no significant
  difference) · **"7±2" does not govern menu counts** (NN/g explicit) · **onboarding tutorials did not
  help** (70 users / 4 apps: 91% vs 94% success, and *higher* perceived ease without).
- **E1 §3.15 constrains how we may read our own measurements**: lab tooling models a network the
  offline sandbox does not have, so Lighthouse numbers are **relative between variants only**, never
  absolute field CWV. That is a direct instruction about a claim this program could easily overstate.
- **E1 §3.7 independently confirmed A2 §3.6** (variable-font break-even at 3 weights) by byte
  measurement rather than by rule of thumb; **H1 §3.5 independently confirmed D2 §3.7** (trademark is
  not waived by a CC0 file licence); **H1 §3.8 is the third independent confirmation that Rive is
  unavailable.**

### Known research gaps the corpus cannot cover
1. **The owner's own decision history** — past comments, picks and rejections sitting unused in the DB.
   The highest-signal taste data available.
2. **Generation variance technique** — how to get genuinely different outputs from one model is an
   LLM-behaviour question, and the whole variant harness depends on it.

---

## 5. Improvements — pending, proven, superseded

### Proven this program
Task 1 visual-QA intake (complete, dogfooded) · isolation gate · variant harness · one-command preview ·
theme-from-content · uncapped ledger · `design_decisions` + migration 0010 · doctrine/rules/rubric/directions ·
**the research sweep, all 22 tracks** · **the source constraint checker + `resolveFloor()` (29/29)**

### Pending, in build order
| Phase | Items |
|---|---|
| ~~**Research sweep**~~ | ✅ **DONE 2026-07-23 — all 22 tracks distilled** |
| **1 Generation** | Sub-decision inventory from C1 anatomy · render-by-tier with states pinned · bundle model + per-item picks · over-generate-and-filter |
| **2 Persistence** | `rejected[]` wiring · reload-on-resume · snapshot differ |
| ~~**3a Enforcement — source**~~ | 🟡 **LARGELY DONE 2026-07-23** — `resolveFloor()` ✅ · the source checker ✅ (15 rules + 3 contract keys, 29/29 tests) · wired into `build-variant-set.mjs` ✅. **Remaining:** `feas-baseline-gate` (`@supports` parsing) · `source_policy` (needs a tagging convention) · constraint *capture* (the contract is read from config; nothing writes it to the ledger yet) |
| **3b Enforcement — computed** | The 5 `computed` rules, hosted in the existing Task-3 Playwright harness: `adv-cross-component-coherence` first, since the per-item pick model depends on it |
| **4 Wiring** | Fresh-context rounds · scope×entry routing · Stage-3 gate · register gates in HARD list · **graduation to `master_components` — now specced by H1, see superseded** |

### Superseded — kept deliberately
- ⛔ **5-tier granularity ladder** (primitive/element/composite/section/shell), invented in the Task-2
  plan → replaced by **C1's 3 tiers** classified by reuse cardinality.
- ⛔ **"2–4 variants" as a flat range** → replaced by count-by-rung (3 default, 2 at page, 4–5 only
  low-fidelity foundational).
- ⛔ **Set-based Jaccard** for structural distance → replaced by frequency-aware cosine over a
  tag/class/CSS-property fingerprint, after the tests showed it misjudged short markup.
- ⛔ **Single divergence check** → replaced by axis-diff **and** control-diff.
- ⛔ **YAML ledger mirror** — claimed in an early session, never existed. Claim deleted.
- ⛔ **Source-text-only constraint checking** (the model inherited from `isolation-gate.mjs`, which
  greps variant source) → replaced by a **two-method model**: `method:"source"` for things visible in
  the text, `method:"computed"` for anything about *resolved* values. **C2 §3.10 is the spec for the
  checker I was about to hand-design in Phase 3** — the 5th time an unread track pre-empted a design.
  A grep cannot see cascade resolution, `color-mix()`/`oklch()` output, or inherited values, so it
  physically cannot answer "does this semantic role resolve to the same value in both components?".
  Consequence for the plan: **Phase 3 splits.** The 12 `source` rules (including all 6 feasibility
  ones) are pure Node and need no browser; the 5 `computed` rules need a rendering host, and the
  Task-3 Playwright harness in `scripts/feature-verify/` is the natural one — which is a reuse of
  existing infrastructure rather than the new subsystem the plan assumed.
- ⛔ **Three enforcement tiers** → **four**. `block_feasibility` added from H2 + E2. See §3.
- ⛔ **"Graduation to `master_components`" as an undesigned Phase-4 line item** → **H1 is its spec.**
  6th instance of the pattern. Graduation is not "copy the winning variant into the catalog"; H1
  defines an ingest contract: provenance captured **at ingest or lost forever** (source, author, SPDX
  id, licence URL, attribution, retrieval date; no provenance → quarantine) · GREEN/AMBER/RED licence
  tiers with `-NC`/`-ND`/unknown rejected · framework coupling stripped · **tokenised, because a
  baked-in `#fff` is a downgrade not an entry** · graded A–F with only A/B shipping · deduped
  **structurally *and* visually** · and a NOTICES block assembled into the output.
  **Consequence for the plan:** Phase 4 needs a live-state check first — do the 179 catalog rows have
  provenance/licence fields at all? Most were *authored* (`library='ottomate'`), so the gap may be
  narrow, but the 5 wired upstream registries make it real the moment that pass runs. Named
  exclusions to encode now: **Shadertoy (CC BY-NC-SA 3.0 — non-commercial *and* viral)**, **unDraw
  (per-image only; its licence forbids repackaging in packs, scraping, and AI-training use)**,
  **Rive (WASM)**.

### Known defects
| Defect | Severity | Note |
|---|---|---|
| **Variant harness has no namespace isolation between panels** — **fix chosen + verified in-sandbox 2026-07-23; plan doc written; NOT yet implemented** | **High — blocks Phase 1** | **Empirically settled this session:** a self-diagnosing probe run in the owner's Chrome inside the real Artifact sandbox (`https://claude.ai/code/artifact/1d77da20-37e7-439f-b51a-1866db6939ad`) showed the shared-document approach **leaks** (both panels purple, shared gradient), **declarative shadow DOM isolates and survives the Artifact publish pipeline**, and iframe srcdoc renders+isolates but is unreadable/unmeasurable under the sandbox. Owner **chose DSD, static-emitted**; `innerHTML` does not parse DSD so panels must be emitted statically at build time. Plan: `docs/plans/2026-07-23-C1-harness-dsd-isolation.md`. Known bound: DSD content is inert, so a `<script>` in a variant still won't run (fine for style/layout axes). Original defect detail below. Found 2026-07-23 via D2 §3.11. `template.variant-set.html:140` does `host.innerHTML = panels.map(…)`, so **all N variants land in ONE document with no iframe or shadow root**. Consequences: a duplicate SVG `id` makes `url(#id)`/`<use>` resolve to the **first** match, so variant B renders with variant A's gradient/filter; a duplicate class name plus a variant `<style>` block lets the **last** panel restyle its siblings; `@keyframes` names and any `:root` custom property go document-wide. **A second, likely more common root cause of the A≈B round** than the one already listed below — the gate passes because the *source* differs, while the *display* is identical, which is exactly what the gate exists to prevent. Also: **`<script>` inserted via `innerHTML` never executes**, so a JS-driven variant silently does nothing. **Scope:** only the `panelTemplate`/`markup` mode. **Token mode is structurally immune** (it varies only inline custom properties), which is why no round has hit this yet — but Phase 1 generation is built on markup mode. **Status: identified by code inspection, NOT yet reproduced** (a repro needs a browser; the cascade is not observable from Node). Candidate fixes, to be decided in the Phase 1 plan doc: (a) build-time prefix rewriting of ids/classes/keyframes — robust, needs a real HTML+CSS rewriter; (b) `iframe srcdoc` per panel — total isolation, no rewriting, but per-panel height management and the known iter-16 iframe-scrollbar caveat; (c) **declarative shadow DOM** (`<template shadowrootmode="open">`) — native id + CSS scoping, no iframes, no script, and the current front-runner, **pending a Baseline-tier check per E2 rule 106** |
| ~~**"4K-first" assumed 3840 CSS px**~~ → **RESOLVED 2026-07-23 by measurement, and it is worse than A3 guessed** | — | **Dell S2725QC, 27.1″, 3840×2160, 162 PPI, at 175 % scaling** (one notch above Windows' recommended 150 %; the laptop panel is detached, so this is the *only* display). Effective DPI 168 → **logical viewport 2194×1234**, browser content box ≈**2194×1100** — ~14 % wider than 1080p, **not** the 2560×1440 A3 §3.7 predicted. Effective ≈93 PPI is *below* the 110–140 comfort band, i.e. the owner deliberately runs a **larger** UI: err generous, never cramped. Probed with `GetDpiForMonitor` + `EnumDisplayDevices`. Doctrine rule 83 and the P1 profile row now carry the measured number |
| ~~`-webkit-font-smoothing` in both preview templates~~ → **FIXED 2026-07-23** | — | E2 §3.13. macOS-only and non-standard: a no-op on the owner's Windows machine, so its only effect was making Mac viewers see a lighter design than the one being tuned. Removed from `template.variant-set.html` + `template.card-wall.html` |
| 34 of 51 rules have no `method` field | Low | The 17 added/updated this session declare `source` or `computed`. Classify the rest when the checker is built — the field decides which runner owns each rule |
| `theme-extract.mjs` emits the raw extracted pick | Medium | A1 §3.10: normalise L to the accent target and clamp C so contrast is guaranteed *at derivation time*. Today it only boosts V |
| Gate does not check that axis params are **visible in a shown state** | High | *A* root cause of the A≈B round; B2 would have caught it. **See the namespace-collision defect above for a second, independent mechanism** — both produce "source differs, display identical", and fixing only one leaves the gate defeatable |
| Render surface ignores component tier | High | 566 KB / 36 posters for a component question. **E1 §3.2 now supplies the budget the complaint lacked: ≤1 MB snappy, ≤2 MB acceptable, >2 MB a budget event — so 566 KB was *within* budget.** The defect is the wrong **surface** (a page rendered to decide a component question), not the weight. Fixed by render-by-tier in Phase 1, not by shrinking anything |
| ~~Every `design-rules.json` rule is `pending`~~ → **74 of 89 still are** | Medium *(was High)* | 15 rules + 3 contract keys now enforced with failing-case tests and wired into the harness. The checker reports unimplemented rules as **`skipped`**, so coverage cannot be mistaken for a pass |
| The checker only runs in the harness's **markup mode** | Medium | Token mode varies only inline custom properties, so there is no per-variant source to check. The build prints `constraint check: SKIPPED` rather than a pass that checked nothing — but it does mean **every round run so far would have been unchecked** |
| `.sr-stat::before` 3px left strip in `template.card-wall.html` | Low | F2's most reliable AI tell, in our own template. Deferred by owner |
| DOM-commenter extension has **no git remote** | Medium | Local-only; "pushed" claims were no-ops |
| The 3 locked specs live outside version control | Medium | `~/Desktop/Skills CC/Ottomate` is not a git repo |

---

## 6. Hard operating constraints (violate none)

1. **ONE DOOR (adr-018)** — never open the live `.db` with a second sqlite client. All reads/writes via the API.
2. **`POST /api/backup` before any DB change.**
3. **Never run `drizzle-kit generate`/`migrate`** — the un-journaled 0002–0006 gap makes it unsafe.
   Hand-write the migration, hand-add the journal entry, let the app self-migrate on boot.
4. **Typecheck before every container rebuild.**
5. **`git status` AFTER committing** — a bare `commit` with no re-`add` once pushed a non-typechecking tree.
6. **Never store a design decision as a todo title** — `project_todos.title` caps at 300 chars.
7. **Do not overclaim.** Documented ≠ demonstrated. Say which one it is.
