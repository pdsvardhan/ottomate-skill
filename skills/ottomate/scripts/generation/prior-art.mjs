// prior-art.mjs — "is this already solved somewhere else in this project?"
//
// The gap the owner named on 2026-07-27: the ledger was only ever queried PER TARGET, so a radius
// locked on the browse-page card was invisible when a round opened on the collection-page card. The
// only backstop was adv-cross-component-coherence, which runs AFTER a mixed pick — a post-hoc check,
// not a pre-round answer.
//
// Two kinds of "already answered", and collapsing them would give wrong advice:
//
//   reuse      same archetype, different target   -> STRONG. Two instances of the same component
//                                                    answering the same question differently is
//                                                    drift. Propose inheriting.
//   coherence  different archetype, same question -> ADVISORY ONLY, never auto-inherit. The radius
//                                                    ladder and concentric nesting mean a nested
//                                                    element's radius SHOULD differ from its
//                                                    container's (doctrine 116). Auto-inheriting
//                                                    button radius onto a card would be a bug.
//
// And the third outcome that matters as much: when the project holds TWO different locked values for
// the same question on the same archetype, this reports a CONFLICT rather than picking one. That is
// the project disagreeing with itself, and nothing was catching it.
//
// PURE — no network. The caller fetches GET /api/projects/<slug>/design-decisions (no target filter).

/** The design QUESTION an axis answers: `media-card.corner-radius` -> `corner-radius`. */
export function axisQuestion(axis) {
  const s = String(axis ?? '');
  const i = s.lastIndexOf('.');
  return i === -1 ? s : s.slice(i + 1);
}

/** The archetype an axis belongs to: `media-card.corner-radius` -> `media-card`. */
export function axisArchetype(axis) {
  const s = String(axis ?? '');
  const i = s.lastIndexOf('.');
  return i === -1 ? '' : s.slice(0, i);
}

const COUNTS = new Set(['locked', 'in-review', 'proposed']);

function evidence(d) {
  return {
    id: d.id ?? null,
    target_id: d.target_id,
    axis: d.axis,
    value: d.chosen_value ?? null,
    status: d.status,
    round: d.round ?? null,
    rationale: d.rationale ?? null,
  };
}

/**
 * @param {Array<object>} allDecisions   every design_decisions row for the PROJECT (not one target)
 * @param {object} opts
 * @param {string} opts.targetId         the target the round is about to open on
 * @param {string} opts.archetype        its archetype (the axis prefix)
 * @param {Array<{id:string}>} [opts.subDecisions]  restrict to these sub-decisions (else: whatever the ledger knows)
 * @returns {Record<string, object>} keyed by sub-decision id
 */
export function priorArtByAxis(allDecisions, { targetId, archetype, subDecisions = null }) {
  if (!archetype) throw new Error('priorArtByAxis needs an archetype');
  const rows = (allDecisions ?? []).filter(
    (d) => d && d.axis && COUNTS.has(d.status) && d.target_id !== targetId,
  );

  const ids = subDecisions
    ? subDecisions.map((s) => (typeof s === 'string' ? s : s.id))
    : [...new Set(rows.map((d) => axisQuestion(d.axis)))];

  const out = {};
  for (const id of ids) {
    const question = axisQuestion(id) || id;
    const sameQuestion = rows.filter((d) => axisQuestion(d.axis) === question);
    const reuse = sameQuestion.filter((d) => axisArchetype(d.axis) === archetype).map(evidence);
    const coherence = sameQuestion.filter((d) => axisArchetype(d.axis) !== archetype).map(evidence);

    // Only a LOCKED decision can be inherited — a proposal is not an answer (G3 rule 12).
    const lockedValues = [...new Set(
      reuse.filter((e) => e.status === 'locked' && e.value).map((e) => e.value),
    )];

    let verdict = 'open';
    let consensus = null;
    let conflict = null;
    if (lockedValues.length === 1) { verdict = 'inherit'; consensus = lockedValues[0]; }
    else if (lockedValues.length > 1) { verdict = 'conflict'; conflict = lockedValues; }
    else if (reuse.length || coherence.some((e) => e.status === 'locked')) { verdict = 'review'; }

    out[id] = { axis: `${archetype}.${id}`, question, reuse, coherence, consensus, conflict, verdict };
  }
  return out;
}

/**
 * Fold prior art into a round input: an `inherit` axis leaves the contested set and becomes an
 * inherited CONTROL, unless the owner deliberately wants to diverge on it (ruling 3 — a profile/preset
 * is never a straitjacket). `conflict` axes stay contested and are flagged loudly: the round is the
 * right place to settle a disagreement the project is already carrying.
 *
 * @param {object} roundInput            the output of buildRoundInput
 * @param {Record<string,object>} priorArt
 * @param {object} [opts]
 * @param {string[]} [opts.diverge]      sub-decision ids to keep contested even if inheritable
 */
export function applyPriorArt(roundInput, priorArt, { diverge = [] } = {}) {
  const div = new Set(diverge);
  const inherited = {};
  const conflicts = [];
  const contested = [];

  for (const sd of roundInput.contested ?? []) {
    const pa = priorArt?.[sd.id];
    if (pa?.verdict === 'conflict') conflicts.push(pa);
    if (pa?.verdict === 'inherit' && !div.has(sd.id)) {
      inherited[pa.axis] = { value: pa.consensus, from: pa.reuse.filter((e) => e.status === 'locked').map((e) => e.target_id) };
      continue;
    }
    contested.push(sd);
  }
  return { ...roundInput, contested, inheritedControls: inherited, priorArtConflicts: conflicts };
}

/** One line per axis, for the round packet / the console. */
export function formatPriorArt(priorArt) {
  const lines = [];
  for (const [id, pa] of Object.entries(priorArt ?? {})) {
    if (pa.verdict === 'open') continue;
    if (pa.verdict === 'inherit') {
      const where = pa.reuse.filter((e) => e.status === 'locked').map((e) => e.target_id).join(', ');
      lines.push(`  inherit   ${id.padEnd(20)} = ${pa.consensus}   (locked on ${where} — do not re-offer unless diverging on purpose)`);
    } else if (pa.verdict === 'conflict') {
      const where = pa.reuse.filter((e) => e.status === 'locked').map((e) => `${e.target_id}=${e.value}`).join(', ');
      lines.push(`  CONFLICT  ${id.padEnd(20)} the project already holds ${pa.conflict.length} different locked values: ${where}`);
    } else {
      const n = pa.reuse.length + pa.coherence.length;
      const co = pa.coherence.filter((e) => e.status === 'locked').map((e) => `${e.axis}=${e.value}`).join(', ');
      lines.push(`  review    ${id.padEnd(20)} ${n} related decision(s) elsewhere${co ? ` — coherence: ${co} (may legitimately differ; radius ladder)` : ''}`);
    }
  }
  return lines.length ? lines.join('\n') : '  (no prior art in this project for these axes)';
}
