// Tests for pre-publish-gates.mjs (WS1.0) — the fail-closed publish gates, with must-pass + must-fail.
// run: node --test pre-publish-gates.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { themeContrastGate, blockSourceLint, prePublishGates } from './pre-publish-gates.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const THEMING = path.resolve(HERE, '../theming');
const cointrailTheme = path.join(THEMING, 'cointrail.tokens.json');
const brokenTheme = path.join(THEMING, '_fixtures', 'broken-theme.tokens.json');
const cleanBlock = path.join(THEMING, 'blocks', 'category-breakdown.block.css');
const dirtyBlock = path.join(THEMING, '_fixtures', 'category-breakdown.DIRTY.css');

// ── theme contrast gate ──
test('theme contrast gate PASSES on cointrail', () => {
  assert.equal(themeContrastGate({ themeFile: cointrailTheme }).verdict, 'pass');
});
test('theme contrast gate BLOCKS a broken theme (invisible text)', () => {
  const r = themeContrastGate({ themeFile: brokenTheme });
  assert.equal(r.verdict, 'block');
  assert.match(r.why, /below floor/);
});
test('no theme file → SKIP, never a silent pass', () => {
  const r = themeContrastGate({ themeFile: null });
  assert.equal(r.verdict, 'skip');
  assert.match(r.why, /NOT a pass/);
});
test('a named-but-missing theme file BLOCKS (never publish against a missing theme)', () => {
  assert.equal(themeContrastGate({ themeFile: path.join(THEMING, 'nope.json') }).verdict, 'block');
});

// ── block source lint ──
test('block lint PASSES the token-only Block', () => {
  assert.equal(blockSourceLint({ blockCssFiles: [cleanBlock] }).verdict, 'pass');
});
test('block lint BLOCKS a Block with raw values', () => {
  const r = blockSourceLint({ blockCssFiles: [dirtyBlock] });
  assert.equal(r.verdict, 'block');
  assert.match(r.why, /violation/);
});
test('no block sources → SKIP (legacy single-HTML round)', () => {
  assert.equal(blockSourceLint({ blockCssFiles: [] }).verdict, 'skip');
});

// ── composed, fail-closed ──
test('prePublishGates PASSES when theme + block are clean', () => {
  const g = prePublishGates({ themeFile: cointrailTheme, blockCssFiles: [cleanBlock] });
  assert.equal(g.pass, true);
  assert.equal(g.blocked.length, 0);
});
test('prePublishGates FAILS if EITHER gate blocks', () => {
  assert.equal(prePublishGates({ themeFile: brokenTheme, blockCssFiles: [cleanBlock] }).pass, false);
  assert.equal(prePublishGates({ themeFile: cointrailTheme, blockCssFiles: [dirtyBlock] }).pass, false);
});
test('a project with no theme + no block sources does not block (both skip)', () => {
  const g = prePublishGates({});
  assert.equal(g.pass, true);
  assert.equal(g.theme.verdict, 'skip');
  assert.equal(g.lint.verdict, 'skip');
});
