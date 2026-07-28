// C9 — the prior-art source scan. run: node --test source-art.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { extractDeclaredTokens, scanSourceArt, reconcileSourceArt, questionTokenSuffix, stripCssComments } from './source-art.mjs';

test('extracts declared custom properties, last-wins, distinct values kept', () => {
  const t = extractDeclaredTokens(':root{ --radius: 8px; --accent:#e9b84c } .x{ --radius: 12px }');
  assert.equal(t['--radius'].value, '12px');
  assert.deepEqual(t['--radius'].values, ['8px', '12px']);
  assert.equal(t['--accent'].value, '#e9b84c');
});

test('MUST PASS (not a grep) — a token mentioned only in a COMMENT is not extracted', () => {
  const t = extractDeclaredTokens('/* --radius: 999px is the old value */ :root{ --radius: 8px }');
  assert.equal(t['--radius'].value, '8px');
  assert.doesNotMatch(JSON.stringify(t['--radius'].values), /999px/);
  assert.match(stripCssComments('/* x */a'), /^\s*a$/);
});

test('MUST PASS — a project that declares --radius:8px reports it as already-built prior art', () => {
  const src = scanSourceArt([{ path: 'app/globals.css', css: ':root{ --radius: 8px }' }]);
  const r = reconcileSourceArt({ sourceTokens: src, ledger: [], questions: ['corner-radius'] });
  assert.equal(r['corner-radius'].verdict, 'already-built');
  assert.equal(r['corner-radius'].source.value, '8px');
});

test('MUST FAIL — ledger locked 12px vs code --radius:8px is a CONFLICT naming both, seeding neither', () => {
  const src = scanSourceArt([{ path: 'app/theme.css', css: ':root{ --radius: 8px }' }]);
  const ledger = [{ axis: 'media-card.corner-radius', status: 'locked', chosen_value: '12px', target_id: 't' }];
  const r = reconcileSourceArt({ sourceTokens: src, ledger });
  const cr = r['corner-radius'];
  assert.equal(cr.verdict, 'conflict');
  assert.match(cr.why, /12px/);
  assert.match(cr.why, /8px/);
  assert.match(cr.why, /theme\.css/);
  assert.equal(cr.ledgerValue, '12px'); // reported, but nothing is auto-inherited
  assert.equal('seed' in cr, false, 'a conflict must not carry a seeded value — the round settles it');
  assert.equal('inherit' in cr, false);
});

test('MUST PASS — agreement reads consistent, not a conflict', () => {
  const src = scanSourceArt([{ path: 'a.css', css: ':root{ --radius: 8px }' }]);
  const ledger = [{ axis: 'media-card.corner-radius', status: 'locked', chosen_value: '8px', target_id: 't' }];
  assert.equal(reconcileSourceArt({ sourceTokens: src, ledger })['corner-radius'].verdict, 'consistent');
});

test('MUST FAIL — one token declared two different values across files is an intra-source conflict', () => {
  const src = scanSourceArt([
    { path: 'a.css', css: ':root{ --radius: 8px }' },
    { path: 'b.css', css: ':root{ --radius: 16px }' },
  ]);
  assert.deepEqual(src['--radius'].conflict, ['8px', '16px']);
});

test('the suffix mapping follows the emitter token template', () => {
  assert.equal(questionTokenSuffix('corner-radius'), 'radius');
  assert.equal(questionTokenSuffix('title-placement'), null); // structural, no token
});

test('a namespaced source token (--library-list-radius) still matches the radius suffix', () => {
  const src = scanSourceArt([{ path: 'x.css', css: ':root{ --library-list-radius: 6px }' }]);
  assert.equal(reconcileSourceArt({ sourceTokens: src, ledger: [], questions: ['corner-radius'] })['corner-radius'].verdict, 'already-built');
});
