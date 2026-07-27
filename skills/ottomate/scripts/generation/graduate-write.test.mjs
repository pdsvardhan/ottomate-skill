// Stage 4 S9 — the writing path. Must-FAIL and must-PASS per rule.
// The draft path keeps its own suite (graduate.test.mjs); those refusals must stay green unchanged.

import test from 'node:test';
import assert from 'node:assert/strict';
import { graduate, buildCatalogRow, draftGraduation } from './graduate.mjs';

const LOCKED = {
  status: 'locked', axis: 'media-card.corner-radius', chosen_value: '12px',
  target_id: 'screenroom.poster-card',
};
const PROV = {
  author: 'pdsv', spdx_id: 'MIT', licence_url: 'https://opensource.org/licenses/MIT',
  attribution: 'pdsv, MIT', retrieved_at: 1785160000000,
  source_url: 'https://ottomate.vault7a.xyz/projects/screenroom/design/poster-card',
};
const SRC = `export default function PosterCard(){
  return <article style={{borderRadius:'var(--poster-card-radius)',background:'var(--surface)'}}/>;
}`;

/** A post() that records rather than performs — the catalog must be provably untouched on a fail. */
function spy(status = 201) {
  const calls = [];
  return { calls, fn: async (row) => { calls.push(row); return { status, body: { component: row } }; } };
}

const OPTS = (extra = {}) => ({
  dark_light_compat: true, responsive: true, dependencies: [], projectSlug: 'screenroom', ...extra,
});

// ── the dry run is unchanged ───────────────────────────────────────────────────────────────────

test('MUST PASS — draftGraduation still never writes; the old contract is intact', () => {
  const d = draftGraduation(LOCKED, SRC, { ...PROV, ingestion_method: 'hand-authored' });
  assert.equal(d.writes, false);
});

test('MUST PASS — graduate() without apply is a dry run that writes nothing', async () => {
  const s = spy();
  const r = await graduate(LOCKED, SRC, PROV, OPTS({ post: s.fn, backedUp: true }));
  assert.equal(r.writes, false);
  assert.equal(r.ok, true, r.reason);
  assert.equal(s.calls.length, 0, 'a dry run must not call post() at all');
  assert.match(r.reason, /dry run/);
});

// ── the happy path ─────────────────────────────────────────────────────────────────────────────

test('MUST PASS — a locked, provenanced, GREEN, tokenised variant is written', async () => {
  const s = spy();
  const r = await graduate(LOCKED, SRC, PROV, OPTS({ apply: true, backedUp: true, post: s.fn }));
  assert.equal(r.writes, true, r.reason);
  assert.equal(s.calls.length, 1);
  assert.ok(['A', 'B'].includes(r.grade), `grade ${r.grade} must ship`);
  assert.equal(s.calls[0].spdx_id, 'MIT');
  assert.equal(s.calls[0].author, 'pdsv');
  assert.deepEqual(s.calls[0].used_in_projects, ['screenroom']);
  assert.ok(r.gates.every((g) => g.pass));
});

test('provenance is RECORDED from what is known, never defaulted', () => {
  const row = buildCatalogRow(LOCKED, SRC, PROV, OPTS());
  assert.equal(row.retrieved_at, PROV.retrieved_at, 'the lock timestamp, not "now"');
  assert.match(row.source_url, /design\/poster-card/, 'the round that produced it');
  assert.equal(row.ingestion_method, 'project-extracted');
  assert.match(row.description, /media-card\.corner-radius = 12px/);
});

test('a row with NO provenance supplied carries nulls, never invented values', () => {
  const row = buildCatalogRow(LOCKED, SRC, {}, OPTS());
  for (const f of ['spdx_id', 'author', 'attribution', 'licence_url', 'retrieved_at']) {
    assert.equal(row[f], null, `${f} must be null, not guessed`);
  }
  assert.equal(row.trademark_flag, false);
});

// ── every gate must fail closed ────────────────────────────────────────────────────────────────

test('MUST FAIL — a PROPOSED decision is refused; nothing is written', async () => {
  const s = spy();
  const r = await graduate({ ...LOCKED, status: 'proposed' }, SRC, PROV, OPTS({ apply: true, backedUp: true, post: s.fn }));
  assert.equal(r.writes, false);
  assert.equal(s.calls.length, 0, 'the catalog must be provably untouched, not merely error-flagged');
  assert.match(r.reason, /only a LOCKED decision/);
});

test('MUST FAIL — a RED licence blocks the write', async () => {
  const s = spy();
  const r = await graduate(LOCKED, SRC, { ...PROV, spdx_id: 'CC-BY-NC-4.0' }, OPTS({ apply: true, backedUp: true, post: s.fn }));
  assert.equal(r.writes, false);
  assert.equal(s.calls.length, 0);
  assert.ok(r.gates.find((g) => g.gate === 'licence' && !g.pass));
});

test('MUST FAIL — missing provenance blocks the write', async () => {
  const s = spy();
  const r = await graduate(LOCKED, SRC, { ...PROV, attribution: null }, OPTS({ apply: true, backedUp: true, post: s.fn }));
  assert.equal(r.writes, false);
  assert.equal(s.calls.length, 0);
});

test('MUST FAIL — a baked-in literal drags the grade below B and blocks the write', async () => {
  const s = spy();
  const literal = `export default function C(){return <div style={{background:'#fff',color:'#111827',border:'1px solid #e5e7eb'}}/>;}`;
  const r = await graduate(LOCKED, literal, PROV, OPTS({ apply: true, backedUp: true, post: s.fn }));
  assert.equal(r.writes, false);
  assert.equal(s.calls.length, 0);
  // Tokenisation is its OWN gate at graduation, not a weighted term that three good factors can
  // outvote: H1 calls a baked-in #fff "a downgrade, not an entry", and this is the one moment the
  // round's token names are known.
  assert.ok(r.gates.find((g) => g.gate === 'tokenised' && !g.pass));
});

test('MUST FAIL — a duplicate blocks the automatic write', async () => {
  const s = spy();
  const r = await graduate(LOCKED, SRC, PROV, OPTS({
    apply: true, backedUp: true, post: s.fn, existing: [{ id: 'mc-old', src: SRC }],
  }));
  assert.equal(r.writes, false);
  assert.equal(s.calls.length, 0);
  assert.match(r.reason, /dedupe/);
});

test('MUST FAIL — no backup, no write. The rule is asserted, not assumed', async () => {
  const s = spy();
  const r = await graduate(LOCKED, SRC, PROV, OPTS({ apply: true, post: s.fn })); // backedUp omitted
  assert.equal(r.writes, false);
  assert.equal(s.calls.length, 0);
  assert.match(r.reason, /POST \/api\/backup/);
});

test('MUST FAIL — a rejected POST is reported as not written, never as success', async () => {
  const s = spy(409);
  const r = await graduate(LOCKED, SRC, PROV, OPTS({ apply: true, backedUp: true, post: s.fn }));
  assert.equal(r.writes, false);
  assert.equal(r.ok, false);
  assert.match(r.reason, /409/);
});

test('every gate is reported with its verdict, so a refusal can always be explained', async () => {
  const r = await graduate(LOCKED, SRC, PROV, OPTS());
  assert.deepEqual(r.gates.map((g) => g.gate), ['locked', 'provenance', 'licence', 'tokenised', 'grade', 'dedupe']);
});
