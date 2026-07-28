import { test } from 'node:test';
import assert from 'node:assert/strict';
import { classifyFile, inferTier, layersForTier } from './change-tier.mjs';

test('classifyFile: page/route → T3, component → T2, style → T1, backend/copy → T0', () => {
  assert.equal(classifyFile('app/routes/reports/new-page/page.tsx'), 'T3');
  assert.equal(classifyFile('app/dashboard/layout.tsx'), 'T3');
  assert.equal(classifyFile('pages/_app.tsx'), 'T3');
  assert.equal(classifyFile('src/routes/reports/+page.svelte'), 'T3');
  assert.equal(classifyFile('public/index.html'), 'T3');
  assert.equal(classifyFile('app/components/PosterCard.tsx'), 'T2');
  assert.equal(classifyFile('src/widgets/Chart.vue'), 'T2');
  assert.equal(classifyFile('app/globals.css'), 'T1');
  assert.equal(classifyFile('styles/tokens.json'), 'T1');
  assert.equal(classifyFile('src/api/metrics/handler.ts'), 'T0');
  assert.equal(classifyFile('content/about.md'), 'T0');
  assert.equal(classifyFile('drizzle/0008_x.sql'), 'T0');
});

test('must-pass: a copy-only diff is T0 with only implicit + system-state', () => {
  const r = inferTier(['content/about.md', 'src/api/metrics/handler.ts']);
  assert.equal(r.tier, 'T0');
  assert.equal(r.unknown, false);
  assert.deepEqual(layersForTier(r.tier), { deterministic: ['implicit', 'system-state'], judge: 'none' });
});

test('must-pass: a new page file drives the whole set to T3 (max-wins) with the full judge', () => {
  const r = inferTier(['app/globals.css', 'app/routes/new-page/page.tsx']);
  assert.equal(r.tier, 'T3');
  assert.match(r.reason, /max-wins/);
  assert.equal(layersForTier('T3').judge, 'full');
});

test('a component change is T2 with a quick judge glance', () => {
  assert.equal(inferTier(['app/components/PosterCard.tsx']).tier, 'T2');
  assert.equal(layersForTier('T2').judge, 'glance');
});

test('must-fail: an empty/unknown diff must NOT default to a clean T0 — it fails closed to T3', () => {
  const r = inferTier([]);
  assert.equal(r.tier, 'T3');
  assert.equal(r.unknown, true);
  assert.match(r.reason, /fail-closed/);
});

test('owner override wins over inference', () => {
  const r = inferTier(['app/globals.css'], { override: 'T3' });
  assert.equal(r.tier, 'T3');
  assert.equal(r.override, true);
  assert.match(r.reason, /override/);
});

test('layersForTier rejects an unknown tier', () => {
  assert.throws(() => layersForTier('T9'), /unknown tier/);
});
