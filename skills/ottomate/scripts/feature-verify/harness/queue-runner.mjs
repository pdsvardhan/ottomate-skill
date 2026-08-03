#!/usr/bin/env node
// BP-4 host-side consumer for the "Verify site" queue. The prod-docker tracker cannot run
// the Playwright/sandbox harness in-process, so its API only ENQUEUES run-requests into the
// shared ./data volume; THIS drains them: fetch the tracker's flows → planFullSite → run the
// runnable sandbox flows → post results (which cascade to features via the roll-up) → write
// status back to each run file. Runs on VAULT7A (has docker + the sandboxes + a token).
//
//   FV_BEARER_TOKEN=$(cat /opt/homeserver/ottomate/.token) node queue-runner.mjs
//
import { readFile, writeFile, readdir } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { planFullSite } from './orchestrate.mjs';

const QUEUE_DIR = process.env.VERIFY_QUEUE_DIR ?? '/opt/homeserver/ottomate/data/verify-queue';
const TRACKER = process.env.FV_TRACKER_BASE ?? 'http://127.0.0.1:8110';
const TOKEN = process.env.FV_BEARER_TOKEN ?? '';
const SR_HARNESS = process.env.FV_SR_HARNESS ?? '/tmp/sr-harness';

const sh = (cmd, opts = {}) => execFileSync('bash', ['-c', cmd], { stdio: ['ignore', 'pipe', 'pipe'], ...opts }).toString();
const getJson = async (u) => (await fetch(u)).json();

async function fetchAllFlows(projectFilter) {
  const raw = await getJson(`${TRACKER}/api/projects`);
  const projects = Array.isArray(raw) ? raw : (raw.projects ?? []);
  const flows = [];
  for (const p of projects) {
    const slug = p.slug ?? p;
    if (projectFilter && slug !== projectFilter) continue;
    try {
      const r = await getJson(`${TRACKER}/api/projects/${slug}/flows`);
      const fl = Array.isArray(r) ? r : (r.flows ?? []);
      for (const f of fl) flows.push({ ...f, project_slug: slug });
    } catch { /* skip a project that won't list */ }
  }
  return flows;
}

// Only the screenroom-music sandbox is runnable today; every other flow has no harness yet
// and is reported as skipped (surfaced, never a silent pass).
function runUnit(unit) {
  const base = { flowId: unit.flowId, project: unit.project, instance: unit.instance };
  if (!/sandboxes\/screenroom-music\//.test(unit.testFile ?? '')) {
    return { ...base, outcome: 'skipped', detail: 'no runnable harness registered for this flow yet' };
  }
  let commit = '';
  try { commit = sh('git -C /mnt/storage/websites/screenroom rev-parse --short HEAD').trim(); } catch { /* leave blank */ }
  try { sh(`cd ${SR_HARNESS} && SR_IMAGE=screenroom-app:latest ./up.sh`); } catch (e) { return { ...base, outcome: 'error', detail: `sandbox up failed: ${String(e).slice(0, 120)}` }; }
  let outcome = 'error', detail = '';
  try {
    const out = sh(`cd ${SR_HARNESS} && FV_BEARER_TOKEN=${TOKEN} FV_COMMIT_SHA=${commit} node music-upload.verify.mjs`);
    const m = out.match(/VERDICT: (\w+)[\s\S]*?cases (\d+) \| pass (\d+) \| fail (\d+)/);
    if (m) { outcome = m[1] === 'APPROVE' ? 'pass' : 'fail'; detail = `${m[1]} ${m[3]}/${m[2]}`; }
    else { outcome = 'error'; detail = 'no verdict parsed'; }
  } catch (e) {
    outcome = 'fail';
    const s = String(e.stdout ?? e).match(/VERDICT: (\w+)[\s\S]*?cases (\d+) \| pass (\d+) \| fail (\d+)/);
    detail = s ? `${s[1]} ${s[3]}/${s[2]}` : String(e).slice(0, 120);
  } finally {
    try { sh(`cd ${SR_HARNESS} && ./down.sh`); } catch { /* best-effort teardown */ }
  }
  return { ...base, outcome, detail };
}

async function processRun(file) {
  const p = path.join(QUEUE_DIR, file);
  const run = JSON.parse(await readFile(p, 'utf8'));
  if (run.status !== 'queued') return null;
  run.status = 'running';
  run.started_at = new Date().toISOString();
  await writeFile(p, JSON.stringify(run, null, 2));
  try {
    const filter = run.scope === 'project' ? run.project_slug : null;
    const flows = await fetchAllFlows(filter);
    const plan = planFullSite(flows, { projects: filter ? [filter] : undefined, triggeredBy: 'manual', session: run.id });
    const units = plan.units.map(runUnit);
    const ran = units.filter((u) => u.outcome !== 'skipped').length;
    const failed = units.filter((u) => u.outcome === 'fail' || u.outcome === 'error').length;
    run.plan = { summary: plan.summary };
    run.results = { summary: { ...plan.summary, ran, failed }, units, gaps: plan.gaps };
    run.status = 'done';
  } catch (e) {
    run.status = 'error';
    run.error = String(e).slice(0, 300);
  }
  run.finished_at = new Date().toISOString();
  await writeFile(p, JSON.stringify(run, null, 2));
  return run;
}

async function main() {
  let files = [];
  try { files = (await readdir(QUEUE_DIR)).filter((f) => f.endsWith('.json')); } catch { /* no queue yet */ }
  const queued = [];
  for (const f of files) {
    try { const r = JSON.parse(await readFile(path.join(QUEUE_DIR, f), 'utf8')); if (r.status === 'queued') queued.push(f); } catch { /* skip bad file */ }
  }
  if (queued.length === 0) { console.log('queue empty — nothing to run'); return; }
  for (const f of queued) {
    console.log('processing', f);
    const r = await processRun(f);
    if (r) console.log(' ->', r.status, JSON.stringify(r.results?.summary ?? { error: r.error }));
  }
}

main();
