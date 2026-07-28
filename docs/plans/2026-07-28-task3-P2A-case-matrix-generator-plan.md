# P2-A Case-Matrix Generator Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Turn a feature requirement into a bounded, independent, reviewable declarative case-matrix file that a data-driven runner executes by attaching the already-built P1 oracle layers.

**Architecture:** A claim-blind generator (EP/BVA values → fixed path templates → attach P1 oracle layers → JS pairwise bound → risk-order → emit `<feature>.matrix.json`), a data-driven Playwright runner that reads the file and drives each case, and a guard enforcing temporal/claim-blind independence + the owner-review gate. Runner-first: first prove the file→runner→verdict path reproduces P1-A's APPROVE, then build the generator that authors the file.

**Tech Stack:** Node 20 (ESM `.mjs`, `node --test`), Playwright `@playwright/test`, the P1 harness modules in `skills/ottomate/scripts/feature-verify/harness/`. Self-contained — a hand-rolled JS pairwise, no external ACTS/PICT. Design: `docs/plans/2026-07-28-task3-P2A-case-matrix-generator-design.md`.

**Working dir for all paths below:** `skills/ottomate/scripts/feature-verify/`. Run tests on VAULT7A staging `/tmp/fv` (recipe in `docs/plans/2026-07-28-task3-P1A-browser-leg-plan.md`); pure-logic tests (`node --test`) also run locally.

---

### Task 1: JS pairwise (self-contained 2-way covering array)

**Files:**
- Create: `harness/pairwise.mjs`
- Test: `harness/pairwise.test.mjs`

**Step 1 — Write the failing test** (`harness/pairwise.test.mjs`):
```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { pairwise } from './pairwise.mjs';

test('covers every value pair in < full cross-product', () => {
  const rows = pairwise({ a: ['1', '2'], b: ['x', 'y'], c: ['p', 'q'] });
  // every 2-way combination appears at least once
  for (const [k1, k2] of [['a', 'b'], ['a', 'c'], ['b', 'c']]) {
    for (const v1 of ['1', '2'].slice(0)) void v1; // exhaustive check below
  }
  const has = (k1, v1, k2, v2) => rows.some((r) => r[k1] === v1 && r[k2] === v2);
  for (const v1 of ['1', '2']) for (const v2 of ['x', 'y']) assert.ok(has('a', v1, 'b', v2), `a=${v1},b=${v2}`);
  for (const v1 of ['1', '2']) for (const v2 of ['p', 'q']) assert.ok(has('a', v1, 'c', v2));
  for (const v1 of ['x', 'y']) for (const v2 of ['p', 'q']) assert.ok(has('b', v1, 'c', v2));
  assert.ok(rows.length < 8, `pairwise ${rows.length} should be < full 8`);
});

test('single-parameter and empty are handled', () => {
  assert.equal(pairwise({ a: ['1', '2', '3'] }).length, 3);
  assert.deepEqual(pairwise({}), [{}]);
});
```
**Step 2 — Run, verify it fails:** `node --test harness/pairwise.test.mjs` → FAIL (`pairwise` not defined).

**Step 3 — Implement** (`harness/pairwise.mjs`): a greedy IPO-style all-pairs generator.
```js
// Self-contained 2-way covering array (greedy). Bounds the parameter cross-product so the case
// matrix stays small while covering every value pair — the NIST interaction-rule justification
// (2-way ≈ 93% of real faults). See docs/research/task3/T2-oracle-and-case-generation.md.
export function pairwise(params) {
  const keys = Object.keys(params);
  if (keys.length === 0) return [{}];
  if (keys.length === 1) return params[keys[0]].map((v) => ({ [keys[0]]: v }));
  const need = new Set();                          // "k1=v1|k2=v2" pairs still to cover
  for (let i = 0; i < keys.length; i++)
    for (let j = i + 1; j < keys.length; j++)
      for (const a of params[keys[i]]) for (const b of params[keys[j]]) need.add(`${keys[i]}=${a}|${keys[j]}=${b}`);
  const rows = [];
  while (need.size) {
    const row = {};
    for (const k of keys) {                        // pick each param's value greedily to cover most new pairs
      let best = params[k][0], bestGain = -1;
      for (const v of params[k]) {
        let gain = 0;
        for (const k2 of keys) if (k2 in row) {
          const key = k < k2 ? `${k}=${v}|${k2}=${row[k2]}` : `${k2}=${row[k2]}|${k}=${v}`;
          if (need.has(key)) gain++;
        }
        if (gain > bestGain) { bestGain = gain; best = v; }
      }
      row[k] = best;
    }
    for (let i = 0; i < keys.length; i++)          // retire the pairs this row covers
      for (let j = i + 1; j < keys.length; j++)
        need.delete(`${keys[i]}=${row[keys[i]]}|${keys[j]}=${row[keys[j]]}`);
    rows.push(row);
    if (rows.length > 10000) break;                // safety
  }
  return rows;
}
```
**Step 4 — Run, verify pass:** `node --test harness/pairwise.test.mjs` → PASS.

**Step 5 — Commit:** `git add harness/pairwise.mjs harness/pairwise.test.mjs && git commit -m "feat(task3 P2-A): self-contained JS pairwise covering-array"`

---

### Task 2: Matrix schema — load + validate (fail-closed)

**Files:**
- Create: `harness/matrix.mjs`
- Test: `harness/matrix.test.mjs`

**Step 1 — Failing test** (`harness/matrix.test.mjs`): a well-formed matrix validates; each defect fails.
```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validateMatrix, PATHS, LAYERS } from './matrix.mjs';

const good = {
  feature: 'f.x', requirement_ref: 'AC-1',
  authored: { from: 'locked-AC', at_commit: 'abc123', blind_to_diff: true },
  target: { kind: 'flow', id: 'x', base: 'FV_INSTANCE_URL' },
  parameters: { indicator: ['A', 'B'] },
  cases: [{ id: 'c1', path: 'happy', params: { indicator: 'A' }, oracles: [{ layer: 'system-state' }] }],
  review: { owner_locked: false, locked_at: null },
};
test('a well-formed matrix passes', () => assert.equal(validateMatrix(good).ok, true));
test('must-fail: bad path enum', () => {
  const bad = structuredClone(good); bad.cases[0].path = 'nonsense';
  const r = validateMatrix(bad); assert.equal(r.ok, false); assert.match(r.errors.join(), /path/);
});
test('must-fail: bad oracle layer', () => {
  const bad = structuredClone(good); bad.cases[0].oracles = [{ layer: 'made-up' }];
  assert.equal(validateMatrix(bad).ok, false);
});
test('must-fail: no cases / missing authored.at_commit', () => {
  assert.equal(validateMatrix({ ...good, cases: [] }).ok, false);
  const b2 = structuredClone(good); delete b2.authored.at_commit; assert.equal(validateMatrix(b2).ok, false);
});
```
**Step 2 — Run, verify fail.**

**Step 3 — Implement** (`harness/matrix.mjs`): enums + a pure validator + `loadMatrix(path)`.
```js
import { promises as fs } from 'node:fs';
export const PATHS = ['happy', 'error', 'edge', 'permission', 'concurrency', 'persistence'];
export const LAYERS = ['system-state', 'implicit', 'metamorphic', 'visual'];
export function validateMatrix(m) {
  const e = [];
  if (!m || typeof m !== 'object') return { ok: false, errors: ['not an object'] };
  for (const k of ['feature', 'requirement_ref']) if (!m[k]) e.push(`missing ${k}`);
  if (!m.authored?.at_commit) e.push('missing authored.at_commit');
  if (m.authored?.blind_to_diff !== true) e.push('authored.blind_to_diff must be true');
  if (!m.target?.kind || !m.target?.id) e.push('missing target.kind/id');
  if (!Array.isArray(m.cases) || m.cases.length === 0) e.push('cases must be a non-empty array');
  for (const c of m.cases ?? []) {
    if (!c.id) e.push('case missing id');
    if (!PATHS.includes(c.path)) e.push(`case ${c.id}: bad path "${c.path}"`);
    if (!Array.isArray(c.oracles) || c.oracles.length === 0) e.push(`case ${c.id}: needs ≥1 oracle`);
    for (const o of c.oracles ?? []) if (!LAYERS.includes(o.layer)) e.push(`case ${c.id}: bad layer "${o.layer}"`);
  }
  if (typeof m.review?.owner_locked !== 'boolean') e.push('missing review.owner_locked');
  return { ok: e.length === 0, errors: e };
}
export async function loadMatrix(path) {
  const m = JSON.parse(await fs.readFile(path, 'utf8'));
  const v = validateMatrix(m);
  if (!v.ok) throw new Error(`invalid matrix ${path}: ${v.errors.join('; ')}`);
  return m;
}
```
**Step 4 — Run, verify pass. Step 5 — Commit:** `feat(task3 P2-A): matrix file schema + fail-closed validator`.

---

### Task 3: The data-driven runner — reproduce P1-A's verdict from a matrix FILE (the key proof)

**Files:**
- Create: `run-matrix.feature-verify.spec.ts`
- Create (fixture): `docs/rounds/../mapsofbharat.indicator-switch.matrix.json` (hand-write the matrix that encodes P1-A's 3 cases; `owner_locked:true` for the demo)
- Reuse: `harness/` (loadConfig, Matrix, postReport, the P1 oracle modules), `harness/matrix.mjs`

**Step 1 — Write the fixture matrix** encoding P1-A's indicator-switch cases (happy: name+API; edge: switch+non-constancy via `system-state`/`metamorphic`; error: `implicit` no-console-errors). Set `authored.at_commit` to P1-A's commit, `review.owner_locked:true`.

**Step 2 — Write the runner spec** (`run-matrix.feature-verify.spec.ts`): read `FV_MATRIX_FILE`, `loadMatrix`, then one Playwright `test` per case that dispatches on `case.oracles[].layer` to the P1 modules:
```ts
// for each case: navigate target with case.params, then for each oracle:
//   'system-state' → assertViaApi / the 2nd-channel check named in oracle.assert
//   'implicit'     → collectPageErrors + assertPopulationOk
//   'metamorphic'  → nonConstancy / conservation over the case's two runs
//   'visual'       → checkNoHorizontalOverflow / checkAxeContrast
// record each into matrix; afterAll postReport (target_id = m.feature).
```
Keep the dispatch small — a `switch (oracle.layer)` calling the already-built helpers with `oracle.args`.

**Step 3 — Run on VAULT7A** with `FV_MATRIX_FILE=<fixture>`:
`FV_* … FV_MATRIX_FILE=/tmp/fv/mapsofbharat.indicator-switch.matrix.json node_modules/.bin/playwright test -c playwright.feature-verify.config.ts run-matrix.feature-verify.spec.ts`
**Expected:** verdict **APPROVE**, a `feature_verification_reports` row for `mapsofbharat.indicator-switch` — i.e. the declarative file reproduces the hand-written P1-A result.

**Step 4 — Verify** the report row + summary match P1-A's shape. **Step 5 — Commit:** `feat(task3 P2-A): data-driven matrix runner — reproduces P1-A from a declarative file`.

---

### Task 4: The generator scaffold (deterministic structure)

**Files:**
- Create: `gen-matrix.mjs` (exports `buildMatrix(requirement)` + a CLI)
- Test: `gen-matrix.test.mjs`

**buildMatrix(requirement)** does the deterministic half: from `requirement.parameters` (EP/BVA classes the caller/Claude supplies) it instantiates the `PATHS` templates, runs `pairwise(parameters)` to bound the cross-product, attaches the requirement's declared oracle layers per path, risk-orders (data-loss/permission paths first), and stamps `authored.at_commit` from `git rev-parse HEAD`. The oracle *specifics* (`assert` strings) are filled by the Claude pass (Task 6); the scaffold emits valid structure.

**Tests (must-pass + must-fail):** produces a `validateMatrix`-valid file from a sample requirement; the pairwise case-count is < full cross-product; permission/persistence paths are present; risk-order puts them first; **must-fail:** a requirement with an unknown oracle layer throws.

**Commit:** `feat(task3 P2-A): generator scaffold — EP/BVA→paths→pairwise→risk-order`.

---

### Task 5: Independence guard — temporal/tamper + owner-review gate

**Files:**
- Create: `harness/matrix-guard.mjs`
- Test: `harness/matrix-guard.test.mjs`

**`assessIndependence(matrix, {featureCommits})`** returns `{gating: boolean, warnings[]}`: **not gating** if `review.owner_locked !== true` (unreviewed → advisory); **high-risk warning** if `authored.at_commit` is a descendant of / equal to any `featureCommits` (matrix authored at-or-after the build — temporal violation). The runner calls this and, when `gating:false`, records the run as advisory (verdict downgraded to ITERATE with the reason).

**Tests (must-fail):** an unreviewed matrix → `gating:false`; a matrix stamped at the build commit → temporal warning. **must-pass:** reviewed + pre-build → `gating:true`, no warnings.

**Commit:** `feat(task3 P2-A): independence guard — owner-review gate + temporal tamper check`.

---

### Task 6: The claim-blind generator prompt

**Files:**
- Create: `prompts/feature-verifier-matrix-prompt.md`

The prompt the skill runs in a FRESH sub-agent to fill the oracle specifics: inputs are ONLY the requirement/AC (or the owner's bug report) + the target's public surface — **never the coder's diff or "I fixed X"**. It fills each case's `oracles[].assert`/`args` by choosing from the P1 layers (it does not invent assertions), and for a bug-report authors the reproduce-symptom case (RED pre-fix → GREEN after). Mirror the structure of `prompts/feature-verifier-prompt.md`; cite the independence rules from the design doc.

**Commit:** `docs(task3 P2-A): claim-blind matrix-generator prompt`.

---

### Task 7: Wire in + register

**Files:**
- Modify: `references/stage-3-feature-verifier.md` (the generator runs at spec-lock; the runner at verify), `references/stage-4-mini-pipeline.md` §4.7 (matrix authored from the bug report for owner-reported fixes).
- Modify: `SKILL-REGISTER.md` (feature-verifier row — P2-A done, in the SAME commit).

**Commit:** `feat(task3 P2-A): wire the case-matrix generator into stages 3 + 4.7`.

---

## Definition of done
The runner reproduces P1-A's APPROVE from a declarative matrix file (Task 3); the generator emits a valid, pairwise-bounded, risk-ordered matrix from a requirement (Task 4); the independence guard blocks an unreviewed or post-build matrix from gating (Task 5); all unit tests green (`node --test harness/*.test.mjs` + the runner on VAULT7A); register updated same-commit. Then the first real use: generate + owner-review + run a matrix for a second MoB feature end-to-end.
