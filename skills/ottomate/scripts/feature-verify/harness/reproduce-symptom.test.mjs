import { test } from 'node:test';
import assert from 'node:assert/strict';
import { symptomVerdict } from './reproduce-symptom.mjs';

test('RED pre-fix then GREEN post-fix + pass_to_pass green = pass', () => {
  assert.equal(symptomVerdict({ preFixRed: true, postFixGreen: true, passToPass: [true, true] }).outcome, 'pass');
});
test('RED then still-RED = fail', () => {
  assert.equal(symptomVerdict({ preFixRed: true, postFixGreen: false, passToPass: [] }).outcome, 'fail');
});
test('already-GREEN pre-fix = inconclusive (bug not reproduced), never pass', () => {
  const r = symptomVerdict({ preFixRed: false, postFixGreen: true, passToPass: [true] });
  assert.equal(r.outcome, 'warn'); assert.match(r.detail, /not reproduced/i);
});
test('a pass_to_pass regression = fail', () => {
  assert.equal(symptomVerdict({ preFixRed: true, postFixGreen: true, passToPass: [true, false] }).outcome, 'fail');
});
