// U3 + U4 — intake and worklist. The load-bearing case is the REFUSAL.
// run: node --test design-intent.test.mjs

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { classifyIntent, resolveTarget, inferScope, isDesignIntent, buildWorklist, UI_ITEM_TYPES } from './design-intent.mjs';

const CANDS = [
  { target_id: 'screenroom.poster-card', name: 'Poster card', kind: 'component' },
  { target_id: 'screenroom.own-chip', name: 'Ownership chip', kind: 'component' },
  { target_id: 'screenroom.find-page', name: 'Find results page', kind: 'page' },
];

test('MUST ASK — "new button here" with no context does not guess a target', () => {
  const r = classifyIntent('new button here', { candidates: CANDS });
  assert.equal(r.action, 'ask');
  assert.equal(r.target, null);
  assert.match(r.ask, /will not guess/);
});

test('"new button here" resolves when the owner is demonstrably looking at something', () => {
  const r = classifyIntent('new button here', { candidates: CANDS, focusTargetId: 'screenroom.poster-card' });
  assert.equal(r.action, 'run');
  assert.equal(r.target.target_id, 'screenroom.poster-card');
  assert.equal(r.confidence, 'context');
});

test('a NON-deictic sentence does not silently inherit the open page', () => {
  // "redesign the sidebar" while the poster card is open must not become the poster card.
  const r = classifyIntent('redesign the sidebar', { candidates: CANDS, focusTargetId: 'screenroom.poster-card' });
  assert.equal(r.action, 'ask');
  assert.equal(r.target, null);
});

test('naming the thing resolves it', () => {
  const r = classifyIntent('redesign the poster card', { candidates: CANDS });
  assert.equal(r.action, 'run');
  assert.equal(r.target.target_id, 'screenroom.poster-card');
  assert.equal(r.scope, 'component');
});

test('MUST ASK — two candidates within the margin are a question, not a coin flip', () => {
  const cands = [{ target_id: 'a.card', name: 'Media card' }, { target_id: 'b.card', name: 'Media card' }];
  const r = resolveTarget('redesign the media card', { candidates: cands });
  assert.equal(r.target, null);
  assert.equal(r.confidence, 'ambiguous');
  assert.equal(r.tied.length, 2);
});

test('"visual overhaul" is site scope and needs no component target', () => {
  const r = classifyIntent('visual overhaul', { candidates: CANDS, projectSlug: 'screenroom' });
  assert.equal(r.scope, 'site');
  assert.equal(r.action, 'run');
  assert.equal(r.target.kind, 'site');
});

test('scope is read from phrasing', () => {
  assert.equal(inferScope('rebuild the whole app'), 'site');
  assert.equal(inferScope('this page feels crowded'), 'page');
  assert.equal(inferScope('these cards are too loud'), 'cluster');
  assert.equal(inferScope('the badge is ugly'), 'component');
});

test('a build request with no UI noun is not a design request', () => {
  assert.equal(isDesignIntent('add a caching layer to the api').is_design, false);
  const r = classifyIntent('add a caching layer to the api', { candidates: CANDS });
  assert.equal(r.action, 'ask');
  assert.match(r.ask, /does not read as a design request/);
});

test('"new button here" IS design-bearing — a new UI element always carries design decisions', () => {
  const d = isDesignIntent('new button here');
  assert.equal(d.is_design, true);
  assert.match(d.why, /UI element/);
});

// ── U4 worklist ─────────────────────────────────────────────────────────────────────────────────
const items = [
  { id: 1, item_type: 'component_modification', target_kind: 'component', target_id: 'a.card', title: 'card too loud', status: 'pending-review', updated_at: 300 },
  { id: 2, item_type: 'component_modification', target_kind: 'component', target_id: 'b.chip', title: 'chip colour', status: 'pending-review', updated_at: 400 },
  { id: 3, item_type: 'risk_addition', target_kind: 'component', target_id: 'c.x', title: 'not ui', status: 'pending-review', updated_at: 999 },
  { id: 4, item_type: 'component_modification', target_kind: 'component', target_id: 'd.done', title: 'shipped', status: 'integrated', updated_at: 999 },
  { id: 5, item_type: 'page_modification', target_kind: 'feature', target_id: 'e.f', title: 'wrong kind', status: 'pending-review', updated_at: 999 },
];

test('only UI-bearing, live, component/page items reach the worklist', () => {
  const w = buildWorklist(items, [], []);
  assert.deepEqual(w.map((x) => x.target_id).sort(), ['a.card', 'b.chip']);
});

test('the UI item-type mapping is written down, not implied', () => {
  assert.ok(UI_ITEM_TYPES.has('component_modification'));
  assert.ok(!UI_ITEM_TYPES.has('risk_addition'));
});

test('unpicked component slots join the worklist; picked and skipped ones do not', () => {
  const comps = [
    { id: 9, name: 'search-bar', picked: false, skip_reason: null, updated_at: 100 },
    { id: 10, name: 'footer', picked: true, skip_reason: null },
    { id: 11, name: 'ads', picked: false, skip_reason: 'not doing ads' },
  ];
  const w = buildWorklist([], comps, []);
  assert.deepEqual(w.map((x) => x.target_id), ['search-bar']);
  assert.equal(w[0].source, 'unpicked component slot');
});

test('a target with LOCKED decisions ranks below one with none', () => {
  const decisions = [{ target_id: 'b.chip', status: 'locked' }];
  const w = buildWorklist(items, [], decisions);
  assert.equal(w[0].target_id, 'a.card', 'the settled target should sink even though it is newer');
  assert.equal(w.at(-1).target_id, 'b.chip');
  assert.equal(w.at(-1).settled, true);
});

test('among unsettled targets, most recently raised comes first', () => {
  const w = buildWorklist(items, [], []);
  assert.equal(w[0].target_id, 'b.chip');
});

test('an empty project produces an empty worklist, not a crash', () => {
  assert.deepEqual(buildWorklist(), []);
});
