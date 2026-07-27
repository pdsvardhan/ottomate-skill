// Tests for Phase-2 persistence: rejected[] wiring, reload-on-resume, and the snapshot differ.
// Every mechanism gets a must-catch/partition case AND a must-pass case.

import test from 'node:test';
import assert from 'node:assert/strict';
import {
  rejectedByAxis, passedOverByAxis, frozenByAxis, resumeSummary,
  snapshotForLock, diffAgainstSnapshots, formatRegressions,
} from './ledger-context.mjs';

// A small ledger for one target across two rounds.
const decisions = [
  { axis: 'media-card.corner-radius', status: 'locked', chosen_value: '14', round: 1,
    rejected: [{ value: 0, grade: 'rejected_with_reason', why_rejected: 'too sharp' },
             { value: 4, grade: 'not_selected', why_rejected: 'not selected in the per-item pick' }],
    snapshot: JSON.stringify({ axis: 'media-card.corner-radius', chosen_value: '14', source_sha256: null }) },
  { axis: 'media-card.accent-usage', status: 'proposed', chosen_value: 'cta', round: 2,
    rejected: [{ value: 'frame', grade: 'not_selected', why_rejected: 'not selected in the per-item pick' }] },
  { axis: 'media-card.accent-usage', status: 'rejected', chosen_value: 'badge', round: 1,
    rejected: [{ value: 'frame', grade: 'rejected_with_reason', why_rejected: 'dup earlier round' }] },
  { axis: 'media-card.hover-motion', status: 'in-review', chosen_value: 'lift', round: 2, rejected: [] },
];

// ── 1. rejected[] + frozen ─────────────────────────────────────────────────────

test('rejectedByAxis binds ONLY hard bans — a value that merely lost is not banned (T3)', () => {
  const r = rejectedByAxis(decisions);
  // 0 was ruled out with a reason; 4 merely did not win, so it stays available for a later round.
  assert.deepEqual(r['media-card.corner-radius'].map((x) => x.value), [0]);
  assert.equal(r['media-card.accent-usage'].filter((x) => x.value === 'frame').length, 1,
    "'frame' was ruled out in one round and merely passed over in another — the ban survives, de-duped");
});

test('MUST NOT BAN — a value that only lost a round is absent from the ban list (T3)', () => {
  const soft = [{ axis: 'x.y', status: 'in-review', rejected: [{ value: 'runner-up', grade: 'not_selected', why_rejected: 'not selected in the per-item pick' }] }];
  assert.deepEqual(rejectedByAxis(soft), {}, 'losing once must not be a permanent ban');
  assert.equal(passedOverByAxis(soft)['x.y'].length, 1, 'but it is still visible as context');
});

test('a LEGACY row with no grade is read as not_selected — errs toward offering, not withholding', () => {
  const legacy = [{ axis: 'x.y', status: 'in-review', rejected: [{ value: 'old', why_rejected: 'not selected in the per-item pick' }] }];
  assert.deepEqual(rejectedByAxis(legacy), {});
  assert.equal(passedOverByAxis(legacy)['x.y'][0].grade, 'not_selected');
});

test('frozenByAxis returns only LOCKED chosen values (harvest-before-ask)', () => {
  const f = frozenByAxis(decisions);
  assert.deepEqual(f, { 'media-card.corner-radius': '14' });
  assert.ok(!('media-card.accent-usage' in f), 'a proposed decision is not frozen');
});

// ── 2. reload-on-resume ────────────────────────────────────────────────────────

test('resumeSummary partitions open / locked / rejected / frozen from one fetch', () => {
  const s = resumeSummary(decisions);
  assert.equal(s.counts.locked, 1);
  assert.equal(s.counts.open, 2, 'proposed + in-review are open');
  assert.equal(s.counts.rejected, 1);
  assert.equal(s.open.length, 2);
  assert.deepEqual(Object.keys(s.frozenByAxis), ['media-card.corner-radius']);
  assert.ok(s.rejectedByAxis['media-card.corner-radius']);
});

// ── 3. snapshot differ ─────────────────────────────────────────────────────────

test('snapshotForLock is deterministic and captures value + source hash', () => {
  const d = { axis: 'x.radius', chosen_value: 14, at: 'FIXED' };
  assert.equal(snapshotForLock(d, '<div>a</div>'), snapshotForLock(d, '<div>a</div>'), 'same input → same snapshot');
  const snap = JSON.parse(snapshotForLock(d, '<div>a</div>'));
  assert.equal(snap.chosen_value, '14');
  assert.ok(snap.source_sha256 && snap.source_sha256.length === 64);
  assert.equal(JSON.parse(snapshotForLock(d)).source_sha256, null, 'no source → null hash');
});

test('diffAgainstSnapshots CATCHES a locked value silently changed on rebuild', () => {
  const locked = decisions.filter((d) => d.status === 'locked');
  const regs = diffAgainstSnapshots(locked, { 'media-card.corner-radius': 8 }); // locked was 14
  assert.equal(regs.length, 1);
  assert.equal(regs[0].axis, 'media-card.corner-radius');
  assert.equal(regs[0].was, '14');
  assert.equal(regs[0].now, '8');
  assert.equal(regs[0].kind, 'value');
});

test('diffAgainstSnapshots PASSES when the locked value is unchanged', () => {
  const locked = decisions.filter((d) => d.status === 'locked');
  const regs = diffAgainstSnapshots(locked, { 'media-card.corner-radius': 14 });
  assert.equal(regs.length, 0, formatRegressions(regs));
});

test('diffAgainstSnapshots catches SOURCE drift even when the value label is unchanged', () => {
  const locked = [{ axis: 'x.title', status: 'locked', chosen_value: 'below',
    snapshot: snapshotForLock({ axis: 'x.title', chosen_value: 'below', at: 'F' }, '<h3>Original</h3>') }];
  // value 'below' unchanged, but the markup for that region changed
  const regs = diffAgainstSnapshots(locked, { 'x.title': 'below' }, { 'x.title': '<h3>Tampered</h3>' });
  assert.equal(regs.length, 1);
  assert.equal(regs[0].kind, 'source');
});

test('a locked decision with no snapshot is skipped, not crashed', () => {
  const regs = diffAgainstSnapshots([{ axis: 'x', status: 'locked', chosen_value: '1', snapshot: null }], { x: 999 });
  assert.equal(regs.length, 0);
});

test('formatRegressions is human-readable both ways', () => {
  assert.match(formatRegressions([]), /no regressions/);
  assert.match(formatRegressions([{ axis: 'a.b', was: '1', now: '2', kind: 'value' }]), /REGRESSION.*a\.b.*was "1".*has "2"/s);
});
