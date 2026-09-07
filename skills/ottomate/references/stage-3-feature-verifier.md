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

> ## BUILD STATUS — Phases 1–3 BUILT + VERIFIED (2026-07-29)
> The 2026-07-23 "ITERATE, not APPROVE" status below is **superseded** — every gap it named is now
> closed. Current reality:
> - **Browser leg PROVEN both ways** — the runner drives the real MoB app in Chromium (clicks, dialog,
>   URL/DOM assertions) and asserts effects via a 2nd channel; trace/video/screenshot produced. A
>   deliberate red case BLOCKs with openable evidence.
> - **7 layers built** — L1 implicit · L2 system-state · L3 metamorphic (`fast-check`) · L4
>   mechanical-visual (`@axe-core/playwright` + geometry) are IN; **axe-core / fast-check / Testcontainers
>   are installed** (owner-approved); L5 reference-fidelity struck; L6 pixel WARN; **L7 AI-judge built +
>   advisory**. **`data-oid` is DEAD** (`oid()` removed from guidance).
> - **Independence machinery** — the case-matrix generator (claim-blind), the held-out assertion
>   registry, the trust record + tamper tripwire, and the reproduce-symptom two-phase (RED→GREEN).
> - **Runs automatically** — `postTestRun` wired; a **VAULT7A nightly cron at 02:30** runs the full
>   matrix; change-tier scales effort; the reporting tail (delta/JSONL/action_log) + durable dated
>   evidence are live. Fail-closed hardened (a throwing driver is a recorded FAIL, not an empty-matrix
>   false-green).
> - **The advisory layers are wired** — the AI-visual-judge (hook a) and the trajectory monitor (hook b)
>   attach to the report via the FV_NO_POST skill-post path (see §5 + §P3-D below); a flag / high-risk
>   softens an APPROVE → ITERATE (human review), never blocks, never the reverse. Demonstrated live.
>
> Full history is in the dated UPDATE blocks below (kept for provenance).
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
> **resolved**: `postTestRun()` is wired and a **VAULT7A cron runs the full matrix nightly at 02:30**
> via the **consolidated `#289` wrapper `/opt/homeserver/scripts/ottomate-nightly.sh`** (crontab `30 2 * * *`
> → backup → `/opt/homeserver/fv-harness/nightly.sh` → `run.mjs nightly` → preview rebuild; #289 folded the
> old separate 02:30-backup / 03:30-fv / 04:30-preview crons into one). (Doc-debt repaid 2026-08-04: earlier
> revisions of this file said "03:30" and a direct fv-harness call — the live crontab is authoritative.)
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

**Built as a concrete hook (2026-07-29):** `harness/explorer.mjs` — `explorerPlaybook()` (the fixed 5
categories + probes) + `nastyInputCatalog()` (the input classes; concrete values from `unicode.ts`) +
`freezeAsCase(finding)` (turns a discovered finding into a **runnable matrix case**, category→path mapped;
a finding with no registered assertion is frozen `needs_assert:true` = fail-closed placeholder, **never a
silent pass**) + `mergeFrozenCases` (a rerun re-freezes the same finding, deduped). So an Explorer finding
persists as a matrix case the data-driven runner reruns. 7 unit tests.

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
  **WIRED (hook a, 2026-07-29) — the skill's dispatch procedure** (owner: judge fires on **every T2+**
  change; T3 **re-samples only on a flag**):
  1. Run the runner with **`FV_NO_POST=1`** for a T2+ verify → it produces `matrix.json` + evidence +
     `report-payload.json` and **does not post** (the nightly path, `FV_NO_POST` unset, still posts — the
     judge needs a Claude sub-agent, which no cron has, so it never runs unattended).
  2. `assembleJudgeInput({evidenceRoot, results, tier})` (`harness/judge-dispatch.mjs`) → the screenshots
     + the L4/L1 `deterministicFacts`; if the tier is < T2 it returns `{gate:'none'}` and you skip.
  3. Spawn the **fresh judge sub-agent** with `prompts/feature-verifier-judge-prompt.md` (blind to the
     diff), fed the requirement + screenshots + facts → its structured findings JSON.
  4. `processJudgeOutput([pass1], facts, {tier})` → cross-check + verdict. If `needsResample` (a T3
     flag), spawn 2 more passes in a randomised order and call `processJudgeOutput([p1,p2,p3], …)`.
  5. **`node post-report.mjs --judge judge.json [--trajectory traj.json] --case <id>`** posts the
     complete report — `judge_verdict` on the case + `full_report.judge`; a judge **flag** softens an
     APPROVE → ITERATE (advisory, human-review), never blocks, never the reverse.
  **CALM self-audit** (`detectJudgeDrift`): periodically re-judge a known-good golden clean case; a
  non-clean re-judge = drift → a human recalibrates the rubric/prompt (detection-only). Demonstrated live
  on MoB: the full loop posted a report with `judge_verdict` attached + a high-risk trajectory softening
  APPROVE→ITERATE.

**Trajectory monitor (P3-D, built 2026-07-29).** `harness/trajectory-monitor.mjs` — a cheap
`scanTrajectory()` over the **coder's** build-session log for self-narrated reward-hacking ("let me just
skip these tests", "hardcode the expected value", "make it pass", `@pytest.mark.skip`, "bypass the
verifier", conftest/report-patching) → `risk: none|medium|high`, specificity-guarded so legitimate talk
("this test skips the network") doesn't false-alarm. **Two hard invariants:** (1) **detection/gating
only, NEVER a training/optimisation signal** — optimising a coder against the monitor teaches it to
obfuscate its narration (T3); the flag is read by a human, never fed back. (2) A heuristic tripwire, not
proof — the deterministic gate (L1–L6 + reproduce-symptom + trust record) is what actually catches a
faked-green. `trajectoryReport()` carries that framing into `full_report`. **WIRED (hook b, 2026-07-29):**
the coder's trajectory source (owner decision) is the **Stage-3 coder sub-agent's returned output** — the
skill captures that text, runs `scanTrajectory()` → `trajectoryReport()`, and passes it to
`post-report.mjs --trajectory traj.json`; a **high-risk** trajectory softens an APPROVE → ITERATE
(advisory, human-review), never blocks. Demonstrated live on MoB (a hack-narration log → risk `high` →
report ITERATE with the trajectory record attached). 5/5 unit tests (clean → not flagged; hack-narration
→ high-risk).

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
  `DELETE /[id]` prunes disposable dogfood/smoke runs (bearer + a JSON body, e.g. `{}` — a
  bodyless DELETE 400s).

  **Two fields the API now enforces (2026-08-11) — both were silent holes:**
  - **`target_id` is the REGISTRY FLOW id** (`flow-request-tv`), never the feature id and never an
    iteration number. The deploy gate resolves per (feature × linked flow) and matches on the flow;
    anything else stores a healthy-looking APPROVE the gate never sees. It was measurably wrong:
    12 of screenroom's 16 rows carried an iteration number, and `run-matrix` posted `m.feature`.
    Declare it in the case matrix as `flow_id` and the runner posts it. **422 on a project whose
    `verify_gate != 'off'`**; on an ungated project the write is accepted with a `warning` field so
    existing harnesses keep running. Keying on the feature was considered and rejected — one
    APPROVE would clear a feature whose other flows were never driven.
  - **`commit_sha` is the full 40-hex sha** (`git rev-parse HEAD`); a short sha is **422** on every
    project. Rows previously held both shapes while the gate compared with `=`, so a format
    mismatch read as "never verified". The gate side is prefix-tolerant (7-char floor, both
    directions), so a *reader* may pass either form and get the same verdict.
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

## The registry ship-gate (Phase 3, 2026-08-04) — "register + verify or you can't ship"

The per-feature verdict above answers *"did THIS feature pass?"*. Phase 3 adds the **standing,
whole-project** guarantee: on a **gated** project you cannot mark a user-facing feature shipped
(deploy / integrate) unless it is (i) **registered** as a flow, (ii) **linked to a test**, and
(iii) **passing a verifier APPROVE against the deploying commit**. Enforcement is a per-project
**ramp** (`projects.verify_gate ∈ {off,warn,block}`, migration 0012) so "hard everywhere" rolls
out app-by-app instead of blocking all 8+ on day one.

- **Two READ-ONLY signals the 3→deploy step (and 4.8 integrate) MUST consult for the deploying commit:**
  1. `GET /api/anti-gaslight/violations?project_slug=<slug>` — refuse on any **HARD** violation.
     The Phase-3 rules `unverified-ship` (**R6**) and `unreconciled-claim` (**R7**) live here
     alongside R1–R5 (see `anti-gaslight-rules.md`). They are HARD on a `'block'` project, SOFT
     on `'warn'`, and emit nothing on `'off'`.
  2. `GET /api/verify/gate?project_slug=<slug>&commit_sha=<deploying commit>` — require `ok:true`.
     **Commit-specific**: each done ui/hybrid feature's linked flows each need an APPROVE
     `feature_verification_reports` row at *that* `commit_sha` (keyed on `target_id` + APPROVE +
     `commit_sha`, never `target_kind` — reports in practice carry `stage-3-feature`). A stale
     APPROVE at an old commit does NOT count; `no-flow` / `no-test` / `no-approve-at-commit` are
     the `blocking` reasons. `off`/`warn` → `ok:true` (advisory `warnings` only). The sha may be
     given short or full (≥7 hex, resolved by prefix since 2026-08-11); a non-hex value 400s.

     **Plan the sweep around this:** the match is commit-specific, so *every new commit invalidates
     every APPROVE*. The verifier pass across all user-facing features has to be the last thing
     before deploy, on the frozen commit — it cannot be spread across a week of work.
- **CLI:** `node scripts/feature-verify/deploy-gate.mjs --project <slug> --commit <sha>` runs both
  and **exits 3 (blocked) / 0 (clear)** — a drop-in pre-deploy shell hook. Env `FV_TRACKER_BASE`
  (default `127.0.0.1:8110`), `FV_BEARER_TOKEN` optional (both GETs are open). The **primary**
  enforcement is the skill step; the CLI is the mechanical belt-and-braces.
- **Auto-reconcile (R7's other half):** posting an **APPROVE** `feature_verification_report` for a
  flow now flips that flow's linked features' latest `unreconciled` `feature_claims` row to
  `reconciled_with='verified'` (`lib/claim-reconcile.ts`; also backfilled by
  `POST /api/coverage/recompute`). So a passing verifier both clears R7 and proves the flow — the
  ledger reconciles itself instead of drifting.
- **Ramp state (2026-08-04):** `screenroom='block'` (Phase-1/2 backfilled + gate PROVEN, see below);
  every other project `'off'`. As Phase 4 backfills an app (flows/tests/APPROVE reports registered),
  flip it `'off' → 'warn' → 'block'`. Target: `'block'` everywhere.

### Standing coverage wiring this gate reads (built BP-1..BP-5, 2026-08-03; doc-debt repaid here)

The gate consumes signals produced by the Phase-1/2 machinery — documented here so the wiring is not
folklore:
- **`flows.linked_playwright_test`** is written when a flow's test path is registered; a flow with
  it NULL/'' is a coverage **GAP** (surfaced by `/coverage`, BP-5) and R6 reason `no-test`.
- **`feature_verification_reports` are keyed to the FLOW** (`target_id = flow id`); `GET
  ?project_slug&target_id&latest=1` reads the latest verdict; the commit gate matches `commit_sha`.
- **`flows.test_status`** is set by the per-flow test writer (`POST /api/flows/[id]/test`,
  `ran_by:'automated'`), which also feeds `flow_test_runs` (the existing E2E-green gate).
- **`features.test_status` is DERIVED** — the AND-of-linked-flows roll-up (`lib/feature-rollup.ts`,
  BP-2): cascaded on each flow-test write and re-derivable in bulk via `POST /api/coverage/recompute`.
  R6 reason `not-passing` fires when this ≠ `passing`.
- **`/coverage` (BP-5)** renders real per-flow/per-feature status + **GAPS** + last verdict.
- **Verify-site queue (BP-4)** — `planFullSite` enqueues every flow; a host runner drains it, runs
  the disposable-sandbox verifier, and POSTs APPROVE reports — i.e. it is the machine that produces
  the very APPROVE@commit rows `/api/verify/gate` requires.

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

## Coverage + drift (added 2026-09-07 — #718, #719)

- **Coverage:** `node scripts/feature-verify/coverage.mjs [--app <slug>] [--json]` (deployed copy: `/opt/homeserver/fv-harness/coverage.mjs`). For every feature / flow / page the tracker knows: matrix present? cases assert system state? latest verdict + date + commit? `STALE` (the tracker's stale-verification rule)? `NEVER-RED` (no case of that matrix has ever failed in the evidence history — a detector that has never gone red has never been shown to detect anything)? Counts and flags only, deliberately no score. Run it at pack-up for any project whose features changed; a target that gains a matrix without ever going red is not yet evidence of anything.
- **Drift guard:** `fv-drift.sh` runs first in both nightlies — fail-closed in `fv-harness/nightly.sh` (the shared runner refuses to run if it differs from any manifest app's `tests/e2e/feature-verify` tree) and reported in `/opt/homeserver/scripts/ottomate-nightly.sh`. Sync is deliberately manual: auto-copying would hide which side is newer. Measured before the fix: shared vs screenroom differed by 9,109 lines in `run-matrix.feature-verify.spec.ts` alone.
- **Known state:** the nightly fv step itself has been SKIPPED since 2026-08-28 (owner ruling: side-effecting oracles). Until it is re-enabled or run by hand, coverage will show `never verified` / stale verdicts — that is the truth, not a bug in the report.

## Project oracle modules (added 2026-09-07 — #717)

The shared runner is generic; each project's held-out oracles live in **its own repo** at
`tests/e2e/feature-verify/oracles/index.ts` (a factory, contract in `harness/project-oracles.ts`). When a feature
verifier is dispatched for a project that has no module yet, the first job is to author that module + its case
matrices and register the app in `feature-verify-apps.json` — until then every case is `skipped: no registered
oracle`, which `coverage.mjs` shows as NO-MATRIX / NEVER-VERIFIED. Never put a project's oracles back into the
shared runner.
