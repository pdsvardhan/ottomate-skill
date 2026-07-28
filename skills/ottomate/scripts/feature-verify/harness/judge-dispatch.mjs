// P3-A hook (a): the JUDGE DISPATCH glue. The judge is skill-orchestrated (a Playwright spec can't spawn
// a Claude agent), so the SKILL runs it after a T2+ verify: assemble the judge's inputs from the run's
// evidence, spawn the fresh diff-blind judge sub-agent (prompts/feature-verifier-judge-prompt.md), then
// feed its raw findings here to cross-check + reconcile + verdict. This module is the pure glue around
// that; the sub-agent spawn + the report POST are the skill's two impure steps (see the method doc).
// Owner decisions 2026-07-29: judge fires on EVERY T2+ change; T3 re-samples ONLY when the first pass
// flags something (sample-on-flag). See docs/plans/2026-07-28-task3-P3A-*.

import { promises as fs } from 'node:fs';
import path from 'node:path';
import { judgeGate, crossCheckSpatialClaims, reconcileSamples, judgeVerdict } from './ai-judge.mjs';

export { judgeGate };

/**
 * Best-effort extraction of the deterministic L1/L4 facts the cross-check needs, from the matrix results
 * the same run already produced (the L4 'visual' cases + the L1 implicit case). Convention: a result's
 * case name carries the check keyword. Absent facts ⇒ the cross-check soft-keeps a spatial claim as
 * `unverified` rather than discarding it (honest: the layer didn't measure it).
 */
export function extractDeterministicFacts(results = []) {
  const facts = {};
  const passed = (r) => r.outcome === 'pass';
  for (const r of results) {
    const name = String(r.case ?? '').toLowerCase();
    if (name.includes('overflow')) facts.overflow = { ok: passed(r) };
    if (name.includes('clip')) facts.hardClip = { ok: passed(r) };
    if (name.includes('contrast')) facts.contrast = { ok: passed(r) };
    if (name.includes('console') || name.includes('implicit')) facts.consoleErrors = passed(r) ? 0 : 1;
  }
  return facts;
}

/** List the screenshots a judge pass should look at (the runner captures PNGs under the evidence dir). */
export async function collectScreenshots(evidenceRoot) {
  const out = [];
  async function walk(dir) {
    let entries = [];
    try { entries = await fs.readdir(dir, { withFileTypes: true }); } catch { return; }
    for (const e of entries) {
      const p = path.join(dir, e.name);
      if (e.isDirectory()) await walk(p);
      else if (/\.png$/i.test(e.name)) out.push(p);
    }
  }
  await walk(evidenceRoot);
  return out.sort();
}

/**
 * Assemble everything the skill hands the judge sub-agent (or `{gate:'none'}` when the tier is below T2).
 * @returns {Promise<{gate:'none'}|{gate:'glance'|'full', tier:string, screenshots:string[], deterministicFacts:object}>}
 */
export async function assembleJudgeInput({ evidenceRoot, results, tier }) {
  const gate = judgeGate(tier);
  if (gate === 'none') return { gate: 'none' };
  return {
    gate,
    tier,
    screenshots: await collectScreenshots(evidenceRoot),
    deterministicFacts: extractDeterministicFacts(results),
  };
}

/**
 * Sample-on-flag (owner decision): after the FIRST pass, the skill re-runs the judge 2 more times (in a
 * randomised screenshot order) ONLY when the pass is a T3 `flag` and we have < 3 passes — a clean/warn
 * first pass is trusted as-is.
 */
export function needsResample(firstVerdict, tier, passesSoFar) {
  return tier === 'T3' && firstVerdict.band === 'flag' && passesSoFar < 3;
}

/**
 * Turn one-or-more raw judge passes into the advisory `judge_verdict` cell. Each pass is cross-checked
 * against the deterministic facts (spatial hallucinations discarded); multiple passes are reconciled
 * (agreed vs no-confidence→human). Pure.
 * @param {object[][]} passes  array of raw findings-arrays (1 for the first pass; ≤3 with sample-on-flag)
 */
export function processJudgeOutput(passes, deterministicFacts = {}, opts = {}) {
  const crossChecked = (passes ?? []).map((p) => crossCheckSpatialClaims(p, deterministicFacts));
  const keptPerPass = crossChecked.map((c) => c.kept);
  const reconciled = reconcileSamples(keptPerPass);
  const verdict = judgeVerdict(reconciled);
  return {
    judge_verdict: {
      ...verdict,
      tier: opts.tier ?? null,
      passes: passes?.length ?? 0,
      discarded: crossChecked.flatMap((c) => c.discarded), // the hallucinations the DOM neutralised
      evidence_seen: opts.screenshots ?? undefined,
    },
    needsResample: needsResample(judgeVerdict(keptPerPass[0] ?? []), opts.tier, passes?.length ?? 0),
  };
}

/**
 * CALM self-audit (periodic): re-judge a KNOWN-GOOD clean golden case; it should still come back `clean`.
 * A non-clean re-judge = judge drift (the model has started flagging a screen a human blessed) → alert a
 * human, do NOT auto-act. Detection-only, like the trajectory monitor.
 */
export function detectJudgeDrift(auditVerdict) {
  const drift = auditVerdict?.band !== 'clean';
  return {
    drift,
    note: drift
      ? `judge drift: a known-good golden re-judged "${auditVerdict?.band}" — a human should recalibrate the rubric/prompt`
      : 'no drift: the golden case still re-judges clean',
  };
}
