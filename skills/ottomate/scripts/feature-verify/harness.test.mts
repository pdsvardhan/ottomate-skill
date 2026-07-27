// Task 3 / A5 — the harness's first unit tests.
//
// Until now `scripts/feature-verify/` had ZERO tests, including for `Matrix.verdict()` — the
// fail-closed logic the entire Task-3 gate rests on. The register described that behaviour as
// "correctly fail-closed"; the audit could only mark it "register claim only, not independently
// verified". This makes it verified.
//
// run: node --test --experimental-strip-types "feature-verify/*.test.mts"
// Node 22.13 strips TypeScript types natively, so there is no build step and no package.json —
// the plugin's zero-dependency rule holds.

import test from 'node:test';
import assert from 'node:assert/strict';
import { Matrix } from './harness/report.ts';
import { assertNfcPreserved, SCRIPT_FIXTURES, NORMALIZATION_PAIR } from './harness/unicode.ts';

const m = (...outcomes: Array<'pass' | 'fail' | 'warn' | 'skipped'>) => {
  const x = new Matrix();
  outcomes.forEach((o, i) => x.record({ case: `c${i}`, outcome: o }));
  return x;
};

// ── counts ─────────────────────────────────────────────────────────────────────────────────────

test('counts tallies every outcome and the total', () => {
  assert.deepEqual(m('pass', 'pass', 'fail', 'warn', 'skipped').counts(),
    { total: 5, pass: 2, fail: 1, warn: 1, skipped: 1 });
});

test('an empty matrix is empty, not a pass', () => {
  assert.deepEqual(new Matrix().counts(), { total: 0, pass: 0, fail: 0, warn: 0, skipped: 0 });
});

// ── THE fail-closed verdict — the load-bearing logic ────────────────────────────────────────────

test('MUST PASS — all-pass is APPROVE with no mandatory review', () => {
  const v = m('pass', 'pass', 'pass').verdict('block');
  assert.equal(v.recommendation_overall, 'APPROVE');
  assert.equal(v.mandatory_user_review, false);
  assert.match(v.reason, /all 3 case\(s\) passed/);
});

test('MUST FAIL — any deterministic failure BLOCKS', () => {
  const v = m('pass', 'fail', 'pass').verdict('block');
  assert.equal(v.recommendation_overall, 'BLOCK');
  assert.equal(v.mandatory_user_review, true);
  assert.match(v.reason, /1\/3/);
});

test('MUST FAIL — a SKIPPED case can never render green. This is the whole fail-closed rule', () => {
  const v = m('pass', 'pass', 'skipped').verdict('block');
  assert.notEqual(v.recommendation_overall, 'APPROVE');
  assert.equal(v.recommendation_overall, 'ITERATE');
  assert.match(v.reason, /could not be verified/);
  assert.match(v.reason, /not a clean pass/);
});

test('MUST FAIL — a single skipped case among 99 passes still refuses APPROVE', () => {
  const outcomes: Array<'pass' | 'skipped'> = Array(99).fill('pass');
  outcomes.push('skipped');
  assert.notEqual(m(...outcomes).verdict('block').recommendation_overall, 'APPROVE',
    'a mocked or unrunnable step must not be diluted away by volume');
});

test('a warning is advisory — ITERATE, never BLOCK, and never mandatory review', () => {
  const v = m('pass', 'warn').verdict('block');
  assert.equal(v.recommendation_overall, 'ITERATE');
  assert.equal(v.mandatory_user_review, false);
});

test('a FAIL outranks a skip and a warn — the worst outcome decides', () => {
  assert.equal(m('fail', 'skipped', 'warn').verdict('block').recommendation_overall, 'BLOCK');
});

// ── risk policy (adr-014: block for cv/public, warn for personal) ───────────────────────────────

test('MUST PASS — risk policy "warn" records the failure WITHOUT demanding review', () => {
  const v = m('fail').verdict('warn');
  assert.equal(v.recommendation_overall, 'BLOCK', 'still BLOCK — the policy changes who must look, not what happened');
  assert.equal(v.mandatory_user_review, false);
  assert.match(v.reason, /personal → warn-recorded, not blocking/);
});

test('MUST FAIL — risk policy "block" demands review on the same input', () => {
  assert.equal(m('fail').verdict('block').mandatory_user_review, true);
});

// ── AI verdicts must never gate ─────────────────────────────────────────────────────────────────

test('MUST PASS — judge_verdict is ignored: an AI opinion can never change the gate', () => {
  const x = new Matrix();
  x.record({ case: 'subjective', outcome: 'pass', judge_verdict: { verdict: 'BLOCK', score: 0, rationale: 'looks wrong' } });
  assert.equal(x.verdict('block').recommendation_overall, 'APPROVE',
    'spec §11: AI verdicts never gate. A judge that could block would make an opinion load-bearing');
});

test('MUST FAIL — and it cannot rescue a red either: a judge saying APPROVE does not lift a fail', () => {
  const x = new Matrix();
  x.record({ case: 'broken', outcome: 'fail', judge_verdict: { verdict: 'APPROVE', score: 100 } });
  assert.equal(x.verdict('block').recommendation_overall, 'BLOCK');
});

// ── the rendered matrix ────────────────────────────────────────────────────────────────────────

test('renderTable emits a row per case with its outcome and first proof path', () => {
  const x = new Matrix();
  x.record({ case: 'upload', variant: 'data', outcome: 'fail', evidence: { trace: '/ev/t.zip', video: '/ev/v.webm' } });
  const t = x.renderTable();
  assert.match(t, /\| outcome \| case \| proof \|/);
  assert.match(t, /\| FAIL \| upload \(data\) \| \/ev\/t\.zip \|/);
});

test('a case with no evidence still renders — a missing proof must not swallow the row', () => {
  assert.match(m('skipped').renderTable(), /\| SKIP \| c0 \|  \|/);
});

// ── the unicode recipe (§5B) ───────────────────────────────────────────────────────────────────

test('MUST PASS — an intact Telugu value is preserved and canonical', () => {
  const r = assertNfcPreserved(SCRIPT_FIXTURES.telugu, SCRIPT_FIXTURES.telugu);
  assert.equal(r.ok, true);
  assert.equal(r.transliterated, false);
  assert.equal(r.canonicalNfc, true);
});

test('MUST FAIL — Telugu transliterated to ASCII is caught, and named as transliteration', () => {
  const r = assertNfcPreserved('paata', SCRIPT_FIXTURES.telugu);
  assert.equal(r.ok, false);
  assert.equal(r.transliterated, true);
  assert.match(r.detail, /TRANSLITERATED/);
});

test('MUST FAIL — a mangled value (U+FFFD or a run of underscores) is caught', () => {
  assert.equal(assertNfcPreserved('___', SCRIPT_FIXTURES.tamil).mangled, true);
  assert.equal(assertNfcPreserved('��', SCRIPT_FIXTURES.tamil).mangled, true);
});

test('NFD stored for an NFC input is PRESERVED but flagged non-canonical — the subtle case', () => {
  const r = assertNfcPreserved(NORMALIZATION_PAIR.nfd, NORMALIZATION_PAIR.nfc);
  assert.equal(r.ok, true, 'codepoints survive a round trip through either form');
  assert.equal(r.canonicalNfc, false, 'but it is not canonical, and the caller decides if that matters');
  assert.match(r.detail, /non-canonical form stored verbatim/);
});

test('MUST FAIL — genuine codepoint loss is caught even when both sides are non-ASCII', () => {
  const r = assertNfcPreserved(SCRIPT_FIXTURES.tamil, SCRIPT_FIXTURES.telugu);
  assert.equal(r.ok, false);
  assert.equal(r.transliterated, false, 'not transliteration — both are native script');
  assert.match(r.detail, /CODEPOINT LOSS/);
});

test('emoji and mixed-script values survive, and a truncated long name does not', () => {
  assert.equal(assertNfcPreserved(SCRIPT_FIXTURES.emoji, SCRIPT_FIXTURES.emoji).ok, true);
  assert.equal(assertNfcPreserved(SCRIPT_FIXTURES.mixed, SCRIPT_FIXTURES.mixed).ok, true);
  const truncated = SCRIPT_FIXTURES.longName.slice(0, 50);
  assert.equal(assertNfcPreserved(truncated, SCRIPT_FIXTURES.longName).ok, false,
    'a silently truncated long name is a real storage bug and must not pass');
});
