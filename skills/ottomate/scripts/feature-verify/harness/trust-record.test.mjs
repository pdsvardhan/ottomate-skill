import { test } from 'node:test';
import assert from 'node:assert/strict';
import { assessTrust, applyTrust } from './trust-record.mjs';

const dims = { claim_blind: true, held_out: true, owner_reviewed: true, untampered: true, pre_build_authored: true };

test('all dimensions hold → trustworthy', () => assert.equal(assessTrust(dims).trustworthy, true));
test('one missing → not trustworthy, with the reason', () => {
  const r = assessTrust({ ...dims, owner_reviewed: false });
  assert.equal(r.trustworthy, false); assert.match(r.warnings.join(), /owner_reviewed/);
});
test('applyTrust downgrades an APPROVE to ITERATE when untrustworthy', () => {
  const v = applyTrust({ recommendation_overall: 'APPROVE', reason: 'all passed' }, assessTrust({ ...dims, untampered: false }));
  assert.equal(v.recommendation_overall, 'ITERATE'); assert.match(v.reason, /untrustworthy|untampered/);
});
test('applyTrust leaves a trustworthy verdict unchanged', () => {
  const v = applyTrust({ recommendation_overall: 'APPROVE', reason: 'ok' }, assessTrust(dims));
  assert.equal(v.recommendation_overall, 'APPROVE');
});
