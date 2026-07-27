// Tests for publish-round.mjs — the pure half (manifest → proposed ledger payloads).
// The live half (file copy + API POSTs) is proven by the real round, not by a mock.
//
// run: node --test publish-round.test.mjs

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildRoundPayloads, roundPaths, safeSegment } from './publish-round.mjs';

const manifest = {
  project_slug: 'demo',
  target_id: 'demo.media-card',
  archetype: 'media-card',
  round: 1,
  variants_shown: {
    v1: { 'corner-radius': '4px', elevation: 'flat-hairline', 'hover-motion': 'lift-2px' },
    v2: { 'corner-radius': '14px', elevation: 'dual-layer-tinted', 'hover-motion': 'scale-1.02' },
    v3: { 'corner-radius': '0', elevation: 'flat-hairline', 'hover-motion': 'none' },
  },
};

test('one payload per offered sub-decision, in anatomy order', () => {
  const out = buildRoundPayloads(manifest);
  assert.equal(out.length, 3);
  // component-anatomy declares corner-radius, elevation, ... , hover-motion in that order
  assert.deepEqual(out.map((p) => p.axis), [
    'media-card.corner-radius',
    'media-card.elevation',
    'media-card.hover-motion',
  ]);
});

test('variants_shown on a row is { slot: value } across every slot that offered one', () => {
  const [radius] = buildRoundPayloads(manifest);
  assert.deepEqual(radius.variants_shown, { v1: '4px', v2: '14px', v3: '0' });
});

test('a slot that omits an axis is simply absent from that row', () => {
  const m = { ...manifest, variants_shown: { ...manifest.variants_shown, v3: { 'corner-radius': '0' } } };
  const out = buildRoundPayloads(m);
  const hover = out.find((p) => p.axis === 'media-card.hover-motion');
  assert.deepEqual(hover.variants_shown, { v1: 'lift-2px', v2: 'scale-1.02' });
});

test('rows are proposed and unconfirmed — a published round is not a decision', () => {
  for (const p of buildRoundPayloads(manifest)) {
    assert.equal(p.status, 'proposed');
    assert.equal(p.confirmed, false);
    assert.equal(p.chosen_value, undefined);
  }
});

test('rung defaults from the archetype tier (media-card is composite → 3)', () => {
  assert.equal(buildRoundPayloads(manifest)[0].rung, 3);
  assert.equal(buildRoundPayloads({ ...manifest, rung: 5 })[0].rung, 5);
});

test('every row carries the same preview_url, and it matches roundPaths', () => {
  const out = buildRoundPayloads(manifest);
  const { url } = roundPaths(manifest);
  assert.equal(url, '/api/previews/design-rounds/demo/demo.media-card/r1/index.html');
  assert.ok(out.every((p) => p.preview_url === url));
});

test('an axis that is not in the anatomy is refused (doctrine rule 40)', () => {
  const m = { ...manifest, variants_shown: { v1: { 'vibe-level': 'high' }, v2: { 'vibe-level': 'low' } } };
  assert.throws(() => buildRoundPayloads(m), /not a sub-decision of media-card/);
});

test('an unknown archetype is refused', () => {
  assert.throws(() => buildRoundPayloads({ ...manifest, archetype: 'nope' }), /unknown archetype/);
});

test('a round with fewer than 2 variants is refused (G1 §4.4: never 1)', () => {
  const m = { ...manifest, variants_shown: { v1: { 'corner-radius': '4px' } } };
  assert.throws(() => buildRoundPayloads(m), /at least 2 variants/);
});

test('safeSegment keeps the path under the previews root', () => {
  assert.equal(safeSegment('../../etc/passwd'), 'etc-passwd');
  assert.equal(safeSegment('screenroom.media-card'), 'screenroom.media-card');
  assert.equal(safeSegment('a b/c'), 'a-b-c');
});
