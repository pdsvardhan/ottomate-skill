# Skill register — what exists, what governs it, what is actually enforced

> **Resuming work?** Read **`docs/plans/2026-07-28-SESSION-HANDOFF.md`** (v2) first, then this file —
> together they are the complete entry point. Do not bulk-read `docs/research/`.
>
> **TWO PARALLEL TRACKS (owner runs both):** **Track A — Task 2 verification + testing** →
> `docs/plans/2026-07-28-TASK2-FINAL-TEST-PLAN.md` (the test pass) + a requirements-traceability audit;
> Task 2 BUILD is complete. **Track B — Task 3 feature verifier** → `docs/plans/2026-07-28-TASK3-BRIEF.md`
> (self-contained). The handoff carries the **file-ownership map** that keeps the two from colliding —
> read it before either session writes. Older backlog: `docs/plans/2026-07-27-OUTSTANDING-WORK.md`.
> *(The 2026-07-23 and 2026-07-27 handoffs/briefs are superseded, kept for history.)*

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
| `generation/publish-round.mjs` | **Publishes a round INTO THE APP** — page → previews volume, one `proposed` decision per sub-decision, backup-first | ✅ 10/10 tests + real round |
| `preview-build/isolation-gate.mjs` | **G1 §4.3 as code** — the pre-display gate | ✅ 20/20 tests |
| `preview-build/isolation-gate.test.mjs` | The gate's test suite | ✅ |
| `preview-build/build-preview.mjs` | Single-design preview (no options) | ✅ |
| `preview-build/theme-extract.mjs` | Theme-from-content (ImageMagick dominant vibrant) | ✅ re-verified independently |
| `preview-build/template.variant-set.html` · `template.card-wall.html` | Preview shells | ✅ |
| `design-check/design-check.mjs` | **The constraint checker** — tier semantics + `resolveFloor()` | ✅ |
| `design-check/checks.mjs` | The source-method detectors (19 rules + 3 contract keys) | ✅ |
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
| **Isolation gate** | Refuses to show a variant set not proven to differ on its axis and match on all others | ✅ | **31/31** tests; a samey set rejected with exit 2 and nothing written |
| **`axis-realised` — declaration vs artifact** | The declared `axis_values` must actually exist in the panels | ✅ | **Closes a hole found + REPRODUCED 2026-07-27**: three *byte-identical* panels declaring `4px`/`12px`/`20px` passed count, labels, control-diff, axis-diff, blind-sort **and** the constraint checker, and would have been published as three options. Every check read the *declaration*; nothing read the *artifact*. Now `distinct-source` **blocks** (no false alarms) and `value-present` **advises** (a legal unit swap must not block). Tests prove the fake set fails, the honest set passes, whitespace-only differences don't count, symbolic values are never reported, and token mode is unaffected |
| **Style priors — the owner's own history** | Past locked values + explicit rule-outs, cross-project, injected into a round | ✅ **demonstrated live 2026-07-27** | `style-priors.mjs` 10/10, wired into `buildRoundInput`. Closes research gap R1. **Demonstrated end-to-end on a throwaway project** (`docs/demos/2026-07-27-u5-t8-live-demo.mjs`): 5 locked rows POSTed and **read back from the API**, priors assembled → `corner-radius 4px ×2 [pattern]`, three `[weak]` singles correctly labelled *do not treat as a preference*, one hard ban with its reason, and an **explore budget** naming the axes with no history. The comparative measurement ran: a round ignoring the priors re-offered 1 ruled-out value, a round respecting them re-offered 0. **Still true of Screenroom's real ledger: 10 rows, zero locked — so priors there are legitimately empty until the owner picks** |
| **Computed pass, inline** | The computed checks run as part of a round, not as a manual afterthought | ✅ | `computed-runner.mjs` + wired into `build-variant-set.mjs`. Three states, never blurred: `ran` · `unavailable` · `failed`. **Verified both ways** — on Windows it prints `UNAVAILABLE … NOT run, and therefore NOT passed`; on VAULT7A it renders in real Chromium and blocks. ESM resolves bare specifiers from the *file's* location, so `OTTO_PW_ROOT` names the playwright install by absolute path |
| **`control-held` — controls verified in the artifact** | The panels must actually HOLD what the set declared frozen | ✅ | T1. `control-diff` only ever checked that a key was not declared as both control and axis; nothing read the panels. Literal controls are now verified present in every panel or none; a **prose** control is reported *not source-checkable* rather than counted as verified. `isolation-gate.test.mjs` **36/36** incl. a must-fail naming the panel that dropped the control |
| **Inherited controls reach the harness** | A value inherited from prior art is frozen in the artifact, not just noted | ✅ | T6. `build-variant-set.mjs` merges `cfg.inheritedControls` into `control`, config winning on a genuine conflict so a deliberate override stays possible |
| **Rubric — objective half** | Score what is computable; keep judgment separate | ✅ | T9. `rubric-score.mjs` 8/8: contrast, token adherence, scale discipline. **`combined` is deliberately `null`** — summing a measurement with a judgment launders an opinion into a number. An unmeasurable row shrinks the denominator instead of scoring zero |
| **Context gate + core-mechanic + ask-on-primary + pressure-test** | No visuals before audience/use-cases/tone/screen; no page work before the mechanic; no primary decision without an owner choice; no presenting a set that was not checked | ✅ **C6 added 2026-07-28** | `pre-round-gates.mjs`, `stage3-gates.test.mjs` **30/30**. **C6 (AC7):** `primaryDecisionGate` refuses to record a *foundational or promoted* axis without an explicit owner choice (a non-primary axis is unaffected — a round is not a dialog); `pressureTest` refuses to present until every check (contrast · reduced-motion · colour-budget) has **run**, and an `unavailable` check is reported as unavailable, **never rounded up to a pass**. Both referenced at the record/present steps of `stage-2-generation.md`. Context: **blocks at EVERY profile since N1 (owner ruling 2026-07-27)** — it advised at P1 until then, but P1 is the profile actually in use, so the locked spec was soft exactly where it mattered. The cost is bounded because the answers persist: stored context passes at every profile, so it is four questions **once per project**, not once per round, with `recontext` to re-open them deliberately. And `ui-mode:none` **skips** rather than fails — deferring UI is their default. Mechanic: page/site scope blocked without a locked rung-1 decision; a merely *proposed* mechanic does not release it |
| **Source policy — the catalog is consulted** | "library-first, not library-only" enforced instead of assumed | ✅ | C2. `catalog-source.mjs`, 9 cases. **The missing tagging convention now exists**: `variant.source = {kind:'catalog', mc_id}` or `{kind:'bespoke', why}`. Bespoke stays first-class but must say what the catalog could not do. **Demonstrated blocking**: the existing Screenroom round config is refused because no variant declared a source. Candidates ranked the way §2.4 documents — preferred library first, then grade |
| **Colour budget** | Accent on a few surfaces, neutral elsewhere, not monochrome | ✅ **stated half closed (C7, 2026-07-28)** | C4 enforces the *honoured* half (over-budget **blocks** in pixels; monochrome **reported not blocked**). **C7 closes the *stated* half (AC9):** `validateColourBudget` makes the budget **mandatory** in the round config — a positive surface count OR an explicit `{mode:'unconstrained', why}` — fails closed before any build, and carries the choice into the manifest (`colour_budget`) so an exception is auditable, never silently absent. `colour-budget.test.mjs` **6/6** (must-fail: absent · zero · unconstrained-without-why; must-pass: number · unconstrained+why) |
| **One command** | gates → build → check → computed → publish, single invocation | ✅ **now has a test (C3, 2026-07-28)** | C5. `design-round.mjs`. Fails closed at every step, and **refuses to publish a file other than the one this run just built**. **C3 (AC10):** the seam guard (`manifestMatchesBuild`) and arg parser are exported and `design-round.test.mjs` **6/6** covers them plus the fail-closed control flow driven as a real subprocess — a failed build step prints `NOTHING PUBLISHED` and the publish stage never begins (asserted on the output) |
| **Anti-slop tells** | The templated-tax signatures are detected | ✅ | C8. `adv-no-slop-tells`, advisory by construction (each tell is legitimate somewhere; blocking would make a heuristic a law). **Fires on our own `template.card-wall.html`** — the deferred 3px strip *and* an emoji nobody had noticed |
| **Rung-A style boards — schema + distinctness + renderer (C4)** | A whole-vibe direction board is well-formed, two boards are genuinely different directions, and a valid set renders | ✅ **checker + renderer done 2026-07-28; a real rung-A round rides on the test plan** | `board-check.mjs` **8/8** — `validateBoard` (schema: `direction` · 4–6 hex `palette` · `type_voice.{display,body}` · 3–5-word `mood` · `hero_sample`) and `checkBoardSet` (3–5 count bounds + **distinctness by shared-swatch count** — two boards differing in ≤1 swatch are refused; a mean ΔE would wave the accent-swap through). `render-boards.mjs` **4/4** — `renderBoardSet` produces a self-contained, checker-gated, injection-safe page (a rejected or non-distinct set never renders; a `<script>` direction is escaped). **Remaining:** a real rung-A round on live content — folded into the final test plan |
| **Round composition** | How many sub-decisions in one round, which travel together, when to escalate | ✅ | `round-composition.mjs` + 11/11. **≤5 contested axes** (the matrix bound, not the option count — Payne/Bettman/Johnson 1993 + conjoint practice; choice overload is *not* the constraint, d≈0.02); grouped by **perceptual channel**, never split, ordered structure-before-dress; `foundational` axes flagged for **promotion** to cluster scope. All 22 sub-decisions annotated with `channel` + `scope_hint`. Returned as `composition` from `buildRoundInput` |
| **Variant harness** | N labelled variants → one page → one stable URL | ✅ | Real round, 12 posters, 0.87s, published |
| **Per-panel isolation (markup mode)** | Each variant's CSS/ids/keyframes scoped to its own declarative shadow root | ✅ | `harness-dsd.test.mjs` 6/6; verified rendering isolated in the real Artifact sandbox on actual output |
| **Preview pipeline** | fetch → extract → inject → emit, self-contained, CSP-safe | ✅ | ~0.2s; placeholder guard genuinely fires |
| **Asset fetcher (§5D-A)** | Pull round content from a project source — local **or** a project API | ✅ **C2, 2026-07-28** | `asset-fetch.mjs`, `asset-fetch.test.mjs` **7/7**. Pluggable per-asset spec: `{kind:'fs'}` (kept byte-identical — regression-tested) or `{kind:'api', url, headers}` with bounded retry + backoff + a hard timeout. On exhaustion it **throws naming the URL and attempt count — never a placeholder** (the silent-fallback failure the placeholder guard exists for). `fetchAllAssets` is **all-or-nothing** so the build never writes a partial page; `fetchImpl` injected so it is tested with no network; api bytes cached by URL (second fetch hits cache, not the source) |
| **Theme-from-content** | Content → machine-derived accent tokens | ✅ | Independent re-run produced byte-identical colours |
| **`design_decisions` ledger** | One row per decision; open/locked/rejected/graduation queries | ✅ | 21/21 live smoke; migration 0010, journal idx 5 |
| **Lock earned / unlock harder** | `locked` needs `confirmed:true`; reopening needs `unlock_reason` | ✅ | Both 422s verified live |
| **Uncapped rationale** | Design decisions never truncated | ✅ | 2160-char round-trip |
| **Named directions** | 20-direction catalogue + adjective disambiguation | ✅ | JSON validated; **consumed** — the generation method commits to one at rung 0 (both real rounds did) |
| **scope × entry routing** | Scope selects the rungs; entry decides context; `ui-mode:none` is the default | ✅ | `routeRungs`/`routeEntry` in `method-routing.mjs`, `method-routing.test.mjs` 9/9; `references/stage-2-routing.md` |
| **Graduation to `master_components`** | Locked bespoke variant → catalog per H1 | ✅ **BUILT 2026-07-27 (S1b–S10)** | Migration **0011** live (6 H1 columns + `provenance_debt`, journal idx 6, hand-written, backup first). `provenance.mjs` **24/24** · `grade-component.mjs` **16/16** · `dedupe.mjs` + `notices.mjs` **18/18** · `graduate-write.test.mjs` **19/19**. `graduate()` runs six gates — locked · provenance(`requireAll`) · licence · **tokenised** · grade · dedupe — failing closed at each, and **every must-fail case asserts the catalog was provably untouched** (the injected `post()` recorded zero calls), not merely that an error was raised. `apply:true` additionally demands `backedUp:true`: the backup rule is asserted, not assumed. `draftGraduation()` is unchanged and remains the dry run. **Demonstrated on the real catalog, not fixtures:** the first grading pass returned C64/D46/E6 with **zero shippable**, because `spdx_id` was null everywhere and null is RED; all 86 filled `license_note` values read "MIT", so `spdx_id` was backfilled by **transcription** and the 30 rows with no note flagged `provenance_debt`. Re-grade: **B10/C97/D8/E1**, then no A because `author` was null everywhere. **Author backfilled 2026-07-28 (owner-approved, conservative, backup-first `backup-1785238319354.db`):** `library` → author — `ottomate`/`tasks-app`/`balls-of-the-bull-app` → `pdsv` (owner), `react-bits`/`magicui`/`aceternity`/`kibo` → the upstream project name; **87 rows set, 29 `asset-library`/`codepen` left null as ambiguous** (never invented). **Re-grade: A48 / B18 / C20 / D30 — 48 shippable A-grade components, up from zero.** The third-party rows correctly did NOT reach A on author alone: they are third-party origin and still miss `source_url`/`licence_url`/`attribution`/`retrieved_at`. Wired at **4.7b** — it ASKS, never auto-graduates |
| ⛔ ~~**Graduation to `master_components`** (planned only)~~ | `references/graduation-protocol.md` + `graduate.mjs` **draft hook (never writes)** 6/6. **Unit plans: `docs/plans/2026-07-27-STAGE4-GRADUATION-PLANS.md`** — S1b + S2–S10, each with build steps and a must-fail *and* must-pass acceptance case. S1's live-state check **shrank the migration from 8 columns to 6** (`source_url` and a grade column already exist), **reframed S6** (85% of rows already carry a grade nothing can reproduce — the job is making it derivable, and widening A–C to A–F), and **added a prerequisite S1b** (267 dirs on disk vs 116 registered). Next migration is `0011_`, journal `idx: 6`. Three open questions carried to the owner: retro-quarantine of the 30 rows with no licence note, the 17 ungraded rows, and whether tokenise-on-ingest reports or rewrites |
| **Audience profiles P1/P2/P3** | Profile selects which floor rules bind | ✅ | `resolveFloor()` in `design-check.mjs`; test proves P1 and P3 return **different** sets, and that a per-project override beats the preset |
| **Constraint checker (source)** | Mechanically enforce source-readable rules | ✅ | **79 of 79 round-scope rules + 3 of 5 contract keys enforced**, each naming a test. Source checker (pure Node) is wired into `build-variant-set.mjs` after the gate, before emit; blocks exit 2. **0 still `pending`** in round scope |
| **Computed checker (browser)** | The rules that need resolved styles — contrast, coherence, appearance divergence | ✅ | `computed-checks.js` (one script, runs in Node for the math + in real Chromium for the DOM). **3 rules enforced: `floor-contrast`, `adv-cross-component-coherence`, `computed-axis-divergence`.** Math: `computed-checks.test.mjs` 6/6. DOM: `computed-checks.browser.test.mjs` 4/4 on the server's Chromium (real catch + real pass). Demonstrated on round-2 output. Host: `run-computed.mjs` (server) or claude-in-chrome. **A post-render pass, not auto-inlined in the harness yet** |
| **Feasibility gate** | Refuse a variant that cannot RUN | 🟡 | **4 of 6 enforced** (`no-eval` · `no-wasm` · `no-network` incl. the placeholder-service list · `no-inline-handlers`). `feas-baseline-gate` needs real `@supports` parsing; `feas-degradation-bottom-rung` is `computed`. Proven profile-invariant by test |
| **Light AND dark both render (C8, AC4)** | The floors must hold in BOTH colour schemes, not just the one shown in review | 🟡 **assertion done 2026-07-28; per-scheme collection is the browser half** | `design-check/scheme-check.mjs`, `scheme-check.test.mjs` **5/5**. `assertBothSchemes({light, dark})` runs the floors (contrast-led + the always-floors) over records collected under each `prefers-color-scheme` and **names the failing scheme**; **both must be measured** — a scheme not collected is not a scheme that passed. `schemeContrastFloor` is honest about scope (only elements painting their own background; nearest-opaque-ancestor stays a browser job). **Remaining:** run the harness twice (once per scheme) in real Chromium — folded into the final test plan |
| **Cross-component coherence** | Same semantic role → same computed value across components; shared state vocab → same token delta | 📋 | `adv-cross-component-coherence`, C2 §3.10. **This is the mix-coherence check G1 requires and the per-item pick model (doctrine 38) depends on.** Needs a browser; no runner |
| **Rubric scoring pass** | Score variants before presenting | 📋 | Rubric written; no runner |
| **Templated-tax scorer** | F2's 18 binary rows | 📋 | Rows written; no runner |
| **Generation (the producer)** | Anatomy → over-generate 6 → filter 3 → states-pinned harness config | 🟡 | `component-anatomy.json` + `stage-2-generation.md` + `picks-to-ledger.mjs`. One **real round demonstrated** end-to-end. Filter is model judgment (no scorer); no computed appearance check yet |
| **Sub-decision inventory** | Component → named parts + required states + the axes to vary | ✅ | `data/component-anatomy.json`, 3 archetypes, `generation.test.mjs` 8/8 |
| **Bundle → per-item picks → ledger** | A mixed pick → one `design_decisions` row per sub-decision | ✅ | `picks-to-ledger.mjs`; live round-trip on a throwaway project verified `mixed_from` + `rejected[]`. **T5 (2026-07-27): every stored variant now carries its label**, so a pick stays traceable after the next round reshuffles the slot letters |
| **Slot letter vs label — cross-round provenance (T5)** | The stable identity of a variant is its label; the slot letter is presentation and is re-shuffled every round | ✅ | `variant-slots.mjs`, `variant-slots.test.mjs` **21/21**. Strict on write (an unlabelled slot throws, with an error naming the slot and both accepted keys), permissive on read (`readShown` parses the legacy bare shape, a half-migrated row, `null` slots and non-object input without throwing). Wired into **both** writers; `describePicks` names bundles by label. Suites after the change: generation **171/171** · preview-build 17/17 · gate 36/36 · pixel 22/22 · design-check 118/119 (the 1 is the Playwright-only browser test) |
| **Fresh-context rounds** | Each round in a clean sub-agent fed only ledger+constraints+rejected | ✅ **re-practised 2026-07-27 (P4), 5/5 mechanical, verifier proven to bite** | The default in `stage-2-generation.md`; `buildRoundInput` assembles the packet (contested = sub-decisions − frozen; + `rejectedByAxis`). **Demonstrated: round 2 ran in a fresh sub-agent fed the live ledger and its set re-offered NO rejected value + omitted the frozen axis — mechanically verified + rendered** |
| **Golden-file regression gate** | Diff locked targets after every rebuild | ✅ | `diffAgainstSnapshots` + `snapshotForLock` in `ledger-context.mjs`; `ledger-context.test.mjs` 9/9; **demonstrated live** — a snapshot stored on lock round-tripped through the API, the differ caught 14→8. Source/value-level (pixel diff is the computed follow-up). Wired into stage-4 §4.6.5 |
| **Reload-on-resume** | Session start re-reads the ledger | ✅ | `resumeSummary` in `ledger-context.mjs`; wired into SKILL.md session-start step 4 (auto GET + partition into open/locked/frozen/rejected) |
| **`rejected[]` + frozen-controls wiring** | A round is fed what to never re-offer | ✅ | `rejectedByAxis` + `frozenByAxis`; wired into `stage-2-generation.md` input #6; tested |
| **Stage-3 handoff** | Stage 3 builds from the locked design spec | ✅ | `stage3DesignGate` (profile-aware: advise P1/P2, block P3); wired into `stage-3-scaffolding.md` pre-checks + SKILL.md's 2→3 HARD gate. `method-routing.test.mjs` covers it |
| **Design-round gates in the HARD list** | Isolation gate + checker + regression gate are first-class stops | ✅ | SKILL.md 2→3 gate + anti-gaslight bedrock item 7 |
| **Context gate** | No visuals before audience/use-case/tone/screen | 🟡 prose | Still prose; `ui-mode:none` (the default) legitimately skips it, but a cold start's gate is not mechanically enforced |
| **Code verifier** | Independent sub-agent, proves the CODE | ✅ | Task-3 sibling; pre-existing |
| **Feature verifier** | Drives the REAL app, asserts system state | 🟡 **RUN for the first time 2026-07-27 (A4)** | `visual-qa-import.feature-verify.spec.ts` executed on VAULT7A against the live app: **3 passed in 569ms** (happy: report row + screenshot bytes on disk · non-ASCII preserved, not transliterated · NFD preserved but flagged non-canonical → advisory warn). Wrote `feature_verification_reports` id 4 (3 cases, 2 passed, 1 warned) and **cleaned up its own visual-QA reports** — 0 left behind. Recipe: `scp` the harness to `/tmp/fv`, `ln -s /opt/homeserver/ottomate/node_modules`, set `FV_BEARER_TOKEN` / `FV_PROJECT_SLUG` / `FV_RISK_POLICY` / `FV_ASSET_ROOT`. **Still no browser-driving spec** — this is HTTP only, so trace/video/screenshot remain configured-but-never-produced. Harness now unit-tested too (A5, 20/20). **2026-07-28 (Track B): deep research sweep + owner-approved re-plan.** The plugin's first testing/verification research (`docs/research/task3/{T1,T2,T3}` — visual-acceptance/VLM-judge · oracle/case-gen · agentic-verification/reward-hacking) → a **7-layer fail-closed architecture** (`docs/plans/2026-07-28-task3-IMPLEMENTATION-PLAN.md`; spec amended 2026-07-28). Scope broadened to a **commit-time truth gate** (data + visual + claimed-fix). Owner-confirmed: **axe-core/Testcontainers/fast-check IN**, `data-oid` **DEAD**, Lighthouse **OUT**; first target **Maps of Bharat** (indicator→dataset→stats). Still no browser leg — **P1-A is the first build** |
| **Visual-QA intake** | Comment → ingest → classify → lock-in | ✅ | Task 1 complete, dogfooded |
| **Stage 1 USABLE — complete** | U1–U6 of the completion plan | ✅ | **2026-07-27.** U1 anatomy split (golden-identical, 10/10) · U2 derive-from-source (13/13, reproduces 9 of 10 hand-written axes on Screenroom's real `PosterCard.tsx`) · U3 intake (must-ask on an unresolvable target) · U4 worklist (live: 2 items + 36 slots) · U5 picks→code (14/14 against a real git repo) · U6 two correct rounds on real posters. Suites: 117 generation + 31 gate + 55 checks/dsd/card-slots |
| **Round → code** | A locked round writes a real tokens file + spec into the project repo | ✅ **C1 landed 2026-07-28; live dry-run GREEN** | `emit-design-artifacts.mjs` **24/24**. Resolves each locked decision to exactly one of **token · structural · unresolved**, never blurred. **C1 (2026-07-28):** an unregistered question is no longer silently skipped — a page-scope or non-CSS-shaped decision resolves **verbatim to a structural spec entry**, `derived:true` with evidence (invents nothing); a novel question with a CSS-shaped value on a component target mints a token **only if the target's source corroborates it** via `collectEvidence`, else **STOP** (doctrine rule 40 — no fabricated custom property). Token names for derived axes are deterministic + target-namespaced (`--{leaf}-{slug}`). **Demonstrated on the live ledger** (`docs/plans/2026-07-28-C1-derive-resolution.md`): all **15** locked screenroom decisions — every one page-scope/enum — resolve to structural, `derived:true`, **0 unresolved, 0 tokens**, emit gate **GREEN**; the would-be spec carries all 15 with evidence and the tokens file echoes them as comments so none is invisible. Earlier 2026-07-27 run (throwaway project) proved the token path: 5 locked → 3 namespaced tokens + 2 structural, `--dry-run` wrote nothing, real run committed 2 files with the ledger ids, `git remote` empty so nothing pushed, re-emit a no-op. Closes spec §12 criterion 6. Writes+commits on the project branch; **never pushes**, only touches `design/ottomate/`, refuses on a dirty tree (test asserts a hand edit survives), `--dry-run` writes nothing |
| **Derive an inventory from source** | A round can open on a component that has no hand-written entry | ✅ **hardened for real shadcn/Tailwind/Radix (U2b, 2026-07-28)** | `anatomy-derive.mjs`, 18/18. Mechanical evidence + fail-closed validator; judgment stays a labelled model step. 4 must-fail cases preserved: invented part · question outside the registry · tier contradicting the evidence · missing always-states floor. **Its `collectEvidence` is the load-bearing half of C1's token-mint guard.** **U2b closed the C12(2) defects, demonstrated on the same 23 real components (validate 17/23 → 23/23, findings 45 → 9):** classes inside `cn()`/`cva()` are now collected (D1), namespaced `<X.Y>` Radix children are seen (D2), a lone `<Slot>`/`<Comp>` passthrough no longer inflates the tier (D3), Tailwind utilities are recognised (`isTailwindUtility`) and never offered as parts (D4), full-page height utilities mark a surface without a landmark (D5), and weak evidence chooses only the *evidenced* questions rather than dumping all of them into one over-wide round (D6, over-wide 13 → 9). **Residual (honest, not bugs):** composites with zero exactly-evidenced questions legitimately need narrowing before a round (the composition rule's own signal); D5 does not fire on components whose `min-h-screen` lives in the route shell. Audit: `docs/audits/2026-07-28-C12-scenario2-pairing.md` |
| **Design intake** | One vague line → target + scope, or a QUESTION | ✅ | `design-intent.mjs` 15/15. **The load-bearing behaviour is the refusal**: "new button here" with no context returns `ask`, and a non-deictic sentence never silently inherits the open page |
| **The design surface (in-app)** | A round renders and is picked **inside the Ottomate app**, not in a Claude Artifact | ✅ | `/projects/[slug]/design` + `/design/[target]` (app `fba1c18`). **Demonstrated on a real project:** `screenroom.poster-card` r1 — 6 axes, 18 options, iframe serving the real page, and pick → 422 → lock → 422 → unlock round-tripped live. **No schema change** — a round IS the rows sharing (project, target, round) |
| **Prior-art / reuse pass** | Before a round opens, answer "is this axis already decided/built elsewhere in this project?" | ✅ **both halves now built (C9, 2026-07-28)** | **Ledger half** `prior-art.mjs` (13/13): reuse vs coherence vs conflict from the ledger. **Source half (C9)** `source-art.mjs` (`source-art.test.mjs` 8/8): reads the project's **declared** CSS tokens (comment-stripped, multi-file, not a grep) and reconciles them against the ledger — `already-built` · `consistent` · `conflict` (names both, **seeds neither**) · intra-source conflict when one token holds two values across files. **Demonstrated on screenroom's real `app/globals.css`: 175 declared tokens extracted** (incl. `--au=#e9b84c`, `--bg=#101216`), 0 intra-source conflicts. Bounded honestly: reads **declared** values; **resolved** values (cascade/`color-mix()`) remain the computed follow-up |
| **A real end-to-end round on a REAL project** | The locked spec's §12 acceptance | 🟡 | **Re-run 2026-07-27 as TWO correctly-composed rounds** (r1 weight+density, r2 colour+motion, 5 axes each, `per-item-viable`) on **real Radarr poster art** — decisions 18–27. The first attempt (12–17) was deleted: it was 6 axes across all four channels, which the composition rule now forbids. **Not yet complete: the owner has not picked.** |
| **Design index = status board (N2)** | The `/projects/[slug]/design` index is a status board — Pages vs Components, each target rolled up to *final*/*in progress*/*not started* | ✅ **built + deployed 2026-07-28** | App `dec92d6`. `lib/design.ts` `summariseTargets` — pure, superseded rows never count toward progress; `tests/design.test.ts` **6/6**. No migration (a target is the `design_decisions` rows sharing `target_id`). **Verified live on screenroom: 8 final · 1 in progress · 0 not started of 9 targets** — poster-card *in progress*, the page targets *final* |
| **Audience-profile capture + backfill (#319)** | The P1/P2/P3 profile `resolveFloor` binds, captured per project + a suggest-only backfill | ✅ **built + deployed 2026-07-28** | App `dec92d6`: `lib/audience-profile.ts` `suggestProfile` (public-server→P3, ideating/building→P1; vault7a-docker is NOT external) + `resolveProjectProfile` (owner-set ALWAYS wins, suggest-only), `tests/audience-profile.test.ts` **7/7**, surfaced as a chip with evidence on the design index. Plugin: `contextProfile(ledger)` reads `design_ledger.context.profile`, falls back to P1, never blocks (not a CONTEXT_KEY); `stage3-gates.test.mjs` **33/33**. No migration (rides in the context blob). **Verified live: screenroom → P1 (suggested, "still building")** |

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
| **P1 source tail (5)** — `adv-p3-meaning-independent` · `adv-bar-zero-baseline` · `adv-series-cap-and-labels` · `adv-encoding-channel` · `adv-plain-language` | ADVISE | C3/D1/E2 | `checks.mjs` + `checks-p1.test.mjs` **13/13** ✅ |
| **P1 computed tail (9)** — `floor-not-colour-alone` · `floor-focus-ring` · `adv-state-delta-relative` · `adv-derivation-contrast-guarantee` · `adv-density-scale` · `adv-whitespace-first` · `adv-body-type` · `adv-token-adherence` · `adv-dark-mode-type-optical` | 2 BLOCK-floor, 7 ADVISE | A1/A2/A3/C2/G2/A5 | `computed-rules.mjs` + `computed-rules-p1.test.mjs` **21/21** ✅, collector verified in real Chromium |

### Specified, enforcing nothing (`status:"pending"`) — **0 of 79 round-scope**
**Nothing in round scope is pending.** P1 closed the panel tail; P2 closed the last three, which
needed pixel sampling. The 11 remaining `pending` rules in the file are the 7 `scope:'app'` + 4
`scope:'catalog'` rules, excluded from this denominator by owner decision D15 with a `scope_note` on
each. `adv-brand-mark-authentic` remains `declared-unenforceable`, and must never be claimed.

⛔ ~~**Two rules can never be fully enforced by any method**~~ → **one of them now is, partly.**
`adv-glass-legibility` said "needs pixel sampling", and P2 built pixel sampling — so the CONTRAST half
is now measured on the composited backdrop. **Only that half**: nothing knows which pixels the glyphs
cover, so what is enforced is the worst-case region contrast behind the text box, and the rule carries
a `scope_note` saying exactly that. `adv-brand-mark-authentic` remains genuinely unenforceable — no
checker distinguishes an authentic mark from a good imitation; it is a prompt-time constraint plus a
provenance annotation, and it stays out of the denominator.

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

### C6 — 2026-07-27 · COMPLETE for the round checker
**62 of 79 round-scope rules enforced** (29 at the start of the day). **17 pending**, reported as
*skipped*, never as passing — 14 panel-checkable, 3 needing pixel comparison.

**The denominator changed honestly, not conveniently.** 11 rules were excluded because a design round
shows ONE component in isolation and a panel checker structurally cannot see them: **7 `scope:'app'`**
(nav counts, URL state, empty states, disclosure depth) await a separate whole-app audit, and
**4 `scope:'catalog'`** (provenance, licence, font strategy) are ingest rules that move to Stage 4.
Each carries a `scope_note` saying why. Plus 1 `declared-unenforceable`. Owner decision 2026-07-27. 44 pending, reported as *skipped*, never as passing.
**91st rule `adv-brand-mark-authentic` is `declared-unenforceable`** with its reason and is excluded
from the denominator — no method can distinguish an authentic mark from a good imitation, so the real
ceiling is 90.

- **All 91 rules now carry a `method`** — `source` 51 · `computed` 31 · `gate` 7 · `ledger` 2. Nothing
  is unclassified, so every remaining rule has an owner.
- **Two rules were enforced but marked pending**, which hides real coverage — the mirror image of
  overclaiming and just as wrong. `lock-regression-gate` is the snapshot differ (`ledger-context` 9/9);
  `seq-parents-locked` is `buildRoundInput` excluding locked axes. Both now claimed, and the meta-test
  extended to recognise the ledger subsystem as a legitimate enforcement home.
- **14 new source detectors**, each with a must-fail AND a must-pass case (`checks-c6.test.mjs` 15/15):
  reduced-motion · motion duration ladder · compositor-only · easing direction · stagger cap · flash
  limit · z-index ladder · focus-ring-not-shadow-only · icon delivery · deterministic placeholder ·
  realistic content · semantic-vs-brand separation · reduced-transparency · canvas a11y mirror.
- **They fire on real markup, not just fixtures:** `floor-reduced-motion` flagged **our own published
  Screenroom round panels** — they declare transitions with no `prefers-reduced-motion` block.
  ⚠ **Corrected in P3:** the P1 run reported "11 real panels, all clean", but **6 of those 11 were not
  panels.** The r2 variant-set JSON stores `panelTemplate` as a *filename*, and the harness fed that
  24-character string to the detectors as markup, so every r2 verdict in that run was vacuous. The
  real r2 panels are written by `gen.mjs`; against those, **all nine panels failed**
  `floor-reduced-motion`, not three. Honest version: 5 real panels checked, 6 vacuous.
- **Batch 3 — 14 computed rules as PURE FUNCTIONS** (`computed-rules.mjs`, 14/14). Written over
  collected *element records* rather than a live DOM, so each has a must-fail and a must-pass case
  runnable **in plain Node without a browser** — the previous computed rules could only be exercised on
  the server, so their edge cases got argued about instead of tested. The browser pass now only
  *collects*; it makes no judgements. Target size · type-family count · leading-by-role · line length ·
  tabular numerals · radius nesting · shadow light-source · shadow layering · dark-surface floor ·
  neutral tint · type/radius/spacing scale adherence · numeric alignment.
- **Batch 4 — the feasibility tail.** `feas-baseline-gate` and `feas-degradation-bottom-rung`, with a
  **hand-written `@supports` reader** (9 risky features, nested conditions handled).
- **Dependency decision, honoured:** the plugin is still **zero-dependency**. postcss and culori were
  in the OSS plan; the `@supports` reader is ~40 lines and the colour maths already existed, so
  portability across Windows and VAULT7A was kept.
- **Two rules stay honestly out of reach:** `adv-glass-legibility` needs pixel sampling of a
  composited backdrop (server-only, waits on the pixel-diff work) and `adv-brand-mark-authentic` is
  `declared-unenforceable`.
- **A real find, twice over:** the numeric-cell matcher missed every real cell (`"12.4 GB"` has a unit
  suffix) — caught by its own must-fail test on the first run.

### P1 — 2026-07-27 · the panel-rule tail is CLOSED
**76 of 79 round-scope rules enforced** (62 at the start). **3 pending**, all needing pixel
comparison (P2). Plan: `docs/plans/2026-07-27-P1-panel-rule-tail.md`.

- **14 rules, each with a must-fail AND a must-pass case.** 5 source (`checks-p1.test.mjs` 13/13) and
  9 computed (`computed-rules-p1.test.mjs` 21/21). Suites: design-check **116/117** (the 1 is the
  Playwright test, which passes on VAULT7A — verified this session), generation 150/150, gate 36/36.
- **The four chart rules return `notApplicable`, never a silent pass**, each with an explicit test.
  `hasChart()` refuses to count a three-rect hamburger icon as a bar series — an unnamed SVG must
  also carry axis furniture.
- **CIEDE2000 was implemented rather than borrowed.** `adv-token-adherence` specifies ΔE2000 at a
  tolerance of 1–2; the existing `deltaE` is CIE76 and says so in its own comment. At that tolerance
  the two disagree, and CIE76 over-reports saturated blues — where brand accents live. Calling CIE76
  "ΔE2000" would have been a quiet false claim. The coarse CIE76 gate elsewhere is untouched.
- **Both halves landed.** A computed rule enforced in Node and inert in production is enforcement in
  name only, so the collector was extended too — `hasIcon`, margins, `letterSpacing`, `dark`, the
  resolved token set, and forced pseudo-states — and **run in real Chromium on VAULT7A**.

**Four defects that only running it could have found** (every unit test was green throughout):
1. **`adv-plain-language` fired on all three published Screenroom r1 panels**, calling
   `rest · owned AR 2160p DV Owned 2016 14.2 GB i Arrival` a 30-word run-on sentence. It was
   `visibleText()` concatenating every independent card label. **The detector was wrong, not the
   panels** — it now measures prose blocks (terminal punctuation + ≥8 words). Regression test reads
   the real panel byte-for-byte.
2. **The token set came back empty.** A `ShadowRoot` is nodeType 11, so `getComputedStyle()` cannot be
   called on it; `:host` custom properties compute on the **host element**. Reading them off
   `document.body` returned nothing, and `adv-token-adherence` would have reported `notApplicable`
   forever without anyone noticing.
3. **No pseudo-states were collected, while meta still said "forced via CDP".** CDP's
   `DOM.querySelectorAll` does **not** pierce shadow roots, and every harness panel is a declarative
   shadow root. Now walks the pierced tree; meta reports the **count**, and says plainly when zero
   controls resolved.
4. **`<style>` elements were being measured as design.** They render nothing but report a computed
   colour and weight, and were showing up as `style.` rows drifting from the token set. Pre-existing;
   affected the batch-3 rules too.

**Plus one pre-existing false positive the new output made visible:** `rgba(0, 0, 0, 0)` — the
computed background of *every* element with no background — parses to pure black, so
`adv-dark-surface-floor` reported "6 surfaces at or near pure black" on a page with one dark card.
`paintedBg()` now returns null for a fully transparent background.

**The meta-test was strengthened after it passed by coincidence.** The P1 computed rules satisfied it
only because their prose happened to contain the substring `computed-checks`. A guard satisfiable by
accident is not a guard: the alternation now recognises `computed-rules-*.test`, and a **new test
asserts every `*.test.mjs` named in an `enforced_by` actually exists on disk** — demonstrated by
injecting a fake name and watching it fail with the rule id.

**No threshold was moved.** The one must-pass fixture that failed was the fixture's fault:
`rgb(29,78,187)` is ΔL 0.095 off its base — a *press* delta offered as a hover. The rule was right;
the test now pins both bands.

### P2 — 2026-07-27 · pixel comparison, hand-rolled. **79 of 79 round-scope rules enforced**
Plan: `docs/plans/2026-07-27-P2-pixel-comparison.md`. Owner decision **D16** honoured: **zero
dependency, no `package.json`.** Playwright already returns PNG buffers and zlib is in Node core, so
the decoder is inflate plus un-filtering scanlines — `pixel/png-decode.mjs`, deliberately narrow
(8-bit, non-interlaced, colour type 2/6) and **throwing on anything else rather than returning
plausible garbage**, because a mis-read format still yields a divergence number that looks fine.

- **`pixel.test.mjs` 14/14 · `pixel-rules.test.mjs` 8/8.** Every PNG filter type round-trips, mixed
  per row as a real encoder emits them.
- **Checked against a PNG this code did not write.** An encoder and decoder written in one sitting can
  share a misunderstanding and round-trip perfectly, so `capture-fixture.mjs` captures a two-swatch
  render in real Chromium and the suite asserts the decoded pixel values **by number**.
- **Three rules closed:** `adv-accent-budget` (pixel share, not declaration count) ·
  `adv-glass-legibility` (**contrast half only** — see above) · `adv-motion-behind-text` (frame diff).
- **A normalisation bug the tests caught immediately:** the YIQ weights give a *squared* distance, and
  the first version divided by 255 instead of by the black↔white maximum. Every delta read ~30% low —
  black vs white scored 0.71, and a plainly visible grey→purple recolour scored **under** the
  threshold and was reported as no change at all. On a metric whose entire job is "do these look
  different?", that was the whole failure.

**The divergence metric, corrected — and my own plan doc was wrong first.** The plan asserted that
`computed-axis-divergence` compared CSS property *strings*. Reading the implementation showed it does
not: it takes the mean Jaccard distance over sets of *resolved* values, and had already been fixed
once for diluting the score with control properties. The **real** residual defect is narrower: a set
of values says nothing about **how much of the panel each value covers**, and geometry is invisible to
it. So the pixel measure **complements** the Jaccard one; both are reported, and the register no
longer claims a replacement.

**The floor was calibrated against the failure, not against a round we wanted to pass:**
byte-identical panels (the gate hole reproduced 2026-07-27) measure **exactly 0.0000**; the real
Screenroom r1 panels measure **0.0809 / 0.1108 / 0.1581**, peak delta 0.93. Two orders of magnitude
apart. The floor is deliberately **low** (0.5% of pixels), and the reasoning is the point: a
controlled variant set is *designed* to be mostly identical, because the isolation gate requires
everything off-axis held constant. A high "percentage differing" floor would reject exactly the
well-controlled sets the gate demands and reward sloppy ones. This is a **near-identity guard**, not a
score of how different two panels are.

### P3 — 2026-07-27 · the defects our own tooling found, fixed
Plan: `docs/plans/2026-07-27-P3-our-own-defects.md`. Every item was found by a detector this program
built, firing on this program's own work. **Nothing was fixed by moving a threshold** — each fix
changed the artifact.

| Defect | Found by | Fix |
|---|---|---|
| **All NINE published panels** declare transitions with no `prefers-reduced-motion` | `floor-reduced-motion` | Block added to r2's `gen.mjs` and to the three committed r1 panels. All nine now clean |
| `template.card-wall.html`'s coloured 3px left strip — F2's most reliable AI tell, in our own template | `adv-no-slop-tells` | Removed rather than deferred a third time |
| `★` / `▶` glyphs as iconography in **both** templates (only card-wall was in the queue) | `adv-no-slop-tells` | Replaced with inline SVG per `adv-icon-delivery-inline-svg` |
| Harness state captions at **3.22:1**, floor 4.5 | measured | `--dim2` `#5f6575` → `#7c8292`: **4.88:1** on the page, **4.54:1** on the card. Computed, not eyeballed, and kept in the same cool-grey hue family |
| **NEW, not in the queue:** `adv-action-label-specific` fired on every icon button in all nine panels, reporting the glyph `i` / `▶` as a 1-word label — while those buttons carried `aria-label="Quick look"` / `"Play"` | itself, on real panels | `actionLabels()` now returns the **accessible name** (aria-label → title → inner text), the order a browser uses. A rule that misfires on correctly-built markup is worse than one that does not run: it trains you to ignore it |
| **My own fix introduced one:** the reduced-motion block used `!important` | `adv-css-layer-order`, immediately | Dropped — the media query already follows the rules it overrides at equal specificity, so source order wins |

**Deliberately NOT done: republishing the live rounds.** The queue said "and republish".
`publish-round.mjs` writes rows into `design_decisions`, and the owner is mid-decision on 18–27 — the
one thing the program is blocked on. A `prefers-reduced-motion` block changes **nothing** about what
the owner is choosing between; it is inert unless the viewer asked for reduced motion. So the fixes
landed in the source of truth and are proven clean, and **republishing waits for the owner's word.**
Recorded so it reads as a decision, not an omission.

### P4 — 2026-07-27 · the fresh-sub-agent round, PRACTISED (D17)
`stage-2-generation.md` specified it and `buildRoundInput` assembled the packet, but it had not been
*run* since 2026-07-23. Now it has, and the result is verified mechanically rather than read.

**The setup, and why it is not vacuous.** Screenroom's ledger is 10 real rows, **all `in-review`,
nothing locked** — so a rehearsal against them as-is could not test either property P4 exists to
check: no frozen axes and no hard bans means an agent cannot violate them. So the real rows are the
base, and **two locks plus one hard ban are applied in memory only**, labelled as a rehearsal. **The
database is not touched** — the owner is mid-decision on exactly these rows.

**The run.** A fresh `Agent` with no conversation context, given the packet file and nothing else:
3 contested axes (corner-radius · elevation · meta-density), 2 frozen controls, 1 hard-banned value.

**Verified mechanically — 5/5** (`docs/demos/2026-07-27-p4-verify-round.mjs`):
frozen axes **omitted** from every option · the hard-banned `corner-radius: 18px` **never re-offered**
· only contested axes present · every contested axis genuinely moves across the set.

**And the verifier was proven to bite.** Against a deliberately sabotaged output — the banned value
re-offered, a frozen axis presented as a choice, one axis held flat — **4 of the 5 checks fail with
exact detail and the runner exits 1**. A check that has never failed is not evidence.

**A defect-fix confirmed working in passing:** the first fixture's ban did not bind, because
`rejectedByAxis` only honours `grade: 'rejected_with_reason'`. That is the two-grade fix for the
logged "`rejected[]` conflates *not picked* with *rejected*" defect, behaving exactly as designed —
a close second is no longer banned by the act of not winning once.

### Prose only (nothing checks them)
anti-slop tells · harvest-before-ask
*(Context gate → `contextGate` (N1). Core-mechanic → `coreMechanicGate` (C7). Colour-budget-stated →
`validateColourBudget` (C7). Ask-on-primary + pressure-test → `primaryDecisionGate`/`pressureTest`
(C6). All now mechanical.)*

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
**the research sweep, all 22 tracks** · **the source constraint checker + `resolveFloor()` (33/33)** ·
**declarative-shadow-DOM panel isolation (verified in-sandbox)** · **Phase-1 generation — one real
round run end-to-end** (fresh sub-agent → gate → checker → isolated render → live ledger round-trip) ·
**Phase-2 persistence** — rejected[]/frozen wiring, reload-on-resume, and the snapshot regression gate
(demonstrated live) · **Phase-4 wiring** — fresh-context default, scope×entry routing, profile-aware
Stage-3 gate, design gates in the HARD list, graduation protocol+hook; **round 2 demonstrated the
ledger being respected** (fresh agent → no rejected value re-offered, frozen axis omitted) ·
**Phase-3b computed checker** — contrast, cross-component coherence, and the appearance-divergence
backstop, verified in real Chromium (the check that would NOT have false-rejected round 1)

### Pending, in build order
> **Re-planned 2026-07-27** — see `docs/plans/2026-07-27-PROGRAM-REPLAN.md`, which supersedes §3 of
> the session handoff. Phase A (the in-app design surface) is **done**; Phase B (the real round) is
> **published and awaiting the owner's picks**; Phases C (round composition) and D (prior-art pass)
> are new, and come from the owner's own questions.

| Phase | Items |
|---|---|
| ~~**A In-app design surface**~~ | ✅ **DONE 2026-07-27** — `/projects/[slug]/design` + `/design/[target]` (app `fba1c18`), `publish-round.mjs` (10/10), artifact path retired across 4 files. No schema change |
| **B Real round on a real project** | 🟡 **PUBLISHED 2026-07-27** — `screenroom.poster-card` r1 live (decisions 12–17). **Remaining: the owner picks, then lock + snapshot.** Deviation to disclose: this round was authored **inline**, not in a fresh sub-agent (the fresh-context property was demonstrated in rounds 1–2 and is unchanged) |
| **C Round composition + anatomy expansion** | The owner's question 1. An interim rule for round size + which axes travel together + when to escalate to cluster; then archetypes beyond the current 3 |
| ~~**D Prior-art / reuse pass**~~ | ✅ **DONE 2026-07-27 (ledger half)** — `prior-art.mjs` 13/13, wired into `buildRoundInput`, demonstrated on Screenroom's live ledger. **D2 remains: the source scan** — "what does the project's built code already use?" needs a per-project source-root convention + real CSS parsing (postcss), not a grep |
| ~~**Research sweep**~~ | ✅ **DONE 2026-07-23 — all 22 tracks distilled** |
| ~~**1 Generation**~~ | 🟡 **LARGELY DONE 2026-07-23** — `component-anatomy.json` (sub-decision inventory) ✅ · render-by-tier in the anatomy ✅ · `picks-to-ledger.mjs` bundle→per-item picks ✅ (live round-trip verified) · `stage-2-generation.md` method (over-generate 6 → filter 3) ✅. **A real round ran** (fresh sub-agent → gate → checker → isolated render → live ledger). **Remaining:** a mechanical rubric *scorer* (filter is model judgment); a *computed rendered-appearance* divergence check (backstop for stylistic bundles); the states-pinned render is convention, not a gate |
| ~~**2 Persistence**~~ | ✅ **DONE 2026-07-23** — `rejected[]`/frozen wiring · reload-on-resume · snapshot differ, all in `ledger-context.mjs` (9/9), wired, and the differ + lock/unlock 422s **demonstrated live**. No DB change (table + API already supported it) |
| ~~**3a Enforcement — source**~~ | 🟡 **LARGELY DONE 2026-07-23** — `resolveFloor()` ✅ · the source checker ✅ (15 rules + 3 contract keys, 29/29 tests) · wired into `build-variant-set.mjs` ✅. **Remaining:** `feas-baseline-gate` (`@supports` parsing) · `source_policy` (needs a tagging convention) · constraint *capture* (the contract is read from config; nothing writes it to the ledger yet) |
| ~~**3b Enforcement — computed**~~ | 🟡 **STARTED 2026-07-23** — the 3 highest-value computed rules built + demonstrated in real Chromium (`floor-contrast`, `adv-cross-component-coherence`, `computed-axis-divergence`). **Remaining:** the ~12 other computed rules (shadow/glass/type-optical/scale/…) against the same architecture; auto-inlining the computed pass into the harness; the mechanical rubric scorer's objective half |
| ~~**4 Wiring**~~ | 🟡 **DONE 2026-07-23 (wiring)** — fresh-context default ✅ · scope×entry routing ✅ · Stage-3 profile gate ✅ · design gates in the HARD list ✅ · graduation **protocol + non-writing hook** ✅. **Remaining: the graduation ingest SUBSYSTEM** (migration for provenance/grade columns + grade runner + dedupe + NOTICES) — its own unit |

### Superseded — kept deliberately
- ⛔ **Claude Artifacts as the preview host** → **the Ottomate app** (owner decision 2026-07-27).
  A round is written to the previews volume and served by `/api/previews`; the picks happen on the
  same screen and write to `design_decisions` directly. **The harness is unchanged** — only the
  destination moved. Updated: `stage-2-design-method.md` (host line, loop rule 4, pipeline stage D),
  `stage-2-generation.md` §6, `stage-2-components.md`, and `build-variant-set.mjs`'s closing hint.
  Why: the ledger and the picking lived in two different places, so every round needed a manual
  transcription step between them — which is exactly where a decision goes missing.
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
- ⛔ **`block-svg-id-collision` as `block_owner`** → **`advise`** (2026-07-23). It was the stopgap for the
  missing per-panel isolation; now that markup panels render in isolated declarative shadow roots
  (`4813ffa`), a cross-variant collision is harmless, and keeping it a hard block would reject
  legitimate isolated sets. Detector still runs and annotates. Owner-disclosed.
- ⛔ **"Graduation to `master_components`" as an undesigned Phase-4 line item** → **H1 is its spec.**
  6th instance of the pattern. Graduation is not "copy the winning variant into the catalog"; H1
  defines an ingest contract: provenance captured **at ingest or lost forever** (source, author, SPDX
  id, licence URL, attribution, retrieval date; no provenance → quarantine) · GREEN/AMBER/RED licence
  tiers with `-NC`/`-ND`/unknown rejected · framework coupling stripped · **tokenised, because a
  baked-in `#fff` is a downgrade not an entry** · graded A–F with only A/B shipping · deduped
  **structurally *and* visually** · and a NOTICES block assembled into the output.
  **Consequence for the plan:** Phase 4 needs a live-state check first. ✅ **RUN 2026-07-27 — and it
  falsified two standing claims.** (1) The catalog is **116 rows, not 179**: `GET /api/master-components`
  returns `count: 116`, and the route applies no limit and no default filter (read directly). Every
  "179 catalog components" claim in this register and in the plans was wrong. (2) The columns are
  **not** all absent — `source_url`, `license_note`, `quality_grade`, `ingestion_method`, `source_paths`
  already exist, and `quality_grade` is **85% filled** (A 31 · B 21 · C 47 · null 17). `license_note` is
  non-empty on 86/116, `source_url` on 40/116. **Genuinely missing: six columns** — `spdx_id`, `author`,
  `attribution`, `licence_url`, `retrieved_at`, `trademark_flag`. So the migration is smaller than H1
  implied, and S6 is "write the runner that justifies the grade", not "add grading". **A drift nobody
  planned for:** **267 component dirs on disk vs 116 registered** (to-do #306) — graduation would write
  into a catalog that is 57% unregistered, so reconciling that is a prerequisite, not a footnote.
  Named exclusions to encode: **Shadertoy (CC BY-NC-SA 3.0 — non-commercial *and* viral)**, **unDraw
  (per-image only; its licence forbids repackaging in packs, scraping, and AI-training use)**,
  **Rive (WASM)**. Full numbers: `docs/plans/2026-07-27-OUTSTANDING-WORK.md` §B.

### Known defects
| Defect | Severity | Note |
|---|---|---|
| ~~**Variant harness has no namespace isolation between panels**~~ → **RESOLVED + verified end-to-end 2026-07-23** | — | **Fixed: markup-mode panels now emit as static declarative shadow roots** (`renderPanelStatic` in `build-variant-set.mjs`, `{{PANELS_HTML}}` slot, client render gated to token mode). **Verified in the owner's Chrome inside the real Artifact sandbox** on actual harness output (`https://claude.ai/code/artifact/57e854cb-…`): panel A green/flat/sharp, panel B pink/raised/rounded — two fully isolated styles, neither leaking. Tests: `harness-dsd.test.mjs` 6/6. Owner chose DSD from the probe (`…/1d77da20-…`): shared-doc **leaks**, DSD **isolates + survives the publish pipeline**, iframe srcdoc renders but is unmeasurable under the sandbox. Known bound: DSD `<template>` content is inert, so a `<script>` in a variant does not execute (flagged in the panel meta; fine for style/layout axes). Plan: `docs/plans/2026-07-23-C1-harness-dsd-isolation.md`. **Follow-up now available:** `block-svg-id-collision` is redundant once panels are shadow-isolated — downgrade block→advise on owner OK. |
| ~~**Every variant-set / card-wall artifact renders BLANK** (`min-height:100%` on the root)~~ → **found + fixed 2026-07-23** | — | **Pre-existing, unrelated to the DSD change, surfaced by the render verification.** The Artifact frame sizes its iframe to content `scrollHeight`, so a percentage `min-height` resolves against an indefinite-height body and collapses the frame to zero → the whole preview is blank. `min-height:100%` → `100vh` in **both** `template.variant-set.html` and `template.card-wall.html`. The exact reason "documented ≠ demonstrated": all unit tests passed while the real artifact was blank. |
| ~~`path.isAbsolute(cfg.template)` throws when `template` is omitted~~ → **fixed 2026-07-23** | — | Pre-existing latent crash; the `?? default` right after implied optional. Resolve the name first. | Consequences: a duplicate SVG `id` makes `url(#id)`/`<use>` resolve to the **first** match, so variant B renders with variant A's gradient/filter; a duplicate class name plus a variant `<style>` block lets the **last** panel restyle its siblings; `@keyframes` names and any `:root` custom property go document-wide. **A second, likely more common root cause of the A≈B round** than the one already listed below — the gate passes because the *source* differs, while the *display* is identical, which is exactly what the gate exists to prevent. Also: **`<script>` inserted via `innerHTML` never executes**, so a JS-driven variant silently does nothing. **Scope:** only the `panelTemplate`/`markup` mode. **Token mode is structurally immune** (it varies only inline custom properties), which is why no round has hit this yet — but Phase 1 generation is built on markup mode. **Status: identified by code inspection, NOT yet reproduced** (a repro needs a browser; the cascade is not observable from Node). Candidate fixes, to be decided in the Phase 1 plan doc: (a) build-time prefix rewriting of ids/classes/keyframes — robust, needs a real HTML+CSS rewriter; (b) `iframe srcdoc` per panel — total isolation, no rewriting, but per-panel height management and the known iter-16 iframe-scrollbar caveat; (c) **declarative shadow DOM** (`<template shadowrootmode="open">`) — native id + CSS scoping, no iframes, no script, and the current front-runner, **pending a Baseline-tier check per E2 rule 106** |
| ~~**"4K-first" assumed 3840 CSS px**~~ → **RESOLVED 2026-07-23 by measurement, and it is worse than A3 guessed** | — | **Dell S2725QC, 27.1″, 3840×2160, 162 PPI, at 175 % scaling** (one notch above Windows' recommended 150 %; the laptop panel is detached, so this is the *only* display). Effective DPI 168 → **logical viewport 2194×1234**, browser content box ≈**2194×1100** — ~14 % wider than 1080p, **not** the 2560×1440 A3 §3.7 predicted. Effective ≈93 PPI is *below* the 110–140 comfort band, i.e. the owner deliberately runs a **larger** UI: err generous, never cramped. Probed with `GetDpiForMonitor` + `EnumDisplayDevices`. Doctrine rule 83 and the P1 profile row now carry the measured number |
| ~~`-webkit-font-smoothing` in both preview templates~~ → **FIXED 2026-07-23** | — | E2 §3.13. macOS-only and non-standard: a no-op on the owner's Windows machine, so its only effect was making Mac viewers see a lighter design than the one being tuned. Removed from `template.variant-set.html` + `template.card-wall.html` |
| 34 of 51 rules have no `method` field | Low | The 17 added/updated this session declare `source` or `computed`. Classify the rest when the checker is built — the field decides which runner owns each rule |
| ~~`theme-extract.mjs` emits the raw extracted pick~~ → **FIXED (C10, 2026-07-28)** | — | A1 §3.10: it clamped HSV *value*, which does not guarantee contrast for a dark hue. `normaliseForContrast` (owner ruling: dark canvas `#101216`, floor 3:1) clamps chroma into a band, then moves luminance into `[Llo, Lhi]` — corrective only, so a well-behaved accent (gold `#e9b84c`) is unchanged. `theme-extract.test.mjs` **6/6** (a deep blue failing 3:1 passes after; gold untouched; a stricter floor demands more luminance). ~~Demonstrated on 6 real radarr posters: 0 below 3:1~~ **CORRECTED 2026-07-28 (final test pass, D-1): the 6-poster spot-check overclaimed — across the FULL 349-poster population, 2 accents land at 2.80/2.85:1 on `#101216`** (#64, #78; deep-indigo raws). The normalise rescues 77 of 79 raw sub-floor picks (sound + valuable), but `normaliseForContrast` only raises HSV value and never desaturates when a saturated blue caps its luminance at V=1, so the guarantee is not universal. Fix scoped in `docs/audits/2026-07-28-task2-final-test-run.md` §5 |
| Gate does not check that axis params are **visible in a shown state** | High | *A* root cause of the A≈B round; B2 would have caught it. **See the namespace-collision defect above for a second, independent mechanism** — both produce "source differs, display identical", and fixing only one leaves the gate defeatable |
| Render surface ignores component tier | High | 566 KB / 36 posters for a component question. **E1 §3.2 now supplies the budget the complaint lacked: ≤1 MB snappy, ≤2 MB acceptable, >2 MB a budget event — so 566 KB was *within* budget.** The defect is the wrong **surface** (a page rendered to decide a component question), not the weight. Fixed by render-by-tier in Phase 1, not by shrinking anything |
| ~~Every `design-rules.json` rule is `pending`~~ → **61 of 90 still are** | Medium *(was High)* | 29 rules + 3 contract keys enforced with tests (26 source + 3 computed). The checker reports unimplemented rules as **`skipped`**, so coverage cannot be mistaken for a pass |
| The checker only runs in the harness's **markup mode** | Medium | Token mode varies only inline custom properties, so there is no per-variant source to check. The build prints `constraint check: SKIPPED` rather than a pass that checked nothing — but it does mean **every round run so far would have been unchecked** |
| `.sr-stat::before` 3px left strip in `template.card-wall.html` | Low | F2's most reliable AI tell, in our own template. Deferred by owner |
| DOM-commenter extension has **no git remote** | Medium | Local-only; "pushed" claims were no-ops |
| ~~The 3 locked specs live outside version control~~ → **CLOSED 2026-07-27 (A6)** | — | The plugin's `docs/specs/` copies are now **canonical** by owner ruling, each carrying a banner saying so. The Desktop paths hold a pointer explaining the move, and the verbatim pre-move text is preserved at `Desktop/Skills CC/Ottomate/superseded-specs-2026-07-27/` — **nothing deleted**, because a spec that vanishes reads as loss. Measured before moving: Task 1 and Task 3 were **byte-identical**; **Task 2 differed** by exactly the §11b amendment (CSS-interactive), which the Desktop copy never received. That divergence is the defect producing its first real consequence — the 2026-07-27 clause audit had to score two different texts |
| ~~**No round-composition rule** (G-A)~~ → **CLOSED 2026-07-27** | — | `round-composition.mjs`, 11/11, cited, wired. Its verdict on the round already published: **it was composed too wide** — 6 axes spanning all four channels in one 18-cell matrix, where the rule says 2 rounds (weight+density, then colour+motion) and 5 of those axes should have been promoted to cluster scope first. **Falsifiable prediction on the live round: if every pick comes from one panel, the owner chose non-compensatively and the composition was the cause.** |
| **The anatomy covers 3 archetypes** | **High — now the binding constraint** | media-card · button · data-table-row. Every other target has **no** sub-decision inventory, so a round on one would have to invent axes — which doctrine rule 40 forbids. **Writing more archetype files does not scale** (there is no bound on component kinds). The structural fix is to derive sub-decisions from **tier × part × channel** with archetype files as *overrides*, plus a classifier from a real component to a tier — not a growing hand-written catalogue |
| ~~**`anatomy-derive` is unreliable on real shadcn/Tailwind/Radix source (C12(2))**~~ → **FIXED by U2b 2026-07-28** | — | The 20-component pairing run found six demonstrated defects: blind to `cn()`/`cva()` (6/23 failed), blind to namespaced `<X.Y>` children, a `<Slot>` inflating the tier, Tailwind utilities taken as parts, surface under-detection, and a weak-evidence fallback that forced over-wide rounds. **U2b fixed D1–D4 + D6 and demonstrated it on the same 23 components: validate 17/23 → 23/23, findings 45 → 9, over-wide 13 → 9.** D5 generalises but does not fire on this corpus (`min-h-screen` lives in the route shell). Residual 9 are honest (zero-evidence composites the composition rule correctly asks to narrow). See the system row + `docs/audits/2026-07-28-C12-scenario2-pairing.md` |
| **Nothing turns a locked decision into code** | **High** | The pipeline's output is a set of strings (`corner-radius = 4px`). No module emits a token file, a CSS block, or a design spec from locked decisions, and `stage3DesignGate` only checks that decisions *exist*. Applying them to the project is prose. **This is the end-to-end gap: the method produces decisions, not artifacts** |
| **`rejected[]` conflates "not picked" with "rejected"** | **High** | Picking A writes B and C as `rejected` with `why_rejected: 'not selected in the per-item pick'`, and the method says a round must **never re-offer a rejected value**. So a close second is banned permanently by the act of not winning once. Needs two grades — `not_selected` (may return) vs `rejected_with_reason` (hard ban) — and only the second should bind |
| ~~**`variants_shown` is keyed by SLOT letter, and slots are re-shuffled every round**~~ → **CLOSED 2026-07-27 (T5)** | — | `variant-slots.mjs` + `variant-slots.test.mjs` **21/21**. The label is now the identity and the slot letter is presentation. **Write side is strict:** a slot with no label is **rejected** by both writers (`buildRoundPayloads` and `picksToLedger`), because a row written without one is unresolvable the moment the next round reshuffles and there is no later chance to add it. **Read side tolerates the legacy bare shape forever** — rows 18–27 predate this and are deliberately NOT rewritten; quietly re-writing live ledger rows to make a format look consistent is the kind of history edit the anti-gaslight rules exist to prevent. `resolveLabels` accepts the harness's own `slot_mapping` as well as a hand-authored `variant_labels`, which removes the transcription step that was where a label got lost. The acceptance criterion is expressed **as code** (`isTraceableAcrossRounds`) so a test asserts it instead of a human comparing two JSON blobs, and the must-fail cases cover blank, whitespace-only and non-string labels. The app picker was already T5-aware (dual-shape reader, `mixed_from:{variant,label}`, renders `label ?? slot`) — **the plugin was the half that was never done** |
| ~~**`inheritedControls` is computed and then dropped**~~ → **STALE ROW, closed by T6; corrected 2026-07-27** | — | The row claimed `build-variant-set.mjs` never reads them. It does: `build-variant-set.mjs:118` (`const inherited = cfg.inheritedControls ?? {}`), merged into `control` with config winning a genuine conflict, and §2's T6 row has said so since it landed. Covered by `prior-art.test.mjs:76-87`. **A defect row left open after its fix is the same class of error as a rule marked `pending` while working** — found while listing Task-2 work, not by a test. The Known-defects table needs a sweep for others like it |
| ~~**The three live round manifests cannot be rebuilt or republished as they stand**~~ → **rebuild-blockers CLEARED (C11, 2026-07-28); republish still owner-gated** | — | Two blockers were: no per-variant `source` (C2 source policy refused), and — after C7 — no stated `colorBudget`. **C11 added `source:{kind:'bespoke', why}` per variant + `colorBudget:4` to all three configs** (`docs/rounds/screenroom-postercard-r1/variant-set.json` + r2 `variant-set-A/B.json`). **All three rebuild GREEN, demonstrated on BOTH hosts:** r1 locally (Windows), r2-A/B on VAULT7A with real posters (gate PASS · constraint check PASS 0-blocking · source policy PASS · 885 KB). **REPUBLISHED 2026-07-28 (owner ruling: r1 as round 1, r2-B as round 2; r2-A discarded).** Backup-first each; T5 labels derived by matching each round.json slot's axis-values to the config variant (bundle identity — robust to the harness shuffle). Live: `screenroom.poster-card` round 1 = decisions **55–60** proposed, round 2 = **61–65** proposed; the old **18–27 superseded** by `--replace`; preview URLs served under `/api/previews/design-rounds/screenroom/screenroom.poster-card/r{1,2}/`. The owner picks on the design surface. Note: r2 configs are generated by `gen.mjs`; if re-genned it must carry `source` + `colorBudget` |
| **The catalog is bypassed** | Medium | `must_use` was empty on the real round and `source_policy` is `pending`, so "library-first" is enforced by nothing. ~~179~~ **116** catalog components exist (measured 2026-07-27; the 179 figure was never true of `master_components`) and the design method never consults them |
| **Catalog drift — 266 dirs on disk, 116 registered** | **Medium — CLASSIFIED 2026-07-27 (S1b), not yet resolved** | 267 entries = **266 dirs + a stray `registry.json`** (Apr 5, pre-dates the table), so the gap is **150**, not 151. All 150 classified, each in exactly one class, **nothing deleted**: **A render-inline-ready 66** · B default-export-with-props 4 · C default-export-aliased 1 · **D named-export-aliased 58** · E named-export-no-alias 16 · web-multifile 5. **This falsifies a standing claim**: the register and memory both said the 2026-07-04 sourcing sprint produced ~90 "self-contained render-inline" components and that "178/179 render LIVE" — only **66** are render-inline-ready, and 58 are named exports with unresolvable `@/` aliases. Worked example read in full, `mc-ai-token-counter`: named export, required props, `import { cn } from "@/lib/utils"` — three reasons it cannot render, in 752 bytes. **They were never finished, not merely unregistered.** Only class A should re-ingest, and only through the S3 gate. Report: `docs/audits/2026-07-27-S1b-catalog-drift.md` |
| **Our published Screenroom r1 panels are ~10× under the accent budget** | Medium — **owner judgement, not a code fix** | Found by P2's own rule on our own work: `#e9b84c` covers **0.72% · 0.51% · 1.11%** of rendered pixels against the doctrine's 10±5%. **The threshold was NOT moved.** The honest caveat is carried in the finding text itself: the denominator is the whole panel *including poster art*, which carries its own colour, so the accent's share of *design* surface is higher than the raw number. A screenshot cannot cleanly separate content from chrome. `advise` tier, so it annotates. **The owner decides whether these cards want more gold** |
| ~~`adv-dark-surface-floor` counts every transparent element as a pure-black surface~~ → **FIXED 2026-07-27 (P1)** | — | `rgba(0, 0, 0, 0)` is the computed background of *every* element with no background, and it parses to pure black. Reported "6 surfaces at or near pure black" on a page with one dark card. Pre-existing since batch 3; surfaced only when the P1 collector ran for real. `paintedBg()` now returns null for a fully transparent background |
| ~~**No prior-art / reuse pass** (G-B)~~ → **BOTH halves CLOSED (ledger 2026-07-27, source C9 2026-07-28)** | — | `prior-art.mjs` answers "already decided" from the ledger; `source-art.mjs` (C9) answers "already built" by reading the project's declared CSS tokens and reconciling against the ledger (conflict named, never silently seeded). Demonstrated on screenroom's real 175-token `globals.css`. Residual: **resolved**-value scanning (cascade) still needs a browser — the computed follow-up |
| ⛔ ~~"`data-oid` — one instrument, three consumers"~~ → **CLAIM WITHDRAWN 2026-07-27 (owner decision)** | — | `grep -rc data-oid` over Screenroom's `app/` + `components/` returns **0**, and the owner has chosen **not** to stamp it. So the three-consumer wiring (Task-1 comment→component · Task-3 test selector · Task-2 design target) **is not real on any live project**, and the register no longer claims it. **`target_id` is a chosen identifier — a label, not a wire.** That is a supported way to work: the ledger, the picker and the emitter all key on the label consistently, and nothing in the design method requires the attribute. What it costs: a rename of a component does not invalidate its design decisions, because nothing connects them. Stamping remains available later; it is not a prerequisite for anything |
| ~~The harness cannot inject real content into a markup panel~~ → **FIXED 2026-07-27 (U6a)** | — | Found while planning Stage 1: the harness had six TEMPLATE-level placeholders and **none per-card**, so a markup panel received no shared content at all — theme-from-content and markup mode were **incompatible**. That, not only a bad poster search, is why round 1 used CSS gradients. `fillCardSlots` (9/9) substitutes `{{IMG_n}}`/`{{TITLE_n}}`/`{{META_n}}`/`{{ACCENT_n}}` before the gate, so every check reads the artifact that will render |
| ~~The round's poster art is the initials-fallback because no posters exist locally~~ → **THE CLAIM WAS WRONG** | Low | **Correction 2026-07-27: 348 real posters ARE on the box**, at `/opt/homeserver/appdata/radarr/MediaCover/<id>/poster-500.jpg`. The original search only covered `/mnt/storage/media`. `theme-extract.mjs` runs on them and returns genuinely varied accents (`#3395A9` teal · `#DDA257` gold · `#BF3F2C` red · `#266E8C` deep blue · `#A44621` burnt orange). So theme-from-content was **not blocked — it was skipped by a bad search.** Round 1 still uses the fallback treatment; rebuilding it with real posters is available whenever the owner wants |
| ~~**"§4.7 has no feature-verifier leg" (Task-3 brief WP8 claim)**~~ → **FALSE — NO CONTRADICTION, confirmed 2026-07-28 (Track B)** | — | The 2026-07-27/28 Task-3 briefs claimed `SKILL.md:86` (feature verifier at 4.7) contradicts `stage-4-mini-pipeline.md` §4.7 ("describes one verifier, no feature leg"). **Both are correct and agree.** The §4.7 sibling-gate leg (L197–205) has existed **unchanged since the original Task-3 commit `08befda`** (2026-07-23 05:28): `git log -S "Feature verifier — the sibling gate"` and `git log -L195,206:…stage-4-mini-pipeline.md` each return **only** `08befda`; the WP8 claim was written **4 days later** (2026-07-27 brief) and copied forward without re-reading the file — a skim that stopped at the 4-pass code-verifier paragraph before reaching the sibling-gate one. Wiring is consistent at **six** points (`SKILL.md:41/55/63/86`, `stage-3-verifier.md:10`, §4.7). **Fix (clarity only, wiring was already right):** a signpost added under the `### 4.7` heading naming both verifiers up front, so the skim-error cannot recur. `ledger-writes.md:169` is NOT a rival endpoint (that is the *code* verifier's 4-pass write; the feature verifier posts to `/api/feature-verification-reports`, table `feature_verification_reports`, migration 0008 — A4 wrote id 4). Full dig: `docs/plans/2026-07-28-task3-WP8-4.7-wiring-resolution.md` |
| **Computed `colourBudget` over-counts distinct accents** (D-2) | Medium | `computed-checks.js:201` keys accents by the full resolved rgba string, so one hue at N opacities (`rgba(233,184,76,0.1)` vs `…,0.45`) counts as N accents, and a borderline dark neutral (`rgb(26,30,40)`, sat 0.35, max 40) slips past the neutral cutoff. On the live r1 output this produces a **false BLOCK** ("5 distinct accents vs budget 4") for a set that uses one gold hue. Fix: quantise to hue (ignore alpha) and widen the neutral filter. Found by the final test pass (scenario 1 computed stage). `docs/audits/2026-07-28-task2-final-test-run.md` §5 |
| **The computed pass is not fail-closed at publish** (D-3) | Medium | A round config omitting `computed.cwd` (or a host without Chromium) publishes in the `UNAVAILABLE` state without the pass ever running. The live r1 round shipped with `computed:null` (decisions 55–60, republished 2026-07-28); when the computed pass finally runs it **BLOCKS** (by D-2). So the method's "MUST NOT be presented" never gated the live publish. Register already noted "post-render pass, not auto-inlined yet" — the final test pass makes the consequence concrete. Found by scenario 1 |
| **`design-round --dry-run` refuses the committed r1 manifest at publish** (D-5) | Low | `round.json` carries no T5 variant labels (derived at republish), so the T5 write-guard fires and the one command stops at publish. Correct fail-closed, but the committed manifest is not directly one-command-publishable, and the "fetch→extract" front of the pipeline is not folded into `design-round` (AC10). Found by scenario 1 one-command |
| **rung-A distinctness is palette-only** (D-6) | Low | `checkBoardSet` refuses two boards differing in ≤1 swatch (ΔE<8); named directions that differ in type-voice/mood/philosophy but share a neutral+single-accent skeleton (editorial vs minimalism) are refused. Arguably the intended samey-trap guard, but type/mood/hero contribute nothing to distinctness, so a single-world app must diversify neutrals to present 4 directions. Found by the rung-A leg |
| **source-art reconcile is token-only** (D-7) | Low | On the real screenroom ledger it finds no conflict — the 15 locked decisions are enum/structural, not token-shaped — and the stored `brand_tone: "away from gold-on-charcoal"` vs the built gold-on-charcoal is a *tone* conflict a token-level reconcile cannot represent. Conflict-naming proven only on controlled input. Found by scenario 5 |
| **The catalog is bypassed — concrete number** (D-8) | Medium | The r1 round declared bespoke with "candidates: none", but `catalogCandidates(media-card, composite)` on the live 116-row catalog returns **5** (mc-3d-card, mc-3d-card-hover, mc-3d-cutout-card, …). Corroborates the standing "catalog is bypassed" defect with a count: candidates existed that the round declared absent. Found by the matrix source cell |
| ➕ **Suite counts in this register lag the suites** | Low | Measured 2026-07-28 on VAULT7A: design-check **124/124** (register says 118/119), preview-build **36/36** (says 29/29), generation 293/293, pixel 22/22, isolation-gate 36/36 = **511 green, 0 fail**. The register *under*-counts (the safe direction). Refresh the §2 evidence cells when next editing them. `docs/audits/2026-07-28-task2-final-test-run.md` §0 |

**Final test pass (Track A, 2026-07-28):** the six §12 scenarios all end in a working round or a correct
named refusal; 5/6 browser legs pass (C10 is the one FAIL, D-1); the parameter matrix passes. Full
record: `docs/audits/2026-07-28-task2-final-test-run.md`. Requirements-traceability (envisioned vs
materialised, per AC): `docs/audits/2026-07-28-task2-traceability.md` — **all 10 ACs met, 5 fully, 5 with
a named non-blocking gap**; the three recurring gaps are catalog consultation (D-8), computed-at-publish
(D-3), and thin token output on real data (AC6).

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
