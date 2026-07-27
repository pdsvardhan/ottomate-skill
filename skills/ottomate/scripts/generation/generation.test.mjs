// Tests for the Phase-1 generation scaffolding: the anatomy data + the pick→ledger mapping.

import test from 'node:test';
import assert from 'node:assert/strict';
import { loadAnatomy, picksToLedger, describePicks } from './picks-to-ledger.mjs';

const A = loadAnatomy();

// ── component-anatomy.json is well-formed and internally consistent ────────────

test('every archetype has a valid tier, parts, required states, and sub-decisions', () => {
  const tiers = Object.keys(A.tiers);
  for (const [name, arche] of Object.entries(A.archetypes)) {
    assert.ok(tiers.includes(arche.tier), `${name}: tier "${arche.tier}" is defined`);
    assert.ok(Array.isArray(arche.parts) && arche.parts.length > 0, `${name}: has parts`);
    assert.ok(Array.isArray(arche.sub_decisions) && arche.sub_decisions.length >= 5, `${name}: >=5 sub-decisions`);
    assert.ok(Array.isArray(arche.required_states) && arche.required_states.length >= 3, `${name}: >=3 required states`);
  }
});

test('the required-state floor holds: every archetype includes the B2 "always" states its interactivity needs', () => {
  const always = Object.keys(A.state_matrix.always); // rest, hover, focus-visible, active, disabled
  for (const [name, arche] of Object.entries(A.archetypes)) {
    // focus-visible is non-negotiable for anything interactive (B2 §3.1, C1 §3.11)
    assert.ok(arche.required_states.includes('focus-visible'), `${name}: must define focus-visible`);
    assert.ok(arche.required_states.includes('rest') && arche.required_states.includes('hover'), `${name}: rest+hover`);
    // every listed state is a known matrix state (no typos, states are not variants — C1 §3.4)
    const known = new Set([...always, ...Object.keys(A.state_matrix.conditional)]);
    for (const s of arche.required_states) assert.ok(known.has(s), `${name}: state "${s}" is in the matrix`);
  }
});

test('every sub-decision names a real part of its archetype (C1 §3.5 anatomy-before-API)', () => {
  for (const [name, arche] of Object.entries(A.archetypes)) {
    const parts = new Set(arche.parts);
    const ids = new Set();
    for (const sd of arche.sub_decisions) {
      assert.ok(parts.has(sd.part), `${name}.${sd.id}: part "${sd.part}" exists in the parts list`);
      assert.ok(sd.kind && sd.hint, `${name}.${sd.id}: has a kind + hint`);
      assert.ok(!ids.has(sd.id), `${name}: sub-decision id "${sd.id}" is unique`);
      ids.add(sd.id);
    }
  }
});

test('every tier declares a render_surface (element 2)', () => {
  for (const [tier, def] of Object.entries(A.tiers)) {
    assert.ok(def.render_surface && def.render_surface.length > 20, `${tier}: has a render_surface`);
  }
});

// ── picks → ledger ─────────────────────────────────────────────────────────────

const round = {
  projectSlug: 'zzz-demo',
  targetId: 'oid-card-1',
  archetype: 'media-card',
  round: 1,
  variantsShown: {
    A: { 'corner-radius': 0, 'hover-motion': 'lift', 'meta-density': 2 },
    B: { 'corner-radius': 20, 'hover-motion': 'scale', 'meta-density': 1 },
    C: { 'corner-radius': 8, 'hover-motion': 'none', 'meta-density': 0 },
  },
  picks: {
    'corner-radius': { value: 20, from: 'B', rationale: 'soft corners read friendlier for posters' },
    'hover-motion': { value: 'lift', from: 'A' },
    'meta-density': { value: 0, from: 'C' },
  },
  // T5: the slot letter is presentation and is re-shuffled every round, so each slot must name the
  // bundle it showed. Without this the round is refused — see variant-slots.test.mjs.
  variantLabels: { A: 'crisp', B: 'plush', C: 'quiet' },
  profile: 'P2',
  sessionId: 'sess-test',
};

test('a mixed pick produces one payload per sub-decision, each recording its source and the passed-over values', () => {
  const rows = picksToLedger(round, A);
  assert.equal(rows.length, 3, 'one row per picked sub-decision');

  const radius = rows.find((r) => r.axis === 'media-card.corner-radius');
  assert.equal(radius.chosen_value, '20');
  assert.deepEqual(radius.mixed_from, { variant: 'B', label: 'plush' },
    'T5: the label travels with the slot, so this row still resolves after the next round reshuffles');
  assert.equal(radius.target_kind, 'component');
  assert.equal(radius.rung, 2, 'composite → rung 2 (a composite COMPONENT decides at the component rung; rung 3 is a cluster — T7)');
  assert.equal(radius.profile_at_decision, 'P2');
  assert.equal(radius.status, 'proposed', 'a pick is not locked until confirmed (G3 rule 12)');
  assert.equal(radius.confirmed, false);
  // rejected = the OTHER offered radii (0 from A, 8 from C), not the chosen 20
  const rejVals = radius.rejected.map((x) => x.value).sort();
  assert.deepEqual(rejVals, [0, 8]);
  assert.ok(!radius.rejected.some((x) => x.value === 20), 'the chosen value is not in rejected[]');
});

test('describePicks flags a cross-variant mix, naming the bundles by LABEL not by slot letter', () => {
  const rows = picksToLedger(round, A);
  // T5: "a MIX across variants A, B, C" was true only until the next round reshuffled the letters.
  assert.match(describePicks(rows), /MIX across variants crisp, plush, quiet/);
});

test('a pick that is not in the anatomy is rejected — picks must trace to real sub-decisions', () => {
  assert.throws(() => picksToLedger({ ...round, picks: { 'made-up-axis': { value: 1, from: 'A' } } }, A), /not a sub-decision/);
});

test('an unknown archetype is rejected', () => {
  assert.throws(() => picksToLedger({ ...round, archetype: 'nope' }, A), /unknown archetype/);
});
