# Task 3 — Feature Verifier: readiness brief for a PARALLEL session

**Written 2026-07-27** for the owner's stated purpose: *"my idea is to work in another session without
disturbing your work — looking to understand how much task 3 is planned, how much needs research work
or digging deep or building something or brainstorming."*

This doc is **self-contained**. A cold session can start from it without reading the main handoff.

---

## 0. The one-paragraph answer

**Task 3 is roughly one-third built, and the third that exists is the wrong third to be finished
first.** The plumbing is real — a sink that accepts reports, system-state assertion helpers, the
NFC/NFD unicode recipe, a fail-closed verdict function. What does not exist is **the thing the task is
named after**: nothing has ever driven a browser. There are zero clicks, zero keystrokes, zero
`setInputFiles`, zero screenshots in the entire tree. The spec's own §1 framing — *"drives the running
app like a QA human"* — is unrealised, and the reference file says so about itself, which is the most
creditable thing in the audit. **The requirements are elaborate and settled** (the spec is 99 lines,
7 locked decisions, 8 component sections, 5 acceptance criteria, and a worked example) — so this is
**not a brainstorming task**. It is mostly **BUILD**, with two genuine **DECIDE** points and one
**RESEARCH** item.

---

## 1. Measured state, today (not claimed — counted)

| | |
|---|---|
| Spec clauses audited | **47** |
| BUILT+PROVEN | **1** |
| BUILT (code exists, no test) | **14** |
| PARTIAL | **17** |
| NOT BUILT | **14** |
| UNKNOWN | **1** |
| Code size | **807 lines total** across 10 files (`scripts/feature-verify/`) |
| Unit tests | **zero** — no `*.test.*` file exists in the directory |
| Specs that drive a browser | **zero** |
| Red cases ever produced | **zero** |
| Evidence artifacts ever captured | **zero** (trace/video/screenshot are *configured*, never *produced*) |

**What is genuinely live and proven:** the sink (`feature_verification_reports`, migration 0008 +
endpoints), one end-to-end run that really inserted reports through the API,
`assertFileOnDisk` / `assertViaApi` / `pollUntil`, the unicode fixtures, and `Matrix.verdict()`'s
fail-closed logic (read directly; **not** test-covered — see WP0).

---

## 2. Work packages, marked by the kind of work each needs

Legend — **BUILD** design settled, just write it · **DIG** must read/measure live state first ·
**RESEARCH** genuinely unknown, needs outside investigation · **BRAINSTORM** needs a design
conversation · **DECIDE** one owner ruling unblocks it.

### WP0 — Unit-test the harness · **BUILD** · small · ⚠ I am doing this one (see §4)
`Matrix.verdict()` is the fail-closed logic the entire gate rests on and **nothing tests it**. Same for
`counts()`, `renderTable()`, and the unicode helpers. Must-fail *and* must-pass cases per the program's
own rule.

> **This is item A5 of my current session.** I will land it first and then stop touching
> `scripts/feature-verify/`. Start the parallel session from that commit. Details in §4.

### WP1 — The browser leg · **BUILD** · large · **the whole point of the task**
Clause T3-02, and it cascades into T3-08 (evidence), T3-30 (selectors), T3-44 (AC2), T3-45 (AC3).

Write one real spec that opens a page, clicks, types, uploads via `setInputFiles`, and asserts the
system-state effect. Everything needed already exists — `playwright.feature-verify.config.ts` already
sets `trace:'on', video:'on', screenshot:'on'`, so evidence starts being produced the moment a browser
context exists. Nothing is blocked; it simply was never written.

- **Design settled?** Yes. Spec §5A is explicit, and the config is already correct.
- **Blocked on?** Choosing the first target feature — see DECIDE-1.
- **Acceptance:** one spec, one browser context, surviving trace + screenshot on disk, one
  system-state assertion that reads the effect rather than the response code.

### WP2 — Produce a deliberately RED case · **BUILD** · small · **highest evidence-per-hour in the task**
A gate that has never blocked is not evidence that it can. The program proved this exact point twice
already (the isolation gate's byte-identical-panel hole; P4's sabotaged round). Break something on
purpose, watch the matrix go red, confirm the red links to its exact proof, and persist that run.

- **Design settled?** Yes. **Acceptance:** a persisted report with `recommendation_overall: 'BLOCK'`
  and an evidence path a human can open.

### WP3 — Case generation (AC1) · **BRAINSTORM → BUILD** · medium · **the only genuinely un-thought-through piece**
Spec §5C says "auto-enumerate a case matrix from the feature's spec/ACs". **There is no generator, and
no plan for one.** `prompts/feature-verifier-prompt.md:31` tells the agent to **STOP** when no plan
exists — an honest guard, but it means the gate is currently *unreachable* rather than merely unused.

The un-thought-through question is **what "auto-enumerate" means mechanically**. Three shapes, and
nobody has picked:
1. **Deterministic cross-product** — variants (happy/edge/error/data) × the feature's ACs. Cheap,
   dumb, produces many nonsense cells.
2. **Model-authored, owner-reviewed** — Claude reads the spec and proposes the matrix; the owner locks
   it. Matches the spec's "reviewed before any run" and the rest of the program's lock-in pattern.
3. **Template-per-feature-kind** — a library of matrices keyed by feature archetype (upload flow, list
   view, auth flow…), the same structural move Task 2 made when it replaced hand-written archetypes
   with tier×part×channel derivation.

Shape 2 is the one that fits the program's grain, and shape 3 is what it will want at scale — but this
needs a real conversation, not a guess. **Start here if the parallel session wants the highest-value
thinking work rather than the highest-value building work.**

### WP4 — The four uninstalled OSS layers · **DECIDE** then trivial BUILD · small
axe-core (the spec makes it a **hard gate**), Lighthouse-CI, Lost Pixel, Testcontainers. All four are
named in spec §4/§5A; none is installed. Recorded as a deliberate deviation, not hidden.

**DECIDE-2:** the plugin is zero-dependency *by design* — but these live in the **project under test**,
not in the plugin, so the constraint may not even apply. That distinction has never been stated out
loud, and it is the whole decision. Once ruled, installing axe is an afternoon.

### WP5 — Explorer + Judge · **BUILD** · medium · design fully settled
Both are prose today: no rubric file exists, `judge_verdict` has no producer, no Explorer finding has
ever been frozen into a spec. The playbook itself is written and specific (5 jobs, spec §5H). The
Judge's contract is written (`{verdict, score, rubric_ref, evidence_paths, rationale}`, advisory only,
and `Matrix.verdict()` correctly ignores it already).

What is missing is **a rubric file** and **one worked instance of each**. No new thinking required.

### WP6 — Nightly CI · **DIG** then BUILD · small
`postTestRun()` exists and has **no caller**. No workflow, no cron entry. Needs a look at how VAULT7A
schedules things today (there is an open to-do, #289, about consolidating two existing crons into a
shared nightly window) — so **DIG first**, then it is a cron line and a filter for the critical subset.

### WP7 — The reporting tail · **BUILD** · small
Three small honest gaps: `action_log` is defined and never populated (T3-20/21); per-run output is
JSON where the spec says **JSONL** (T3-22); and there is no **delta vs the previous run** (T3-24).
Each is self-contained.

### WP8 — The 4.7 wiring contradiction · **DIG** · tiny · **do this one first, it is 20 minutes**
`SKILL.md:86` asserts the feature verifier runs at Stage 4.7. `references/stage-4-mini-pipeline.md`
§4.7 describes **one** verifier writing one `verification_reports` row and has no feature-verifier leg.
**One of the two files is wrong.** Cheapest correctness win in the task.

---

## 3. The two DECIDE points, stated so they can be answered in one line each

**DECIDE-1 — which feature does the browser leg drive first?**
Candidates, with what each buys:
- **The Ottomate 4.3 lock-in view** — dogfood; also closes Task-1 clauses T1-20/21/41/42 in the same
  run, which are UNKNOWN today purely because nobody has looked at that screen with a driver.
- **Screenroom** — a real user-facing app, and Task 2's live rounds are there.
- **The music-upload flow** — the spec's own worked example (§7), and the one with the real Telugu/Tamil
  payoff the unicode recipe was built for.

*My read: the 4.3 lock-in view.* It is the smallest surface, it is on the same box, and it converts
four UNKNOWN Task-1 clauses into measured ones for free. The music-upload flow is the better
*demonstration* but the worse *first* target.

**DECIDE-2 — does "zero-dependency" bind the project under test, or only the plugin?**
If only the plugin: axe-core, Lighthouse-CI, Lost Pixel and Testcontainers become ordinary
project-level dev-dependencies and WP4 is unblocked. If it binds everywhere, WP4 should be struck from
the spec rather than left as a permanent open item.

---

## 4. How to run this in parallel without colliding with my session

**File ownership, from the moment WP0 lands:**

| Path | Owner |
|---|---|
| `skills/ottomate/scripts/feature-verify/**` | **The parallel Task-3 session** (mine stops after WP0/A5) |
| `skills/ottomate/prompts/feature-verifier-prompt.md` | The parallel session |
| `skills/ottomate/references/stage-3-feature-verifier.md` | The parallel session |
| `skills/ottomate/references/stage-4-mini-pipeline.md` §4.7 only | The parallel session (WP8) |
| `skills/ottomate/data/component-anatomy.json`, `scripts/generation/**`, `scripts/design-check/**` | **Me** (A7 + Stage-4 planning) |
| `skills/ottomate/references/stage-2-*.md`, `stage-4-visual-qa.md`, `command-routing.md`, `output-style.md` | **Me** (A1–A3) |
| `SKILL-REGISTER.md` | **Both — the one real collision risk.** See below |
| `SKILL.md` | Both (different sections: mine none, theirs line 86 area) |

**The `SKILL-REGISTER.md` rule:** the program's own maintenance rule says update it in the same commit
as the change it describes, so both sessions will want to edit it. To avoid a merge fight: the parallel
session should append its Task-3 rows to **§2 (Systems)** and **§5 (Known defects)** only, and never
reflow §3. Commit small and often; the file is append-friendly if nobody rewrites existing rows.

**Two hard operating constraints that apply to the parallel session too:** ONE DOOR (all DB access via
the app API, never a second sqlite client) and `POST /api/backup` before any DB change. The feature
verifier writes real rows to `feature_verification_reports` — that is a DB change.

**A trap that will cost an hour if not known up front:** ESM and Playwright both resolve bare
specifiers from the **file's own location**, not `process.cwd()`. Running anything from
`scripts/feature-verify/` on VAULT7A needs `node_modules` symlinked next to it. This has bitten the
program twice.

---

## 5. What is honestly NOT thought through at all

Everything else in Task 3 has a written design. These do not:

1. **What "auto-enumerate a case matrix" means mechanically** (WP3). The single real gap.
2. **Where the fixtures live per project.** Spec §5F says "the project's
   `tests/e2e/feature-verify/fixtures/`". No such directory or convention exists in any project. It is
   one sentence of prose with nothing behind it.
3. **What a Judge rubric actually contains.** The *contract* is specified; the *content* — what
   questions, what scale, what counts as a fail — has never been drafted. Task 2's `design-rubric.md`
   (4×25 + hard-gate overrides) is the obvious model to copy from.
4. **Whether `data-oid` selectors are viable at all.** The spec's §9 claims `data-oid` doubles as
   Task 3's stable test selector — but the owner **withdrew** `data-oid` stamping on 2026-07-27
   (`grep -rc data-oid` on Screenroom returns 0). So `selectors.ts` `oid()` is built on an
   instrument that does not exist on any live project. **The parallel session should assume
   `getByRole`/`getByTestId` and treat `oid()` as dead code** until the owner revisits stamping.

Item 4 is the one most likely to waste time if discovered late.

---

## 6. Suggested order for a parallel session

1. **WP8** (20 min, pure correctness) → 2. **WP1** (the browser leg — everything else compounds off
it) → 3. **WP2** (the red case — proves the gate bites) → 4. **WP5** (Explorer/Judge, now that
evidence exists to feed them) → 5. **WP3** (case-gen, after seeing what real cases look like) →
6. **WP7 / WP6 / WP4** (tails, in any order).

WP3 is deliberately placed *after* WP1/WP2: designing a case generator before ever having run a real
case is how the program produced its earlier overclaims.
