#!/usr/bin/env node
// Doc-lint runner (Phase 4, D4) — the free-tool leg of the documentation standard.
// Runs over a project's HAND-WRITTEN docs:
//   • Vale (Vale.Avoid) — retired/dropped terms must not appear (R-DOC-2), from
//     the per-project reject-seed (e.g. leaploop → "Telegram").
//   • lychee — no broken links (R-DOC-7).
//   • native — required title/sections present (R-DOC-6, lenient) + generated
//     docs carry a provenance header (R-DOC-1).
// Ramp-aware: reads the project's doc_gate; 'block' → exit 3 on any violation,
// 'warn'/'off' → advisory (exit 0, prints WARN). Runs ON the box (repos + the
// vale/lychee binaries live there).
//
//   node run.mjs --project <slug> [--repo <path>] [--gate off|warn|block]
// Env: VALE_BIN (~/.local/bin/vale), LYCHEE_BIN (~/.local/bin/lychee),
//      FV_TRACKER_BASE (http://127.0.0.1:8110).

import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import os from 'node:os';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const arg = (n, d) => { const i = process.argv.indexOf(`--${n}`); return i >= 0 ? process.argv[i + 1] : d; };
const project = arg('project');
if (!project) { console.error('usage: run.mjs --project <slug> [--repo <path>] [--gate ...]'); process.exit(2); }
const repo = arg('repo', `/mnt/storage/websites/${project}`);
const VALE = process.env.VALE_BIN || path.join(os.homedir(), '.local/bin/vale');
const LYCHEE = process.env.LYCHEE_BIN || path.join(os.homedir(), '.local/bin/lychee');
const TRACKER = process.env.FV_TRACKER_BASE || 'http://127.0.0.1:8110';

// ── resolve the ramp ───────────────────────────────────────────────────────
let gate = arg('gate');
if (!gate) {
  try {
    const j = JSON.parse(execFileSync('curl', ['-s', `${TRACKER}/api/projects/${project}`], { encoding: 'utf8' }));
    gate = j?.project?.doc_gate || 'off';
  } catch { gate = 'off'; }
}

// ── collect the hand-written doc set ───────────────────────────────────────
function mdUnder(dir) {
  if (!existsSync(dir)) return [];
  const out = [];
  for (const e of readdirSync(dir)) {
    const p = path.join(dir, e);
    const st = statSync(p);
    if (st.isDirectory()) { if (e !== 'node_modules' && e !== '.git') out.push(...mdUnder(p)); }
    else if (e.toLowerCase().endsWith('.md')) out.push(p);
  }
  return out;
}
// EVERY top-level .md is hand-authored unless it is agent scratch or a machine-appended
// log (deny-list below), plus everything under public_docs/ and decisions/.
// Deny by exception, never by allow-pattern: the failure mode of this linter is a SILENT
// SKIP, not a false alarm, so a newly written doc must be linted by default. The previous
// name heuristic (three fixed filenames + /brief|features|product/i) skipped most of a
// project's Layer-2 docs — in mapsofbharat it dropped DECISIONS.md, VOICE.md, ROADMAP.md,
// moderation-policy.md, response-playbook.md, does-not-claim.md and measurement-runbook.md,
// so the runner printed CLEAN while lychee found 25 broken links in DECISIONS.md alone.
const DENY_TOP = [
  /^iteration[-_]log\.md$/i,          // append-only iteration log (agent-written)
  /^pending-and-next-session\.md$/i,  // session handoff scratch
  /^session[-_].+\.md$/i,             // dated session notes (SESSION_2026-03-21.md)
  /^claude[-_]memory\.md$/i,          // agent memory scratch
];
const topDocs = (existsSync(repo) ? readdirSync(repo) : [])
  .filter((f) => /\.md$/i.test(f) && !DENY_TOP.some((re) => re.test(f)))
  .map((f) => path.join(repo, f))
  .filter((p) => existsSync(p) && statSync(p).isFile());
const docs = [...new Set([...topDocs, ...mdUnder(path.join(repo, 'public_docs')), ...mdUnder(path.join(repo, 'decisions'))])].sort();
// Print the collected set: a CLEAN verdict is only trustworthy if you can see what it covered.
console.log(`doc-lint: collected ${docs.length} doc(s) — ${docs.map((d) => path.relative(repo, d)).join(' ')}`);

const violations = [];

// ── Vale: retired terms ────────────────────────────────────────────────────
const seedFile = path.join(HERE, 'reject-seeds', `${project}.txt`);
const rejectFile = path.join(HERE, 'styles/config/vocabularies/Ottomate/reject.txt');
const terms = existsSync(seedFile)
  ? readFileSync(seedFile, 'utf8').split('\n').map((l) => l.trim()).filter((l) => l && !l.startsWith('#'))
  : [];
writeFileSync(rejectFile, terms.join('\n') + (terms.length ? '\n' : ''));
// Retired-term is NOT applied to the ADR record — neither decisions/ nor a top-level
// DECISIONS.md register, which is the same artifact class: an ADR is the RECORD of a drop,
// so it must be free to name the dropped thing. R-DOC-8 governs those instead. The
// exemption is Vale-only — the ADR record IS link-checked by lychee below.
const isAdrRecord = (d) =>
  d.split(path.sep).some((seg) => seg.toLowerCase() === 'decisions') ||
  path.basename(d).toLowerCase() === 'decisions.md';
const valeDocs = docs.filter((d) => !isAdrRecord(d));
if (valeDocs.length && terms.length) {
  try {
    const out = execFileSync(VALE, ['--config', path.join(HERE, '.vale.ini'), '--output', 'JSON', ...valeDocs], { encoding: 'utf8' });
    const parsed = JSON.parse(out || '{}');
    for (const [file, alerts] of Object.entries(parsed)) {
      for (const a of alerts) violations.push({ rule: 'R-DOC-2 retired-term', file: path.relative(repo, file), line: a.Line, msg: a.Match });
    }
  } catch (e) {
    // vale exits non-zero when it finds alerts; its JSON is on stdout.
    try {
      const parsed = JSON.parse(e.stdout || '{}');
      for (const [file, alerts] of Object.entries(parsed)) {
        for (const a of alerts) violations.push({ rule: 'R-DOC-2 retired-term', file: path.relative(repo, file), line: a.Line, msg: a.Match });
      }
    } catch {
      // 2026-09-07: a Vale RUNTIME failure (e.g. E100 missing .vale.ini) used to be swallowed here and the run
      // printed CLEAN — the silent-skip failure mode this file's own README warns about. It is a violation now.
      violations.push({ rule: 'R-DOC-2 vale-did-not-run', file: '(all)', msg: String(e.stdout || e.message || e).slice(0, 200) });
    }
  }
}

// ── lychee: broken links ───────────────────────────────────────────────────
if (docs.length) {
  try {
    execFileSync(LYCHEE, ['--no-progress', '--format', 'json', ...docs], { encoding: 'utf8' });
  } catch (e) {
    try {
      const j = JSON.parse(e.stdout || '{}');
      // lychee >= 0.19 emits `error_map` (keyed by input file); older builds emitted
      // `fail_map`. Reading only `fail_map` made this leg a silent no-op on lychee
      // 0.24 — it reported CLEAN on a file lychee itself flagged. Accept both.
      const map = j.error_map || j.fail_map || {};
      for (const [file, fails] of Object.entries(map)) {
        for (const f of fails) {
          const url = f.url || String(f);
          const status = typeof f.status === 'string' ? f.status : f.status?.text || '';
          violations.push({
            rule: 'R-DOC-7 broken-link',
            file: path.relative(repo, file),
            line: f.span?.line,
            msg: url + (status ? ` [${status}]` : ''),
          });
        }
      }
    } catch { /* lychee non-zero without parseable json */ }
  }
}

// ── native: required title + provenance on generated docs ──────────────────
for (const f of ['README.md', 'ARCHITECTURE.md']) {
  const p = path.join(repo, f);
  if (existsSync(p)) { const t = readFileSync(p, 'utf8'); if (!/^#\s+\S/m.test(t)) violations.push({ rule: 'R-DOC-6 missing-title', file: f }); }
}
for (const f of ['FEATURES.md']) {
  const p = path.join(repo, f);
  if (existsSync(p)) { const t = readFileSync(p, 'utf8'); if (!/generated from registry/i.test(t)) violations.push({ rule: 'R-DOC-1 no-provenance', file: f, msg: 'generated doc lacks provenance header' }); }
}

// ── report + exit per ramp ─────────────────────────────────────────────────
console.log(`doc-lint: project=${project} gate=${gate} docs=${docs.length} retired-terms=[${terms.join(', ')}]`);
if (!violations.length) { console.log('CLEAN — no doc violations.'); process.exit(0); }
for (const v of violations) console.log(`  ${v.rule}: ${v.file}${v.line ? ':' + v.line : ''}${v.msg ? ' — ' + v.msg : ''}`);
if (gate === 'block') { console.error(`\nBLOCKED — ${violations.length} doc violation(s) on a doc-gated project.`); process.exit(3); }
console.log(`\nWARN — ${violations.length} doc violation(s) (gate=${gate}, advisory).`);
process.exit(0);
