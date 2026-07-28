// dictionaries.mjs — Phase 2. Loader + query API for the design-intelligence dictionaries the AI loads
// on activation (spec §3 Pillar E): motion (P2.1), chart-by-data (P2.2), pattern/combination (P2.3).
// Pure + dependency-free; the dictionaries are data files under data/dictionaries/.

import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const DICT_DIR = path.resolve(HERE, '../../data/dictionaries');
const load = (name) => JSON.parse(readFileSync(path.join(DICT_DIR, name), 'utf8'));

// ── Motion dictionary (P2.1) ─────────────────────────────────────────────────────────────────────
export function loadMotionPatterns() { return load('motion-patterns.json'); }

const MOTION_ROLES = new Set(['productive', 'expressive']);
const REQUIRED = ['id', 'name', 'role', 'trigger', 'tokens', 'effect', 'reducedMotion'];

/**
 * Validate the motion dictionary. The NON-NEGOTIABLE the must-fail pins: every pattern MUST carry a
 * `reducedMotion` swap (rich by default, gracefully reduced — taste-profile.md). Also: valid role,
 * semantic (var-style) tokens only (no raw ms/easing), and good-with/avoid reference real pattern ids.
 * @returns {{ok:boolean, errors:string[]}}
 */
export function validateMotionDict(dict = loadMotionPatterns()) {
  const errors = [];
  const patterns = dict?.patterns ?? [];
  const ids = new Set(patterns.map((p) => p.id));
  for (const p of patterns) {
    for (const k of REQUIRED) if (p[k] == null || p[k] === '') errors.push(`${p.id ?? '?'}: missing "${k}"` + (k === 'reducedMotion' ? ' — rich-by-default REQUIRES a reduced-motion swap' : ''));
    if (p.role && !MOTION_ROLES.has(p.role)) errors.push(`${p.id}: unknown role "${p.role}"`);
    const tokVals = Object.values(p.tokens ?? {});
    for (const t of tokVals) if (typeof t === 'string' && !t.startsWith('--')) errors.push(`${p.id}: token "${t}" is a raw value — motion tokens must be semantic (--motion-*)`);
    for (const g of p.goodWith ?? []) if (!ids.has(g) && !/^[a-z-]+$/.test(g)) errors.push(`${p.id}: goodWith "${g}" is not a known pattern id`);
    for (const a of p.avoid ?? []) if (!ids.has(a) && !/^[a-z-]+$/.test(a)) errors.push(`${p.id}: avoid "${a}" is not a known pattern id`);
  }
  return { ok: errors.length === 0, errors };
}

export function motionPattern(id, dict = loadMotionPatterns()) { return (dict.patterns ?? []).find((p) => p.id === id) ?? null; }
export function motionByRole(role, dict = loadMotionPatterns()) { return (dict.patterns ?? []).filter((p) => p.role === role); }
export function motionByTrigger(trigger, dict = loadMotionPatterns()) { return (dict.patterns ?? []).filter((p) => p.trigger === trigger); }
export function reducedMotionSwap(id, dict = loadMotionPatterns()) { return motionPattern(id, dict)?.reducedMotion ?? null; }

/** Patterns that pair well / clash with a given one — the "good together / avoid together" for motion. */
export function motionAffinity(id, dict = loadMotionPatterns()) {
  const p = motionPattern(id, dict);
  if (!p) throw new Error(`unknown motion pattern "${id}"`);
  return { goodWith: p.goodWith ?? [], avoid: p.avoid ?? [] };
}

/**
 * Recommend motion for a context, honouring the owner's appetite. `appetite:'expressive'` (the default
 * for this owner) surfaces expressive patterns first; a productive-only surface (dense data) filters them.
 */
export function recommendMotion({ triggers = [], appetite = 'expressive' } = {}, dict = loadMotionPatterns()) {
  let out = (dict.patterns ?? []).filter((p) => triggers.length === 0 || triggers.includes(p.trigger));
  if (appetite === 'productive') out = out.filter((p) => p.role === 'productive');
  // expressive first when the owner's appetite allows it
  return out.sort((a, b) => (appetite === 'expressive' ? (a.role === 'expressive' ? -1 : 1) - (b.role === 'expressive' ? -1 : 1) : 0));
}

// ── Chart-by-data dictionary (P2.2, FT Visual Vocabulary) ──────────────────────────────────────────
export function loadChartDict() { return load('chart-by-data.json'); }

export const DATA_RELATIONSHIPS = [
  'change-over-time', 'magnitude', 'part-to-whole', 'ranking', 'deviation',
  'correlation', 'distribution', 'spatial', 'flow',
];

/** Validate the chart dictionary: all 9 relationships present, each with charts whose encoding is known. */
export function validateChartDict(dict = loadChartDict()) {
  const errors = [];
  const rel = dict?.relationships ?? {};
  const channels = new Set(dict?.encoding_accuracy ?? []);
  for (const r of DATA_RELATIONSHIPS) if (!rel[r]) errors.push(`missing data-relationship "${r}"`);
  for (const [name, r] of Object.entries(rel)) {
    if (!DATA_RELATIONSHIPS.includes(name)) errors.push(`unknown data-relationship "${name}"`);
    if (!Array.isArray(r.charts) || !r.charts.length) errors.push(`${name}: no charts`);
    for (const c of r.charts ?? []) {
      if (!c.id || !c.when) errors.push(`${name}: a chart is missing id/when`);
      // encoding may combine channels with "+"; every part must be a known channel
      for (const part of String(c.encoding ?? '').split('+')) if (part && !channels.has(part)) errors.push(`${name}.${c.id}: unknown encoding channel "${part}"`);
    }
  }
  return { ok: errors.length === 0, errors };
}

/**
 * Charts for a data relationship, RANKED by encoding accuracy (position > length > angle > area > colour).
 * The first result is the most perceptually accurate default; later ones are legitimate when their `when`
 * fits. Each carries the `avoid` note so the generator does not walk into the common trap.
 * @param {string} relationship one of DATA_RELATIONSHIPS
 */
export function chartsForRelationship(relationship, dict = loadChartDict()) {
  const r = dict.relationships?.[relationship];
  if (!r) throw new Error(`unknown data relationship "${relationship}" (known: ${DATA_RELATIONSHIPS.join(', ')})`);
  const rank = (enc) => Math.min(...String(enc).split('+').map((p) => {
    const i = (dict.encoding_accuracy ?? []).indexOf(p);
    return i === -1 ? 99 : i;
  }));
  return [...r.charts].sort((a, b) => rank(a.encoding) - rank(b.encoding));
}

/** The single best-default chart for a relationship (most accurate encoding). */
export function bestChart(relationship, dict = loadChartDict()) { return chartsForRelationship(relationship, dict)[0]; }

/** The global + per-relationship avoid notes, so the generator never picks a known-bad chart. */
export function chartAvoids(relationship, dict = loadChartDict()) {
  const r = dict.relationships?.[relationship];
  return { global: dict.global_avoid ?? [], perChart: (r?.charts ?? []).map((c) => ({ id: c.id, avoid: c.avoid })).filter((x) => x.avoid) };
}
