// anatomy.mjs — resolve the two halves of the anatomy into the one shape every consumer expects.
//
// U1, 2026-07-27. Before the split, `component-anatomy.json` held four things at once: the tier
// definitions, the state matrix, the finite registry of design QUESTIONS, and the per-component facts.
// Because the universal half lived in the same blob as the per-component half, **adding a component
// meant re-authoring the universal half too** — each entry cost a full research-and-write pass, which
// is the entire reason there were only three archetypes.
//
// Split:
//   data/design-questions.json   tiers · state_matrix · questions{}   (universal, written once)
//   data/component-anatomy.json  archetypes{}                          (per-component, short)
//
// A component's record is now short enough to be DERIVED from its own source, because the JSX names
// the parts. That is U2.
//
// This module returns EXACTLY the pre-split shape, so no consumer had to change semantics. A golden
// snapshot taken before the split is asserted against it — the split provably changes nothing.

import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const DATA = path.join(HERE, '..', '..', 'data');

let _cache = null;
function loadRaw(dir = DATA) {
  if (_cache && _cache.dir === dir) return _cache.value;
  const questions = JSON.parse(readFileSync(path.join(dir, 'design-questions.json'), 'utf8'));
  const components = JSON.parse(readFileSync(path.join(dir, 'component-anatomy.json'), 'utf8'));
  const value = { questions, components };
  _cache = { dir, value };
  return value;
}

/** The universal question registry: id → { channel, scope_hint, kind, axis, token, hint, applies_to_tiers }. */
export function questionRegistry(dir = DATA) {
  return loadRaw(dir).questions.questions;
}

/**
 * Resolve ONE archetype to the pre-split shape:
 *   { tier, parts, required_states, required_variant_floor, sub_decisions:[{id,part,kind,axis,channel,scope_hint,hint}] }
 * A per-component entry may override `hint` / `kind` / `axis`; everything else comes from the registry.
 */
export function resolveArchetype(name, dir = DATA) {
  const { questions, components } = loadRaw(dir);
  const rec = components.archetypes?.[name];
  if (!rec) {
    throw new Error(`unknown archetype "${name}" (known: ${Object.keys(components.archetypes ?? {}).join(', ')})`);
  }
  const sub_decisions = rec.questions.map((e) => {
    const q = questions.questions?.[e.q];
    if (!q) throw new Error(`archetype "${name}" references question "${e.q}", which is not in the registry`);
    return {
      id: e.q,
      part: e.part,
      kind: e.kind ?? q.kind,
      axis: e.axis ?? q.axis,
      channel: q.channel,
      scope_hint: q.scope_hint,
      hint: e.hint ?? q.hint,
    };
  });
  return {
    tier: rec.tier,
    parts: rec.parts,
    required_states: rec.required_states,
    required_variant_floor: rec.required_variant_floor,
    sub_decisions,
  };
}

/** The whole thing in the pre-split shape — for consumers that read `anatomy.tiers` / `anatomy.archetypes`. */
export function resolveAnatomy(dir = DATA) {
  const { questions, components } = loadRaw(dir);
  const archetypes = {};
  for (const name of Object.keys(components.archetypes ?? {})) archetypes[name] = resolveArchetype(name, dir);
  return { meta: components.meta, tiers: questions.tiers, state_matrix: questions.state_matrix, archetypes };
}

/** Which questions apply to a tier — the starting set when deriving a NEW component's record (U2). */
export function questionsForTier(tier, dir = DATA) {
  const q = questionRegistry(dir);
  return Object.entries(q)
    .filter(([, v]) => (v.applies_to_tiers ?? []).includes(tier))
    .map(([id, v]) => ({ id, ...v }));
}

/** Token-shaped questions only — U5 reads this to know which picks can become CSS. */
export function tokenShapedQuestions(dir = DATA) {
  const q = questionRegistry(dir);
  return Object.fromEntries(Object.entries(q).filter(([, v]) => v.token));
}

// `loadAnatomy` keeps its PRE-SPLIT contract deliberately: it returns the resolved, merged shape, not
// the two raw files. Every existing caller passes its result straight into code that expects
// `.archetypes[x].sub_decisions`, so changing what this name returns would have been a silent break
// dressed up as a refactor.
export const loadAnatomy = resolveAnatomy;
