#!/usr/bin/env node
// Real-feature DOGFOOD orchestrator — assembles ONE unified feature-verification report from the whole
// pipeline on a live app: the deterministic layers (L2 system-state + L1/L3/L4, each run FV_NO_POST so
// they defer posting), an Explorer-frozen adversarial case, the AI-judge (fed the REAL L4 facts, tier
// gated + sample-on-flag), and the trajectory monitor — folding the judge/trajectory advisory softening
// on top of the deterministic verdict. Proves the assembled system on a real feature, not just units.
//   node dogfood.mjs --matrix <L2-payload> --layers <layers-payload> --visual <visual.json> \
//                    --judge <judge-findings.json> --coder-log-file <log> --tier T3
import { promises as fs } from 'node:fs';
import { processJudgeOutput } from './harness/judge-dispatch.mjs';
import { scanTrajectory, trajectoryReport } from './harness/trajectory-monitor.mjs';
import { freezeAsCase } from './harness/explorer.mjs';

const arg = (n, d) => { const i = process.argv.indexOf(`--${n}`); return i >= 0 ? process.argv[i + 1] : d; };
const readJson = async (p, d = null) => { try { return JSON.parse(await fs.readFile(p, 'utf8')); } catch { return d; } };

const l2 = await readJson(arg('matrix'));
const layers = await readJson(arg('layers'), { case_matrix: [] });
const visual = await readJson(arg('visual'), {});
const judgeFindings = await readJson(arg('judge'), []);
const coderLog = arg('coder-log-file') ? await fs.readFile(arg('coder-log-file'), 'utf8') : (arg('coder-log') ?? '');
const tier = arg('tier', 'T3');

// Explorer: freeze one real adversarial finding (a Telugu query in the district search) as a runnable case.
const ex = freezeAsCase({ category: 'adversarial-inputs', probe: 'non-ascii district search', input: 'non-ascii:telugu', layer: 'system-state', note: 'Explorer playbook: native-script query in the search box' });

// Combined case matrix: L2 + L1/L3/L4 + the Explorer-frozen case (fail-closed: needs_assert ⇒ skipped).
const cases = [
  ...(l2.case_matrix || []),
  ...(layers.case_matrix || []),
  { case: `explorer: ${ex.probe}`, variant: ex.path, axis: 'explorer', outcome: ex.needs_assert ? 'skipped' : 'pass', system_state: { frozen: ex } },
];

// Deterministic verdict (fail-closed): any fail ⇒ BLOCK; any skip/warn ⇒ ITERATE; else APPROVE.
const c = { total: cases.length, fail: 0, warn: 0, skipped: 0 };
for (const x of cases) { if (x.outcome === 'fail') c.fail++; else if (x.outcome === 'warn') c.warn++; else if (x.outcome === 'skipped') c.skipped++; }
let rec = c.fail > 0 ? 'BLOCK' : (c.skipped > 0 || c.warn > 0) ? 'ITERATE' : 'APPROVE';
let reason = `${c.total} cases across L1/L2/L3/L4 + explorer: ${c.fail} fail, ${c.warn} warn, ${c.skipped} skip`;

// AI-judge on the REAL L4 facts from the layers run (visual.json).
const facts = { overflow: visual.overflow, hardClip: visual.clipped, contrast: visual.axe };
const { judge_verdict } = processJudgeOutput([judgeFindings], facts, { tier });
if (judge_verdict.band === 'flag' && rec === 'APPROVE') { rec = 'ITERATE'; reason += ' · AI-judge FLAG (advisory)'; }

// Trajectory monitor on the coder's log.
const traj = trajectoryReport(scanTrajectory(coderLog));
if (traj.risk === 'high' && rec === 'APPROVE') { rec = 'ITERATE'; reason += ' · trajectory high-risk (advisory)'; }

const body = {
  project_slug: l2.project_slug, target_kind: 'stage-3-feature', target_id: 'feat-mapsofbharat-dogfood',
  verifier_session_id: 'dogfood-2026-07-29', commit_sha: l2.commit_sha, recommendation_overall: rec,
  recommendation_reason: reason, risk_policy: l2.risk_policy, mandatory_user_review: false, case_matrix: cases,
  evidence_root: l2.evidence_root,
  full_report: { tier, judge: judge_verdict, trajectory: traj, deterministic_counts: c, layers_verdict: layers.recommendation_overall, l2_verdict: l2.recommendation_overall },
};
const res = await fetch(`${process.env.FV_TRACKER_BASE}/api/feature-verification-reports`, {
  method: 'POST', headers: { Authorization: `Bearer ${process.env.FV_BEARER_TOKEN}`, 'Content-Type': 'application/json' }, body: JSON.stringify(body),
});
if (!res.ok) { console.error('[dogfood] POST failed', res.status, await res.text()); process.exit(1); }
const j = await res.json();
console.log(`[dogfood] UNIFIED REPORT id ${j.report?.id} → ${rec}`);
console.log(`  deterministic: ${JSON.stringify(c)}`);
console.log(`  judge: band=${judge_verdict.band} discarded=${judge_verdict.discarded.length} tier=${tier} passes=${judge_verdict.passes}`);
console.log(`  trajectory: risk=${traj.risk}`);
console.log(`  reason: ${reason}`);
