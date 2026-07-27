// style-priors.mjs — teach a round what the OWNER actually likes.
//
// T8, 2026-07-27. The highest-value item in Stage 2, and the one that needed no research: every past
// locked value, every rule-out and every comment already sits in the DB, unused. A fresh round today
// knows the doctrine (229 cited rules) and the constraint contract — and nothing whatsoever about the
// person it is designing for. This is the register's research gap R1, closed with data we already had.
//
// THE DESIGN CONSTRAINT THAT MATTERS: priors must INFORM, never CONSTRAIN. Overfitting to past taste
// is a real failure mode — a generator that only ever re-offers what was liked before stops being able
// to show the owner something they have not seen, which is the entire point of over-generating. So:
//   - a prior is evidence WITH A COUNT, never a rule;
//   - a value seen once is reported as `weak` and must not shape a round on its own;
//   - the packet carries an explicit `explore` budget naming the axes where the owner has NO history,
//     so the round knows where it is free rather than treating silence as agreement.
//
// PURE. The caller fetches; this shapes. Cross-project by design — taste is a property of the person,
// not of one project.

import { gradeOf, HARD_BAN } from './ledger-context.mjs';

function axisQuestion(axis) {
  const s = String(axis ?? '');
  const i = s.lastIndexOf('.');
  return i === -1 ? s : s.slice(i + 1);
}

const MIN_FOR_PATTERN = 2;   // one instance is an anecdote, not a preference

/**
 * @param {Array<object>} decisions   design_decisions rows, ideally across ALL projects
 * @param {object} [opts]
 * @param {string[]} [opts.axesInPlay] the question ids this round will contest — used to compute the
 *                                     explore budget (where the owner has no history at all)
 * @param {string} [opts.excludeTarget] don't let a target's own history speak for its own round
 */
export function buildStylePriors(decisions = [], { axesInPlay = [], excludeTarget = null } = {}) {
  const rows = decisions.filter((d) => d && d.axis && d.target_id !== excludeTarget);

  const chosen = new Map();   // question -> Map(value -> {count, targets:Set, projects:Set})
  const banned = new Map();   // question -> Map(value -> {count, whys:[]})

  for (const d of rows) {
    const q = axisQuestion(d.axis);
    if (d.status === 'locked' && d.chosen_value) {
      const m = chosen.get(q) ?? new Map();
      const e = m.get(d.chosen_value) ?? { count: 0, targets: new Set(), projects: new Set() };
      e.count += 1;
      if (d.target_id) e.targets.add(d.target_id);
      if (d.project_slug) e.projects.add(d.project_slug);
      m.set(d.chosen_value, e);
      chosen.set(q, m);
    }
    for (const r of Array.isArray(d.rejected) ? d.rejected : []) {
      if (gradeOf(r) !== HARD_BAN) continue;   // only a deliberate rule-out is taste; losing is not
      const m = banned.get(q) ?? new Map();
      const key = String(r.value);
      const e = m.get(key) ?? { count: 0, whys: [] };
      e.count += 1;
      if (r.why_rejected) e.whys.push(r.why_rejected);
      m.set(key, e);
      banned.set(q, m);
    }
  }

  const prefers = [];
  for (const [q, m] of chosen) {
    for (const [value, e] of m) {
      prefers.push({
        question: q, value, count: e.count,
        targets: [...e.targets], projects: [...e.projects],
        strength: e.count >= MIN_FOR_PATTERN ? 'pattern' : 'weak',
      });
    }
  }
  const avoids = [];
  for (const [q, m] of banned) {
    for (const [value, e] of m) {
      avoids.push({ question: q, value, count: e.count, whys: [...new Set(e.whys)], strength: e.count >= MIN_FOR_PATTERN ? 'pattern' : 'weak' });
    }
  }
  prefers.sort((a, b) => b.count - a.count || a.question.localeCompare(b.question));
  avoids.sort((a, b) => b.count - a.count || a.question.localeCompare(b.question));

  // Where the owner has NO history: the round is free here, and should be told so explicitly rather
  // than inferring agreement from silence.
  const known = new Set([...prefers.map((p) => p.question), ...avoids.map((a) => a.question)]);
  const explore = axesInPlay.filter((q) => !known.has(q));

  return {
    prefers, avoids, explore,
    evidence: { rows: rows.length, locked: rows.filter((d) => d.status === 'locked').length, projects: [...new Set(rows.map((d) => d.project_slug).filter(Boolean))] },
    empty: prefers.length === 0 && avoids.length === 0,
  };
}

/**
 * The text injected into a generation round. Deliberately hedged: a prior is evidence, not an
 * instruction, and the packet says so in the packet — the model reading it must not treat a count of
 * two as a rule.
 */
export function formatStylePriors(p) {
  if (!p || p.empty) {
    return 'STYLE PRIORS: none yet — this owner has no locked decisions or rule-outs to learn from.\n'
      + 'Treat every axis as open. Do NOT invent a house style; the absence of history is not a preference.';
  }
  const l = ['STYLE PRIORS — evidence from this owner\'s own past decisions. These INFORM, they do not',
    'constrain: a count is not a rule, and you must still be able to show them something new.'];
  l.push(`(from ${p.evidence.locked} locked decisions across ${p.evidence.projects.length || 1} project(s))`);
  if (p.prefers.length) {
    l.push('', 'Has chosen before:');
    for (const x of p.prefers) {
      l.push(`  ${x.question.padEnd(20)} ${String(x.value).padEnd(24)} x${x.count}  [${x.strength}]${x.strength === 'weak' ? ' — once only; do not treat as a preference' : ''}`);
    }
  }
  if (p.avoids.length) {
    l.push('', 'Has explicitly ruled out (never re-offer these values):');
    for (const x of p.avoids) l.push(`  ${x.question.padEnd(20)} ${String(x.value).padEnd(24)} x${x.count}  ${x.whys[0] ? `— "${x.whys[0]}"` : ''}`);
  }
  if (p.explore.length) {
    l.push('', `No history on: ${p.explore.join(', ')}.`,
      'You are free here — and SHOULD spend the divergence budget on these axes rather than on ones');
    l.push('where the owner has already told you what they think.');
  }
  return l.join('\n');
}

/**
 * How much of a proposed round is re-treading ground. The honest measurement behind T8: a round fed
 * priors should re-offer fewer already-ruled-out values than one that was not.
 * @param {Record<string,Record<string,*>>} variantsShown  { slot: { question: value } }
 */
export function scoreAgainstPriors(variantsShown, priors) {
  const bans = new Set((priors?.avoids ?? []).map((a) => `${a.question}=${a.value}`));
  const seen = [];
  const violations = [];
  for (const slot of Object.keys(variantsShown ?? {})) {
    for (const [q, v] of Object.entries(variantsShown[slot] ?? {})) {
      seen.push(`${q}=${v}`);
      if (bans.has(`${q}=${v}`)) violations.push({ slot, question: q, value: v });
    }
  }
  return { offered: seen.length, ruledOutReOffered: violations.length, violations };
}
