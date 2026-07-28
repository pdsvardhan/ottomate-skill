// C4 — rung-A style boards: schema + distinctness. run: node --test board-check.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validateBoard, checkBoardSet, paletteDistance } from './board-check.mjs';

const board = (o = {}) => ({
  direction: 'editorial',
  palette: ['#101216', '#f4f5f8', '#e9b84c', '#7fd6a2', '#5f6575'],
  type_voice: { display: 'Fraunces', body: 'Inter' },
  mood: ['calm', 'literary', 'warm'],
  hero_sample: 'a poster wall with a single gold rule',
  ...o,
});

test('MUST PASS — a well-formed board validates', () => {
  assert.equal(validateBoard(board()).ok, true);
});

test('MUST FAIL — a board with only 2 palette entries is refused, naming the field', () => {
  const v = validateBoard(board({ palette: ['#000000', '#ffffff'] }));
  assert.equal(v.ok, false);
  assert.match(v.problems.join(' '), /palette/);
});

test('MUST FAIL — a board with no hero sample is refused, naming the field', () => {
  const v = validateBoard(board({ hero_sample: '' }));
  assert.equal(v.ok, false);
  assert.match(v.problems.join(' '), /hero_sample/);
});

test('MUST FAIL — a non-hex palette entry is caught', () => {
  assert.equal(validateBoard(board({ palette: ['#101216', 'tomato', '#e9b84c', '#7fd6a2'] })).ok, false);
});

test('MUST PASS — a well-formed 3-board set of distinct directions passes', () => {
  const set = [
    board({ direction: 'editorial', palette: ['#101216', '#f4f5f8', '#e9b84c', '#5f6575'] }),
    board({ direction: 'brutalist', palette: ['#ffffff', '#000000', '#ff3b30', '#111111'] }),
    board({ direction: 'organic', palette: ['#1c2a22', '#e8f0e8', '#6fae7f', '#3a5a44'] }),
  ];
  const r = checkBoardSet(set);
  assert.equal(r.ok, true, JSON.stringify(r.problems));
});

test('MUST FAIL — two boards that differ only in accent are refused as not distinct', () => {
  const base = ['#101216', '#f4f5f8', '#5f6575', '#9aa1b2'];
  const set = [
    board({ direction: 'editorial-gold', palette: [...base, '#e9b84c'] }),
    board({ direction: 'editorial-teal', palette: [...base, '#4cb8e9'] }), // same look, one swatch changed
    board({ direction: 'brutalist', palette: ['#ffffff', '#000000', '#ff3b30', '#111111'] }),
  ];
  const r = checkBoardSet(set);
  assert.equal(r.ok, false);
  assert.ok(r.tooClose.some((t) => (t.aDir + t.bDir).includes('editorial')));
  assert.match(r.problems.join(' '), /one with a swatch changed/);
});

test('MUST FAIL — too few or too many boards is refused', () => {
  assert.equal(checkBoardSet([board(), board({ direction: 'x', palette: ['#fff', '#000', '#f00', '#0f0'] })]).ok, false);
  const many = Array.from({ length: 6 }, (_, i) => board({ direction: 'd' + i, palette: ['#101216', '#f4f5f8', '#5f6575', `#${(i * 40).toString(16).padStart(2, '0')}b84c`] }));
  assert.match(checkBoardSet(many).problems.join(' '), /3–5 boards/);
});

test('paletteDistance is near-zero for identical palettes and large for opposite ones', () => {
  assert.ok(paletteDistance(['#000000', '#ffffff'], ['#000000', '#ffffff']) < 1);
  assert.ok(paletteDistance(['#000000', '#ffffff'], ['#111111', '#eeeeee']) < 12);
  assert.ok(paletteDistance(['#e9b84c', '#101216'], ['#4c7de9', '#f4f5f8']) > 12);
});
