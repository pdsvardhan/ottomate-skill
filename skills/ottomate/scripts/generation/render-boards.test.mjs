// C4 renderer — run: node --test render-boards.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { renderBoardSet } from './render-boards.mjs';

const board = (o = {}) => ({
  direction: 'editorial', palette: ['#101216', '#f4f5f8', '#e9b84c', '#5f6575'],
  type_voice: { display: 'Fraunces', body: 'Inter' }, mood: ['calm', 'literary', 'warm'],
  hero_sample: 'a poster wall with a single gold rule', ...o,
});
const distinctSet = () => [
  board({ direction: 'editorial', palette: ['#101216', '#f4f5f8', '#e9b84c', '#5f6575'] }),
  board({ direction: 'brutalist', palette: ['#ffffff', '#000000', '#ff3b30', '#111111'] }),
  board({ direction: 'organic', palette: ['#1c2a22', '#e8f0e8', '#6fae7f', '#3a5a44'] }),
];

test('MUST PASS — a valid set renders each direction, its palette hexes and its mood words', () => {
  const html = renderBoardSet(distinctSet());
  assert.match(html, /data-direction="editorial"/);
  assert.match(html, /data-direction="brutalist"/);
  assert.match(html, /#e9b84c/);
  assert.match(html, /calm/);
  assert.match(html, /Fraunces/);
  assert.match(html, /class="boards"/);
});

test('MUST FAIL — a set the checker rejects never renders (too few boards)', () => {
  assert.throws(() => renderBoardSet([board()]), /refused|renderable/);
});

test('MUST FAIL — a non-distinct set (two boards differing only in accent) never renders', () => {
  const base = ['#101216', '#f4f5f8', '#5f6575', '#9aa1b2'];
  assert.throws(() => renderBoardSet([
    board({ direction: 'gold', palette: [...base, '#e9b84c'] }),
    board({ direction: 'teal', palette: [...base, '#4cb8e9'] }),
    board({ direction: 'brutalist', palette: ['#ffffff', '#000000', '#ff3b30', '#111111'] }),
  ]), /refused/);
});

test('output is injection-safe — a malicious direction is escaped, not embedded as markup', () => {
  const html = renderBoardSet([
    board({ direction: '<script>x', palette: ['#101216', '#f4f5f8', '#e9b84c', '#5f6575'] }),
    board({ direction: 'brutalist', palette: ['#ffffff', '#000000', '#ff3b30', '#111111'] }),
    board({ direction: 'organic', palette: ['#1c2a22', '#e8f0e8', '#6fae7f', '#3a5a44'] }),
  ]);
  assert.doesNotMatch(html, /<script>x/);
  assert.match(html, /&lt;script&gt;x/);
});
