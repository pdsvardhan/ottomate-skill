// Tests for decompose.mjs (WS1.3, F-15/F-4/F-9). run: node --test decompose.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { extractRoles, decompose, scopeChoices, scopeQuestion, requireExplicitScope, axesForScope } from './decompose.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const blockHtml = readFileSync(path.resolve(HERE, '../theming/blocks/category-breakdown.html'), 'utf8');

// F-4: decomposition comes from the STAMPS, not name-guessing.
test('extractRoles reads the real data-role/data-oid stamps from source', () => {
  const e = extractRoles(blockHtml);
  assert.equal(e.oid, 'cointrail.category-breakdown');
  assert.deepEqual(e.parts, ['panel', 'metric', 'category-list', 'category-row', 'bar']);
});

test('decompose maps each stamped part to changeable dimensions (derived, not invented)', () => {
  const d = decompose({ src: blockHtml });
  assert.equal(d.hasStamps, true);
  const panel = d.parts.find((p) => p.role === 'panel');
  assert.ok(panel.derived, 'a known role is marked derived:true');
  assert.ok(panel.dimensions.some((x) => x.id === 'surface-depth'));
  const bar = d.parts.find((p) => p.role === 'bar');
  assert.ok(bar.dimensions.some((x) => x.id === 'grow-motion' && x.channel === 'motion'));
});

test('an UNKNOWN role decomposes to generic dimensions, honestly flagged derived:false (never a fake part)', () => {
  const d = decompose({ oid: 'x', parts: ['mystery-widget'] });
  const p = d.parts[0];
  assert.equal(p.derived, false);
  assert.deepEqual(p.dimensions.map((x) => x.id), ['layout', 'type', 'colour', 'motion']);
});

// F-9: granular one-property AND bold whole-section are both first-class.
test('scopeChoices offers whole / per-section / per-property granularities', () => {
  const d = decompose({ src: blockHtml });
  const c = scopeChoices(d);
  assert.ok(c.some((x) => x.granularity === 'whole'));
  assert.ok(c.some((x) => x.id === 'section:bar'));
  assert.ok(c.some((x) => x.id === 'property:bar.grow-motion' && x.opensAxes.length === 1));
  const whole = c.find((x) => x.granularity === 'whole');
  assert.ok(whole.opensAxes.length > 5, 'the whole-component scope opens every part.dimension');
});

test('scopeQuestion is an AskUserQuestion-shaped, on-screen scope prompt (never a silent pick)', () => {
  const q = scopeQuestion(decompose({ src: blockHtml }));
  assert.match(q.question, /decomposes into 5 part\(s\)/);
  assert.ok(q.options.length >= 2);
  assert.ok(q.options.every((o) => o.label && o.description));
});

// F-15 must-fail: no explicit scope → BLOCK (scope may never be assumed).
test('requireExplicitScope BLOCKS an assumed scope and PASSES an explicit one', () => {
  assert.equal(requireExplicitScope(null).verdict, 'block');
  assert.equal(requireExplicitScope('   ').verdict, 'block');
  assert.match(requireExplicitScope(null).why, /F-15/);
  assert.equal(requireExplicitScope('section:bar').verdict, 'pass');
});

test('axesForScope turns a chosen scope into channel-tagged axes for composeRounds', () => {
  const d = decompose({ src: blockHtml });
  const axes = axesForScope(d, 'section:bar');
  assert.deepEqual(axes.map((a) => a.id).sort(), ['bar.bar-shape', 'bar.fill-style', 'bar.grow-motion']);
  assert.ok(axes.some((a) => a.id === 'bar.grow-motion' && a.channel === 'motion'));
  assert.throws(() => axesForScope(d, 'section:nope'), /unknown scope choice/);
});
