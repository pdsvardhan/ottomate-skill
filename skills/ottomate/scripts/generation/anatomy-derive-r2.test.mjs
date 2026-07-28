// R2.2 (F-4) — harden anatomy-derive against the exact cointrail failure:
// leaked JS ternary names as "parts", a false media-aspect axis, over-confident "medium" on junk.
// run: node --test anatomy-derive-r2.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { collectEvidence, proposeRecord, isJsIdentifierLeak } from './anatomy-derive.mjs';

// A cointrail-like data panel: JS ternary conditions leak into className, no data-role, NO media well.
const SOURCE = `
export function TxnPanel({ tx }) {
  const isCredit = tx.type === 'credit';
  const isPaid = tx.status === 'paid';
  const periodOpen = tx.period === 'open';
  return (
    <section className="group">
      <div className={isCredit ? 'amount-credit' : 'amount-debit'}>{tx.amount}</div>
      <span className={isPaid ? 'badge-paid' : 'badge-due'} />
      <ul className={periodOpen ? 'rows-open' : 'rows-closed'} />
    </section>
  );
}`;
// a tiny stylesheet that styles NONE of the leaked names (they aren't classes)
const CSS = `.group:hover .x { opacity: 1 } .amount-credit { color: green }`;

test('isJsIdentifierLeak flags camelCase / is* tokens the stylesheet does not style', () => {
  assert.equal(isJsIdentifierLeak('isCredit', []), true);
  assert.equal(isJsIdentifierLeak('periodOpen', []), true);
  assert.equal(isJsIdentifierLeak('amount-credit', []), false);      // kebab, a real class
  assert.equal(isJsIdentifierLeak('isActive', ['isActive']), false); // if the stylesheet styles it, keep it
});

test('leaked JS ternary names do NOT appear as parts (F-4 fix)', () => {
  const ev = collectEvidence(SOURCE, CSS);
  const rec = proposeRecord(ev, { name: 'txn-panel' });
  for (const junk of ['isCredit', 'isPaid', 'periodOpen']) {
    assert.ok(!rec.parts.includes(junk), `"${junk}" must not be a part; parts=${JSON.stringify(rec.parts)}`);
  }
});

test('no media element → media-aspect is NOT chosen, only (at most) possible (F-4 false-axis fix)', () => {
  const ev = collectEvidence(SOURCE, CSS);
  const rec = proposeRecord(ev, { name: 'txn-panel' });
  const chosenIds = rec.questions.map((q) => q.q);
  assert.ok(!chosenIds.includes('media-aspect'), `media-aspect must not be chosen on a media-less panel; chosen=${JSON.stringify(chosenIds)}`);
  assert.ok(!rec.likely.includes('media-aspect'));
});

test('a semantically-empty derivation reads confidence LOW, not an over-confident medium (F-4)', () => {
  const ev = collectEvidence(SOURCE, CSS);
  const rec = proposeRecord(ev, { name: 'txn-panel' });
  assert.equal(rec.confidence, 'low', `no data-role + no styled parts → low; got ${rec.confidence}`);
});

// MUST still work: a composite component WITH a media well keeps media-aspect available (not suppressed).
test('CONTROL — a composite component WITH a media well keeps media-aspect available', () => {
  const media = `<article className="media-card"><img className="cover" src="x" /><h3 className="title" /><p className="desc" /><figcaption className="body" /></article>`;
  const css = `.media-card{position:relative} .cover{aspect-ratio:16/9} .title{font-weight:700} .desc{color:gray} .body{padding:1rem}`;
  const rec = proposeRecord(collectEvidence(media, css), { name: 'media-card' });
  assert.equal(rec.tier, 'composite');
  const ids = [...rec.likely, ...rec.possible, ...rec.questions.map((q) => q.q)];
  assert.ok(ids.includes('media-aspect'), `media-aspect must be available when there IS media; got ${JSON.stringify([...new Set(ids)])}`);
});

test('CONTROL — a data-role-stamped component reads confidence high', () => {
  const stamped = `<section data-role="panel"><div data-role="metric" /><ul data-role="rows" /></section>`;
  const rec = proposeRecord(collectEvidence(stamped, ''), { name: 'panel' });
  assert.equal(rec.confidence, 'high');
  assert.deepEqual(rec.parts, ['panel', 'metric', 'rows']);
});
