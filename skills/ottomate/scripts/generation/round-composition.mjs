// round-composition.mjs — how many sub-decisions belong in ONE round, and which travel together.
//
// The gap the owner named on 2026-07-27. Until now `stage-2-generation.md` said "a bundle of ~8-12
// sub-decisions" — prose, no rule, no code, no citation. This is the rule.
//
// ── The reasoning, with citation status kept honest ────────────────────────────────────────────
//
// [CITED] Choice overload is NOT the constraint. Scheibehenne, Greifeneder & Todd (2010), a
//   meta-analysis of 50 experiments, found a mean effect near zero (d ~ 0.02). "Too many options is
//   bad" is folk knowledge. So the number of OPTIONS per axis is not what to economise on.
// [CITED] Hick's law: decision time grows with log2(n+1) of alternatives — sublinear. Again: option
//   count is cheap.
// [CITED] The real constraint is the comparison MATRIX. Payne, Bettman & Johnson, *The Adaptive
//   Decision Maker* (1993): as alternatives x attributes grows, people switch from COMPENSATORY
//   strategies (weigh every attribute) to NON-COMPENSATORY heuristics (elimination-by-aspects,
//   lexicographic — pick on one attribute, ignore the rest). This is the well-replicated finding
//   that actually governs a design round.
// [CITED as practice] Conjoint analysis converges on ~4-6 attributes per choice task before
//   respondents begin simplifying and attribute non-attendance rises. A rule of thumb, not a constant.
//
// [REASONED] The consequence for THIS method: our model is "pick a value per sub-decision, a mix is
//   the normal outcome" (doctrine 38) — which is a *compensatory* task. Run it at a matrix size where
//   the literature says people go non-compensatory and you do not get per-item picks; you get "I like
//   panel B" plus some tweaks. The round that was published on 2026-07-27 was 3 bundles x 6 axes = an
//   18-cell matrix spanning FOUR independent perceptual groups. That is above the bound this module
//   sets, and it is a falsifiable prediction: if every pick comes from one panel, the owner chose
//   non-compensatively and the round was composed too wide.
//
// [REASONED] Which axes travel together: the eye FUSES some properties into one impression and treats
//   others separately. A 20px radius reads differently flat vs raised, so radius and elevation cannot
//   be judged apart. Accent placement is largely independent of both. Grouping by perceptual channel
//   therefore keeps each round a single question. The channels below are named by the doctrine already
//   (A4 shape/depth/material, A2 typography, B1 motion, C3 information density) — this module only
//   makes the grouping mechanical.
//
// [REASONED] When a component round must become a CLUSTER round: when the axis's value has to be
//   SHARED with a sibling. An axis is `local` if two components may legitimately hold different values
//   (meta-density, badge-style); it is `foundational` if a difference between siblings reads as
//   inconsistency (the radius ladder, the elevation ladder, accent policy, the motion vocabulary).
//   Deciding a foundational axis inside one component round, then again inside another, is exactly how
//   a project arrives at the CONFLICT that prior-art.mjs reports after the fact. Promote, don't repair.

// Structure before dress: define the object (weight, density), then dress it (colour, motion).
// `type` sits with density because both are about how much information the surface carries.
export const CHANNEL_ORDER = ['weight', 'density', 'type', 'colour', 'motion'];

export const CHANNELS = {
  weight:  'shape + depth — radius, elevation, borders, padding. These FUSE: radius reads differently flat vs raised.',
  density: 'how much is shown and how tightly — meta lines, row height, aspect, placement.',
  type:    'typeface, scale, leading, numerals.',
  colour:  'accent placement, badge/state colour, semantic tones.',
  motion:  'transitions, reveals, state deltas — judged only in a pinned/hover state.',
};

/** Default matrix bound. 5 attributes is the top of the conjoint band; above it, expect panel-level picking. */
export const DEFAULT_MAX_AXES = 5;

function channelOf(sd) { return sd.channel ?? 'weight'; }
function isFoundational(sd) { return sd.scope_hint === 'foundational'; }

/**
 * Split a set of contested sub-decisions into rounds that are each ONE question.
 *
 * @param {Array<object>} contested   sub-decisions (from the anatomy, minus frozen/inherited)
 * @param {object} [opts]
 * @param {number} [opts.maxAxes]     matrix bound per round (default 5)
 * @param {string} [opts.scope]       'component' | 'cluster' | 'page' | 'site'
 * @returns {{rounds:Array, promote:Array, matrix:object, warnings:string[]}}
 */
export function composeRounds(contested, { maxAxes = DEFAULT_MAX_AXES, scope = 'component', granularity = 'one-per-round' } = {}) {
  const axes = (contested ?? []).filter(Boolean);
  const warnings = [];
  // R3.1 (F-5): the greedy packer merged up to 3 perceptual channels into one round — "one question per
  // round" was aspirational. Default is now ONE CHANNEL PER ROUND (maximally legible); `packed` reproduces
  // the old greedy behaviour and is an EXPLICIT owner choice (the WS1.2 banner enumerates a packed round's
  // questions, so packing is informed, not silent). An unknown value falls back to one-per-round.
  const packed = granularity === 'packed';

  // group by perceptual channel, in the structure-before-dress order
  const byChannel = new Map();
  for (const sd of axes) {
    const c = channelOf(sd);
    if (!byChannel.has(c)) byChannel.set(c, []);
    byChannel.get(c).push(sd);
  }
  const groups = CHANNEL_ORDER
    .filter((c) => byChannel.has(c))
    .map((c) => ({ channel: c, axes: byChannel.get(c) }));
  for (const c of byChannel.keys()) {
    if (!CHANNEL_ORDER.includes(c)) {
      warnings.push(`unknown channel "${c}" — it will be judged last; add it to CHANNEL_ORDER or fix the anatomy`);
      groups.push({ channel: c, axes: byChannel.get(c) });
    }
  }

  // Pack channels into rounds without ever splitting a channel — a channel is a FUSED group, and
  // splitting one asks the owner to judge half an impression. The single exception is a channel that
  // is on its own larger than the bound, which is said out loud rather than silently allowed.
  const rounds = [];
  let cur = null;
  for (const g of groups) {
    if (g.axes.length > maxAxes) {
      warnings.push(`channel "${g.channel}" alone has ${g.axes.length} axes (bound ${maxAxes}) — it runs as one over-wide round because splitting a fused channel is worse; expect panel-level picking`);
      rounds.push({ channels: [g.channel], axes: [...g.axes], overWide: true });
      cur = null;
      continue;
    }
    if (packed && cur && cur.axes.length + g.axes.length <= maxAxes) {
      cur.channels.push(g.channel);
      cur.axes.push(...g.axes);
    } else {
      cur = { channels: [g.channel], axes: [...g.axes], overWide: false };
      rounds.push(cur);
    }
  }

  rounds.forEach((r, i) => { r.index = i + 1; });

  // Foundational axes decided inside a component round are how sibling conflicts are born.
  const promote = scope === 'component' ? axes.filter(isFoundational) : [];

  const matrix = {
    axes: axes.length,
    rounds: rounds.length,
    maxAxes,
    granularity: packed ? 'packed' : 'one-per-round',
    widestChannels: rounds.reduce((m, r) => Math.max(m, r.channels.length), 0),
    widest: rounds.reduce((m, r) => Math.max(m, r.axes.length), 0),
    regime: rounds.some((r) => r.axes.length > maxAxes) ? 'expect-panel-level' : 'per-item-viable',
  };
  return { rounds, promote, matrix, warnings };
}

// R3.2 (F-9): map the WS1.3 scope granularity to the ROUND TYPE that selects the gate. A one-property
// round is a controlled one-axis round (control-diff governs, divergence N/A); a whole/section round runs
// as whole, dramatically-distinct directions (divergence governs). Pass the result as `roundType` to the
// computed runner's allFindings/blockingFindings.
export function roundTypeForScope(granularity) {
  return granularity === 'property' ? 'one-axis' : 'whole-direction';
}

/** Human summary — printed before a round is generated, so the composition is a visible decision. */
export function formatComposition(result) {
  const lines = [];
  const { matrix, rounds, promote, warnings } = result;
  lines.push(`composition: ${matrix.axes} contested axes -> ${matrix.rounds} round(s), widest ${matrix.widest} (bound ${matrix.maxAxes}) — ${matrix.regime}`);
  for (const r of rounds) {
    lines.push(`  round ${r.index}  [${r.channels.join(' + ')}]${r.overWide ? '  ** over-wide **' : ''}`);
    for (const a of r.axes) lines.push(`      ${a.id}${a.scope_hint === 'foundational' ? '  (foundational)' : ''}`);
  }
  if (promote.length) {
    lines.push(`  PROMOTE: ${promote.map((a) => a.id).join(', ')}`);
    lines.push('      these are shared with sibling components — decide once at cluster/site scope and inherit,');
    lines.push('      or the project ends up holding two locked values for one question.');
  }
  for (const w of warnings) lines.push(`  warn: ${w}`);
  return lines.join('\n');
}
