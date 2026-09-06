#!/usr/bin/env node
// coverage.mjs — per-project feature-verify coverage + confidence report (ottomate #719, 2026-09-07).
//
// For every feature / flow / page the tracker knows, answers:
//   MATRIX        does a case matrix exist for it? (no matrix = nothing can ever verify it)
//   STATE         do its cases assert system state (oracle layer 'system-state'), not only what the screen shows?
//   VERIFIED      latest feature-verification report — verdict, date, commit
//   STALE         the tracker's own stale-verification rule fired (edited after the last verdict)
//   NEVER-RED     no case of that matrix has ever failed (evidence history) and no report for the target ever
//                 recorded a failed case or a BLOCK. A detector that has never
//                 gone red has never been shown to detect anything — that is the honest confidence gap.
// Counts and flags only. No score: a number here would be the exact kind of false confidence this exists to expose.
//
// Usage: node coverage.mjs [--app <slug>] [--json] [--base <url>]
//   FV_HOME     (default: this file's dir) — holds feature-verify-apps.json; relative matrix paths resolve here
//   FV_EVIDENCE ':'-separated evidence roots for NEVER-RED (default: tracker fv-evidence + FV_HOME/evidence; app repo evidence dirs are always added)
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const FV_HOME = process.env.FV_HOME || HERE;
// evidence history roots (':'-separated). Defaults: the tracker's fv-evidence, the harness's own evidence dir, and
// every manifest app's tests/e2e/feature-verify/evidence (hand runs land there).
const EVIDENCE_ROOTS = (process.env.FV_EVIDENCE || `/opt/homeserver/ottomate/fv-evidence:${path.join(FV_HOME, 'evidence')}`).split(':');
const args = process.argv.slice(2);
const opt = (k, d) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : d; };
const BASE = opt('--base', 'http://127.0.0.1:8110');
const ONLY = opt('--app', null);
const JSON_OUT = args.includes('--json');

async function getJson(p) {
  const r = await fetch(BASE + p);
  if (!r.ok) throw new Error(`${p} -> ${r.status}`);
  return r.json();
}

async function loadMatrices(app) {
  const out = [];
  for (const mf of app.matrix_files || []) {
    const file = path.isAbsolute(mf) ? mf : path.join(FV_HOME, mf);
    let m;
    try { m = JSON.parse(await fs.readFile(file, 'utf8')); } catch (e) { out.push({ file: mf, error: String(e.message || e) }); continue; }
    const cases = Array.isArray(m.cases) ? m.cases : [];
    const oracles = cases.flatMap((c) => (Array.isArray(c.oracles) ? c.oracles : []));
    const kind = m.target?.kind || null;
    const tid = m.target?.id || null;
    const candidates = [m.flow_id, m.feature_id, m.page_id, m.feature, kind && tid ? `${kind}-${tid}` : null, tid].filter(Boolean);
    out.push({
      file: mf, candidates, cases: cases.length, caseIds: cases.map((c) => c.id),
      oracles: oracles.length, stateOracles: oracles.filter((o) => o.layer === 'system-state').length,
      review: typeof m.review === 'string' ? m.review : m.review?.status ?? null,
    });
  }
  return out;
}

// evidence/<date>/<unit>/matrix.json rows: { case, outcome, ... }
async function everRed(roots) {
  const red = new Map();
  let files = 0;
  async function walk(d, depth) {
    let ents;
    try { ents = await fs.readdir(d, { withFileTypes: true }); } catch { return; }
    for (const e of ents) {
      const p = path.join(d, e.name);
      if (e.isDirectory() && depth < 3) await walk(p, depth + 1);
      else if (e.isFile() && e.name === 'matrix.json') {
        files++;
        try {
          const rows = JSON.parse(await fs.readFile(p, 'utf8'));
          for (const r of Array.isArray(rows) ? rows : []) if (r.outcome === 'fail') red.set(r.case, (red.get(r.case) || 0) + 1);
        } catch { /* unreadable evidence counts as no evidence, never as a pass */ }
      }
    }
  }
  for (const root of roots) await walk(root, 0);
  return { red, files };
}

const bare = (id) => id.replace(/^(flow|feat|page)-/, '');
const matchesTarget = (m, id) => m.candidates.some((c) => c === id || `flow-${c}` === id || `feat-${c}` === id || `page-${c}` === id || c === bare(id));

const manifest = JSON.parse(await fs.readFile(path.join(FV_HOME, 'feature-verify-apps.json'), 'utf8'));
const apps = manifest.apps || [];
const projectsRaw = await getJson('/api/projects');
const slugs = (Array.isArray(projectsRaw) ? projectsRaw : projectsRaw.projects || []).map((p) => p.slug).filter((s) => !ONLY || s === ONLY);
const evidenceRoots = [...EVIDENCE_ROOTS, ...apps.map((a) => a.repo_root && path.join(a.repo_root, 'tests/e2e/feature-verify/evidence')).filter(Boolean)];
const { red, files: evidenceFiles } = await everRed(evidenceRoots);
const report = { generated_at: new Date().toISOString(), evidence_files: evidenceFiles, projects: [] };

for (const slug of slugs) {
  const packet = await getJson(`/api/projects/${slug}/context-packet?include=features,flows,pages`);
  const targets = [
    ...(packet.features || []).map((f) => ({ kind: 'feature', ...f })),
    ...(packet.flows || []).map((f) => ({ kind: 'flow', ...f })),
    ...(packet.pages || []).map((p) => ({ kind: 'page', ...p })),
  ];
  const app = apps.find((a) => a.slug === slug);
  if (!app) { report.projects.push({ slug, in_manifest: false, targets: targets.length }); continue; }
  const matrices = await loadMatrices(app);
  // every report for the project, reduced to the newest per target (the API's latest=1 is ONE report project-wide)
  const repRaw = await getJson(`/api/feature-verification-reports?project_slug=${slug}&limit=1000`);
  const repRows = Array.isArray(repRaw) ? repRaw : repRaw.reports || (repRaw.report ? [repRaw.report] : []);
  const byTarget = new Map();
  for (const r of repRows) {
    const cur = byTarget.get(r.target_id);
    if (!cur || String(r.ran_at) > String(cur.ran_at)) byTarget.set(r.target_id, r);
  }
  // second "has it ever gone red" source: any report for the target that recorded a failed case or a BLOCK.
  // Evidence dirs alone miss hand runs whose artifacts were not kept.
  const redTargets = new Set(repRows.filter((r) => (r.cases_failed ?? 0) > 0 || r.recommendation_overall === 'BLOCK').map((r) => r.target_id));
  const stale = new Set();
  try {
    const v = await getJson(`/api/anti-gaslight/violations?project_slug=${slug}`);
    const list = Array.isArray(v) ? v : v.violations || v.items || [];
    for (const x of list) {
      if (!String(x.rule || x.id || '').includes('stale-verification')) continue;
      for (const t of x.targets || x.rows || x.items || []) stale.add(t.id || t.target_id || t.feature_id || t);
    }
  } catch { /* the rule endpoint is optional for this report */ }

  const rows = targets.map((t) => {
    const ms = matrices.filter((m) => !m.error && matchesTarget(m, t.id));
    const cases = ms.reduce((n, m) => n + m.cases, 0);
    const stateOr = ms.reduce((n, m) => n + m.stateOracles, 0);
    const rep = byTarget.get(t.id) || null;
    const wasRed = ms.some((m) => m.caseIds.some((c) => red.has(c))) || redTargets.has(t.id);
    const flags = [];
    if (!ms.length) flags.push('NO-MATRIX');
    else {
      if (!stateOr) flags.push('NO-STATE-ORACLES');
      if (!wasRed) flags.push('NEVER-RED');
      if (ms.some((m) => m.review && !['reviewed', 'locked', 'approved', 'owner-reviewed'].includes(String(m.review)))) flags.push('UNREVIEWED');
    }
    if (!rep) flags.push('NEVER-VERIFIED');
    if (stale.has(t.id)) flags.push('STALE');
    return {
      kind: t.kind, id: t.id, title: t.title || t.route || '', status: t.status ?? null,
      matrices: ms.map((m) => m.file), cases, state_oracles: stateOr,
      last_verdict: rep ? rep.recommendation_overall ?? rep.verdict ?? null : null,
      last_ran_at: rep ? rep.ran_at : null,
      last_commit: rep ? String(rep.commit_sha || '').slice(0, 7) : null,
      cases_failed: rep ? rep.cases_failed ?? null : null,
      flags,
    };
  });
  const withMatrix = rows.filter((r) => r.matrices.length);
  const summary = {
    targets: rows.length,
    with_matrix: withMatrix.length,
    with_state_oracles: rows.filter((r) => r.state_oracles > 0).length,
    verified: rows.filter((r) => r.last_verdict).length,
    approve_latest: rows.filter((r) => r.last_verdict === 'APPROVE').length,
    stale: rows.filter((r) => r.flags.includes('STALE')).length,
    never_red: withMatrix.filter((r) => r.flags.includes('NEVER-RED')).length,
    matrix_files: matrices.length,
    matrix_errors: matrices.filter((m) => m.error).length,
  };
  const unmatched = matrices.filter((m) => !m.error && !rows.some((r) => r.matrices.includes(m.file))).map((m) => m.file);
  report.projects.push({ slug, in_manifest: true, summary, rows, unmatched_matrices: unmatched });
}

if (JSON_OUT) { console.log(JSON.stringify(report, null, 2)); process.exit(0); }
for (const p of report.projects) {
  if (!p.in_manifest) { console.log(`\n${p.slug}: NOT IN feature-verify-apps.json - ${p.targets} targets the nightly can never verify`); continue; }
  const s = p.summary;
  console.log(`\n${p.slug}: ${s.targets} targets · with matrix ${s.with_matrix} · state-oracles ${s.with_state_oracles} · verified ${s.verified} (latest APPROVE ${s.approve_latest}) · stale ${s.stale} · never-red ${s.never_red}/${s.with_matrix} · matrix files ${s.matrix_files}${s.matrix_errors ? ` (${s.matrix_errors} unreadable)` : ''}`);
  for (const kind of ['feature', 'flow', 'page']) {
    const rs = p.rows.filter((r) => r.kind === kind);
    if (!rs.length) continue;
    console.log(`  ${kind}s (${rs.length}):`);
    for (const r of rs) {
      const m = r.matrices.length ? `${String(r.cases).padStart(3)} cases /${String(r.state_oracles).padStart(3)} state` : '      no matrix       ';
      const v = r.last_verdict ? `${String(r.last_verdict).padEnd(7)} ${String(r.last_ran_at).slice(0, 10)} @${r.last_commit}` : 'never verified              ';
      console.log(`    ${r.id.padEnd(36)} ${m}  ${v}  ${r.flags.join(' ')}`);
    }
  }
  if (p.unmatched_matrices.length) console.log(`  matrices matching no tracker target: ${p.unmatched_matrices.join(', ')}`);
}
console.log(`\nevidence scanned: ${report.evidence_files} matrix.json files · generated ${report.generated_at.slice(0, 16)}Z`);
