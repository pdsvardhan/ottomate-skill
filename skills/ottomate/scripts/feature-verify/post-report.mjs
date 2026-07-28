#!/usr/bin/env node
// P3-A hook (a) + (b): the SKILL-SIDE poster. After a T2+ interactive verify, the runner (FV_NO_POST=1)
// leaves report-payload.json + evidence but does NOT post. The skill then (1) spawns the diff-blind judge
// sub-agent on the screenshots, processes it through harness/judge-dispatch.mjs → a judge_verdict, and (2)
// scans the coder's returned output through harness/trajectory-monitor.mjs → a trajectoryReport. This
// helper merges both ADVISORY records into the payload and POSTs the complete report.
//
// ADVISORY DISCIPLINE: the judge/trajectory never turn a BLOCK green and never mandate a block; the most
// they do is soften an APPROVE → ITERATE (needs-human) when the judge FLAGS or the trajectory is high-risk.
// The deterministic gate's verdict is untouched otherwise.
//
//   node post-report.mjs [--payload <report-payload.json>] [--judge <judge_verdict.json>] \
//                        [--trajectory <trajectoryReport.json>] [--case <caseId>]
// Env: FV_TRACKER_BASE, FV_BEARER_TOKEN, FV_EVIDENCE_ROOT (default payload dir). See the method doc.

import { promises as fs } from 'node:fs';
import path from 'node:path';

const arg = (n, d) => { const i = process.argv.indexOf(`--${n}`); return i >= 0 ? process.argv[i + 1] : d; };
const readJson = async (p) => (p ? JSON.parse(await fs.readFile(p, 'utf8')) : null);

const EVID = process.env.FV_EVIDENCE_ROOT ?? '/tmp/feature-verify';
const payloadPath = arg('payload', path.join(EVID, 'report-payload.json'));
const TRACKER = process.env.FV_TRACKER_BASE ?? 'http://127.0.0.1:8110';
const TOKEN = process.env.FV_BEARER_TOKEN;

async function main() {
  if (!TOKEN) throw new Error('FV_BEARER_TOKEN required');
  const body = await readJson(payloadPath);
  const judge = await readJson(arg('judge'));
  const trajectory = await readJson(arg('trajectory'));
  const caseId = arg('case');

  const full = { ...(body.full_report ?? {}) };

  if (judge) {
    full.judge = judge; // run-level advisory record (the evidence it saw + what the DOM discarded)
    if (caseId) { const c = (body.case_matrix ?? []).find((x) => (x.case ?? '').startsWith(caseId)); if (c) c.judge_verdict = judge; }
    if (judge.band === 'flag' && body.recommendation_overall === 'APPROVE') {
      body.recommendation_overall = 'ITERATE';
      body.recommendation_reason = `${body.recommendation_reason} · AI-judge FLAG (advisory) — human review`;
    }
  }
  if (trajectory) {
    full.trajectory = trajectory; // detection-only; NEVER a training signal (framing travels in the record)
    if (trajectory.risk === 'high' && body.recommendation_overall === 'APPROVE') {
      body.recommendation_overall = 'ITERATE';
      body.recommendation_reason = `${body.recommendation_reason} · trajectory monitor flagged hack-narration (advisory) — human review`;
    }
  }
  body.full_report = full;

  const res = await fetch(`${TRACKER}/api/feature-verification-reports`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`post-report → ${res.status} ${await res.text()}`);
  const j = await res.json();
  const id = j.report?.id ?? null;
  console.log(`[post-report] ${body.recommendation_overall} — report id ${id}` +
    (judge ? ` · judge:${judge.band}(${judge.discarded?.length ?? 0} discarded)` : '') +
    (trajectory ? ` · trajectory:${trajectory.risk}` : ''));
  return id;
}

main().catch((e) => { console.error('[post-report] FATAL', e.message); process.exit(1); });
