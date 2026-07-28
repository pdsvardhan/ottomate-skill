// Tests for Phase-4 routing + gates.

import test from 'node:test';
import assert from 'node:assert/strict';
import { routeRungs, routeEntry, buildRoundInput, stage3DesignGate, DEFERRAL } from './method-routing.mjs';
import { loadAnatomy } from './picks-to-ledger.mjs';
import { loadTaste } from './taste-packet.mjs';

const A = loadAnatomy();

// ── scope × entry routing ──────────────────────────────────────────────────────

test('a component scope runs B (+micro), NOT the full vibe ladder', () => {
  assert.deepEqual(routeRungs('component'), ['component', 'micro']);
  assert.ok(!routeRungs('component').includes('direction'), 'a single button never runs directions');
});

test('a site scope runs the full A→A½→B→C ladder', () => {
  assert.deepEqual(routeRungs('site'), ['direction', 'mechanic', 'component', 'cluster', 'page']);
});

test('page and cluster scopes run their own rung plus the component rung', () => {
  assert.deepEqual(routeRungs('page'), ['page', 'component']);
  assert.deepEqual(routeRungs('cluster'), ['component', 'cluster']);
  assert.throws(() => routeRungs('nope'), /unknown scope/);
});

test('ui-mode:none is the default and runs NO design; stage-4-item does not re-interview', () => {
  const none = routeEntry('ui-mode:none');
  assert.equal(none.runsDesign, false);
  assert.equal(none.buildNeutral, true);
  const item = routeEntry('stage-4-item');
  assert.equal(item.reInterview, false, 'a stage-4 item inherits locked context, never re-interviews');
  assert.equal(routeEntry('deferred-overhaul').contextGate, 'run-now');
  assert.throws(() => routeEntry('bogus'), /unknown entry/);
});

test('deferral guidance keeps the load-bearing decisions out of "cheap to defer"', () => {
  assert.ok(DEFERRAL.expensive.some((x) => /foundation tokens/.test(x)));
  assert.ok(DEFERRAL.expensive.some((x) => /core mechanic/.test(x)));
  assert.ok(!DEFERRAL.cheap.some((x) => /token|mechanic/.test(x)));
});

// ── fresh-context round input ───────────────────────────────────────────────────

test('buildRoundInput excludes LOCKED axes from the contested set and carries rejected values', () => {
  const decisions = [
    { axis: 'media-card.corner-radius', status: 'locked', chosen_value: '14', rejected: [{ value: 0, grade: 'rejected_with_reason', why_rejected: 'too sharp' }] },
    { axis: 'media-card.accent-usage', status: 'rejected', chosen_value: 'badge', rejected: [{ value: 'frame', grade: 'rejected_with_reason', why_rejected: 'x' }] },
  ];
  const inp = buildRoundInput({ anatomy: A, archetype: 'media-card', profile: 'P2', direction: 'editorial', decisions });
  const contestedIds = inp.contested.map((s) => s.id);
  assert.ok(!contestedIds.includes('corner-radius'), 'a locked (frozen) axis is NOT re-offered');
  assert.ok(contestedIds.includes('hover-motion'), 'an untouched axis stays contested');
  assert.equal(inp.frozen['media-card.corner-radius'], '14');
  assert.ok(inp.rejectedByAxis['media-card.corner-radius'].some((r) => r.value === 0));
  assert.equal(inp.tier, 'composite');
  assert.ok(inp.renderSurface, 'the render surface for the tier is included');
});

test('with no decisions (gen-1) every sub-decision is contested and nothing is frozen', () => {
  const inp = buildRoundInput({ anatomy: A, archetype: 'button', decisions: [] });
  assert.equal(inp.contested.length, A.archetypes.button.sub_decisions.length);
  assert.deepEqual(inp.frozen, {});
});

// WS0.3: the taste profile rides in the packet when supplied, and is null otherwise (no silent default).
test('buildRoundInput injects the taste block when a profile is supplied', () => {
  const withTaste = buildRoundInput({ anatomy: A, archetype: 'button', decisions: [], taste: loadTaste() });
  assert.ok(withTaste.taste, 'the packet carries a taste block');
  assert.equal(withTaste.taste.motionBudget, 'expressive');
  assert.equal(withTaste.taste.antiSlopAdvisory, true, 'anti-slop is advisory for this owner');
  assert.ok(withTaste.taste.wantedTells.includes('glow'));

  const without = buildRoundInput({ anatomy: A, archetype: 'button', decisions: [] });
  assert.equal(without.taste, null, 'no taste supplied → no taste block (never invented)');
});

// ── Stage-3 design-lock gate ─────────────────────────────────────────────────────

const built = [{ target_id: 'oid-card', user_facing: true }, { target_id: 'oid-internal', user_facing: false }];

test('an un-designed user-facing target ADVISES at P1/P2 and BLOCKS at P3', () => {
  const locked = []; // nothing locked
  assert.equal(stage3DesignGate({ profile: 'P1', targetsBuilt: built, lockedDecisions: locked }).verdict, 'advise');
  assert.equal(stage3DesignGate({ profile: 'P2', targetsBuilt: built, lockedDecisions: locked }).verdict, 'advise');
  const p3 = stage3DesignGate({ profile: 'P3', targetsBuilt: built, lockedDecisions: locked });
  assert.equal(p3.verdict, 'block');
  assert.deepEqual(p3.missing, ['oid-card'], 'only the user-facing target is missing; the internal one is exempt');
});

test('a fully-designed target passes at every profile', () => {
  const locked = [{ target_id: 'oid-card', status: 'locked' }];
  for (const p of ['P1', 'P2', 'P3']) {
    assert.equal(stage3DesignGate({ profile: p, targetsBuilt: built, lockedDecisions: locked }).verdict, 'pass');
  }
});
