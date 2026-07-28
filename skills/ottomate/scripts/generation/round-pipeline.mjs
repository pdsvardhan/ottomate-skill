// round-pipeline.mjs — Phase 4 R8. The one-command round SEQUENCE (efficiency §M) + the plan↔built-reality
// reconciliation (F-2). Makes the full chain a single, ordered, auditable thing instead of derive/compose/
// context/generate/gates/publish/pick/lock/emit as scattered manual steps.

// The ordered steps of a design round, each tagged by WHO does it — so a one-command driver runs every
// `mechanical` step itself and pauses only at the genuine `owner`/`model` forks (never silently deciding).
export const ROUND_STEPS = [
  { id: 'decompose', kind: 'mechanical', desc: 'decompose the target from its data-role stamps (decompose.mjs)' },
  { id: 'scope', kind: 'owner', desc: 'ASK what to change + how deep — always-ask (requireExplicitScope)' },
  { id: 'context-gate', kind: 'mechanical', desc: 'context gate — blocks on missing audience/use-cases/tone/screen' },
  { id: 'compose', kind: 'mechanical', desc: 'compose into rounds (one-question-per-round by default, R3.1)' },
  { id: 'generate', kind: 'model', desc: 'a fresh sub-agent authors interactive per-variant HTML (R1.2)' },
  { id: 'gates', kind: 'mechanical', desc: 'pre-publish gates: per-theme contrast + ban-raw-values + catalog-consult proof' },
  { id: 'publish', kind: 'mechanical', desc: 'publish-round auto-emits the live grid + legibility banner (R1.1)' },
  { id: 'pick', kind: 'owner', desc: 'pick / mix a value per sub-decision' },
  { id: 'lock', kind: 'owner', desc: 'lock — earned (confirmed + regression snapshot)' },
  { id: 'emit', kind: 'mechanical', desc: 'emit tokens + structural spec (enum→structural, R6)' },
];

/**
 * The one-command plan for a round: the ordered steps, which the driver runs mechanically, and where it
 * pauses for the owner or a model sub-agent. `resume` starts the plan after a completed step.
 */
export function planRound({ resumeAfter = null } = {}) {
  let steps = ROUND_STEPS;
  if (resumeAfter) {
    const i = ROUND_STEPS.findIndex((s) => s.id === resumeAfter);
    if (i === -1) throw new Error(`unknown step "${resumeAfter}"`);
    steps = ROUND_STEPS.slice(i + 1);
  }
  return {
    steps,
    mechanical: steps.filter((s) => s.kind === 'mechanical').map((s) => s.id),
    pauses: steps.filter((s) => s.kind !== 'mechanical').map((s) => ({ id: s.id, kind: s.kind })),
    nextPause: steps.find((s) => s.kind !== 'mechanical')?.id ?? null,
  };
}

/**
 * R8.3 (F-2): flag a ui_master_plan field that CONTRADICTS the shipped source. The named case is
 * `palette_dark: null` while the source clearly ships a dark theme — the plan under-describes built reality.
 * @param {object} ump        the ui_master_plan row
 * @param {object} evidence   { hasDarkTokens?:boolean, css?:string }
 * @returns {{ok:boolean, problems:string[]}}
 */
export function reconcileLedgerVsSource(ump = {}, evidence = {}) {
  const problems = [];
  const shipsDark = Boolean(evidence.hasDarkTokens)
    || /\.dark\b|prefers-color-scheme:\s*dark|\[data-theme[^\]]*dark/i.test(String(evidence.css ?? ''));
  if ((ump.palette_dark == null) && shipsDark) {
    problems.push('ui_master_plan.palette_dark is null, but the source ships a dark theme (.dark / prefers-color-scheme: dark) — the plan under-describes built reality (F-2); record both schemes.');
  }
  return { ok: problems.length === 0, problems };
}

export function formatPlan(plan) {
  return plan.steps.map((s) => `  ${s.kind === 'mechanical' ? '·' : s.kind === 'owner' ? '◆' : '★'} ${s.id.padEnd(14)} ${s.desc}`).join('\n')
    + `\n  (★ model · ◆ owner-fork · · auto) — a driver runs the auto steps and pauses at the next fork: ${plan.nextPause ?? 'none'}`;
}
