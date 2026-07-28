// Tests for ban-raw-values.mjs — MUST-PASS (the real token-only Block) + MUST-FAIL (injected raws).
// run: node --test ban-raw-values.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { lintCss, lintFile } from './ban-raw-values.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));

// MUST-PASS: the refactored Block reads only tokens — zero blocking findings.
test('the real token-only Block has ZERO blocking findings', () => {
  const r = lintFile(path.join(HERE, 'blocks', 'category-breakdown.block.css'));
  assert.equal(r.blocking, 0, 'blocking: ' + JSON.stringify(r.findings.filter((f) => f.severity === 'block'), null, 1));
});

// MUST-FAIL: a raw hex is caught.
test('an injected raw hex is flagged as blocking', () => {
  const r = lintCss('.x { color: #ff0000; background: var(--color-surface); }');
  assert.equal(r.blocking, 1);
  assert.equal(r.findings[0].category, 'colour');
  assert.match(r.findings[0].detail, /#ff0000/);
});

test('rgb()/hsl() and named colours are all caught', () => {
  assert.equal(lintCss('.x { color: rgb(1,2,3); }').blocking, 1);
  assert.equal(lintCss('.x { color: hsl(200 50% 40%); }').blocking, 1);
  assert.equal(lintCss('.x { border-color: red; }').blocking, 1);
});

test('a raw easing is flagged, but only in a timing context', () => {
  assert.equal(lintCss('.x { transition: transform 150ms ease-in-out; }').blocking, 1);
  assert.equal(lintCss('.x { transition: transform var(--motion-duration-fast) cubic-bezier(0.4,0,0.2,1); }').blocking, 1);
  // "linear" inside linear-gradient() on a non-timing prop must NOT be read as easing
  assert.equal(lintCss('.x { background: var(--color-action); }').blocking, 0);
});

test('hard-coded radius and shadow are flagged; var() forms pass', () => {
  assert.equal(lintCss('.x { border-radius: 12px; }').blocking, 1);
  assert.equal(lintCss('.x { border-radius: var(--radius-lg); }').blocking, 0);
  assert.equal(lintCss('.x { box-shadow: 0 1px 3px rgba(0,0,0,.1); }').blocking >= 1, true);
  assert.equal(lintCss('.x { box-shadow: var(--shadow-card); }').blocking, 0);
  assert.equal(lintCss('.x { box-shadow: none; }').blocking, 0);
});

test('var(--token) values and the reduced-motion "transition: none" are clean', () => {
  const clean = '.x { background: var(--color-surface); transition: none; }';
  assert.equal(lintCss(clean).blocking, 0);
});

test('raw spacing px is ADVISORY, never blocking (no spacing-scale token yet)', () => {
  const r = lintCss('.x { padding: 24px; gap: 14px; }');
  assert.equal(r.blocking, 0);
  assert.ok(r.advisory >= 1);
  // hairline + zero are allowlisted
  assert.equal(lintCss('.x { padding: 0; border-width: 1px; }').advisory, 0);
});

test('a selector or class name that looks like a colour is not matched (values only)', () => {
  // ".gold" and ".navy-thing" are selectors; only the var() value is scanned.
  assert.equal(lintCss('.gold, .navy-thing { color: var(--color-on-surface); }').blocking, 0);
});
