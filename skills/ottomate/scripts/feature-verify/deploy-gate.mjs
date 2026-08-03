#!/usr/bin/env node
// Phase-3 deploy gate CLI — the shell-hook form of the Stage-3→deploy / Stage-4.8
// integrate REGISTRY SHIP-GATE ("register + verify or you can't ship"). Consults
// the two READ-ONLY signals and exits non-zero if the deploying commit may not
// ship on a gated project:
//   1. GET /api/anti-gaslight/violations?project_slug=<slug>  → any HARD violation
//      (R1..R7, incl. the Phase-3 unverified-ship / unreconciled-claim rules)
//      blocks — same "refuse on any HARD" contract as anti-gaslight-rules.md.
//   2. GET /api/verify/gate?project_slug=<slug>&commit_sha=<sha> → ok:false blocks
//      (commit-specific: every done user-facing feature needs an APPROVE report at
//      THIS commit; a stale APPROVE at an old commit does not count).
// A project with verify_gate='off'/'warn' never blocks here (the endpoints emit
// SOFT / advisory, ok:true) — the ramp is enforced server-side; this CLI only reads.
//
//   node deploy-gate.mjs --project <slug> --commit <sha>
// Env: FV_TRACKER_BASE (default http://127.0.0.1:8110); FV_BEARER_TOKEN optional
// (both GETs are open). Exit 0 = clear to ship · 2 = usage/transport error · 3 = BLOCKED.

const arg = (n, d) => { const i = process.argv.indexOf(`--${n}`); return i >= 0 ? process.argv[i + 1] : d; };
const TRACKER = process.env.FV_TRACKER_BASE ?? 'http://127.0.0.1:8110';
const TOKEN = process.env.FV_BEARER_TOKEN;
const project = arg('project', arg('slug'));
const commit = arg('commit', arg('sha'));

const die = (msg, code = 2) => { console.error(msg); process.exit(code); };
if (!project) die('usage: deploy-gate.mjs --project <slug> --commit <sha>  (--project required)');
if (!commit) die('usage: deploy-gate.mjs --project <slug> --commit <sha>  (--commit required)');

const headers = TOKEN ? { Authorization: `Bearer ${TOKEN}` } : {};
async function getJson(pathq) {
  const res = await fetch(`${TRACKER}${pathq}`, { headers });
  if (!res.ok) throw new Error(`${pathq} → ${res.status} ${await res.text()}`);
  return res.json();
}

try {
  const v = await getJson(`/api/anti-gaslight/violations?project_slug=${encodeURIComponent(project)}`);
  const hard = (v.violations ?? []).filter((r) => r.severity === 'HARD' && r.count > 0);

  const g = await getJson(
    `/api/verify/gate?project_slug=${encodeURIComponent(project)}&commit_sha=${encodeURIComponent(commit)}`,
  );

  const blocked = hard.length > 0 || g.ok === false;

  console.log(`deploy-gate: project=${project} commit=${commit} gate=${g.gate}`);
  if (hard.length) {
    console.log(`  HARD anti-gaslight violations (${hard.length}):`);
    for (const r of hard) console.log(`   - ${r.rule} (${r.count})`);
  }
  if (g.ok === false) {
    console.log(`  verify/gate ok=false — ${g.blocking.length} feature/flow(s) missing APPROVE@${commit}:`);
    for (const b of g.blocking.slice(0, 20)) console.log(`   - ${b.feature_id}${b.flow_id ? ' / ' + b.flow_id : ''}: ${b.reason}`);
    if (g.blocking.length > 20) console.log(`   … +${g.blocking.length - 20} more`);
  }

  if (blocked) {
    console.error(`\nBLOCKED — resolve the above before deploying ${project}@${commit} (verify_gate=${g.gate}).`);
    process.exit(3);
  }
  console.log(`\nCLEAR — ${project}@${commit} may ship (gate=${g.gate}).`);
  process.exit(0);
} catch (err) {
  die(`deploy-gate error: ${err.message ?? err}`, 2);
}
