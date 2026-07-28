// Case-matrix file: enums + a fail-closed validator + loader (P2-A). The declarative matrix is the
// reviewable, versioned unit the runner executes. See docs/plans/2026-07-28-task3-P2A-*-design.md.
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
  // P3-C1: optional `covers` globs drive on-commit impacted-matrix selection (absent ⇒ always impacted).
  if (m.covers !== undefined && (!Array.isArray(m.covers) || m.covers.some((g) => typeof g !== 'string')))
    e.push('covers, if present, must be an array of glob strings');
  const ids = new Set((m.cases ?? []).map((c) => c.id));
  for (const c of m.cases ?? []) {
    if (!c.id) e.push('case missing id');
    if (!PATHS.includes(c.path)) e.push(`case ${c.id}: bad path "${c.path}"`);
    if (!Array.isArray(c.oracles) || c.oracles.length === 0) e.push(`case ${c.id}: needs ≥1 oracle`);
    for (const o of c.oracles ?? []) if (!LAYERS.includes(o.layer)) e.push(`case ${c.id}: bad layer "${o.layer}"`);
    // P2-B: optional reproduce-symptom fields.
    if (c.reproduce_symptom) {
      if (!c.symptom_assert) e.push(`case ${c.id}: reproduce_symptom needs symptom_assert`);
      for (const ref of c.pass_to_pass ?? []) if (!ids.has(ref)) e.push(`case ${c.id}: pass_to_pass ref "${ref}" is not a case id`);
    }
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
