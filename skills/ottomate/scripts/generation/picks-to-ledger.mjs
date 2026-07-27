// Element 3 — bundle → per-item picks → ledger rows.
//
// A round shows 2-4 variant BUNDLES, each a coherent assignment of the target's sub-decisions. The
// owner picks a VALUE PER SUB-DECISION (a vector, not a panel — doctrine 38: a mix is the normal
// outcome). This turns that pick vector into one `design_decisions` payload per sub-decision, so the
// ledger records exactly what was chosen, from which variant, and what was rejected — the data every
// later feature (rejected[]-aware regeneration, profile graduation, the regression gate) reads.
//
// PURE. No network here (unit-tested with no DB). The thin POST helper below is used only by the live
// demo run, one door via the API, backup-first.

import { resolveAnatomy, rungForTier } from './anatomy.mjs';
import { SOFT } from './ledger-context.mjs';

// The anatomy is now TWO files (U1, 2026-07-27) — the universal question registry and the
// per-component records. anatomy.mjs resolves them into the shape this module has always used.
export { loadAnatomy } from './anatomy.mjs';


/**
 * @param {object} input
 * @param {string} input.projectSlug
 * @param {string} input.targetId        the data-oid of the target
 * @param {string} input.archetype       key into component-anatomy.json archetypes
 * @param {number} input.round
 * @param {Record<string,object>} input.variantsShown  { slot: { subDecisionId: value, ... } } — what each panel offered
 * @param {Record<string,{value:*,from:string,rationale?:string}>} input.picks  the per-item pick vector
 * @param {object} [input.constraints]   the constraint contract in force
 * @param {string} [input.profile]       audience profile the rationale depended on
 * @param {string} [input.sessionId]
 * @param {object} [anatomy]
 * @returns {Array<object>} one design_decisions POST payload per picked sub-decision
 */
export function picksToLedger(input, anatomy = resolveAnatomy()) {
  const { projectSlug, targetId, archetype, round, variantsShown, picks, constraints = null, profile = 'P1', sessionId = null } = input;
  const arche = anatomy.archetypes?.[archetype];
  if (!arche) throw new Error(`unknown archetype "${archetype}" (known: ${Object.keys(anatomy.archetypes).join(', ')})`);
  const known = new Set(arche.sub_decisions.map((s) => s.id));
  const rung = rungForTier(arche.tier);
  const slots = Object.keys(variantsShown);

  const payloads = [];
  for (const [subId, pick] of Object.entries(picks)) {
    if (!known.has(subId)) throw new Error(`"${subId}" is not a sub-decision of ${archetype} — pick must trace to the anatomy`);
    // rejected = every OTHER offered value for this sub-decision that wasn't the chosen one.
    const rejected = [];
    for (const slot of slots) {
      const offered = variantsShown[slot]?.[subId];
      if (offered !== undefined && offered !== pick.value) {
        // T3: grade it. Simply not winning is `not_selected` and MAY come back in a later round;
        // only an explicit rule-out is a hard ban.
        rejected.push({ value: offered, from: slot, grade: SOFT, why_rejected: 'not selected in the per-item pick' });
      }
    }
    const isMix = pick.from && slots.length > 1;
    payloads.push({
      target_id: targetId,
      target_kind: arche.tier === 'surface' ? 'page' : 'component',
      axis: `${archetype}.${subId}`,
      status: 'proposed',             // a pick is not LOCKED until confirmed (G3 rule 12: lock is earned)
      rung,
      round,
      variants_shown: Object.fromEntries(slots.map((s) => [s, variantsShown[s]?.[subId]])),
      chosen_value: String(pick.value),
      mixed_from: pick.from ? { variant: pick.from } : null,
      rejected,
      rationale: pick.rationale ?? `Selected ${pick.value} for ${subId}${pick.from ? ` (from variant ${pick.from})` : ''}.`,
      constraints_applied: constraints,
      profile_at_decision: profile,
      confirmed: false,
      session_id: sessionId,
    });
  }
  return payloads;
}

// Summarise a pick vector as a one-liner (for the round record / owner echo).
export function describePicks(payloads) {
  const mixed = payloads.filter((p) => p.mixed_from);
  const froms = new Set(mixed.map((p) => p.mixed_from.variant));
  return `${payloads.length} sub-decisions recorded` + (froms.size > 1 ? ` — a MIX across variants ${[...froms].sort().join(', ')}` : '');
}

// ── thin live POST helper (used ONLY by the demo run) ──────────────────────────────────────────
// One door: every write via the API. Caller must POST /api/backup first.
export async function postDecisions(baseUrl, token, projectSlug, payloads) {
  const out = [];
  for (const p of payloads) {
    const res = await fetch(`${baseUrl}/api/projects/${projectSlug}/design-decisions`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', authorization: `Bearer ${token}` },
      body: JSON.stringify(p),
    });
    out.push({ status: res.status, body: await res.json().catch(() => null) });
  }
  return out;
}
