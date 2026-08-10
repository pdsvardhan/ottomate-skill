// P2-A: the generator scaffold — the DETERMINISTIC half of the case-matrix recipe (the claim-blind
// Claude pass fills each case's oracle `assert`/`args`; this emits the valid, pairwise-bounded,
// risk-ordered structure). EP/BVA value classes → path templates → pairwise → risk-order → matrix file.
// See docs/plans/2026-07-28-task3-P2A-case-matrix-generator-design.md.
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { pairwise } from './harness/pairwise.mjs';
import { validateMatrix, LAYERS } from './harness/matrix.mjs';
const pexec = promisify(execFile);

// Higher-risk paths first (Risk = Likelihood × Impact): data-loss/permission before cosmetic happy.
const RISK_ORDER = ['permission', 'persistence', 'error', 'concurrency', 'edge', 'happy'];

export async function buildMatrix(req, { at_commit } = {}) {
  const layers = req.oracleLayers ?? ['system-state', 'implicit'];
  for (const l of layers) if (!LAYERS.includes(l)) throw new Error(`unknown oracle layer: ${l}`);
  const oracles = layers.map((layer) => ({ layer }));
  const combos = pairwise(req.parameters ?? {});
  // Happy path = the pairwise-reduced combinations; then ensure each mandatory path appears once.
  const cases = combos.map((params, i) => ({ id: `happy-${i + 1}`, path: 'happy', params, oracles }));
  for (const path of ['error', 'permission', 'persistence'])
    cases.push({ id: `${path}-1`, path, params: combos[0] ?? {}, oracles });
  cases.sort((a, b) => RISK_ORDER.indexOf(a.path) - RISK_ORDER.indexOf(b.path));

  const commit = at_commit ?? (await pexec('git', ['rev-parse', 'HEAD'], { cwd: req.repoRoot ?? '.' })
    .then((r) => r.stdout.trim()).catch(() => 'unknown'));

  const m = {
    feature: req.feature, requirement_ref: req.requirement_ref,
    authored: { from: req.from ?? 'locked-AC', at_commit: commit, blind_to_diff: true },
    target: req.target, parameters: req.parameters ?? {}, cases,
    review: { owner_locked: false, locked_at: null },
  };
  // Carry the registry flow id through when the caller names one — the runner posts it as
  // target_id so the deploy gate can see this run. Omitted rather than guessed: mapping a
  // matrix to the wrong flow would put a green APPROVE against a flow nobody drove.
  if (req.flow_id) m.flow_id = req.flow_id;
  const v = validateMatrix(m);
  if (!v.ok) throw new Error(`generated matrix invalid: ${v.errors.join('; ')}`);
  return m;
}
