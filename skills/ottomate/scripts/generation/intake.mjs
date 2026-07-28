// intake.mjs — Phase 2 P2.4. The one-time project onboarding intake (spec §3 Pillar D).
//
// Loads data/onboarding-intake.json (5 staged UI-decision questions), VALIDATES it, and does the real
// PRE-FILL: derive each question's default from repo/DB/taste evidence, so onboarding is "confirm the
// pre-filled answer", not "answer 30 blank questions". Persisted per project (design_ledger.intake);
// re-run only on what is being rebuilt. Grounding rule (v0): use only what the project actually has;
// a follow-up question only where the sources are insufficient.
//
// Pure + dependency-free.

import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
export function loadIntake() {
  return JSON.parse(readFileSync(path.resolve(HERE, '../../data/onboarding-intake.json'), 'utf8'));
}

export function allQuestions(intake = loadIntake()) { return (intake.stages ?? []).flatMap((s) => (s.questions ?? []).map((q) => ({ ...q, stage: s.id }))); }
export function askableStages(intake = loadIntake()) { return (intake.stages ?? []).filter((s) => !s.silent); }

/** Validate: 5 stages, every question has id/q/enum/default, default is IN its enum, prefill well-formed. */
export function validateIntake(intake = loadIntake()) {
  const errors = [];
  const stages = intake.stages ?? [];
  if (stages.length !== 5) errors.push(`expected 5 stages, got ${stages.length}`);
  const seen = new Set();
  for (const s of stages) {
    for (const q of s.questions ?? []) {
      if (!q.id) { errors.push(`${s.id}: a question has no id`); continue; }
      if (seen.has(q.id)) errors.push(`duplicate question id "${q.id}"`);
      seen.add(q.id);
      if (!q.q) errors.push(`${q.id}: no prompt text`);
      if (!Array.isArray(q.enum) || !q.enum.length) errors.push(`${q.id}: enum required`);
      else if (q.default == null || !q.enum.includes(q.default)) errors.push(`${q.id}: default "${q.default}" is not in its enum`);
      for (const r of q.prefill ?? []) if (!r.from) errors.push(`${q.id}: a prefill rule has no \`from\``);
    }
  }
  return { ok: errors.length === 0, errors };
}

// Evaluate one prefill rule against evidence → { value, source } or null.
function evalRule(rule, ev) {
  const hay = [...(ev.files ?? []), ...(ev.deps ?? [])].join(' ').toLowerCase();
  const taste = ev.taste ?? {};
  const ledger = ev.ledgerContext ?? {};
  switch (rule.from) {
    case 'repo':
      return (rule.any ?? []).some((k) => hay.includes(String(k).toLowerCase())) ? { value: rule.then, source: 'repo' } : null;
    case 'ledger': {
      let v = ledger[rule.key];
      if (v == null) return null;
      if (rule.map) v = rule.map[v] ?? null;
      return v != null ? { value: v, source: 'ledger' } : null;
    }
    case 'taste':
      if (rule.wants) { const w = taste.wantedTells ?? taste.loves ?? []; return Array.isArray(w) && w.includes(rule.wants) ? { value: rule.then, source: 'taste' } : null; }
      if (rule.ifKey) return taste[rule.ifKey] === rule.equals ? { value: rule.then, source: 'taste' } : null;
      if (rule.key) { const v = taste[rule.key]; if (v != null) return { value: v, source: 'taste' }; return rule.default != null ? { value: rule.default, source: 'taste-default' } : null; }
      return null;
    case 'tokens':
      if ((rule.has === 'dark' || rule.flag === 'dark') && ev.hasDarkTokens) return { value: rule.then, source: 'tokens' };
      if ((rule.has === 'glass' || rule.flag === 'glass') && ev.hasGlassTokens) return { value: rule.then, source: 'tokens' };
      if ((rule.radiusRem || rule.flag === 'radiusRem') && ev.radiusRem) return { value: rule.then ?? 'rounded', source: 'tokens' };
      return null;
    default: return null;
  }
}

/**
 * Pre-fill every question from evidence. Returns { qId: {value, source, prefilled} } — the resolved
 * default per question, tagged with where it came from (repo/ledger/taste/tokens/default). The first
 * prefill rule that yields an in-enum value wins; otherwise the static default (source 'default').
 * @param {object} evidence  { files, deps, hasDarkTokens, hasGlassTokens, radiusRem, ledgerContext, taste }
 */
export function prefillIntake(evidence = {}, intake = loadIntake()) {
  const out = {};
  for (const q of allQuestions(intake)) {
    let resolved = null;
    for (const rule of q.prefill ?? []) {
      const r = evalRule(rule, evidence);
      if (r && r.value != null && q.enum.includes(r.value)) { resolved = r; break; }
    }
    out[q.id] = resolved
      ? { value: resolved.value, source: resolved.source, prefilled: true }
      : { value: q.default, source: 'default', prefilled: false };
  }
  return out;
}

/** Drop conditional questions whose `when` is not satisfied by the answers so far (e.g. dashboard-subtype). */
export function applicableQuestions(answers = {}, intake = loadIntake()) {
  return allQuestions(intake).filter((q) => {
    if (!q.when) return true;
    return Object.entries(q.when).every(([k, v]) => answers[k] === v);
  });
}

/** Re-run only what is being rebuilt: keep questions in the named stages, treat the rest as already settled. */
export function questionsForRebuild(stageIds = [], intake = loadIntake()) {
  const set = new Set(stageIds);
  return allQuestions(intake).filter((q) => set.has(q.stage));
}
