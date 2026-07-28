// R4 (F-7) — three checker misfires fixed. Each misfire now PASSES; a genuine instance still FLAGS.
// run: node --test checks-r4.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DETECTORS } from './checks.mjs';

const run = (id, ...args) => DETECTORS[id].fn(...args);
const flagged = (r) => r.pass === false;

// ── R4.1: currency amounts are not HTTP status codes ──
const vocabRule = { params: { patterns: ['\\b[45]\\d\\d\\b'] } };
test('R4.1 — spend amounts (₹428, ₹500, ₹403) are NOT flagged as HTTP status codes', () => {
  const r = run('adv-no-implementation-vocabulary', '<p>You spent ₹428 on dining, ₹500 on fuel and ₹403 on bills.</p>', vocabRule);
  assert.equal(flagged(r), false, r.detail);
});
test('R4.1 CONTROL — a genuine non-monetary status code still flags', () => {
  const r = run('adv-no-implementation-vocabulary', '<p>The server returned 500 while saving.</p>', vocabRule);
  assert.equal(flagged(r), true);
});

// ── R4.2: numeric coincidence across property classes is not drift ──
test('R4.2 — padding:8px coinciding with a RADIUS token (--pr:8px) is NOT drift', () => {
  const src = '<style>:root{--pr:8px} .a{border-radius:var(--pr)} .b{padding:8px;gap:16px}</style>';
  const r = run('adv-raw-value-drift', src);
  assert.equal(flagged(r), false, r.detail);
});
test('R4.2 CONTROL — a literal border-radius duplicating a radius token still flags', () => {
  const src = '<style>:root{--pr:8px} .a{border-radius:var(--pr)} .b{border-radius:8px}</style>';
  const r = run('adv-raw-value-drift', src);
  assert.equal(flagged(r), true);
});

// ── R4.3: shared classes are harmless under shadow-DOM isolation ──
const collideRule = { params: { namespaces: ['css_class'] } };
const isoVariant = (extra = '') => `<div class="vs-shadow-host"><template shadowrootmode="open"><style>.card{padding:1rem} ${extra}</style><div class="card"></div></template></div>`;
test('R4.3 — two SHADOW-ISOLATED variants sharing a class do NOT collide', () => {
  const r = run('block-svg-id-collision', { A: isoVariant(), B: isoVariant() }, collideRule);
  assert.equal(flagged(r), false, r.detail);
});
test('R4.3 CONTROL — two NON-isolated variants sharing a class still collide', () => {
  const plain = '<div class="card"><style>.card{padding:1rem}</style></div>';
  const r = run('block-svg-id-collision', { A: plain, B: plain }, collideRule);
  assert.equal(flagged(r), true);
});
