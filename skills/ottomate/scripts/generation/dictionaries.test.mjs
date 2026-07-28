// Tests for dictionaries.mjs (Phase 2). run: node --test dictionaries.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  loadMotionPatterns, validateMotionDict, motionPattern, motionByRole, motionByTrigger,
  reducedMotionSwap, motionAffinity, recommendMotion,
  loadChartDict, validateChartDict, chartsForRelationship, bestChart, chartAvoids, DATA_RELATIONSHIPS,
} from './dictionaries.mjs';

test('the motion dictionary has the 20 starter patterns and VALIDATES', () => {
  const dict = loadMotionPatterns();
  assert.equal(dict.patterns.length, 20);
  const v = validateMotionDict(dict);
  assert.equal(v.ok, true, v.errors.join('\n'));
});

// THE NON-NEGOTIABLE must-fail: a pattern with no reduced-motion swap fails validation.
test('a pattern MISSING its reduced-motion swap FAILS validation (rich-by-default is non-negotiable)', () => {
  const bad = { patterns: [{ id: 'x', name: 'X', role: 'expressive', trigger: 'load', tokens: { duration: '--motion-duration-base' }, effect: 'e' }] };
  const v = validateMotionDict(bad);
  assert.equal(v.ok, false);
  assert.ok(v.errors.some((e) => /reduced-motion swap/.test(e)));
});

test('a RAW (non-semantic) motion token FAILS validation', () => {
  const bad = { patterns: [{ id: 'x', name: 'X', role: 'productive', trigger: 'load', tokens: { duration: '300ms' }, effect: 'e', reducedMotion: 'none' }] };
  assert.equal(validateMotionDict(bad).ok, false);
});

test('an avoid/goodWith referencing an unknown pattern id FAILS validation', () => {
  const bad = { patterns: [{ id: 'x', name: 'X', role: 'productive', trigger: 'load', tokens: {}, effect: 'e', reducedMotion: 'none', avoid: ['NoSuchPattern1'] }] };
  assert.equal(validateMotionDict(bad).ok, false);
});

test('query by role / trigger / id', () => {
  assert.ok(motionByRole('expressive').some((p) => p.id === 'count-up'));
  assert.ok(motionByTrigger('hover').some((p) => p.id === '3d-tilt'));
  assert.equal(motionPattern('scroll-reveal').role, 'expressive');
  assert.equal(motionPattern('nope'), null);
});

test('every pattern exposes a reduced-motion swap (spot-check the API)', () => {
  assert.match(reducedMotionSwap('count-up'), /final value/i);
  assert.match(reducedMotionSwap('3d-tilt'), /flat/i);
});

test('motionAffinity gives good-with/avoid; unknown id throws', () => {
  const a = motionAffinity('success-check');
  assert.ok(a.avoid.includes('error-shake'));
  assert.throws(() => motionAffinity('nope'), /unknown motion pattern/);
});

test('recommendMotion surfaces expressive first for this owner, and can go productive-only', () => {
  const expr = recommendMotion({ triggers: ['load'], appetite: 'expressive' });
  assert.ok(expr.length > 0);
  assert.equal(expr[0].role, 'expressive', 'expressive appetite ranks expressive patterns first');
  const prod = recommendMotion({ triggers: ['load'], appetite: 'productive' });
  assert.ok(prod.every((p) => p.role === 'productive'), 'productive-only filters out expressive');
});

// ── chart-by-data (P2.2) ──
test('the chart dictionary has all 9 FT data-relationships and VALIDATES', () => {
  const dict = loadChartDict();
  assert.equal(Object.keys(dict.relationships).length, 9);
  for (const r of DATA_RELATIONSHIPS) assert.ok(dict.relationships[r], `missing ${r}`);
  const v = validateChartDict(dict);
  assert.equal(v.ok, true, v.errors.join('\n'));
});

test('a chart with an unknown encoding channel FAILS validation (must-fail)', () => {
  const bad = { encoding_accuracy: ['position'], relationships: Object.fromEntries(DATA_RELATIONSHIPS.map((r) => [r, { charts: [{ id: 'c', when: 'x', encoding: 'position' }] }])) };
  bad.relationships['magnitude'].charts[0].encoding = 'telepathy';
  assert.equal(validateChartDict(bad).ok, false);
});

test('a missing data-relationship FAILS validation', () => {
  const bad = { encoding_accuracy: ['position'], relationships: { magnitude: { charts: [{ id: 'bar', when: 'x', encoding: 'position' }] } } };
  const v = validateChartDict(bad);
  assert.equal(v.ok, false);
  assert.ok(v.errors.some((e) => /missing data-relationship/.test(e)));
});

test('chartsForRelationship ranks by encoding accuracy; part-to-whole prefers length over angle/area', () => {
  const charts = chartsForRelationship('part-to-whole');
  const ids = charts.map((c) => c.id);
  // stacked-bar/ordered-bar (length) must outrank pie/donut (angle) and treemap (area) — matches cointrail's bars
  assert.ok(ids.indexOf('stacked-bar') < ids.indexOf('pie'), 'length beats angle');
  assert.ok(ids.indexOf('stacked-bar') < ids.indexOf('treemap'), 'length beats area');
  assert.equal(bestChart('change-over-time').id, 'line', 'a trend defaults to a line (position)');
});

test('chartsForRelationship rejects an unknown relationship; avoids are surfaced', () => {
  assert.throws(() => chartsForRelationship('vibes'), /unknown data relationship/);
  const av = chartAvoids('part-to-whole');
  assert.ok(av.global.length > 0 && av.perChart.some((x) => x.id === 'pie' && /slices/.test(x.avoid)));
});
