// Live end-to-end demonstration of U5 (picks -> code) and T8 (style priors) on a THROWAWAY project.
// Owner decision 2026-07-27: prove the machinery now rather than wait for real picks, without
// touching Screenroom or biasing the real rounds. Everything is deleted at the end.
//
// The point is that both run against rows FETCHED BACK FROM THE LIVE API, not fixtures.

import { readFileSync, mkdtempSync, writeFileSync, readFileSync as rf } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { buildStylePriors, formatStylePriors, scoreAgainstPriors } from '/tmp/ottoskill/scripts/generation/style-priors.mjs';
import { buildArtifacts, emitToRepo, formatEmit } from '/tmp/ottoskill/scripts/generation/emit-design-artifacts.mjs';

const BASE = 'http://127.0.0.1:8110';
const TOKEN = readFileSync('/opt/homeserver/ottomate/.token', 'utf8').trim();
const SLUG = 'zzz-u5t8-demo';

async function api(p, init = {}) {
  const res = await fetch(BASE + p, {
    ...init,
    headers: { ...(init.body ? { 'content-type': 'application/json' } : {}), authorization: `Bearer ${TOKEN}`, ...(init.headers ?? {}) },
  });
  return { status: res.status, ok: res.ok, body: await res.json().catch(() => null) };
}

const line = (s) => console.log('\n' + '─'.repeat(78) + '\n' + s + '\n' + '─'.repeat(78));

// ── 0. backup FIRST (hard constraint 2) ──────────────────────────────────────────────────────────
line('0. backup before any DB change');
console.log(JSON.stringify((await api('/api/backup', { method: 'POST', body: '{}' })).body));

// ── 1. throwaway project ─────────────────────────────────────────────────────────────────────────
line('1. create the throwaway project');
await api(`/api/projects/${SLUG}`, { method: 'DELETE' }).catch(() => {});
const created = await api('/api/projects', {
  method: 'POST',
  body: JSON.stringify({ slug: SLUG, display_name: 'U5/T8 demo (throwaway)', current_status: 'ideating' }),
});
console.log(`POST /api/projects -> ${created.status}`);
if (!created.ok) { console.error(JSON.stringify(created.body)); process.exit(1); }

// ── 2. seed a realistic decision history ─────────────────────────────────────────────────────────
// Two targets, so prior art and cross-target priors have something real to read. Token-shaped AND
// structural picks, plus one HARD ban so T8 has an `avoid` and not only a `prefer`.
line('2. seed locked decisions through the API (one door)');
const seed = [
  { target_id: 'demo.poster-card', axis: 'media-card.corner-radius', chosen_value: '4px', status: 'locked', confirmed: true, round: 1,
    rejected: [{ value: '20px', grade: 'rejected_with_reason', why_rejected: 'too soft for a data surface' }] },
  { target_id: 'demo.poster-card', axis: 'media-card.elevation', chosen_value: 'flat-hairline', status: 'locked', confirmed: true, round: 1 },
  { target_id: 'demo.poster-card', axis: 'media-card.title-placement', chosen_value: 'below-media', status: 'locked', confirmed: true, round: 1 },
  { target_id: 'demo.poster-card', axis: 'media-card.media-aspect', chosen_value: '2/3', status: 'locked', confirmed: true, round: 1 },
  { target_id: 'demo.collection-card', axis: 'media-card.corner-radius', chosen_value: '4px', status: 'locked', confirmed: true, round: 1 },
  { target_id: 'demo.poster-card', axis: 'media-card.hover-motion', chosen_value: 'lift-6px', status: 'proposed', round: 2 },
];
for (const d of seed) {
  const r = await api(`/api/projects/${SLUG}/design-decisions`, { method: 'POST', body: JSON.stringify(d) });
  if (!r.ok) { console.error(d.axis, r.status, JSON.stringify(r.body)); process.exit(1); }
}
console.log(`${seed.length} rows posted`);

// ── 3. read them BACK from the API — everything below runs on live data, not the seed array ──────
const fetched = (await api(`/api/projects/${SLUG}/design-decisions?limit=500`)).body.decisions;
console.log(`GET returned ${fetched.length} rows · locked ${fetched.filter((d) => d.status === 'locked').length}`);

// ── 4. T8 — style priors from that history ───────────────────────────────────────────────────────
line('4. T8 — style priors, assembled from the LIVE rows');
const priors = buildStylePriors(fetched, { axesInPlay: ['corner-radius', 'elevation', 'badge-style', 'accent-usage'] });
console.log(formatStylePriors(priors));

line('4b. T8 — the honest measurement: does a proposed round re-tread ruled-out ground?');
const naive = { A: { 'corner-radius': '20px' }, B: { 'corner-radius': '12px' }, C: { 'corner-radius': '4px' } };
const primed = { A: { 'corner-radius': '2px' }, B: { 'corner-radius': '12px' }, C: { 'corner-radius': '8px' } };
console.log('a round that ignored the priors :', JSON.stringify(scoreAgainstPriors(naive, priors)));
console.log('a round that respected them    :', JSON.stringify(scoreAgainstPriors(primed, priors)));

// ── 5. U5 — the same rows become code ────────────────────────────────────────────────────────────
line('5. U5 — locked decisions become a tokens file + a spec');
const artifacts = buildArtifacts(fetched, { project: SLUG });
console.log(formatEmit(artifacts));

const repo = mkdtempSync(path.join(tmpdir(), 'u5-demo-repo-'));
execFileSync('git', ['-C', repo, 'init', '-q']);
execFileSync('git', ['-C', repo, 'config', 'user.email', 'demo@local']);
execFileSync('git', ['-C', repo, 'config', 'user.name', 'demo']);
writeFileSync(path.join(repo, 'README.md'), '# throwaway\n');
execFileSync('git', ['-C', repo, 'add', '.']);
execFileSync('git', ['-C', repo, 'commit', '-qm', 'init']);

line('5b. --dry-run first: prints, writes nothing');
const dry = emitToRepo(repo, artifacts, { project: SLUG, round: 1, dryRun: true });
console.log(dry.css);
console.log('--- ' + path.basename(dry.specPath) + ' ---');
console.log(dry.spec);

line('5c. for real: write + commit on the branch (never push)');
const res = emitToRepo(repo, artifacts, { project: SLUG, round: 1 });
console.log(formatEmit(artifacts, res));
console.log('\ngit log:');
console.log(execFileSync('git', ['-C', repo, 'log', '-1', '--pretty=%B'], { encoding: 'utf8' }).trim());
console.log('files committed:', execFileSync('git', ['-C', repo, 'show', '--stat', '--oneline', 'HEAD'], { encoding: 'utf8' }).trim());
console.log('remotes (must be empty — nothing could have been pushed):',
  JSON.stringify(execFileSync('git', ['-C', repo, 'remote'], { encoding: 'utf8' }).trim()));

line('5d. re-emitting the same artifacts is a no-op, not an empty commit');
console.log(JSON.stringify(emitToRepo(repo, artifacts, { project: SLUG, round: 1 })));

// ── 6. clean up ──────────────────────────────────────────────────────────────────────────────────
line('6. delete the throwaway project (cascades its decisions)');
const del = await api(`/api/projects/${SLUG}`, { method: 'DELETE' });
console.log(`DELETE /api/projects/${SLUG} -> ${del.status}`);
const after = await api(`/api/projects/${SLUG}/design-decisions?limit=500`);
console.log('decisions remaining:', (after.body?.decisions ?? []).length);
console.log('throwaway repo left at', repo, '(tmp, not tracked)');
