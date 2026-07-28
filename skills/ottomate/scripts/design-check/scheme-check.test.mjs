// C8 — light AND dark both render (½ of AC4). run: node --test scheme-check.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { assertBothSchemes, schemeContrastFloor, formatSchemes } from './scheme-check.mjs';

// a card that paints its own bg and carries text
const card = (color, bg, text = 'Owned 2016') => ({ tag: 'div', text, styles: { color, backgroundColor: bg } });

test('MUST FAIL — passes contrast in light, fails in dark → caught, naming the dark scheme', () => {
  const light = [card('rgb(20,20,20)', 'rgb(240,240,240)')];   // dark text on light card — clears
  const dark = [card('rgb(20,20,20)', 'rgb(26,26,26)')];        // same dark text on a dark card — fails
  const r = assertBothSchemes({ light, dark });
  assert.equal(r.ok, false);
  assert.ok(r.failing.some((f) => f.scheme === 'dark' && f.rule === 'floor-contrast'), 'dark contrast failure named');
  assert.ok(!r.failing.some((f) => f.scheme === 'light'), 'light passed');
  assert.match(formatSchemes(r), /dark: floor-contrast/);
});

test('MUST PASS — correct in both schemes passes, and the report says which schemes were measured', () => {
  const light = [card('rgb(20,20,20)', 'rgb(240,240,240)')];
  const dark = [card('rgb(238,238,238)', 'rgb(24,26,32)')];    // light text on dark card — clears
  const r = assertBothSchemes({ light, dark });
  assert.equal(r.ok, true, JSON.stringify(r.failing));
  assert.deepEqual(r.measured, ['light', 'dark']);
  assert.match(formatSchemes(r), /measured light, dark/);
});

test('MUST FAIL — only one scheme measured is refused ("not measured is not passed")', () => {
  const r = assertBothSchemes({ light: [card('rgb(20,20,20)', 'rgb(240,240,240)')] });
  assert.equal(r.ok, false);
  assert.deepEqual(r.measured, ['light']);
  assert.match(r.why, /not measured is not a scheme that passed/);
});

test('the contrast floor only measures elements that paint their own background', () => {
  // an element with no own background is not counted (its real bg is an ancestor, a browser job)
  const els = [{ tag: 'span', text: 'hi', styles: { color: 'rgb(20,20,20)', backgroundColor: 'rgba(0, 0, 0, 0)' } }];
  assert.equal(schemeContrastFloor(els).notApplicable, true);
});

test('the failing scheme is named even when BOTH fail', () => {
  const bad = [card('rgb(20,20,20)', 'rgb(26,26,26)')];
  const r = assertBothSchemes({ light: bad, dark: bad });
  assert.equal(r.ok, false);
  assert.deepEqual([...new Set(r.failing.map((f) => f.scheme))].sort(), ['dark', 'light']);
});
