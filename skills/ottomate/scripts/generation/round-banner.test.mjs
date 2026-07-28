// Tests for round-banner.mjs (WS1.2, F-17). run: node --test round-banner.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildBanner, assertAccounted, bannerFromComposition } from './round-banner.mjs';

test('the banner states what it decides, that everything else is held, loudly', () => {
  const b = buildBanner({
    decided: [{ id: 'panel-depth', hint: 'flat vs raised' }, { id: 'panel-radius' }],
    held: [{ id: 'section-layout' }],
    variantCount: 3,
  });
  assert.match(b.text, /This round decides: panel-depth \(flat vs raised\), panel-radius\./);
  assert.match(b.text, /The 3 versions differ ONLY in that/);
  assert.match(b.text, /Held: section-layout\./);
  assert.equal(b.assentRequired, false, 'no deferral → no assent needed');
});

test('a deferred axis is NAMED and sets assentRequired (no silent round-2)', () => {
  const b = buildBanner({
    decided: [{ id: 'panel-depth' }],
    deferred: [{ id: 'motion', hint: 'transitions', toRound: 2 }],
    variantCount: 2,
  });
  assert.match(b.text, /Deferred to a later round \(NOT decided now\): motion \(transitions\)/);
  assert.match(b.text, /confirm you're OK deferring/);
  assert.equal(b.assentRequired, true);
});

test('the HTML render carries the decided + deferred chips and an assent flag', () => {
  const b = buildBanner({ decided: [{ id: 'panel-depth' }], deferred: [{ id: 'motion' }], variantCount: 2 });
  assert.match(b.html, /class="round-banner"/);
  assert.match(b.html, /rb-decide">panel-depth/);
  assert.match(b.html, /rb-assent">needs your OK to defer/);
});

test('a round with nothing decided, or <2 versions, is refused', () => {
  assert.throws(() => buildBanner({ decided: [], variantCount: 3 }), /nothing decided/);
  assert.throws(() => buildBanner({ decided: [{ id: 'x' }], variantCount: 1 }), /at least 2 versions/);
});

// THE MUST-FAIL: an axis that is varied/dropped without being decided, held, or deferred = the F-17 gap.
test('assertAccounted FLAGS a silent gap (an unaccounted contested axis)', () => {
  const contested = [{ id: 'panel-depth' }, { id: 'panel-radius' }, { id: 'motion' }];
  const r = assertAccounted(contested, { decided: [{ id: 'panel-depth' }], deferred: [{ id: 'panel-radius' }] });
  assert.equal(r.ok, false);
  assert.deepEqual(r.unaccounted, ['motion']);
  assert.match(r.why, /SILENT GAP/);
});

test('assertAccounted passes when every axis is decided/held/deferred, and flags double-counting', () => {
  const contested = [{ id: 'a' }, { id: 'b' }, { id: 'c' }];
  assert.equal(assertAccounted(contested, { decided: [{ id: 'a' }], held: [{ id: 'b' }], deferred: [{ id: 'c' }] }).ok, true);
  const dbl = assertAccounted(contested, { decided: [{ id: 'a' }, { id: 'b' }], held: [{ id: 'b' }], deferred: [{ id: 'c' }] });
  assert.equal(dbl.ok, false);
  assert.deepEqual(dbl.doubleCounted, ['b']);
});

test('bannerFromComposition derives decided(this round)+deferred(other rounds) and checks accounting', () => {
  const composition = {
    rounds: [
      { index: 1, channels: ['weight'], axes: [{ id: 'panel-depth', hint: 'depth' }, { id: 'panel-radius' }] },
      { index: 2, channels: ['motion'], axes: [{ id: 'motion' }] },
    ],
  };
  const { banner, accounting } = bannerFromComposition({ composition, currentRound: 1, frozen: [{ id: 'section-layout' }], variantCount: 3 });
  assert.deepEqual(banner.decides.map((d) => d.id), ['panel-depth', 'panel-radius']);
  assert.deepEqual(banner.deferred.map((d) => d.id), ['motion']);       // round 2 named, not silent
  assert.deepEqual(banner.held.map((h) => h.id), ['section-layout']);
  assert.equal(banner.assentRequired, true);
  assert.equal(accounting.ok, true, accounting.why);
});
