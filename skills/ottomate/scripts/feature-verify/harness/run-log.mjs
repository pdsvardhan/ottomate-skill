// P3-C2: the run-log — one JSONL line per verifier run, the durable trend substrate the nightly/on-commit
// cadence reads. It answers three questions the cadence needs: what changed since last run (delta, above),
// what the LAST-GREEN baseline commit is (on-commit diffs from there), and which cases are FLAKY (surface,
// don't alarm). Impure only in the fs read/append; the path is injected so it's tested on a tmp file.
// See docs/plans/2026-07-28-task3-P3C-*.

import { promises as fs } from 'node:fs';
import path from 'node:path';

/** Normalise a completed run into a compact, greppable log entry. */
export function runLogEntry(x) {
  const c = x.counts ?? {};
  return {
    run_id: x.run_id,
    ts: x.ts ?? new Date().toISOString(),
    mode: x.mode ?? 'manual',                 // nightly | commit | fix | manual
    app: x.app,
    feature: x.feature ?? null,
    tier: x.tier ?? null,
    commit: x.commit ?? null,
    result: c.fail > 0 ? 'failed' : c.skipped > 0 ? 'partial' : 'passed',
    counts: { total: c.total ?? 0, pass: c.pass ?? 0, fail: c.fail ?? 0, warn: c.warn ?? 0, skipped: c.skipped ?? 0 },
    verdict: x.verdict ?? null,
    delta: x.delta ?? null,
    // compact per-case outcomes so future deltas + flakyCases() have history without the full evidence
    results: (x.results ?? []).map((r) => ({ case: r.case, outcome: r.outcome })),
    evidence_dir: x.evidence_dir ?? null,
  };
}

/** Append one entry as a JSONL line (creates the dir + file if needed). */
export async function appendRunLog(file, entry) {
  await fs.mkdir(path.dirname(file), { recursive: true });
  await fs.appendFile(file, JSON.stringify(entry) + '\n', 'utf8');
}

/** Read the whole log back as an array (missing file ⇒ []; blank/broken lines skipped). */
export async function readRunLog(file) {
  let raw;
  try { raw = await fs.readFile(file, 'utf8'); } catch { return []; }
  const out = [];
  for (const line of raw.split('\n')) {
    const s = line.trim(); if (!s) continue;
    try { out.push(JSON.parse(s)); } catch { /* skip a torn line rather than throw */ }
  }
  return out;
}

/** The most recent all-green ('passed') commit for an app — the on-commit last-green baseline. */
export function lastGreenCommit(entries, opts = {}) {
  const app = opts.app;
  for (let i = entries.length - 1; i >= 0; i--) {
    const e = entries[i];
    if (app && e.app !== app) continue;
    if (e.result === 'passed' && e.commit) return e.commit;
  }
  return null;
}

/**
 * Cases whose outcome is NOT constant across an app's recent runs → flaky candidates (surface, don't
 * alarm). Heuristic (commit-blind, honestly bounded): a case with ≥2 distinct outcomes across the last
 * `window` runs of that app. Feed the result to deltaVsPrevious({knownFlaky}).
 */
export function flakyCases(entries, opts = {}) {
  const { app, window = 5 } = opts;
  const recent = entries.filter((e) => (!app || e.app === app)).slice(-window);
  const seen = new Map(); // case id → Set of outcomes
  for (const e of recent) {
    for (const r of e.verdict?.results ?? e.results ?? []) {
      if (!seen.has(r.case)) seen.set(r.case, new Set());
      seen.get(r.case).add(r.outcome);
    }
  }
  return [...seen.entries()].filter(([, outcomes]) => outcomes.size > 1).map(([id]) => id);
}
