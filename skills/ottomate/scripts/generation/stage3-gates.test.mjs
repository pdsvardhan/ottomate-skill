// C1 · C2 · C7 — the pre-round gates and the source policy.
// run: node --test stage3-gates.test.mjs

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { contextGate, coreMechanicGate, preRoundGates, formatGates, CONTEXT_KEYS, primaryDecisionGate, pressureTest } from './pre-round-gates.mjs';
import { catalogCandidates, checkSourcePolicy, formatSource } from './catalog-source.mjs';

const FULL = { context: { audience: 'solo owner', use_cases: ['browse', 'request'], brand_tone: 'calm, dense', primary_screen: '/find' } };

// ── C1 context gate ─────────────────────────────────────────────────────────────────────────────
test('a complete context passes', () => {
  assert.equal(contextGate({ ledger: FULL }).verdict, 'pass');
});

test('MUST STOP — a missing answer blocks at EVERY profile, P1 included (N1, owner ruling 2026-07-27)', () => {
  const partial = { context: { ...FULL.context, primary_screen: '' } };
  assert.equal(contextGate({ ledger: partial, profile: 'P3' }).verdict, 'block');
  // Was 'advise' at P1, on the reasoning that the owner alone pays for their own wrong round. But P1
  // is the profile actually in use, so the locked spec's "do not proceed to visuals without it" was
  // soft exactly where it mattered. The cost is bounded by the answers persisting — see below.
  assert.equal(contextGate({ ledger: partial, profile: 'P1' }).verdict, 'block');
  assert.deepEqual(contextGate({ ledger: partial }).missing, ['primary_screen']);
});

test('N1 — ANSWER ONCE PER PROJECT: stored context passes at every profile, with no re-interview', () => {
  for (const profile of ['P1', 'P2', 'P3']) {
    assert.equal(contextGate({ ledger: FULL, profile }).verdict, 'pass', profile);
  }
});

test('N1 — `recontext` deliberately re-opens the questions even when context IS stored', () => {
  const g = contextGate({ ledger: FULL, profile: 'P1', recontext: true });
  assert.equal(g.verdict, 'block');
  assert.deepEqual(g.missing, CONTEXT_KEYS, 'all four are re-asked, not just one');
  assert.match(g.why, /answers have changed/);
});

test('N1 — `ui-mode:none` still skips; deferring UI is the default and blocking it would be wrong', () => {
  assert.equal(contextGate({ ledger: {}, entry: 'ui-mode:none', profile: 'P1' }).verdict, 'skip');
  assert.equal(contextGate({ ledger: {}, entry: 'ui-mode:none', recontext: true }).verdict, 'skip',
    'even a recontext request does not manufacture a round that is not happening');
});

test('MUST FAIL — three of four answers is not "recorded"; a partial context never passes', () => {
  for (const k of CONTEXT_KEYS) {
    const partial = { context: { ...FULL.context, [k]: '' } };
    assert.equal(contextGate({ ledger: partial, profile: 'P1' }).verdict, 'block', `missing ${k}`);
  }
});

test('an empty ledger names every missing answer, not just the first', () => {
  assert.deepEqual(contextGate({ ledger: {} }).missing, CONTEXT_KEYS);
});

test('ui-mode:none SKIPS the gate — deferring UI is the owner\'s default, not a failure', () => {
  const g = contextGate({ ledger: {}, entry: 'ui-mode:none', profile: 'P3' });
  assert.equal(g.verdict, 'skip');
  assert.deepEqual(g.missing, []);
});

test('an empty array or blank string does not count as an answer', () => {
  assert.ok(contextGate({ ledger: { context: { ...FULL.context, use_cases: [] } } }).missing.includes('use_cases'));
  assert.ok(contextGate({ ledger: { context: { ...FULL.context, audience: '   ' } } }).missing.includes('audience'));
});

// ── C7 core mechanic ────────────────────────────────────────────────────────────────────────────
test('component and cluster scope do not depend on the core mechanic', () => {
  assert.equal(coreMechanicGate({ scope: 'component' }).verdict, 'pass');
  assert.equal(coreMechanicGate({ scope: 'cluster' }).verdict, 'pass');
});

test('MUST STOP — page or site scope with no locked mechanic is blocked', () => {
  assert.equal(coreMechanicGate({ scope: 'page', decisions: [] }).verdict, 'block');
  assert.equal(coreMechanicGate({ scope: 'site', decisions: [{ rung: 2, status: 'locked', axis: 'x' }] }).verdict,
    'block', 'a locked COMPONENT decision is not a core mechanic');
});

test('a locked rung-1 decision releases page and site scope', () => {
  const d = [{ rung: 1, status: 'locked', axis: 'site.core-mechanic' }];
  assert.equal(coreMechanicGate({ scope: 'page', decisions: d }).verdict, 'pass');
});

test('a merely PROPOSED mechanic does not release it', () => {
  assert.equal(coreMechanicGate({ scope: 'site', decisions: [{ rung: 1, status: 'proposed', axis: 'x' }] }).verdict, 'block');
});

test('preRoundGates reports both, and blocks if either blocks', () => {
  const g = preRoundGates({ ledger: FULL, scope: 'page', decisions: [], profile: 'P1' });
  assert.equal(g.pass, false);
  assert.equal(g.blocked.length, 1);
  assert.match(formatGates(g), /ROUND BLOCKED/);
});

// ── C2 catalog + source policy ──────────────────────────────────────────────────────────────────
const CATALOG = [
  { id: 'mc-poster-glass', name: 'Poster glass', category: 'cards', library: 'ottomate', quality_grade: 'A', tags: ['dark', 'media'] },
  { id: 'mc-card-plain', name: 'Plain card', category: 'cards', library: 'shadcn', quality_grade: 'C', tags: [] },
  { id: 'mc-btn', name: 'Button', category: 'buttons-actions', library: 'ottomate', quality_grade: 'A', tags: [] },
];

test('candidates are drawn from the archetype AND tier categories, best first', () => {
  const c = catalogCandidates(CATALOG, { archetype: 'media-card', tier: 'composite' });
  assert.equal(c[0].id, 'mc-poster-glass', 'grade A should outrank grade C');
  assert.ok(!c.some((x) => x.id === 'mc-btn'), 'a button is not a media-card candidate');
});

test('a preferred library and matching tags raise the score', () => {
  const plain = catalogCandidates(CATALOG, { archetype: 'media-card', preferLibrary: 'shadcn' });
  assert.equal(plain[0].id, 'mc-card-plain', 'the preferred library should win despite the lower grade');
});

test('MUST FAIL — a variant with no declared source is refused', () => {
  const r = checkSourcePolicy([{ label: 'a' }], { candidates: CATALOG });
  assert.equal(r.pass, false);
  assert.match(r.problems.join(' '), /declares no source/);
});

test('MUST FAIL — bespoke with no stated reason is refused under library-first', () => {
  const r = checkSourcePolicy([{ label: 'a', source: { kind: 'bespoke' } }], { candidates: CATALOG });
  assert.equal(r.pass, false);
  assert.match(r.problems.join(' '), /no stated reason/);
});

test('bespoke WITH a real reason is first-class — library-first, not library-only', () => {
  const r = checkSourcePolicy([{ label: 'a', source: { kind: 'bespoke', why: 'nothing in cards/ handles a 2:3 poster plus an ownership chip' } }], { candidates: CATALOG });
  assert.equal(r.pass, true);
});

test('library-only refuses bespoke however good the reason', () => {
  const r = checkSourcePolicy([{ label: 'a', source: { kind: 'bespoke', why: 'a perfectly good and sufficiently long reason' } }], { policy: 'library-only' });
  assert.equal(r.pass, false);
});

test('a catalog source must name the component it came from', () => {
  assert.equal(checkSourcePolicy([{ label: 'a', source: { kind: 'catalog' } }]).pass, false);
  assert.equal(checkSourcePolicy([{ label: 'a', source: { kind: 'catalog', mc_id: 'mc-poster-glass' } }]).pass, true);
});

test('an all-bespoke set with candidates available PASSES but is called out', () => {
  const vs = [
    { label: 'a', source: { kind: 'bespoke', why: 'the catalog cards are all 16:9 and this needs 2:3' } },
    { label: 'b', source: { kind: 'bespoke', why: 'the catalog cards are all 16:9 and this needs 2:3' } },
  ];
  const r = checkSourcePolicy(vs, { candidates: CATALOG });
  assert.equal(r.pass, true, 'bespoke is a legitimate choice');
  assert.match(r.notes.join(' '), /ALL 2 variants are bespoke while 3 catalog candidate\(s\) existed/);
});

test('with no candidates at all, the output says bespoke was the only option', () => {
  assert.match(formatSource(checkSourcePolicy([], {}), []), /none for this archetype\/tier/);
});

// ── C6 — ask-on-primary + pressure-test-before-presenting (AC7), 2026-07-28 ───────────────────────

test('MUST FAIL — a primary (foundational) axis recorded with no owner choice is refused', () => {
  const g = primaryDecisionGate({ decision: { axis: 'corner-radius', scope_hint: 'foundational' }, ownerChoice: null });
  assert.equal(g.verdict, 'block');
  assert.match(g.why, /foundational|primary/);
});

test('MUST FAIL — an axis flagged for promotion is treated as primary too', () => {
  assert.equal(primaryDecisionGate({ decision: { axis: 'accent-usage', scope_hint: 'local' }, promoted: true }).verdict, 'block');
});

test('MUST PASS — a primary axis WITH an explicit owner choice is allowed', () => {
  const g = primaryDecisionGate({ decision: { axis: 'corner-radius', scope_hint: 'foundational' }, ownerChoice: '4px' });
  assert.equal(g.verdict, 'pass');
});

test('MUST PASS — a non-primary axis is unaffected (a round must not become a dialog)', () => {
  const g = primaryDecisionGate({ decision: { axis: 'meta-density', scope_hint: 'local' }, ownerChoice: null });
  assert.equal(g.verdict, 'pass');
  assert.equal(g.primary, false);
});

test('MUST PASS — pressure-test passes only when every check RAN and passed', () => {
  const p = pressureTest({ checks: { contrast: { state: 'ran' }, 'reduced-motion': { state: 'ran' }, 'colour-budget': { state: 'ran' } } });
  assert.equal(p.verdict, 'pass');
});

test('MUST FAIL — presenting before the pressure-test has run is refused; unavailable is NOT a pass', () => {
  const p = pressureTest({ checks: {} }); // nothing has run
  assert.equal(p.verdict, 'block');
  assert.deepEqual(p.unavailable.sort(), ['colour-budget', 'contrast', 'reduced-motion']);
  assert.match(p.why, /UNAVAILABLE/);
  assert.match(p.why, /not a pass/);
});

test('MUST FAIL — a check that RAN and failed blocks presentation, naming it', () => {
  const p = pressureTest({ checks: { contrast: { state: 'failed', detail: '3.2:1' }, 'reduced-motion': { state: 'ran' }, 'colour-budget': { state: 'ran' } } });
  assert.equal(p.verdict, 'block');
  assert.deepEqual(p.failed, ['contrast']);
});
