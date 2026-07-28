# Task 3 — Feature Verifier (build-integrated, sibling to the code verifier)

> **CANONICAL COPY — this file, in the plugin repo, is the source of truth (owner ruling 2026-07-27).**
> The former originals under `~/Desktop/Skills CC/Ottomate/` are superseded and now hold a pointer to
> here. They were outside version control, and on 2026-07-27 that produced its first real consequence:
> the two copies of the Task-2 spec had silently diverged, and an audit had to be scored twice.
> Amendments go **here**, dated and signed, and never into a second copy.


**Status:** ✅ LOCKED 2026-07-23. Build order: Task 1 → **Task 3** → Task 2.
**Author:** design session 2026-07-23. Task 3 of 3.
**Source:** `Downloads/TASK3-FEATURE-TESTING-METHOD.md` (owner's method) + 2026 market research (this session).
**Related:** Task 1 (visual-QA intake, LOCKED) shares the evidence intake; Task 2 (UI design) prevents issues this catches.

---

## AMENDMENT — 2026-07-28 (Track B, owner-approved). Scope broadened + architecture refined by deep research.

> This section **amends** §3 (scope), §4 (architecture), §5C (case-gen), §9 (selectors), §11 (anti-gaslight)
> below, which are **preserved unchanged** for history. Where they conflict, **this amendment governs.**
> Full detail: [`docs/plans/2026-07-28-task3-IMPLEMENTATION-PLAN.md`](../plans/2026-07-28-task3-IMPLEMENTATION-PLAN.md)
> + research [`docs/research/task3/{T1,T2,T3}`](../research/task3/).

**Why amended.** The owner broadened the verifier's remit, and a deep 3-track research sweep (visual
acceptance/VLM-judge · the test-oracle problem · agentic-verification/reward-hacking) both **validated the
original spec** (Playwright-anchored deterministic gate, AI advisory-only, fail-closed, no-SaaS) **and
sharpened it**. Net changes:

1. **Scope broadened to a commit-time TRUTH gate.** The verifier now proves that whatever the coding agent
   claims it built/fixed is actually true on the live site — **data correct, visuals as designed, matching
   the requirement** — across every case worth imagining. §3's non-goal *"not a substitute for design
   taste (Task 2)"* is **narrowed**: design/visual **correctness** is now in scope as a deterministic layer
   (overflow, clipping, collision, contrast, target-size, on-spec fidelity); only **holistic taste** stays
   advisory and Task-2's domain. Runs whenever the agent commits, and whenever the owner reports an issue
   and the agent claims a fix.

2. **Architecture: the "three layers" (§4) become SEVEN, fail-closed.** Deterministic HARD-GATE layers
   L1–L6 + one ADVISORY model layer L7:
   - **L1 Implicit-oracle** — no 4xx/5xx/console/job-orphan, over the whole population.
   - **L2 System-state** — DB row via API · file on disk · async job done — + a differential recompute.
   - **L3 Metamorphic/property** — relations that need no known-correct value (`fast-check`).
   - **L4 Mechanical-visual** — overflow/clip/collision/contrast/target-size/pseudo-loc/stress.
   - **L5 Reference-fidelity** — Design2Code metrics, when a target design image exists.
   - **L6 Pixel-regression** — **WARN**; **missing baseline ⇒ FAIL**, never auto-bless.
   - **L7 AI-judge** — **ADVISORY only, can fail but never bless**; blind to claims; reference-anchored;
     forced grounding cross-checked against L2/L4; disagreement→human. Justified by research: VLMs are ~58%
     at geometry and below-random at design quality, so math/DOM gate and the model only advises.

3. **The case-matrix generator gains architectural independence (the anti-gaslight core; refines §5C).**
   The verifier authors its checks in a **fresh context blind to the coder's diff and "I fixed X" claims**,
   from the **pinned requirement** only (LLM oracles otherwise bless the bug). Recipe: EP/BVA values → path
   templates (happy/error/edge/permission/concurrency/persistence) → layered oracles → **pairwise covering
   array** (NIST ACTS or MS PICT — free) → risk-order → owner reviews the matrix **once** → Claude
   *instantiates structured templates*, never free-forms the oracle. For every owner-reported fix, the
   verifier first writes a **reproduce-symptom** check (RED on the pre-fix state, GREEN after — the
   SWE-bench FAIL_TO_PASS pattern) + a PASS_TO_PASS sweep of adjacent behavior.

4. **Reward-hacking is documented, and dictates fail-closed (strengthens §11).** Agents fake green via
   `exit(0)`, `raise SkipTest`, `__eq__`→True, patching the test-report object, reading expected values
   from test files, memorizing tests — **all by making the check not really run.** Therefore: the verifier
   **owns and runs its own assertions** (never a coder exit-code/report), verdicts are `PASS/FAIL/UNMEASURED`
   with **UNMEASURED ⇒ FAIL**, checks live **held-out** from the build agent, and a **harness-tamper
   tripwire** re-derives assertions if verifier/config files were touched.

5. **`data-oid` is DEAD (corrects §9).** The owner withdrew stamping 2026-07-27 (`grep -rc data-oid` → 0).
   Selectors are `getByRole`/`getByTestId`/ARIA — **not** `data-oid`; the "one instrumentation, two
   consumers" claim in §9 no longer holds.

6. **Dependency ruling (refines D3/§4/§8).** Free/OSS deps are fine; **no paid SaaS**. **IN:** `axe-core`
   (the contrast/target-size engine for L4 — catches the owner's own "tags not visible / low contrast"),
   **Testcontainers** (disposable real DB for L2), `fast-check`, ACTS/PICT. **OUT:** Lighthouse-CI (perf
   not needed); Lost Pixel as a primary path (pixel-regression is L6 WARN-only via Playwright's built-in
   `toHaveScreenshot`).

7. **Canvas/WebGL/3D is out of scope** (accepted) — DOM controls + data only, never the map/3D canvas paint.

**Confirmed first target (owner, 2026-07-28):** Phase 1 (P1-A) drives **Maps of Bharat**, the
**indicator → dataset → on-page-stats** control flow (DOM + data, not the map canvas).

**Build-order note:** the §Status line ("Task 1 → Task 3 → Task 2") is historical — Task 2 is built; Task 3
is now in active build per the implementation plan.

---

## 1. Problem & goal

The existing verifier (Stage 3.5) proves the **code**: files exist, no stubs, tests pass, each acceptance criterion has a test. But those tests are **coder-authored, happy-path, derived from ACs the coder/skill wrote** — so nothing *independently* drives the **real** feature with **nasty real inputs** and checks the **real effect** (the file that landed on disk with its Telugu tag intact, the DB row, the media rescan). A code verifier will green-light an upload whose button 500s, whose progress bar lies, or that transliterates non-ASCII filenames — because the *code* looked fine.

**Goal:** add a **feature verifier** — a second, independent gate that drives the running app like a QA human, feeds it real + nasty inputs, and asserts on **user-visible outcomes + system state, with evidence**. It complements (never replaces) the code verifier; a user-facing feature is "done" only when **both** are green. It runs **inside the build session** (Stage 3) and per-item in Stage 4.7 — as you put it: *"emulate clicks + check APIs in parallel, and a lot of 'does it actually work' clears itself."*

## 2. Decisions locked (Q&A + 2026 market research)

| # | Decision |
|---|---|
| D1 | **Deterministic tooling for the gate; AI only for discovery + judging.** 2026 data: agentic browser tools are 85–89% reliable (~11–15% flake/run) → they can't gate; DOM-driven beats vision by 12–17pp. |
| D2 | **Playwright is the anchor** (already in the repo; best-in-class for real file+folder uploads, trace/video/network/console evidence, auto-wait, free parallelism). NOT ad-hoc "Claude drives a browser." |
| D3 | **Self-hosted / OSS only on the critical path** — no SaaS that ingests the app (Testim/Mabl/Applitools/Meticulous/QA Wolf excluded). |
| D4 | **Runs in the build session**, against the real running app with storage access; a critical subset re-runs nightly in CI. |
| D5 | **Sibling to the code verifier**; both gate "done" — block-on-red for cv/public, warn for personal (matches adr-014). |
| D6 | **AI Explorer & Judge = Claude Code in the build session, not a hosted model** — VAULT7A has **no GPU** (probed 2026-07-23; i5-14600K / 62GB, iGPU only), so no local models. Explorer writes findings as deterministic Playwright specs; Judge scores subjective cells with a rubric + evidence, advisory only. |
| D7 | **Explorer runs a fixed high-value playbook** (§5H), each finding frozen into a deterministic spec. Hosted VLM deferred to unattended-CI judging only. |

## 3. Scope / non-goals

**In scope:** an independent feature-verifier that auto-derives a case matrix from the feature spec, drives the real app via Playwright, asserts system state, captures evidence, reports a case×outcome matrix, and gates completion beside the code verifier.

**Non-goals:** not replacing the code verifier or the existing Stage-3.6 test tiers (it extends them); no SaaS; AI agents never gate; not a substitute for design taste (that's Task 2, at design time).

## 4. Architecture — three layers (only the first one gates)

| Layer | Role | Tools (all free / self-hostable) |
|---|---|---|
| **Deterministic core** *(the gate)* | drive real UI + assert outcomes + **system state** | Playwright · `fs` + DB client + downstream SDK assertions · **Testcontainers** (disposable real deps) · `expect.poll()`/`toPass()` (async effects) · trace/video/network/console always on · `toHaveScreenshot`/Lost Pixel · `@axe-core/playwright` · Lighthouse-CI |
| **AI discovery = Claude Code** *(build session)* | run the §5H Explorer playbook, fuzz nasty inputs, find edge cases | **Claude Code drives it during the build** (no hosted model — no GPU); every finding is frozen into a **deterministic Playwright spec**. Never a live gate. |
| **AI judge = Claude Code** *(build session)* | score "does it look right / make sense?" | **Claude Code** scores subjective cells against a rubric, fed the screenshot + ARIA snapshot, recording a **structured verdict + the evidence it saw**. Advisory only; hosted VLM only if unattended-CI judging is wanted later. |

## 5. Component design

- **5A Deterministic core (gate).** Playwright drives the real end-to-end workflow (clicks, typing, `setInputFiles` incl. `webkitdirectory` folder uploads). After each action, a **system-state assertion layer** confirms the *effect*: `fs` for files (stat + read the bytes back), a DB client for rows, a downstream SDK/API for services; **Testcontainers** where a disposable real dependency helps. Evidence (trace/video/network/console) always on. Fold in `toHaveScreenshot` (or the repo's Lost Pixel), `@axe-core/playwright` as a hard gate, Lighthouse-CI for perf budgets.
- **5B The Unicode recipe (the headline nasty-input case).** The real trap is **NFC-vs-NFD normalization**. For each hard fixture (Telugu, Tamil, emoji, combining marks, RTL, long names): assert the stored name is NFC and `=== expected.normalize('NFC')`, assert it was **not** ASCII-transliterated (raw codepoints preserved), and verify the bytes match in **both** the DB row and the on-disk dirent. Catches "Telugu filename became `telugu` / `_____`" that functional tests never see.
- **5C Case generation (spec → cases → runnable tests).** From the feature's spec/ACs, auto-enumerate real workflows + variants (happy / edge: empty·max·boundary / error: net-fail·provider-down·permission / **data: non-ASCII·large·duplicate·corrupt·mixed**). Owner **reviews/adjusts the plan before any run** (a lock-in on the test plan). Emit Playwright specs + a capture/record harness + the analysis config.
- **5D Reporting + ledger.** Per-step (timestamp, action, screenshot, network, console), per-case (inputs, action log, **system-state values**, duration, pass/fail, evidence paths), per-run (machine-readable JSONL + a human-readable **case×outcome matrix** with each red linked to its proof, plus deltas vs the previous run). Persist to Ottomate (reuse `flow_test_runs`/`test_runs` + an evidence store) so trends are visible.
- **5E Isolation + anti-flake.** Per-test unique working dirs + seeded state; freeze time/animations (Playwright Clock API); stable fonts; tag genuinely external-dependency cases. **No self-healing selectors on the gate** — they can silently heal over a real regression; use `getByRole`/`getByTestId`/ARIA snapshots.
- **5F Sample data.** Prefer owner-provided real fixtures (esp. the nasty ones); synthesize when scarce (programmatic files with controlled tags/sizes/scripts); curate a reusable per-feature fixtures set; the skill **asks** for domain data it can't synthesize.
- **5G AI layers = Claude Code, in the build session (no hosted model).** VAULT7A has no GPU, so we do not self-host a model. **Explorer = Claude Code** runs the §5H playbook during the build, finds edge cases, and writes each as a deterministic Playwright spec (the value persists as tests). **Judge = Claude Code** scores only *subjective* cells against a written rubric, always fed the captured artifact, recording a structured verdict + evidence. Both are build-session-only and advisory; the deterministic core is the only thing that gates and the only thing that reruns unattended. A hosted VLM is deferred to "unattended-CI judging" if ever wanted (a slow CPU model or an API call).
- **5H Explorer playbook (the high-value jobs, run each build — not open-ended wandering; each finding → a deterministic spec).**
  1. **Adversarial inputs** — non-ASCII (Telugu/Tamil/emoji/RTL), empty, huge/max, malformed/corrupt, duplicate, mixed-type.
  2. **Interruptions & races** — double-submit, navigate away mid-operation, cancel mid-flow, rapid repeat, back-button mid-flow.
  3. **Error paths** — provider/dependency offline, permission denied, network drop, timeout → assert graceful, honest failure, no crash.
  4. **Boundary & state** — empty / first-run / at-limit states; cross-flow contamination (does X break Y).
  5. **Visibility** — logged-out vs owner vs guest each see the right thing.

## 6. Integration with the code verifier + skill

- Both are **independent sub-agents** the skill dispatches, blind to coder claims (same pattern the code verifier already uses).
- Code verifier: *"is the code correct/complete?"* (Stage 3.5). Feature verifier: *"does it work for a user?"* (new, Stage 3.6+ / Stage 4.7).
- **Completion gate:** both green. Wire into the Stage-3→deploy gate and the Stage-4.7 per-item verify. Skill **rule 10** ("Verifier is mandatory") gains a sibling: *feature verifier mandatory for user-facing features*.
- **Anti-gaslight fit:** system-state assertions **are** the anti-gaslight (they check the real effect, not a coder claim); AI verdicts never gate and are evidence-backed; **fail closed** — a skipped/mocked step can never render green (method principle 7).

## 7. Worked example — music-upload (your own)

Feature `/music/add`: upload audio → decode-verify → metadata reco → custom-metadata web-search → commit + rescan. Cases (each recorded + scored): single file · multi-file batch · **folder upload** · **non-ASCII (Telugu+Tamil) tags preserved** · reco sensible (AI-judge) · web-search returns + selectable (record results each run) · large file · duplicate · provider-offline error path. Captured per run: upload success + duration, per-file progress correctness, recommended metadata, search results, **final on-disk tags (native script preserved?)**, DB/library state, screenshots, network, console. The red on "non-ASCII tags preserved" points straight at the encoding bug **with the saved bytes as proof**.

## 8. Phasing

**Phase 1 (the gate + build-time AI):** deterministic feature-verifier — case-gen from spec (reviewed before run), Playwright real-workflow drive, system-state assertions (fs/DB/poll) + nasty fixtures incl. NFC/NFD, evidence capture, case-matrix report, wired as a sibling gate with block/warn per risk policy (reuses the repo's Playwright/axe/Lighthouse/Lost-Pixel) — **plus Claude Code as Explorer (playbook) + Judge**, both in the build session. No hosted model.

**Phase 2 (only if wanted):** unattended-CI subjective judging via a hosted VLM (slow CPU model or API), for when Claude isn't in the session.

## 9. Task 1 / Task 2 links (shared infra — build once)

- Task 1's **QA evidence intake is the same sink**: the feature-verifier posts its case-matrix + evidence through the same lock-in/verifier/trace store; a Task-1 bug comment ("upload stuck") becomes a Task-3 case that reproduces + records it.
- **`data-oid`** (Task 1) doubles as Task 3's stable test selectors — one instrumentation, two consumers.
- Task 2 prevents design issues at design time; Task 3 catches functional issues at build time — complementary gates.

## 10. Open decisions — RESOLVED at lock (2026-07-23)

**Applied:** AI Explorer & Judge = **Claude Code in the build session** (no hosted model, no GPU); Explorer runs the §5H playbook; visual regression = **keep Lost Pixel**; v1 = deterministic core + axe + Lost Pixel + system-state **+ build-time Claude Explorer/Judge**; report-sink = **reuse `flow_test_runs`/`test_runs` + evidence rows** (confirm exact shape vs live app); hosted AI-judge model = **deferred** to unattended-CI only. Confirm at build: runner storage reach per project (dev vs deploy target) for FS/DB assertions.

## 11. Risks / anti-gaslighting

- Flakiness → freeze time/animations, stable fonts, isolated dirs/seeds, Testcontainers; tag external-dependency cases honestly.
- Self-healing selectors banned on the gate.
- AI verdicts never gate; always evidence-backed + validated.
- Fail closed: a skipped/mocked step can't be green.

## 12. Acceptance criteria (Phase 1)

1. From a feature spec, the skill auto-produces a **reviewable case matrix** (workflows × variants incl. nasty/data).
2. The feature verifier runs **independently** (not coder-authored), drives the real app via Playwright, and **asserts system state** (a file with correct NFC unicode tag, a DB row, a rescan pickup) with evidence.
3. Produces a **case×outcome matrix** + structured results + evidence; a red links to exact proof (e.g. the saved bytes).
4. A user-facing feature passes the completion gate only when **both** code + feature verifier are green (block-on-red cv/public; warn personal).
5. Runs in the build session; a critical subset re-runs nightly in CI.
