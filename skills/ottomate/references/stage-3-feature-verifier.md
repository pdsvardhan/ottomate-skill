# Feature Verifier — the second, independent gate (Task 3, 2026-07-23)

> Sibling to `stage-3-verifier.md` (the CODE verifier). The code verifier proves the
> **code** is correct/complete (files exist, no stubs, tests pass, each AC has a test).
> This one proves the **running feature works for a user**: an independent sub-agent
> drives the real app like a QA human, feeds it real + nasty inputs, and asserts
> **user-visible outcomes + system state, with evidence**. A user-facing feature is
> "done" only when **both** verifiers are green.

**Mandatory for user-facing features** (rule 10 sibling). Runs after the code verifier
in Stage 3 (per feature, before the deploy gate) and in **Stage 4.7** (per locked item).
Advisory-only for pure-backend/no-UI internal changes (still welcome, never blocking there).

> ## ⚠ BUILD STATUS — independently verified 2026-07-23: **ITERATE**, not APPROVE
> Read this before trusting any capability claim below.
>
> **Live and proven:** the sink (`feature_verification_reports`, migration 0008 + endpoints), the
> system-state helpers (`assertFileOnDisk` / `assertViaApi` / `pollUntil`), the **NFC-vs-NFD unicode
> recipe**, `Matrix.verdict()` (correctly fail-closed), and one end-to-end run that really inserted
> reports through the API.
>
> **NOT yet demonstrated — design intent, not capability:**
> - **No browser-driving spec exists.** The only instantiation drives the app over HTTP (Playwright
>   `request`), not a real UI: zero clicks, keystrokes, `setInputFiles`, or screenshots. "Drives the
>   real app like a QA human" (above) is the **goal**, not what has been shown.
> - **`selectors.ts` (`oid()`) has zero call sites** — the data-oid "one instrument, two consumers"
>   pairing is unproven. Same for `pollUntil` (the async / rescan-pickup leg).
> - **Explorer + Judge are prose only.** No rubric file exists; `judge_verdict` has no producer; no
>   Explorer finding has ever been frozen into a deterministic spec.
> - **Nightly CI is not wired** (no workflow, no cron entry). `postTestRun()` now exists as the
>   helper, but nothing calls it on a schedule.
> - **axe-core / Lighthouse-CI / Lost Pixel / Testcontainers are NOT installed.** Spec §4/§5A names
>   them in the deterministic core (axe as a hard gate). This build deliberately did not add those
>   deps and treats them as pluggable layers — a **known deviation from the spec**, recorded here
>   rather than glossed over.
> - **Evidence capture is configured, not exercised** — API-only specs create no browser context, so
>   no trace/video/screenshot is ever produced.
>
> **To reach APPROVE:** one real browser-driving spec producing surviving trace + screenshot
> evidence, at least one deliberately red case with its proof persisted, and a scheduled nightly entry.
>
> **UPDATE 2026-07-28 (Track B) — research-grounded re-plan.** A deep 3-track sweep + owner-approved
> re-plan now define the target: a **7-layer, fail-closed, claim-blind gate** (L1 implicit · L2
> system-state · L3 metamorphic/property · L4 mechanical-visual · L5 reference-fidelity · L6 pixel-WARN ·
> L7 AI-judge-advisory), fed by an **independence-preserving case-matrix generator** (blind to the coder's
> diff; the SWE-bench reproduce-symptom rule for fixes). Scope broadened to a **commit-time truth gate**
> (data + visual + claimed-fix). See [`docs/plans/2026-07-28-task3-IMPLEMENTATION-PLAN.md`](../../../docs/plans/2026-07-28-task3-IMPLEMENTATION-PLAN.md),
> research [`docs/research/task3/`](../../../docs/research/task3/), and the amended
> [spec](../../../docs/specs/TASK3-FEATURE-VERIFIER-SPEC.md). **Resolved since the status above:** axe-core
> + Testcontainers + fast-check are **IN** (owner-approved, for L4/L2/L3); **`data-oid` is confirmed DEAD**
> (`oid()` is dead code — use `getByRole`/`getByTestId`); **Lighthouse-CI is OUT** (perf not needed). First
> build: **P1-A, the browser leg on Maps of Bharat** (indicator→dataset→stats).

> **The case-matrix generator + runner (P2-A/P2-B, built + verified 2026-07-28).** At **spec-lock** (ACs
> locked, before the coder builds), a **claim-blind sub-agent** (`prompts/feature-verifier-matrix-prompt.md`)
> authors a declarative **matrix file** in the project (`design/feature-verify/<feature>.matrix.json`):
> `gen-matrix.mjs` scaffolds it (EP/BVA → the six path templates → **pairwise** bound → risk-order), and the
> sub-agent fills each case's oracles from the registered P1 layers — **never inventing assertions**. The
> owner reviews + locks it. At **verify**, the data-driven runner `run-matrix.feature-verify.spec.ts`
> executes each case against the running app via a **held-out assertion registry** (the verifier owns the
> assert logic; the matrix only references it by name), then the **trust record** (`trust-record.mjs`) +
> **tamper tripwire** (`tamper-guard.mjs`) gate: a run that is not claim-blind + held-out + owner-reviewed +
> untampered + pre-build-authored is **downgraded to advisory (ITERATE), never a silent APPROVE**. For an
> owner-reported bug, a `reproduce_symptom` case is confirmed **RED pre-fix → GREEN after** the claimed fix
> (`reproduce-symptom.mjs`). Verified on MoB: reports **id 9 APPROVE** (reproduces P1-A from the file) /
> **id 10 ITERATE** (unreviewed downgrade) / the two-phase symptom demo (RED→GREEN). Design + plans:
> `docs/plans/2026-07-28-task3-P2{A,B}-*`.

> **Cadence + gate wiring (P3-C, DONE + verified on VAULT7A 2026-07-29).** The verifier now runs
> **automatically** and scales to the change. The status bullet above ("Nightly CI is not wired") is
> **resolved**: `postTestRun()` is wired and a **VAULT7A cron runs the full matrix nightly at 03:30**
> (`/opt/homeserver/fv-harness/nightly.sh` → `run.mjs nightly`; pairs with app to-do #289).
> - **Change-tier spine** (`harness/change-tier.mjs`): verification scales to the *kinds* of impacted
>   files — **T0** backend/copy (L1+L2) · **T1** style (+L4 scoped) · **T2** component (+L4 full+L3, judge
>   glance) · **T3** page/redesign (everything, full judge). `inferTier` is max-wins + **fail-closed**
>   (an unknown/empty diff → T3, verify the most); owner override honoured. `layersForTier` feeds both the
>   deterministic runner and the P3-A judge gate.
> - **Cadence:** **nightly** = full matrix across every app in `data/feature-verify-apps.json`, schedule
>   cadence, evidence **persisted** to a dated dir (`/opt/homeserver/ottomate/fv-evidence/<date>/…`);
>   **on-commit** = impacted **app only** (`impacted.mjs` slug-by-repo-path + a matrix's `covers:[globs]`),
>   `/tmp` evidence; **on-fix** = the reproduce-symptom two-phase. The orchestrator is `run.mjs`
>   (`nightly | commit | fix`).
> - **Reporting tail** (`harness/{delta,run-log,action-log}.mjs`): `action_log` populated per case, a
>   **JSONL run-log** (one line/run), **delta-vs-previous** (new_failures/fixed/still_failing/appeared/
>   disappeared) with known-flaky reds surfaced (not alarmed).
> - **Flake control** (`harness/flake-control.md`): the official Playwright Docker image pins
>   browser+OS+fonts; time/animation frozen per-spec; Testcontainers for L2 disposable DBs; `retries:0`
>   gate default (`FV_RETRIES=1` opt-in nightly surfacing, <2% quarantine).
> - **Fail-closed hardening:** a driver that THROWS (app down, selector gone, timeout) is now a **recorded
>   FAIL**, never an un-recorded case that would leave the matrix empty and read as "all 0 passed".
>   **Verified both ways on MoB:** a healthy nightly → `test_runs` `passed` (schedule) + persistent
>   trace/video + a run-log delta (report APPROVE); MoB pointed at a dead port → recorded FAIL →
>   `test_runs` `failed` + BLOCK (the false-green closed). Plan+results:
>   `docs/plans/2026-07-28-task3-P3C-gate-wiring-plan.md`.

## Why it exists (the gap the code verifier can't close)

The code verifier's tests are **coder-authored, happy-path, derived from ACs the coder/skill
wrote**. Nothing *independently* drives the **real** feature with **nasty real inputs** and
checks the **real effect** — the file that actually landed on disk with its Telugu tag intact,
the DB row, the media rescan. A code verifier will green-light an upload whose button 500s,
whose progress bar lies, or that transliterates a non-ASCII filename to `_____` — because the
*code* looked fine. System-state assertions **are** the anti-gaslight: they check the real
effect, not a coder claim.

## Decisions locked (TASK3 spec)

- **D1 — deterministic tooling for the gate; AI only for discovery + judging.** 2026 data:
  agentic browser tools are 85–89% reliable (~11–15% flake/run) → they can't gate; DOM-driven
  beats vision by 12–17pp.
- **D2 — Playwright is the anchor** (already in every project's harness; best for real
  file+folder uploads, trace/video/network/console evidence, auto-wait, free parallelism).
  NOT ad-hoc "Claude drives a browser."
- **D3 — self-hosted / OSS only on the critical path.** No SaaS that ingests the app
  (Testim/Mabl/Applitools/Meticulous/QA Wolf excluded).
- **D5 — sibling to the code verifier;** both gate "done" — block-on-red for `cv`/public,
  warn for `personal` (adr-014).
- **D6 — AI Explorer & Judge = Claude Code in the build session, not a hosted model.**
  VAULT7A has no GPU (i5-14600K / 62GB, iGPU only — probed 2026-07-23), so no local models.
  Explorer writes findings as deterministic Playwright specs; Judge scores subjective cells
  with a rubric + evidence, **advisory only**.
- **D7 — Explorer runs a fixed high-value playbook (§ Explorer playbook),** each finding
  frozen into a deterministic spec. Hosted VLM deferred to unattended-CI judging only.

## Three layers — only the first one gates

| Layer | Role | Tools (all free / self-hostable) |
|---|---|---|
| **Deterministic core** *(the gate)* | drive real UI + assert outcomes + **system state** | Playwright · `fs` + DB-via-API + downstream SDK assertions · Testcontainers (disposable real deps) · `expect.poll()`/`toPass()` (async effects) · trace/video/network/console always on · `toHaveScreenshot`/Lost Pixel · `@axe-core/playwright` · Lighthouse-CI |
| **AI discovery = Claude Code** *(build session)* | run the Explorer playbook, fuzz nasty inputs, find edge cases | Claude drives it during the build (no hosted model). Every finding is **frozen into a deterministic Playwright spec** (value persists as tests). Never a live gate. |
| **AI judge = Claude Code** *(build session)* | score "does it look right / make sense?" | Claude scores only *subjective* cells against a written rubric, always fed the captured artifact (screenshot + ARIA snapshot), recording a **structured verdict + the evidence it saw**. Advisory only. |

The deterministic core is the **only** thing that gates and the **only** thing that reruns
unattended. AI verdicts never gate; they are always evidence-backed. **Fail closed:** a
skipped/mocked/errored step can never render a case green.

## The method (per user-facing feature or Stage-4 item)

### 1. Case generation — spec → cases → a reviewable matrix (lock-in BEFORE any run)

From the feature's spec/ACs + linked flows, auto-enumerate real workflows × variants:

- **happy** — the primary success path(s).
- **edge** — empty · max · boundary · first-run / at-limit.
- **error** — net-fail · provider/dependency-down · permission-denied · timeout → assert
  graceful, honest failure, **no crash**.
- **data** — **non-ASCII (Telugu/Tamil/emoji/RTL/combining marks) · large · duplicate ·
  corrupt · mixed-type.**

Emit the matrix as a **reviewable plan** and show the owner **before any run** — this is a
lock-in on the test plan (they add/cut/adjust cases; nasty inputs they know about get added
here). Only after the owner accepts do specs run. Then generate: Playwright specs + the
capture/record harness + the analysis config (see `scripts/feature-verify/`).

### 2. Deterministic core — drive + assert system state

Playwright drives the real end-to-end workflow (clicks, typing, `setInputFiles` incl.
`webkitdirectory` folder uploads; or `request` (APIRequestContext) for API-driven features).
**After each action, a system-state assertion layer confirms the *effect*:**

- **files** — `fs` stat + read the bytes back (not just "the endpoint returned 200").
- **DB rows** — assert through the **app's own API** (ONE DOOR, adr-018 — never open the live
  `.db` with a second sqlite client). The disposable instance's throwaway DB is likewise only
  read through its API.
- **downstream** — a service SDK/API for rescans, search indexes, queues.
- **async effects** — `expect.poll()` / `toPass()` (the rescan that lands 2s later).
- **Testcontainers** where a disposable real dependency helps (real Postgres/Redis/etc.).

Evidence (trace/video/network/console) **always on**. Fold in `toHaveScreenshot` (or the repo's
Lost Pixel), `@axe-core/playwright` as a hard gate on user-facing pages, Lighthouse-CI for perf
budgets — each **pluggable** (skip gracefully if a project hasn't wired it; never fake a green).

### 3. The Unicode recipe — the headline nasty-input case

The real trap is **NFC-vs-NFD normalization**. For each hard fixture (Telugu, Tamil, emoji,
combining marks, RTL, long names):

- assert the stored value **`=== expected.normalize('NFC')`** (or the app's declared canonical
  form — assert *a* form, consistently, and flag if the app stores mixed forms);
- assert it was **not** ASCII-transliterated (raw codepoints preserved — catches
  "Telugu filename became `telugu` / `_____`");
- verify the bytes match in **both** the DB row **and** the on-disk dirent.

Catches the encoding bug that functional happy-path tests never see. Helper + fixtures:
`scripts/feature-verify/harness/unicode.ts`.

### 4. Explorer playbook (Claude, in the build session — each finding → a deterministic spec)

Not open-ended wandering; the high-value jobs, run each build:

1. **Adversarial inputs** — non-ASCII (Telugu/Tamil/emoji/RTL), empty, huge/max,
   malformed/corrupt, duplicate, mixed-type.
2. **Interruptions & races** — double-submit, navigate away mid-operation, cancel mid-flow,
   rapid repeat, back-button mid-flow.
3. **Error paths** — provider/dependency offline, permission denied, network drop, timeout →
   assert graceful, honest failure, no crash.
4. **Boundary & state** — empty / first-run / at-limit states; cross-flow contamination
   (does X break Y).
5. **Visibility** — logged-out vs owner vs guest each see the right thing.

Every finding is written as a Playwright spec and folded into the deterministic matrix, so the
next run reruns it deterministically.

### 5. Judge (Claude, advisory) — subjective cells only

For cells that are genuinely a judgement ("does the recommended metadata look sensible?",
"does the empty state read right?"): Claude scores against a **written rubric**, always fed the
captured artifact, recording `{verdict, score, rubric_ref, evidence_paths, rationale}`. Never
gates. If a subjective cell is the *only* thing red, the case is `warn`, not `fail`.

**The AI-visual-judge (P3-A, built + demonstrated 2026-07-29).** The judge is now a concrete,
guardrailed unit — advisory, **tier-gated** (skipped below T2; a quick glance at T2, a full guardrailed
pass at T3 — `judgeGate(tier)`), and **structurally incapable of a gating pass**:
- **Rubric** `data/feature-verify-judge-rubric.md` — four advisory dims (*intentional/on-spec* ·
  *empty-state works* · *nothing visibly broken* · *symptom-relevance* for fixes), each a
  `clean|warn|flag` with a **cited region**. None gate.
- **Prompt** `prompts/feature-verifier-judge-prompt.md` — a **fresh Claude sub-agent, blind to the diff**,
  fed the requirement + screenshots + ARIA + the deterministic facts + the rubric; **forced grounding**
  (a region per finding), structured-JSON only, no pass/approve verdict.
- **Harness** `harness/ai-judge.mjs` — `crossCheckSpatialClaims` **discards any spatial claim the L2/L4
  DOM/geometry layer contradicts** (neutralising VLM spatial-blindness; `measureRegionsOverlap` in
  `visual-robustness.ts` re-measures the judge's own cited overlap selectors), `reconcileSamples`
  (T3: 2–3 order-randomised passes → agreed vs `no-confidence`→human), `judgeVerdict` (`gating` always
  false), `applyJudgeToOutcome` (**downgrade-only**: `fail`→`fail`, `pass`→`warn` on a *flag*, never the
  reverse). A real issue is still caught deterministically by L1–L4; the judge is a redundant advisory
  glance on top.
- **Demonstrated live on MoB:** a fresh judge sub-agent judged the real indicator-switch screenshot →
  `intentional:clean`, a `contrast:warn` **corroborated** by L4's real axe flag, `nothing-broken:clean`;
  an injected **fabricated "overlap"** was **discarded** by the DOM cross-check; verdict advisory
  (band `warn`, `gating:false`). Plan `docs/plans/2026-07-28-task3-P3A-ai-visual-judge-plan.md`.
  **NOT yet wired into the live runner's afterAll** (the dispatch is skill-driven; wiring the automatic
  in-run judge pass is the remaining tail).

### 6. Reporting + the sink

Per-step (timestamp, action, screenshot, network, console) → per-case (inputs, action log,
**system-state values**, duration, outcome, evidence paths, optional judge verdict) → per-run
(machine-readable **case×outcome matrix** + a human-readable rendering where each red links to
its exact proof, e.g. the saved bytes). Persist to Ottomate so trends are visible:

- **Rich report → `POST /api/feature-verification-reports`** (the feature verifier's sink,
  sibling to `verification_reports`). Body: `{project_slug, target_kind, target_id,
  verifier_session_id, commit_sha, recommendation_overall (APPROVE|BLOCK|ITERATE),
  recommendation_reason, risk_policy (block|warn), mandatory_user_review, case_matrix:[{case,
  variant, axis, inputs, action_log, system_state, outcome (pass|fail|warn|skipped), evidence,
  judge_verdict?}], evidence_root, full_report}`. Headline counts are derived server-side from
  the matrix (they can't disagree). `GET ?project_slug=&target_id=&latest=1` reads the verdict;
  `DELETE /[id]` prunes disposable dogfood/smoke runs.
- **Per-critical-flow pass/fail → `POST /api/flows/[id]/test`** with `ran_by:'automated'` — this
  is what the **Stage-3→deploy gate** already reads (`flow_test_runs`). Reuse, don't reinvent.
- **CI subset → `POST /api/test-runs`** (`triggered_by:'schedule'`) for the nightly rerun.

The harness posts all three via `scripts/feature-verify/harness/report.ts`.

## Isolation + anti-flake

Per-test unique working dirs + seeded state; freeze time/animations (Playwright **Clock API**);
stable fonts; tag genuinely external-dependency cases honestly. **No self-healing selectors on
the gate** — they can silently heal over a real regression. Use `getByRole` / `getByTestId` /
ARIA snapshots. (**`data-oid` is DEAD** — `selectors.ts` `oid()` is dead code with zero call sites;
do not reach for the provenance stamp as a selector.)

## Sample data / fixtures

Prefer owner-provided real fixtures (especially the nasty ones). Synthesize when scarce
(programmatic files with controlled tags/sizes/scripts — `unicode.ts` ships the script fixtures).
Curate a reusable per-feature fixtures set under the project's `tests/e2e/feature-verify/fixtures/`.
The skill **asks** (AskUserQuestion) for domain data it can't synthesize.

## The gate (completion) — both verifiers green

- **Code verifier:** *is the code correct/complete?* (`stage-3-verifier.md`).
- **Feature verifier:** *does it work for a user?* (this file).
- **Completion = both green.** Wire into the Stage-3→deploy gate and the Stage-4.7 per-item
  verify. Policy (adr-014): `cv`/public projects **BLOCK on red**; `personal`/internal **WARN**.
- **Fail closed:** a skipped/mocked/errored step can never render green. AI verdicts never gate.
- Verdict → skill action mirrors the code verifier: `APPROVE` → proceed; `ITERATE` (< 3) →
  auto-fix loop; `ITERATE` (≥ 3) → escalate; `BLOCK + mandatory_user_review` → HALT, show the
  exact proof (the saved bytes / the crash), owner decides.

## How to dispatch (independent sub-agent — blind to coder claims)

Same pattern as the code verifier: the skill writes the prompt directly; the coder does NOT.
Prompt: `prompts/feature-verifier-prompt.md`. Inputs = feature spec + ACs + linked flows +
deploy/instance URL + the reviewed case matrix + the harness path — **never** coder claims.
The sub-agent generates/updates specs, runs them against the real instance, captures evidence,
scores subjective cells, and POSTs the report + flow_test_runs. See the harness scaffold at
`scripts/feature-verify/` (README = how to instantiate into a project + run).

## Worked example — music-upload (the spec's own)

Feature `/music/add`: upload audio → decode-verify → metadata reco → custom-metadata web-search
→ commit + rescan. Cases (each recorded + scored): single file · multi-file batch · **folder
upload** · **non-ASCII (Telugu+Tamil) tags preserved** · reco sensible (AI-judge) · web-search
returns + selectable (record results each run) · large file · duplicate · provider-offline error
path. Captured per run: upload success + duration, per-file progress correctness, recommended
metadata, search results, **final on-disk tags (native script preserved?)**, DB/library state,
screenshots, network, console. The red on "non-ASCII tags preserved" points straight at the
encoding bug **with the saved bytes as proof**.

## Cost + phasing

- Per feature: case-gen (cheap) + a Playwright run (minutes) + Claude Explorer/Judge in-session
  (bounded — the playbook is fixed, not open-ended). Scoped per item in Stage 4.7.
- **Phase 1 (this):** deterministic core + build-time Claude Explorer/Judge + the sink. No
  hosted model.
- **Phase 2 (only if wanted):** unattended-CI subjective judging via a hosted VLM (slow CPU
  model or an API call), for when Claude isn't in the session.

## Links

- Task 1's `data-oid` = these stable selectors (one instrument, two consumers).
- Task 1's QA-evidence intake is the same sink family: a bug comment ("upload stuck") becomes a
  feature-verifier case that reproduces + records it.
- Task 2 prevents design issues at design time; this catches functional issues at build time.
