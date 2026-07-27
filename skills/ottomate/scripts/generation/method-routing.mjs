// Phase 4 — wiring. Makes the design method one profile-aware pipeline that respects the owner's real
// workflow (build on placeholder UI, do design later, never re-derive locked work).
//
//   1. buildRoundInput  — the self-contained packet a FRESH sub-agent gets (the anti-degradation default)
//   2. routeRungs / routeEntry — scope × entry routing: a single button never runs the full ladder
//   3. stage3DesignGate — the 2→3 design-lock, advisory at P1/P2, blocking at P3
//
// Pure. The doc side (spawn recipe, stage-3 wiring, HARD-list registration) lives in the references.

import { rejectedByAxis, frozenByAxis } from './ledger-context.mjs';
import { priorArtByAxis, applyPriorArt } from './prior-art.mjs';
import { composeRounds } from './round-composition.mjs';
import { buildStylePriors } from './style-priors.mjs';

// ── 2. scope × entry routing (owner ruling, docs/plans/2026-07-23-task2-remaining-work.md §3) ─────

// The A→A½→B→C ladder as named rungs. `direction`=A, `mechanic`=A½, `component`=B,
// `cluster`/`page`=C, `micro`=polish.
export const LADDER = ['direction', 'mechanic', 'component', 'cluster', 'page', 'micro'];

const RUNGS_BY_SCOPE = {
  component: ['component', 'micro'],                              // B (+ micro) — NOT the full vibe ladder
  cluster: ['component', 'cluster'],                             // B → C-cluster
  page: ['page', 'component'],                                   // C-page (+ B for unsettled parts)
  site: ['direction', 'mechanic', 'component', 'cluster', 'page'], // A → A½ → B → C (full)
};

/** Which ladder rungs run for a scope. A `component` scope that tries to run whole-vibe directions is a bug. */
export function routeRungs(scope) {
  const rungs = RUNGS_BY_SCOPE[scope];
  if (!rungs) throw new Error(`unknown scope "${scope}" (component|cluster|page|site)`);
  return rungs;
}

const ENTRY = {
  'stage-2': { when: 'designing before build (rare)', contextGate: 'full', reInterview: true, foundationSetHere: true },
  'stage-4-item': { when: 'a built component/page bugs you', contextGate: 'inherit', reInterview: false, note: 'inherit locked context + foundation from the ledger; do NOT re-interview' },
  'deferred-overhaul': { when: 'built on placeholders, now doing UI', contextGate: 'run-now', reInterview: true, forceScope: ['page', 'site'], note: 'the context gate was skipped at build time — run it now' },
  'ui-mode:none': { when: 'defer UI — THE DEFAULT', contextGate: 'defer', reInterview: false, buildNeutral: true, recordDropWithReason: true, runsDesign: false, note: 'build neutral + data-oid, expect a later overhaul' },
};

/** How an entry point (re)establishes context. `ui-mode:none` is the owner's default — no design round runs. */
export function routeEntry(entry) {
  const e = ENTRY[entry];
  if (!e) throw new Error(`unknown entry "${entry}" (stage-2|stage-4-item|deferred-overhaul|ui-mode:none)`);
  return e;
}

// Deferral is legitimate, but three things are expensive to retrofit — capture them even when UI is deferred.
export const DEFERRAL = {
  cheap: ['per-component look', 'whole-page style', 'micro-polish'],
  expensive: ['foundation tokens (ramp / type-scale / radius)', 'the core mechanic', 'theme-from-content wiring'],
  safe_default_upfront: ['context-gate answers (audience/use-cases/tone/primary-screen)', 'is the project asset-rich? (wire theme-from-content early)', 'build visibly-neutral replaceable UI + keep data-oid stamping on'],
};

// ── 1. fresh-context round input packet ──────────────────────────────────────────────────────────

/**
 * Assemble the self-contained packet a FRESH generation sub-agent receives. The ledger is the memory;
 * the packet carries everything a clean context needs and nothing else.
 * - contested axes = the archetype's sub-decisions MINUS any that are LOCKED (frozen controls)
 *   MINUS any the PRIOR-ART pass says this project already settled on another target.
 * - rejectedByAxis  = values already turned down; the agent must never re-offer them.
 *
 * `decisions` is this TARGET's rows. `projectDecisions` (optional) is the whole project's — pass it
 * and the round also learns what the project already decided ELSEWHERE (prior-art.mjs). Without it the
 * behaviour is exactly as before, so every existing caller is unaffected.
 *
 * @returns {{archetype,tier,direction,profile,contract,requiredStates,renderSurface,contested:Array,frozen:object,rejectedByAxis:object,priorArt:object,inheritedControls:object,priorArtConflicts:Array}}
 */
export function buildRoundInput({
  anatomy, archetype, contract = {}, profile = 'P1', direction = null, decisions = [],
  projectDecisions = null, targetId = null, diverge = [], scope = 'component', maxAxes = undefined,
}) {
  const arche = anatomy.archetypes?.[archetype];
  if (!arche) throw new Error(`unknown archetype "${archetype}"`);
  const frozen = frozenByAxis(decisions);          // { 'archetype.id': value }
  const rejected = rejectedByAxis(decisions);      // { 'archetype.id': [{value,why}] }
  const contested = arche.sub_decisions.filter((sd) => !(`${archetype}.${sd.id}` in frozen));
  const base = {
    archetype,
    tier: arche.tier,
    direction,
    profile,
    contract,
    requiredStates: arche.required_states,
    renderSurface: anatomy.tiers?.[arche.tier]?.render_surface ?? null,
    contested,
    frozen,
    rejectedByAxis: rejected,
    priorArt: {},
    stylePriors: null,
    inheritedControls: {},
    priorArtConflicts: [],
  };
  const withPriorArt = (projectDecisions && targetId)
    ? { ...applyPriorArt(base, priorArtByAxis(projectDecisions, { targetId, archetype, subDecisions: arche.sub_decisions }), { diverge }),
        priorArt: priorArtByAxis(projectDecisions, { targetId, archetype, subDecisions: arche.sub_decisions }) }
    : base;

  // T8: what this OWNER has chosen and ruled out before, across every project. Evidence, never a
  // rule — see style-priors.mjs. Computed from the project-wide rows when they were supplied.
  const stylePriors = buildStylePriors(projectDecisions ?? [], {
    axesInPlay: (withPriorArt.contested ?? []).map((sd) => sd.id),
    excludeTarget: targetId,
  });

  // Composition is computed LAST, on what is actually still contested — a round's width should be
  // decided after frozen, inherited and rejected axes have already been taken out, not before.
  return { ...withPriorArt, stylePriors, composition: composeRounds(withPriorArt.contested, { scope, maxAxes }) };
}

// ── 3. Stage-3 design-lock gate, profile-aware ───────────────────────────────────────────────────

/**
 * The 2→3 gate for design: a user-facing target built with no locked design decision is advisory at
 * P1/P2 (build on placeholders, do UI later — the owner's default) and blocking at P3 (public ships no
 * un-designed UI).
 * @param {object} o
 * @param {string} o.profile
 * @param {Array<{target_id:string, user_facing?:boolean}>} o.targetsBuilt
 * @param {Array<{target_id:string, status:string}>} o.lockedDecisions  (status 'locked')
 * @returns {{verdict:'pass'|'advise'|'block', missing:string[]}}
 */
export function stage3DesignGate({ profile = 'P1', targetsBuilt = [], lockedDecisions = [] }) {
  const lockedTargets = new Set(lockedDecisions.filter((d) => d.status === 'locked').map((d) => d.target_id));
  const missing = targetsBuilt
    .filter((t) => t.user_facing !== false && !lockedTargets.has(t.target_id))
    .map((t) => t.target_id);
  if (missing.length === 0) return { verdict: 'pass', missing: [] };
  return { verdict: profile === 'P3' ? 'block' : 'advise', missing };
}
