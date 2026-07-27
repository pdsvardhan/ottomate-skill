// U6a — shared content into a markup panel.
// The harness had only template-level placeholders and none per-card, so markup panels got no shared
// content at all. These prove the substitution is right AND that a typo still fails loudly downstream.
// run: node --test card-slots.test.mjs

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { fillCardSlots } from './build-variant-set.mjs';

const cards = [
  { title: 'Arrival', meta: '2016 · 14.2 GB', rating: 7.9, accent: '#3395A9', img: 'data:image/jpeg;base64,AAAA' },
  { title: 'Dune & Sons <2>', meta: '2024', rating: null, accent: '#DDA257', img: 'data:image/jpeg;base64,BBBB' },
];

test('every slot kind is filled from the right card, 1-indexed', () => {
  const out = fillCardSlots('<img src="{{IMG_1}}"><b>{{TITLE_1}}</b><i>{{META_1}}</i><s>{{RATING_1}}</s>', cards);
  assert.equal(out, '<img src="data:image/jpeg;base64,AAAA"><b>Arrival</b><i>2016 · 14.2 GB</i><s>7.9</s>');
});

test('the accent is emitted raw so it can sit in a CSS custom property', () => {
  assert.equal(fillCardSlots('.c{--a:{{ACCENT_2}}}', cards), '.c{--a:#DDA257}');
});

test('titles are HTML-escaped — content is untrusted text, not markup', () => {
  assert.equal(fillCardSlots('<b>{{TITLE_2}}</b>', cards), '<b>Dune &amp; Sons &lt;2&gt;</b>');
});

test('the image is NOT escaped — a data: URI must survive verbatim', () => {
  assert.match(fillCardSlots('<img src="{{IMG_1}}">', cards), /base64,AAAA/);
});

test('a null rating renders empty rather than the string "null"', () => {
  assert.equal(fillCardSlots('<s>{{RATING_2}}</s>', cards), '<s></s>');
});

test('a slot pointing past the end of the deck is LEFT IN PLACE so the guard catches it', () => {
  // build-variant-set throws on any {{...}} left in the emitted page. Silently blanking an
  // out-of-range card would ship a hole instead of failing.
  assert.equal(fillCardSlots('<img src="{{IMG_9}}">', cards), '<img src="{{IMG_9}}">');
});

test('an unknown slot name is left alone (it is not ours to consume)', () => {
  assert.equal(fillCardSlots('{{AXIS_NAME}}', cards), '{{AXIS_NAME}}');
});

test('no cards means the markup is returned untouched', () => {
  assert.equal(fillCardSlots('<img src="{{IMG_1}}">', []), '<img src="{{IMG_1}}">');
});

test('content is CONTROL — the same deck fills every panel identically', () => {
  const a = fillCardSlots('<x>{{TITLE_1}}</x>', cards);
  const b = fillCardSlots('<y>{{TITLE_1}}</y>', cards);
  assert.ok(a.includes('Arrival') && b.includes('Arrival'));
});
