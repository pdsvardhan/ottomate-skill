# P2-B Independence + Fail-Closed Enforcement Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Make the verifier structurally un-gaslightable — a held-out + tamper-detected + trust-recorded + reproduce-symptom enforcement layer that the P2-A runner consults before any verdict.

**Architecture:** Four small guard modules (`tamper-guard`, `baseline-guard`, `reproduce-symptom`, `trust-record`) plus wiring into the P2-A runner. Pure logic where possible (node-testable); git-dependent bits isolated in `tamper-guard`. A run is trustworthy-APPROVE only when every independence dimension holds; otherwise the verdict downgrades to advisory.

**Tech Stack:** Node 20 ESM `.mjs`, `node --test`, `git` (via `child_process`), the P1 harness + P2-A runner in `skills/ottomate/scripts/feature-verify/`. Design: `docs/plans/2026-07-28-task3-P2B-independence-enforcement-design.md`.

**Dependency:** Tasks 1–4 are independent of P2-A and can land first; Task 5 (wiring) needs the P2-A runner (P2-A Task 3). Working dir: `skills/ottomate/scripts/feature-verify/`.

---

### Task 1: `baseline-guard` — missing baseline ⇒ FAIL (smallest, independent)

**Files:** Create `harness/baseline-guard.mjs`, Test `harness/baseline-guard.test.mjs`.

**Step 1 — Failing test:**
```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { requireBaseline } from './baseline-guard.mjs';

test('missing baseline is a FAIL, never auto-created', async () => {
  const r = await requireBaseline('/tmp/does-not-exist-xyz.png');
  assert.equal(r.ok, false); assert.match(r.detail, /missing baseline/i);
});
test('present baseline passes', async () => {
  const r = await requireBaseline(new URL(import.meta.url).pathname); // this file exists
  assert.equal(r.ok, true);
});
```
**Step 2 — Run fail:** `node --test harness/baseline-guard.test.mjs` → FAIL.
**Step 3 — Implement:**
```js
import { promises as fs } from 'node:fs';
/** A baseline that does not exist is a FAIL — NEVER auto-created (auto-blessing the current, possibly
 *  buggy UI is the "assert-the-bug-back" trap for pixels; see docs/research/task3/T2 §0). */
export async function requireBaseline(absPath) {
  try { const s = await fs.stat(absPath); return { ok: s.size > 0, detail: s.size > 0 ? `baseline present (${s.size}B)` : 'baseline is empty', observed: s.size }; }
  catch { return { ok: false, detail: `missing baseline: ${absPath} — refusing to auto-bless`, observed: null }; }
}
```
**Step 4 — Run pass. Step 5 — Commit:** `feat(task3 P2-B): baseline-guard — missing baseline is a FAIL`.

---

### Task 2: `reproduce-symptom` — pure two-phase verdict logic

**Files:** Create `harness/reproduce-symptom.mjs`, Test `harness/reproduce-symptom.test.mjs`.
The *running* of the assertion is the runner's job; this module owns the **verdict rule** over the two phases.

**Step 1 — Failing test:**
```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { symptomVerdict } from './reproduce-symptom.mjs';

test('RED pre-fix then GREEN post-fix + pass_to_pass green = pass', () => {
  assert.equal(symptomVerdict({ preFixRed: true, postFixGreen: true, passToPass: [true, true] }).outcome, 'pass');
});
test('RED then still-RED = fail', () => {
  assert.equal(symptomVerdict({ preFixRed: true, postFixGreen: false, passToPass: [] }).outcome, 'fail');
});
test('already-GREEN pre-fix = inconclusive (bug not reproduced), never pass', () => {
  const r = symptomVerdict({ preFixRed: false, postFixGreen: true, passToPass: [true] });
  assert.equal(r.outcome, 'warn'); assert.match(r.detail, /not reproduced/i);
});
test('a pass_to_pass regression = fail', () => {
  assert.equal(symptomVerdict({ preFixRed: true, postFixGreen: true, passToPass: [true, false] }).outcome, 'fail');
});
```
**Step 2 — Run fail. Step 3 — Implement:**
```js
/** SWE-bench FAIL_TO_PASS + PASS_TO_PASS as a verdict over two runner phases. A symptom that was not
 *  RED before the fix means the bug was never reproduced — inconclusive (warn), never a pass. */
export function symptomVerdict({ preFixRed, postFixGreen, passToPass = [] }) {
  if (!preFixRed) return { outcome: 'warn', detail: 'symptom not reproduced pre-fix (already green) — inconclusive, not a pass' };
  const regressed = passToPass.some((g) => g === false);
  if (postFixGreen && !regressed) return { outcome: 'pass', detail: 'RED pre-fix → GREEN post-fix, no PASS_TO_PASS regression' };
  return { outcome: 'fail', detail: !postFixGreen ? 'symptom still RED after the claimed fix' : 'a PASS_TO_PASS case regressed' };
}
```
**Step 4 — Run pass. Step 5 — Commit:** `feat(task3 P2-B): reproduce-symptom verdict (FAIL_TO_PASS + PASS_TO_PASS)`.

---

### Task 3: `trust-record` — the consolidated independence verdict

**Files:** Create `harness/trust-record.mjs`, Test `harness/trust-record.test.mjs`.

**Step 1 — Failing test:**
```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { assessTrust, applyTrust } from './trust-record.mjs';

const dims = { claim_blind: true, held_out: true, owner_reviewed: true, untampered: true, pre_build_authored: true };
test('all dimensions hold → trustworthy', () => assert.equal(assessTrust(dims).trustworthy, true));
test('one missing → not trustworthy, with the reason', () => {
  const r = assessTrust({ ...dims, owner_reviewed: false });
  assert.equal(r.trustworthy, false); assert.match(r.warnings.join(), /owner_reviewed/);
});
test('applyTrust downgrades an APPROVE to ITERATE when untrustworthy', () => {
  const v = applyTrust({ recommendation_overall: 'APPROVE', reason: 'all passed' }, assessTrust({ ...dims, untampered: false }));
  assert.equal(v.recommendation_overall, 'ITERATE'); assert.match(v.reason, /untrustworthy|untampered/);
});
test('applyTrust leaves a trustworthy verdict unchanged', () => {
  const v = applyTrust({ recommendation_overall: 'APPROVE', reason: 'ok' }, assessTrust(dims));
  assert.equal(v.recommendation_overall, 'APPROVE');
});
```
**Step 2 — Run fail. Step 3 — Implement:**
```js
export function assessTrust(dimensions) {
  const warnings = Object.entries(dimensions).filter(([, v]) => v !== true).map(([k]) => `independence dimension not satisfied: ${k}`);
  return { trustworthy: warnings.length === 0, dimensions, warnings };
}
/** A run that is not trustworthy can never be a gating APPROVE — downgrade to advisory ITERATE, keeping
 *  the reason so the anti-gaslight property is an auditable field, not a promise. */
export function applyTrust(verdict, trust) {
  if (trust.trustworthy || verdict.recommendation_overall !== 'APPROVE') return verdict;
  return { ...verdict, recommendation_overall: 'ITERATE', mandatory_user_review: false, reason: `untrustworthy run (${trust.warnings.join('; ')}) — advisory, not gating` };
}
```
**Step 4 — Run pass. Step 5 — Commit:** `feat(task3 P2-B): trust-record — untrustworthy runs never gate`.

---

### Task 4: `tamper-guard` — the file-tamper tripwire (git)

**Files:** Create `harness/tamper-guard.mjs`, Test `harness/tamper-guard.test.mjs`.

**Design:** `assertUntampered({ repoRoot, featureCommits, protectedPaths })` runs `git diff --name-only <base>..<head>` (or over the listed commits) and returns `{ untampered, touched, action }`. `touched` = protected paths that appear in the feature's diff. Isolate the git call behind an injectable `runGit` so the test needs no repo.

**Step 1 — Failing test** (inject a fake `runGit`):
```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { assertUntampered } from './tamper-guard.mjs';

const protectedPaths = ['design/feature-verify/x.matrix.json'];
test('a feature commit that touched the matrix → tampered', async () => {
  const runGit = async () => 'app/page.tsx\ndesign/feature-verify/x.matrix.json\n';
  const r = await assertUntampered({ featureCommits: ['a', 'b'], protectedPaths, runGit });
  assert.equal(r.untampered, false); assert.deepEqual(r.touched, protectedPaths); assert.equal(r.action, 're-derive');
});
test('a clean feature diff → untampered', async () => {
  const runGit = async () => 'app/page.tsx\nlib/db.ts\n';
  const r = await assertUntampered({ featureCommits: ['a'], protectedPaths, runGit });
  assert.equal(r.untampered, true); assert.equal(r.action, 'none');
});
```
**Step 2 — Run fail. Step 3 — Implement:**
```js
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
const pexec = promisify(execFile);
const defaultRunGit = async (repoRoot, commits) => {
  const { stdout } = await pexec('git', ['show', '--name-only', '--pretty=format:', ...commits], { cwd: repoRoot, maxBuffer: 4e6 });
  return stdout;
};
/** Flag if any of the feature's build commits touched a verifier-owned file (the matrix). A tampered
 *  matrix is the "edit the test to pass" hack (T3 §1) — re-derive from the requirement, never trust it. */
export async function assertUntampered({ repoRoot = '.', featureCommits = [], protectedPaths = [], runGit = defaultRunGit }) {
  const out = await runGit(repoRoot, featureCommits);
  const changed = new Set(out.split('\n').map((s) => s.trim()).filter(Boolean));
  const touched = protectedPaths.filter((p) => changed.has(p));
  return touched.length
    ? { untampered: false, touched, action: 're-derive', detail: `feature commit touched verifier file(s): ${touched.join(', ')}` }
    : { untampered: true, touched: [], action: 'none', detail: 'no verifier file touched by the feature diff' };
}
```
**Step 4 — Run pass. Step 5 — Commit:** `feat(task3 P2-B): tamper-guard — flag a matrix edited by the feature diff`.

---

### Task 5: Wire the guards into the P2-A runner + the `reproduce_symptom` case kind

**Files:** Modify `run-matrix.feature-verify.spec.ts` (P2-A), `harness/matrix.mjs` (allow `reproduce_symptom` case fields), `harness/index.ts` (export the four guards).

**Steps (TDD where the logic is pure; integration proven on VAULT7A):**
1. Extend `validateMatrix` to accept optional `reproduce_symptom`, `symptom_assert`, `pass_to_pass` on a case; add a test that a reproduce-symptom case validates and that `pass_to_pass` must reference real case ids. Commit.
2. In the runner's `afterAll`, before `postReport`: build `dimensions` (claim_blind from the matrix's `authored.blind_to_diff`; owner_reviewed from `review.owner_locked`; pre_build_authored + untampered from `assertUntampered` given `FV_FEATURE_COMMITS`), call `assessTrust`, `applyTrust(verdict, trust)`, and attach `full_report:{ trust }`. Commit.
3. In the runner's per-case dispatch, handle a `reproduce_symptom` case via the two-phase protocol (phase from `FV_PHASE=pre|post`), folding `symptomVerdict` into the case outcome. Commit.
4. Export the guards from `harness/index.ts`. Commit.

---

### Task 6: Demonstrate on MoB + register

**Files:** a throwaway `mapsofbharat.symptom-demo.matrix.json` fixture; Modify `SKILL-REGISTER.md` (P2-B row, same commit).

**Steps:** author a `reproduce_symptom` case whose `symptom_assert` is RED against a deliberately-broken expectation (the P1-B fabricated-count trick) and GREEN against the correct one; run phase=pre (RED recorded) then phase=post (GREEN) on VAULT7A; confirm the report carries `full_report.trust` and the symptom verdict; and confirm an unreviewed matrix downgrades APPROVE→ITERATE. Commit: `feat(task3 P2-B): demonstrate independence enforcement on MoB + register`.

---

## Definition of done
Four guards green under `node --test harness/*.test.mjs`; the runner attaches a `trust` record and downgrades untrustworthy runs; a `reproduce_symptom` case goes RED→GREEN across two phases on VAULT7A; a matrix edited by a feature commit is flagged; a missing baseline is a FAIL; register updated same-commit. Then Phase 3 (P3-A judge, P3-B fidelity, P3-C gate-wiring/nightly, P3-D monitor).
