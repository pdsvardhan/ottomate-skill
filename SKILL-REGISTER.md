# Skill register — what exists, what governs it, what is actually enforced

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
| **Audience profiles P1/P2/P3** | Profile selects which floor rules bind | 📋 | Specced in `design-rules.json`; `resolveFloor()` absent |
| **Constraint checker** | Mechanically enforce `must_use`/`animation_vocab`/`forbidden`/`source_policy` | ⬜ | **Every rule is `status:"pending"`. Nothing is enforced today** |
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

### Specified, enforcing nothing (`status:"pending"`)
`must_use` · `animation_vocab` · `forbidden` · `source_policy` · `colour_budget` · `floor-contrast` ·
`floor-reduced-motion` · `floor-target-size` · `floor-not-colour-alone` · `hover-only-content` ·
all 18 templated-tax rows · all `adv-*` rules · `seq-parents-locked` · `lock-regression-gate`

### Prose only (nothing checks them)
Context gate · anti-slop tells · core-mechanic-before-page · colour-budget stated up front ·
harvest-before-ask · pressure-test-before-presenting

---

## 4. Intelligence — what the skill knows, and where

| Knowledge | Home | Source |
|---|---|---|
| 53 design doctrine rules, cited, `[CITED]` vs `[REASONED]` preserved | `references/design-doctrine.md` | G1, G2, G3, F2, C1, B2, F1 |
| 20 named directions + adjective map | `data/design-directions.json` | F1 |
| Component taxonomy: primitive / composite / surface | doctrine §4¾ | C1 §4.1 |
| Full interaction state matrix | doctrine + B2 on demand | B2 §4.1 |
| 4×25 critique rubric + hard-gate overrides | `data/design-rubric.md` | G2 §4.6 |
| 18-row templated tax | `data/design-rules.json` | F2 §7 |
| Audience profiles P1/P2/P3 | `data/design-rules.json` | owner ruling |
| Decision-record schema | `design_decisions` table | G3 §5.2 |

### Research ingestion — 11 of 22 tracks read (owner ruling: sweep ALL)
**Read:** G1 variant generation · G2 critique · G3 taste elicitation · F2 anti-generic ·
C1 component anatomy · B2 states/affordance · F1 style movements · **A5 a11y · A1 colour ·
B1 motion · A3 space** *(+ ZZ chatgpt)*
**Remaining 11:** A2 type · A4 material · B3 nav · C2 tokens/coherence · C3 data display ·
D1 copy · D2 icons · E1 perf · E2 cross-platform · H1 assets · H2 feasibility

**Method that works:** `awk '/^## 3\./{p=1} /^## 4\./{p=0} p' <track>.md` extracts just the executive
rules — the corpus explicitly writes §3 to be applied without reading the body. ~20 lines per track
instead of ~1000. Distil and commit after every 2–4 tracks so progress survives a context boundary.

**What the last batch changed (not just added):**
- A5 **independently confirmed** the earlier arbitration: WCAG 2.2 AA gates, **APCA is a draft and
  must never be cited as the compliance bar**.
- A1 **validated `theme-extract.mjs`** — "derive by role (vibrant), not by dominant" is exactly what
  it does. Outstanding upgrade: normalise L and clamp C at derivation time.
- B1 gave `animation_vocab` real numbers for the first time (the role-based duration ladder).
- A3 **corrected a foundational method assumption** — see defects.

### Known research gaps the corpus cannot cover
1. **The owner's own decision history** — past comments, picks and rejections sitting unused in the DB.
   The highest-signal taste data available.
2. **Generation variance technique** — how to get genuinely different outputs from one model is an
   LLM-behaviour question, and the whole variant harness depends on it.

---

## 5. Improvements — pending, proven, superseded

### Proven this program
Task 1 visual-QA intake (complete, dogfooded) · isolation gate · variant harness · one-command preview ·
theme-from-content · uncapped ledger · `design_decisions` + migration 0010 · doctrine/rules/rubric/directions

### Pending, in build order
| Phase | Items |
|---|---|
| **Research sweep** | All 16 remaining tracks → doctrine/rules/rubric, register updated as it goes |
| **1 Generation** | Sub-decision inventory from C1 anatomy · render-by-tier with states pinned · bundle model + per-item picks · over-generate-and-filter |
| **2 Persistence** | `rejected[]` wiring · reload-on-resume · snapshot differ |
| **3 Enforcement** | Profile `resolveFloor()` · constraint capture · **the checker** · wire into pre-present |
| **4 Wiring** | Fresh-context rounds · scope×entry routing · Stage-3 gate · register gates in HARD list · graduation to `master_components` |

### Superseded — kept deliberately
- ⛔ **5-tier granularity ladder** (primitive/element/composite/section/shell), invented in the Task-2
  plan → replaced by **C1's 3 tiers** classified by reuse cardinality.
- ⛔ **"2–4 variants" as a flat range** → replaced by count-by-rung (3 default, 2 at page, 4–5 only
  low-fidelity foundational).
- ⛔ **Set-based Jaccard** for structural distance → replaced by frequency-aware cosine over a
  tag/class/CSS-property fingerprint, after the tests showed it misjudged short markup.
- ⛔ **Single divergence check** → replaced by axis-diff **and** control-diff.
- ⛔ **YAML ledger mirror** — claimed in an early session, never existed. Claim deleted.

### Known defects
| Defect | Severity | Note |
|---|---|---|
| **"4K-first" assumed 3840 CSS px** — a 27″ 4K panel defaults to ~150% OS scaling, so the real logical viewport is ≈**2560×1440** | Medium | A3 §3.7. The method's primary-screen instruction, the Screenroom tuning, and the P1 profile all inherited the marketing number. **Needs owner confirmation of their actual scaling setting** |
| `theme-extract.mjs` emits the raw extracted pick | Medium | A1 §3.10: normalise L to the accent target and clamp C so contrast is guaranteed *at derivation time*. Today it only boosts V |
| Gate does not check that axis params are **visible in a shown state** | High | Root cause of the A≈B round; B2 would have caught it |
| Render surface ignores component tier | High | 566 KB / 36 posters for a component question |
| Every `design-rules.json` rule is `pending` | High | Doctrine enforces nothing today |
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
