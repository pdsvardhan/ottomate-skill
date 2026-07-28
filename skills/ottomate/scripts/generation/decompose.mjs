// decompose.mjs — WS1.3. Decompose-and-ask + always-ask scope (fixes F-15, with F-4/F-9).
//
// The test's biggest missing brain: on "redesign X" the method never recognised "spending-analysis = 3
// panels made of parts" and never ASKED which panel/part/property to change, or how deep — it silently
// chose scope. This module makes decomposition come from the anatomy graph + `data-role`/`data-oid`
// STAMPING (not name-guessing, F-4), turns it into an explicit scope MENU, and enforces that the owner
// chooses scope (always-ask) before a round runs. The chosen scope becomes the round's axes (→ composeRounds
// → the WS1.2 banner), so both granular one-property picks and bold whole-section directions are first-class
// (F-9). The interactive ASK is a runtime AskUserQuestion the skill fires from `scopeQuestion(...)`.
//
// Pure + dependency-free.

// Which changeable dimensions each stamped role exposes, tagged by perceptual channel (round-composition
// CHANNELS). GROUNDED in the anatomy vocabulary, not invented per component. A role not in the map still
// decomposes — it gets the generic object dimensions + a `derived:false` note (honest, never a fake part).
export const ROLE_DIMENSIONS = {
  panel:          [{ id: 'surface-depth', channel: 'weight' }, { id: 'corner-radius', channel: 'weight' }, { id: 'border-treatment', channel: 'weight' }, { id: 'padding-density', channel: 'density' }],
  metric:         [{ id: 'type-scale', channel: 'type' }, { id: 'count-up-motion', channel: 'motion' }, { id: 'accent-colour', channel: 'colour' }],
  'category-list':[{ id: 'row-layout', channel: 'density' }, { id: 'row-density', channel: 'density' }],
  'category-row': [{ id: 'row-layout', channel: 'density' }, { id: 'label-treatment', channel: 'type' }],
  bar:            [{ id: 'fill-style', channel: 'colour' }, { id: 'grow-motion', channel: 'motion' }, { id: 'bar-shape', channel: 'weight' }],
  swatch:         [{ id: 'swatch-shape', channel: 'weight' }, { id: 'swatch-colour', channel: 'colour' }],
};
const GENERIC_DIMENSIONS = [{ id: 'layout', channel: 'density' }, { id: 'type', channel: 'type' }, { id: 'colour', channel: 'colour' }, { id: 'motion', channel: 'motion' }];

/** Pull the stamped anatomy out of real source — data-role parts + the data-oid. NOT name-guessing.
 *  Catches both the ATTRIBUTE form (data-role="x", data-role='x', JSX data-role="x") and the JS
 *  setAttribute form (setAttribute('data-role', 'x')) — real components stamp both ways. */
export function extractRoles(src = '') {
  const roles = [...String(src).matchAll(/data-role["']?\s*[=,]\s*["']([^"']+)["']/g)].map((m) => m[1]);
  const oidMatch = String(src).match(/data-oid["']?\s*[=,]\s*["']([^"']+)["']/);
  // unique, in first-seen order
  const seen = new Set();
  const parts = roles.filter((r) => (seen.has(r) ? false : (seen.add(r), true)));
  return { oid: oidMatch ? oidMatch[1] : null, parts };
}

/**
 * Decompose a component into its parts + the changeable dimensions per part, from its stamped roles.
 * @param {object} o  either {src} (real source to read stamps from) or {oid, parts:[roleString]}
 * @returns {{oid, parts:[{role, dimensions, derived}], hasStamps:boolean}}
 */
export function decompose({ src = null, oid = null, parts = null } = {}) {
  let roleList = parts, resolvedOid = oid;
  if (src != null) { const e = extractRoles(src); roleList = e.parts; resolvedOid = e.oid ?? oid; }
  roleList = roleList ?? [];
  const decomposedParts = roleList.map((role) => {
    const known = ROLE_DIMENSIONS[role];
    return { role, dimensions: known ?? GENERIC_DIMENSIONS, derived: Boolean(known) };
  });
  return { oid: resolvedOid, parts: decomposedParts, hasStamps: roleList.length > 0 };
}

/**
 * The scope MENU offered to the owner, at three granularities (F-9: granular OR bold). Each choice lists
 * the axes it would open (part.dimension), which become the round's contested axes.
 * @returns {Array<{id, granularity:'whole'|'section'|'property', label, opensAxes:string[]}>}
 */
export function scopeChoices(decomposition) {
  const { parts } = decomposition;
  const all = parts.flatMap((p) => p.dimensions.map((d) => `${p.role}.${d.id}`));
  const choices = [
    { id: 'whole', granularity: 'whole', label: `The whole component — every part (bold redesign)`, opensAxes: all },
  ];
  for (const p of parts) {
    choices.push({
      id: `section:${p.role}`, granularity: 'section', label: `Just the "${p.role}" part`,
      opensAxes: p.dimensions.map((d) => `${p.role}.${d.id}`),
    });
  }
  for (const p of parts) {
    for (const d of p.dimensions) {
      choices.push({ id: `property:${p.role}.${d.id}`, granularity: 'property', label: `Only ${p.role} → ${d.id}`, opensAxes: [`${p.role}.${d.id}`] });
    }
  }
  return choices;
}

/**
 * The AskUserQuestion-shaped structure the skill fires at runtime — decomposition made an explicit
 * on-screen question, never a silent scope pick. (The skill calls AskUserQuestion with this.)
 */
export function scopeQuestion(decomposition) {
  const choices = scopeChoices(decomposition);
  return {
    header: 'Redesign scope',
    question: `"${decomposition.oid ?? 'this component'}" decomposes into ${decomposition.parts.length} part(s): `
      + `${decomposition.parts.map((p) => p.role).join(', ')}. What do you want to change, and how deep?`,
    // a trimmed set for the tool (whole + per-part); the full property list is available on request
    options: [choices[0], ...choices.filter((c) => c.granularity === 'section')]
      .map((c) => ({ label: c.label, description: `Opens: ${c.opensAxes.join(', ')}` })),
  };
}

/** ALWAYS-ASK gate: a round may not proceed on an ASSUMED scope. A missing/blank choice BLOCKS. */
export function requireExplicitScope(ownerChoiceId = null) {
  const chosen = ownerChoiceId != null && String(ownerChoiceId).trim() !== '';
  if (chosen) return { verdict: 'pass', scope: ownerChoiceId, why: `scope explicitly chosen: ${ownerChoiceId}` };
  return {
    verdict: 'block', scope: null,
    why: 'scope was not chosen — a redesign must ASK which part/property to change and how deep (whole / section / property), never assume it. This is F-15: the running agent silently decided scope.',
  };
}

/** Turn the owner's chosen scope into the round's contested axes (id + channel), for composeRounds. */
export function axesForScope(decomposition, choiceId) {
  const choice = scopeChoices(decomposition).find((c) => c.id === choiceId);
  if (!choice) throw new Error(`unknown scope choice "${choiceId}" (choices: ${scopeChoices(decomposition).map((c) => c.id).join(', ')})`);
  const chanOf = (role, dimId) => (ROLE_DIMENSIONS[role]?.find((d) => d.id === dimId)?.channel) ?? 'weight';
  return choice.opensAxes.map((ax) => {
    const [role, dimId] = ax.split('.');
    return { id: ax, channel: chanOf(role, dimId), part: role };
  });
}
