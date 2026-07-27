// pre-round-gates.mjs — the two things that must be true BEFORE a round renders anything.
//
// C1 + C7, 2026-07-27. Both were prose in the method and enforced by nothing, and both are in the
// locked spec's §12 acceptance bar (criteria 1 and 8).
//
// C1 CONTEXT GATE — "no visuals before audience / use-cases / tone / primary screen." The reason it
// is a gate and not advice: a round costs real time to generate, look at and judge, and a round run
// against the wrong audience produces a *confident* answer to the wrong question. The owner then locks
// it, and it becomes a frozen control everything downstream inherits.
//
// C7 CORE MECHANIC — "the core mechanic is locked before whole-page work." Deciding page layout before
// the thing the page is FOR means the layout gets re-litigated the moment the mechanic lands.
//
// Both are profile-aware and entry-aware, because the owner's normal path is `ui-mode:none` (build on
// placeholders, design later) and that legitimately skips the gate rather than failing it.

export const CONTEXT_KEYS = ['audience', 'use_cases', 'brand_tone', 'primary_screen'];

function present(v) {
  if (v == null) return false;
  if (Array.isArray(v)) return v.length > 0;
  if (typeof v === 'string') return v.trim().length > 0;
  if (typeof v === 'object') return Object.keys(v).length > 0;
  return true;
}

/**
 * @param {object} o
 * @param {object} [o.ledger]   ui_master_plans.design_ledger (the blob that holds context)
 * @param {string} [o.entry]    stage-2 | stage-4-item | deferred-overhaul | ui-mode:none
 * @param {string} [o.profile]  P1 | P2 | P3
 * @param {boolean} [o.recontext]  force a re-interview even when context is stored
 * @returns {{verdict:'pass'|'block'|'advise'|'skip', missing:string[], why:string}}
 */
export function contextGate({ ledger = null, entry = 'stage-2', profile = 'P1', recontext = false } = {}) {
  if (entry === 'ui-mode:none') {
    return { verdict: 'skip', missing: [], why: 'ui-mode:none runs no design round, so there is nothing to gate' };
  }
  const ctx = ledger?.context ?? ledger ?? {};
  const missing = CONTEXT_KEYS.filter((k) => !present(ctx[k]));

  // N1 — the owner asked to be re-interviewed on purpose. Stored context is deliberately ignored.
  if (recontext) {
    return {
      verdict: 'block', missing: CONTEXT_KEYS,
      why: 'recontext requested — re-asking audience, use-cases, tone and primary screen even though '
        + 'context is stored, because the owner said the answers have changed',
    };
  }

  if (missing.length === 0) {
    // ANSWER ONCE PER PROJECT. The stored context satisfies the gate at every profile and on every
    // later round — the questions are asked when there is nothing recorded, not every time.
    return { verdict: 'pass', missing: [], why: 'audience, use-cases, tone and primary screen are all recorded' };
  }
  // A stage-4 entry INHERITS context from the ledger and must not re-interview (routeEntry). If the
  // ledger genuinely has nothing, that is still a block — inheriting nothing is not inheriting.
  const why = `missing context: ${missing.join(', ')}. A round generated without these answers a `
    + 'question nobody asked, and the owner then locks it as a frozen control.';
  // N1, owner ruling 2026-07-27: P1 now BLOCKS too. It previously advised, on the reasoning that the
  // owner alone pays for their own wrong round — but P1 is the profile actually in use, so the locked
  // spec's "do not proceed to visuals without it" was soft exactly where it mattered, and acceptance
  // criterion 1 could not honestly be called met. The cost is bounded because the answers persist:
  // four questions once per project, not once per round. `recontext` re-opens them deliberately.
  return { verdict: 'block', missing, why };
}

/**
 * C7. At page or site scope, a locked rung-1 (mechanic) decision must exist first.
 * @param {object} o
 * @param {string} o.scope
 * @param {Array<{rung:number,status:string,axis:string}>} [o.decisions]  the project's rows
 */
export function coreMechanicGate({ scope = 'component', decisions = [] } = {}) {
  if (scope !== 'page' && scope !== 'site') {
    return { verdict: 'pass', why: `${scope} scope does not depend on the core mechanic` };
  }
  const locked = decisions.filter((d) => d.status === 'locked' && d.rung === 1);
  if (locked.length) {
    return { verdict: 'pass', why: `core mechanic locked: ${locked.map((d) => d.axis).join(', ')}` };
  }
  return {
    verdict: 'block',
    why: `${scope} scope with no locked core-mechanic (rung 1) decision. Laying out a page before the `
      + 'thing the page is FOR means the layout gets re-litigated the moment the mechanic lands. '
      + 'Run the mechanic rung first (routeRungs("site") puts it second, right after direction).',
  };
}

/** Both gates, one call — what a round runner asks before generating anything. */
export function preRoundGates({ ledger, entry, profile, scope, decisions } = {}) {
  const context = contextGate({ ledger, entry, profile });
  const mechanic = coreMechanicGate({ scope, decisions });
  const blocked = [context, mechanic].filter((g) => g.verdict === 'block');
  return { context, mechanic, pass: blocked.length === 0, blocked };
}

export function formatGates(g) {
  const l = [];
  const mark = (v) => ({ pass: 'PASS', advise: 'ADVISE', block: 'BLOCK', skip: 'SKIP' }[v] ?? v);
  l.push(`  ${mark(g.context.verdict).padEnd(6)} context-gate   ${g.context.why}`);
  l.push(`  ${mark(g.mechanic.verdict).padEnd(6)} core-mechanic  ${g.mechanic.why}`);
  if (!g.pass) l.push('  ROUND BLOCKED — generating now would answer a question nobody asked.');
  return l.join('\n');
}
