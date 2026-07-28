#!/usr/bin/env node
// P3-C4: the ORCHESTRATOR — the single entry the VAULT7A nightly cron and the on-commit hook both call.
// A thin conductor over the pure planners (harness/orchestrate.mjs), Playwright (the run-matrix runner),
// and the reporting tail (delta-vs-previous → the JSONL run-log). The runner's own afterAll posts the
// feature-verification report + (schedule cadence) the test_runs row; run.mjs owns the cross-run tail.
//
//   node run.mjs nightly                       # every app in the manifest, schedule cadence, persistent evidence
//   node run.mjs commit --app <slug> [--base <ref>] [--tier T2]   # impacted matrices only, /tmp evidence
//   node run.mjs fix   --app <slug> --matrix <file>               # reproduce-symptom two-phase (RED→GREEN)
//
// See docs/plans/2026-07-28-task3-P3C-gate-wiring-plan.md.

import { spawnSync, execFileSync } from 'node:child_process';
import { existsSync, promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { planNightly, planCommit } from './harness/orchestrate.mjs';
import { changedFilesSince } from './harness/impacted.mjs';
import { deltaVsPrevious } from './harness/delta.mjs';
import { runLogEntry, appendRunLog, readRunLog, lastGreenCommit, flakyCases } from './harness/run-log.mjs';
import { PERSIST_ROOT, evidenceRootFor } from './harness/evidence-root.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const CONFIG = 'playwright.feature-verify.config.ts';
const RUNNER = 'run-matrix.feature-verify.spec.ts';
const RUN_LOG = process.env.FV_RUN_LOG ?? path.posix.join(PERSIST_ROOT, 'run-log.jsonl');

const argv = process.argv.slice(2);
const MODE = argv[0] ?? 'nightly';
const opt = (name, def) => { const i = argv.indexOf(`--${name}`); return i >= 0 ? argv[i + 1] : def; };
const log = (...a) => console.log('[fv-run]', ...a);

/** Manifest resolution: env override → next to run.mjs (scp'd) → in-repo data dir. */
async function loadManifest() {
  const candidates = [
    process.env.FV_APPS_MANIFEST,
    path.join(HERE, 'feature-verify-apps.json'),
    path.join(HERE, '..', '..', 'data', 'feature-verify-apps.json'),
  ].filter(Boolean);
  for (const p of candidates) if (existsSync(p)) return { manifest: JSON.parse(await fs.readFile(p, 'utf8')), path: p };
  throw new Error(`no app manifest found (looked in: ${candidates.join(', ')})`);
}

function gitHead(cwd) {
  try { return execFileSync('git', ['rev-parse', 'HEAD'], { cwd, encoding: 'utf8' }).trim(); } catch { return null; }
}

function tally(results) {
  const c = { total: results.length, pass: 0, fail: 0, warn: 0, skipped: 0 };
  for (const r of results) if (c[r.outcome] !== undefined) c[r.outcome]++;
  return c;
}

/** Drive one run-unit through Playwright, then append the reporting-tail entry. Returns the entry. */
async function runUnit(unit, { commit, extraEnv = {} }) {
  const env = {
    ...process.env,
    FV_INSTANCE_URL: unit.instanceUrl,
    FV_PROJECT_SLUG: unit.app,
    FV_MATRIX_FILE: unit.matrixFile,
    FV_EVIDENCE_ROOT: unit.evidenceRoot,
    FV_TRIGGERED_BY: unit.triggeredBy,
    FV_SESSION_ID: `${unit.mode}-${unit.app}-${Date.now()}`,
    ...(commit ? { FV_COMMIT_SHA: commit } : {}),
    ...extraEnv,
  };
  log(`▶ ${unit.app} · ${unit.matrixFile} · ${unit.mode} → ${unit.evidenceRoot}`);
  const res = spawnSync('npx', ['playwright', 'test', RUNNER, '-c', CONFIG], { cwd: HERE, env, stdio: 'inherit', shell: process.platform === 'win32' });

  // Fail-closed reporting tail: read the matrix the runner wrote (afterAll writes it even on failure).
  let results = [];
  const matrixPath = path.join(unit.evidenceRoot, 'matrix.json');
  try { results = JSON.parse(await fs.readFile(matrixPath, 'utf8')); }
  catch { results = [{ case: `${unit.app}: run produced no matrix`, outcome: 'fail' }]; } // no matrix ⇒ FAIL, not silent green
  const counts = tally(results);

  const history = await readRunLog(RUN_LOG);
  const prev = [...history].reverse().find((e) => e.app === unit.app);
  const flaky = flakyCases(history, { app: unit.app });
  const delta = prev ? deltaVsPrevious(results, prev.results ?? [], { knownFlaky: flaky }) : null;

  const entry = runLogEntry({
    run_id: env.FV_SESSION_ID, mode: unit.mode, app: unit.app,
    feature: results[0]?.case?.split(':')[0] ?? null, tier: unit.tier ?? null, commit,
    counts, delta, results, evidence_dir: unit.evidenceRoot,
  });
  await appendRunLog(RUN_LOG, entry);
  log(`  ${entry.result.toUpperCase()} — ${counts.pass}/${counts.total} pass, ${counts.fail} fail, ${counts.skipped} skip` +
      (delta ? ` · Δ new_fail=${delta.new_failures.length} fixed=${delta.fixed.length} flakes=${delta.flakes.length}` : ' · (no baseline)') +
      (res.status !== 0 ? `  [playwright exit ${res.status}]` : ''));
  return entry;
}

async function main() {
  const { manifest, path: mp } = await loadManifest();
  log(`mode=${MODE} · manifest=${mp} · run-log=${RUN_LOG}`);

  if (MODE === 'nightly') {
    const units = planNightly(manifest, { session: `nightly-${new Date().toISOString().slice(0, 10)}` });
    if (!units.length) { log('manifest has no matrix files — nothing to run'); return; }
    const entries = [];
    for (const u of units) {
      const app = manifest.apps.find((a) => a.slug === u.app);
      entries.push(await runUnit(u, { commit: app?.repo_root ? gitHead(app.repo_root) : null }));
    }
    const failed = entries.filter((e) => e.result === 'failed');
    log(`nightly done — ${entries.length} unit(s), ${failed.length} failed`);
    process.exit(failed.length ? 1 : 0);
  }

  if (MODE === 'commit') {
    const slug = opt('app'); if (!slug) throw new Error('commit mode needs --app <slug>');
    const app = manifest.apps.find((a) => a.slug === slug);
    if (!app) throw new Error(`--app ${slug} not in the manifest`);
    const history = await readRunLog(RUN_LOG);
    const base = opt('base') ?? lastGreenCommit(history, { app: slug }) ?? 'HEAD~1';
    const changed = changedFilesSince(base, { cwd: app.repo_root });
    const matrices = await discoverMatrices(app.repo_root);
    const plan = planCommit({ app: slug, instanceUrl: app.instance_url, changedFiles: changed, matrices, override: opt('tier'), session: `commit-${Date.now()}` });
    log(`commit · base=${base} · ${changed.length} file(s) → tier ${plan.tier} (${plan.tierReason}) · ${plan.units.length} matrix(es)`);
    let anyFail = false;
    for (const u of plan.units) { const e = await runUnit({ ...u, matrixFile: u.matrixFile }, { commit: gitHead(app.repo_root) }); anyFail ||= e.result === 'failed'; }
    process.exit(anyFail ? 1 : 0);
  }

  if (MODE === 'fix') {
    const slug = opt('app'); const matrix = opt('matrix');
    if (!slug || !matrix) throw new Error('fix mode needs --app <slug> --matrix <file>');
    const app = manifest.apps.find((a) => a.slug === slug);
    const base = { app: slug, instanceUrl: app.instance_url, matrixFile: matrix, mode: 'fix', triggeredBy: 'iteration',
                   evidenceRoot: evidenceRootFor({ mode: 'fix', session: `fix-${slug}` }) };
    log('fix · reproduce-symptom two-phase (pre → post)');
    await runUnit(base, { commit: gitHead(app.repo_root), extraEnv: { FV_PHASE: 'pre' } });
    const post = await runUnit(base, { commit: gitHead(app.repo_root), extraEnv: { FV_PHASE: 'post' } });
    process.exit(post.result === 'failed' ? 1 : 0);
  }

  throw new Error(`unknown mode "${MODE}" (nightly | commit | fix)`);
}

/** Read a repo's design/feature-verify/*.matrix.json, projecting {file, covers} for on-commit selection. */
async function discoverMatrices(repoRoot) {
  const dir = path.join(repoRoot, 'design', 'feature-verify');
  let names = [];
  try { names = (await fs.readdir(dir)).filter((n) => n.endsWith('.matrix.json')); } catch { return []; }
  const out = [];
  for (const n of names) {
    try { const m = JSON.parse(await fs.readFile(path.join(dir, n), 'utf8')); out.push({ file: path.join(dir, n), covers: m.covers }); }
    catch { /* skip an unreadable matrix */ }
  }
  return out;
}

main().catch((e) => { console.error('[fv-run] FATAL', e.message); process.exit(2); });
