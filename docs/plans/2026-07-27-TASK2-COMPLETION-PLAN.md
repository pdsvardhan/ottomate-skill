# Task 2 — the completion plan

**Written 2026-07-27 after the deep dive.** Supersedes `2026-07-27-PROGRAM-REPLAN.md` §5 (which
predates the deep-dive findings and the owner's answers below). The re-plan's §1–§4 — the gap
analysis, the research verdict and the OSS table — still stand.

**Finish line:** the locked spec's **§12, all 10 criteria**, plus the defects the deep dive found.
Nothing open-ended: the list below is the whole of it.

---

## 0. Owner decisions this session — settled, do not re-litigate

| # | Decision |
|---|---|
| D5 | **Replace the published round.** Scrap `screenroom.poster-card` r1; republish as **two correctly-composed rounds** using **real Radarr poster art** |
| D6 | **Enforce all 90 rules.** Not a subset. *One exception, declared:* `adv-brand-mark-authentic` cannot be mechanically checked by any method — it ships as a prompt-time constraint + provenance annotation, marked **declared-unenforceable-with-reason**, never counted as enforced. The other 89 are all mechanizable, glass legibility via pixel sampling |
| D7 | **Order: usable → trustworthy → complete.** A tool that works in daily life first |
| D8 | **Graduation is IN Task 2, scheduled LAST** |
| D9 | **A locked round writes a real CSS/token file into the project repo.** Not a spec document — actual code the project imports |
| D10 | **The worklist is a query over `iteration_items`**, not a new table. Every source the owner named (a DOM comment, a passing dislike, a full rebuild, a new feature) already funnels into that row, and it already carries `target_kind` + `target_id`. `project_todos` is the wrong table — title + done flag only, and a 300-char cap |
| D11 | **No separate anatomy-approval gate.** The owner's real input is one vague line. Derive the inventory from the component's code silently; surface the derived axes **inside the round presentation**; correction happens in-flight; the inventory is saved once it survives a round |

---

## 1. Why only 3 archetypes — the root cause, and the fix

`component-anatomy.json` is hand-written, and it **conflates two kinds of information**:

- **Universal** — the state matrix (rest/hover/focus-visible/active/disabled/…), the tier definitions,
  and the finite set of design *questions* (radius · elevation · accent placement · density · motion …)
  with their channel and scope. Researched, fixed, identical for every component.
- **Per-component** — the named parts (`CardMedia`, `CardBadge`, `CardActions`) and which of the
  universal questions apply.

Both live in one blob, so **adding a component means re-authoring the universal half too.** Each entry
costs a full pass. That is the entire reason there are three.

**Fix: split them.** The universal half is written once (today's `channel` / `scope_hint` annotation is
most of it). A component then needs only a short record — tier, parts, applicable questions — and that
record is **derivable from the component's own source**, because the JSX names the parts.
`PosterCard.tsx` literally contains `pz` / `pills` / `own` / `meter` / `info` / `cap`.

Not a recipe book per dish: one book of techniques, plus a short ingredient list per dish.

---

## 2. Scoreboard against the locked spec §12

| # | Criterion | Now | Closed by |
|---|---|---|---|
| 1 | Context gate before any visual | ⬜ prose | C1 |
| 2 | Worklist decomposed; owner picks order | ⬜ | U3 + U4 |
| 3 | 2–4 real variants, catalog where possible, pick/mix, locked carry forward | 🟡 | C2 (catalog), C3 (interactivity) |
| 4 | Self-contained · real content · interactive · light/dark · screen-tuned | 🟡 | U6 (real content), C3 |
| 5 | Ledger records locks + rationale, survives resume | ✅ | — |
| 6 | **Output = design spec handed to Stage 3** | ⬜ | **U5** |
| 7 | Anti-slop + ask-on-primary enforced | 🟡 | C6 |
| 8 | Core mechanic first; each set isolates one decision | 🟡 | C7 (composition landed 2026-07-27) |
| 9 | Colour budget stated + honoured | ⬜ | C4 |
| 10 | One command; uncapped ledger | 🟡 | C5 |

---

## 3. Stage 1 — USABLE · *"I can run a design round on anything, and my picks change the site"*

| Unit | What it is | Done when |
|---|---|---|
| **U1** | **Split the anatomy.** `design-questions.json` (universal: question → channel → scope_hint → tier applicability → hint) + `component-anatomy.json` reduced to per-component records. Migrate the 3 existing archetypes onto it with **zero behaviour change** | The 3 archetypes produce byte-identical `buildRoundInput` output before and after; test asserts it |
| **U2** | **Derive an inventory from component source.** Read the real file, extract parts (JSX class/`data-role`/component names), map to applicable questions by tier, emit the short record. No approval gate (D11) — the derived axes are shown in the round header and are correctable in-flight; saved on survival | Run against Screenroom's `PosterCard.tsx` and two components it has never seen; the derived parts match what a human reading the file would list |
| **U3** | **Design-intent intake.** One vague line → is this a design issue? which target? what scope (component/cluster/page/site)? → create the `iteration_item` **or** run straight through. Must fail loudly on an ambiguous target rather than guessing | "new button here", "redesign this", "visual overhaul" each resolve to the right target+scope on a real project, and an unresolvable one asks instead of guessing |
| **U4** | **Worklist = a query.** `iteration_items` with UI involvement, not rejected/integrated, plus unpicked `components`; ranked; surfaced on the design page | The Screenroom design page lists real outstanding UI work, each row opening a round on its `target_id` |
| **U5** | **Picks → code.** A locked round emits a real tokens/CSS file into the project repo. Snapshot the emitted file so the regression gate diffs **actual code**, not a value string | A lock on Screenroom writes a tokens file the project imports; changing it out-of-band trips the regression gate |
| **U6** | **Re-run Screenroom properly.** Delete r1; republish **round A (weight+density)** and **round B (colour+motion)** with real Radarr posters through `theme-extract` | Two rounds live, ≤5 axes each, real poster art, `regime: per-item-viable` |

**After Stage 1 you can:** say one line about any component in any project, get a correctly-sized round
on real content, pick, and have the picks land in the codebase.

---

## 4. Stage 2 — TRUSTWORTHY · *"nothing it shows me can be wrong"*

| Unit | What it is | Why it matters |
|---|---|---|
| **T1** | **Control-side verification** — the twin of the `axis-realised` fix shipped today. `control-diff` only checks that a key isn't both control and axis; **nothing verifies the panels actually hold controls constant** | Same class of hole as the one reproduced today, on the other side of the set |
| **T2** | **Auto-inline the computed pass** into the harness | A manual step is a step that gets skipped. This is what proves the panels *look* different |
| **T3** | **`rejected[]` gets two grades** — `not_selected` (may return) vs `rejected_with_reason` (hard ban). Today a close second is banned permanently for losing once | Silent loss of good options |
| **T4** | **Record the discarded 3** from the 6→3 filter | The filter is currently unauditable and the round learns nothing from what it threw away |
| **T5** | **Slot-letter provenance + a round record.** Slots reshuffle each round, so `mixed_from:{variant:'A'}` is meaningless later | Cross-round traceability is currently hand-recoverable only |
| **T6** | **Harness consumes `inheritedControls`** — computed today, then dropped | An inherited value is a note, not a frozen control |
| **T7** | **Fix `TIER_RUNG`**: `composite → 3` maps a composite *component* onto the **cluster** rung, silently relaxing the variant count from exactly-3 to 2–3 | A modeling bug that weakens a rule |
| **T8** | **Inject the owner's own history** — past locked values, rejections and DOM comments as style priors | **The single biggest quality lever available, and the data already exists.** Research gap R1 |
| **T9** | **Rubric scorer, objective half** — contrast, size ratios, token adherence are computable; taste isn't | Turns 6→3 from pure judgment into judgment-on-top-of-measurement |

---

## 5. Stage 3 — COMPLETE · *the acceptance bar and all 90 rules*

| Unit | What it is |
|---|---|
| **C1** | Context gate becomes mechanical (criterion 1) — `ui-mode:none` still legitimately skips it |
| **C2** | **Catalog consulted.** `must_use` + `source_policy` enforced, so "library-first" stops being enforced by nothing and the 179 components stop being bypassed (criterion 3) |
| **C3** | Previews: light **and** dark, real content, and an honest answer on interactivity — declarative shadow DOM makes panels inert, so CSS state (hover/focus) works and JS does not. Either accept CSS-only and say so in the spec, or move JS-driven variants to per-panel iframes (criterion 3, 4) |
| **C4** | **Colour budget** enforced — needs rendered surfaces, so it is a computed rule (criterion 9) |
| **C5** | **One command**: build + publish collapse into a single invocation (criterion 10) |
| **C6** | **All 90 rules.** The remaining source rules (incl. `feas-baseline-gate` via **postcss** + `web-features`, and `source_policy`'s tagging convention), the ~12 remaining computed rules, **axe-core** for the a11y floor, **culori** for colour maths, and **pixel sampling** for `adv-glass-legibility`. `adv-brand-mark-authentic` ships **declared-unenforceable-with-reason** |
| **C7** | Core-mechanic rung becomes mechanical (criterion 8) |
| **C8** | Anti-slop tells + ask-on-primary enforced (criterion 7) |

---

## 6. Stage 4 — GRADUATION *(last, per D8)*

| Unit | What it is |
|---|---|
| **G1** | Hand-written migration adding `master_components` provenance/grade columns (spdx_id, author, attribution, retrieved_at, trademark_flag, grade). Backup-first; **never `drizzle-kit`** |
| **G2** | Grade runner (A–F, only A/B ship) · structural **and** visual dedupe (**sharp** + **blockhash-core**) · licence tiering (**spdx-expression-parse**) · NOTICES assembler. Named exclusions: **Shadertoy** (CC BY-NC-SA), **unDraw** (per-image only), **Rive** (WASM) |
| **G3** | Audit the 179 existing catalog rows against H1 (research gap R4) |

---

## 7. Standing rules for every unit

1. **Plan doc before the unit** — verify live state → spec → acceptance → risks.
2. **Demonstrate, don't assert.** Run it, show the output. Today's headline finding was found by
   *reproducing* it, not by reading code.
3. **Every enforced rule names a test with BOTH a failing and a passing case.** A detector with only a
   passing test is indistinguishable from a stub returning `true`.
4. **Register updated in the same commit** as the change it describes.
5. Hard constraints unchanged: ONE DOOR · backup before any DB change · never `drizzle-kit` ·
   typecheck before rebuild · `git status` after committing · no design decision in a todo title ·
   documented ≠ demonstrated.
