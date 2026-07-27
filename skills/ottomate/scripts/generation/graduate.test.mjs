// Tests for the graduation hook — protocol captured, NEVER writes.

import test from 'node:test';
import assert from 'node:assert/strict';
import { draftGraduation, licenceTier } from './graduate.mjs';

const locked = { status: 'locked', axis: 'media-card.corner-radius', chosen_value: '14', target_id: 'oid-card' };
const tokenised = '<style>.card{border-radius:var(--radius-4);color:var(--ink)}</style><div class="card"></div>';

test('licenceTier maps GREEN/AMBER/RED and treats unknown as RED', () => {
  assert.equal(licenceTier('MIT'), 'GREEN');
  assert.equal(licenceTier('CC-BY-4.0'), 'AMBER');
  assert.equal(licenceTier('CC BY-NC-SA 3.0'), 'RED');
  assert.equal(licenceTier(null), 'RED');
  assert.equal(licenceTier('WTFPL'), 'RED');
});

test('an in-house locked + tokenised variant produces a clean draft — and NEVER writes', () => {
  const r = draftGraduation(locked, tokenised, { author: 'ottomate', ingestion_method: 'hand-authored' });
  assert.equal(r.writes, false, 'the hook must never write to master_components');
  assert.equal(r.quarantine, false, r.reasons.join('; '));
  assert.equal(r.tier, 'GREEN');
  assert.equal(r.draft.library, 'ottomate');
  assert.equal(r.draft._pending_columns.grade, null, 'grade needs the rubric runner (not this unit)');
});

test('a non-locked decision is refused', () => {
  const r = draftGraduation({ ...locked, status: 'proposed' }, tokenised, { author: 'ottomate', ingestion_method: 'hand-authored' });
  assert.equal(r.quarantine, true);
  assert.match(r.reasons.join(), /only a LOCKED decision/);
});

test('baked-in literals block graduation (tokenise first, H1 §3.12)', () => {
  const baked = '<style>.card{background:#0d0e12;color:#fff}</style>';
  const r = draftGraduation(locked, baked, { author: 'ottomate', ingestion_method: 'hand-authored' });
  assert.equal(r.quarantine, true);
  assert.match(r.reasons.join(), /not tokenised/);
});

test('a third-party variant with missing provenance is quarantined; a RED licence is rejected', () => {
  const noProv = draftGraduation(locked, tokenised, { ingestion_method: 'clone' });
  assert.equal(noProv.quarantine, true);
  assert.match(noProv.reasons.join(), /missing provenance/);

  const red = draftGraduation(locked, tokenised, { source_url: 'x', author: 'a', spdx_id: 'CC-BY-NC-SA-3.0', licence_url: 'x', attribution: 'a', retrieved_at: 'x', ingestion_method: 'clone' });
  assert.equal(red.tier, 'RED');
  assert.equal(red.quarantine, true);
});

test('draft is never a live write regardless of input', () => {
  for (const st of ['locked', 'proposed']) {
    assert.equal(draftGraduation({ ...locked, status: st }, tokenised, {}).writes, false);
  }
});
