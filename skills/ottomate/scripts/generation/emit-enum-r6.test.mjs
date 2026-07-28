// R6 (F-12) — a registered token-mapped question must NOT mint an enum value as a CSS custom property.
// run: node --test emit-enum-r6.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { resolveDecision } from './emit-design-artifacts.mjs';
import { questionRegistry } from './anatomy.mjs';

// pick a genuinely token-mapped question from the registry
const reg = questionRegistry();
const tokenQ = Object.keys(reg).find((k) => reg[k].token);
assert.ok(tokenQ, 'the registry has at least one token-mapped question');

test('an ENUM value on a token-mapped question → STRUCTURAL, not an invalid --custom-property (F-12)', () => {
  const d = { id: 1, axis: `media-card.${tokenQ}`, chosen_value: 'flat-hairline', target_id: 'x.card', round: 1 };
  const r = resolveDecision(d, { registry: reg });
  assert.equal(r.kind, 'structural', `enum value must not mint a token; got ${r.kind}`);
  assert.equal(r.row.evidence.how, 'enum-value-structural');
});

test('CONTROL — a CSS-shaped value on the same token-mapped question STILL mints a token', () => {
  const d = { id: 2, axis: `media-card.${tokenQ}`, chosen_value: '6px', target_id: 'x.card', round: 1 };
  const r = resolveDecision(d, { registry: reg });
  assert.equal(r.kind, 'token', `a real CSS value must still mint a token; got ${r.kind}`);
  assert.ok(r.row.token, 'the token name is present');
});

test('CONTROL — a non-token structural question is unchanged', () => {
  const structuralQ = Object.keys(reg).find((k) => !reg[k].token);
  if (!structuralQ) return; // all token-mapped (unlikely) → nothing to assert
  const r = resolveDecision({ id: 3, axis: `media-card.${structuralQ}`, chosen_value: 'left', target_id: 'x.card' }, { registry: reg });
  assert.equal(r.kind, 'structural');
});
