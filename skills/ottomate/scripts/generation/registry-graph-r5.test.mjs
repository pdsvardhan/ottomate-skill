// R5 (F-11) — a NOVEL/unregistered component publishes a round from its decomposed anatomy, no registry
// surgery. Doctrine rule 40 still holds. run: node --test registry-graph-r5.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildRoundPayloads, resolveArchetype } from './publish-round.mjs';
import { decompose, anatomyForScope } from './decompose.mjs';

// a novel component the registry has never heard of
const decomp = decompose({ oid: 'cointrail.spending-analysis', parts: ['transaction-history', 'top-merchants', 'category-breakdown'] });
const inline = anatomyForScope(decomp, 'section:category-breakdown'); // its own sub-decisions

test('anatomyForScope turns a decomposed scope into inline sub_decisions', () => {
  assert.equal(inline.tier, 'composite');
  assert.ok(inline.sub_decisions.length >= 1);
  assert.ok(inline.sub_decisions.every((s) => s.id.startsWith('category-breakdown.')));
});

test('resolveArchetype uses the REGISTRY when the archetype is known (fast-path unchanged)', () => {
  // media-card is a registered archetype
  const arche = resolveArchetype({ archetype: 'media-card' });
  assert.ok(Array.isArray(arche.sub_decisions) && !arche._inline);
});

test('a NOVEL component publishes a round from anatomy_inline — NO registry surgery (F-11)', () => {
  const axis = inline.sub_decisions[0].id; // e.g. category-breakdown.layout
  const manifest = {
    project_slug: 'cointrail', target_id: 'cointrail.category-breakdown',
    archetype: 'cointrail.spending-analysis-novel', // not in the registry
    anatomy_inline: inline, round: 1,
    variants_shown: { A: { [axis]: 'flat' }, B: { [axis]: 'raised' } },
    variant_labels: { A: 'flat', B: 'raised' },
  };
  const payloads = buildRoundPayloads(manifest);
  assert.equal(payloads.length, 1);
  assert.equal(payloads[0].axis, `cointrail.spending-analysis-novel.${axis}`);
  assert.equal(payloads[0].status, 'proposed');
});

// MUST-FAIL: doctrine rule 40 — an axis tracing to NEITHER the registry nor the inline anatomy is refused.
test('an axis not in the inline anatomy is REFUSED (rule 40 still holds)', () => {
  const manifest = {
    project_slug: 'cointrail', target_id: 'cointrail.category-breakdown',
    archetype: 'novel-x', anatomy_inline: inline, round: 1,
    variants_shown: { A: { 'not-a-real-axis': 'x' }, B: { 'not-a-real-axis': 'y' } },
    variant_labels: { A: 'a', B: 'b' },
  };
  assert.throws(() => buildRoundPayloads(manifest), /not a sub-decision/);
});

test('an unregistered archetype with NO anatomy_inline is still refused (fail loud)', () => {
  assert.throws(() => resolveArchetype({ archetype: 'ghost' }), /no manifest.anatomy_inline/);
});
