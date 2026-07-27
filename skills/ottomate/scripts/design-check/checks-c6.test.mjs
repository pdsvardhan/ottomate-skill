// C6 batch 2 — one MUST-FAIL and one MUST-PASS per source detector.
// A detector with only a passing test is indistinguishable from a stub returning true.
// run: node --test checks-c6.test.mjs

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DETECTORS } from './checks.mjs';

const fn = (id) => DETECTORS[id].fn;
const fails = (id, src, why) => { const r = fn(id)(src); assert.equal(r.pass, false, why || r.detail); return r; };
const passes = (id, src) => { const r = fn(id)(src); assert.equal(r.pass, true, r.detail); return r; };

test('floor-reduced-motion — motion without an opt-out is an accessibility failure', () => {
  fails('floor-reduced-motion', '.c{transition:transform 200ms ease-out}');
  passes('floor-reduced-motion', '.c{transition:transform 200ms ease-out}@media (prefers-reduced-motion: reduce){.c{transition:none}}');
  passes('floor-reduced-motion', '.c{color:red}');   // no motion, nothing to opt out of
});

test('adv-motion-duration — durations outside the role ladder are caught', () => {
  fails('adv-motion-duration', '.c{transition:transform 1.2s ease}');
  fails('adv-motion-duration', '.c{transition:opacity 20ms linear}');
  passes('adv-motion-duration', '.c{transition:transform 260ms ease-out}');
});

test('adv-compositor-only — animating layout properties is caught, including `all`', () => {
  fails('adv-compositor-only', '.c{transition:height 300ms ease}');
  fails('adv-compositor-only', '.c{transition:all 300ms ease}', 'transition:all animates layout properties too');
  passes('adv-compositor-only', '.c{transition:transform 300ms ease, opacity 200ms ease}');
});

test('adv-easing-direction — linear easing on UI motion reads mechanical', () => {
  fails('adv-easing-direction', '.c{transition:transform 200ms linear}');
  passes('adv-easing-direction', '.c{transition:transform 200ms ease-out}');
});

test('adv-stagger-cap — a stagger long enough to feel broken is caught', () => {
  fails('adv-stagger-cap', '.i:nth-child(9){transition-delay:800ms}');
  passes('adv-stagger-cap', '.i:nth-child(9){transition-delay:180ms}');
});

test('adv-flash-limit — sub-333ms infinite animation is a seizure risk', () => {
  fails('adv-flash-limit', '.c{animation:blink 120ms infinite}');
  passes('adv-flash-limit', '.c{animation:pulse 1200ms infinite}');
  passes('adv-flash-limit', '.c{animation:enter 120ms ease-out}');   // not repeating
});

test('adv-zindex-ladder — 9999 is not a layer, it is an argument', () => {
  fails('adv-zindex-ladder', '.modal{z-index:9999}');
  fails('adv-zindex-ladder', '.a{z-index:1}.b{z-index:2}.c{z-index:3}.d{z-index:4}.e{z-index:5}.f{z-index:6}.g{z-index:7}');
  passes('adv-zindex-ladder', '.base{z-index:1}.overlay{z-index:10}.toast{z-index:20}');
});

test('adv-focus-ring-not-shadow-only — forced-colors deletes box-shadow', () => {
  fails('adv-focus-ring-not-shadow-only', '.b:focus-visible{box-shadow:0 0 0 3px #e9b84c}');
  passes('adv-focus-ring-not-shadow-only', '.b:focus-visible{outline:2px solid #e9b84c;outline-offset:2px}');
  passes('adv-focus-ring-not-shadow-only', '.b{color:red}');   // no focus styling here at all
});

test('adv-icon-delivery-inline-svg — an icon font ships an alphabet to draw an arrow', () => {
  fails('adv-icon-delivery-inline-svg', '<i class="fas fa-chevron-right"></i>');
  fails('adv-icon-delivery-inline-svg', '.icon{font-family:"Material Icons"}');
  passes('adv-icon-delivery-inline-svg', '<svg viewBox="0 0 24 24"><path d="M4 4h16"/></svg>');
});

test('adv-deterministic-placeholder — a variant set must not differ because the dice differed', () => {
  fails('adv-deterministic-placeholder', '<img src="https://example.com/random?sig=1">');
  fails('adv-deterministic-placeholder', '<script>const n = Math.random()</script>');
  passes('adv-deterministic-placeholder', '<img src="data:image/jpeg;base64,AAA">');
});

test('adv-realistic-content — lorem ipsum hides every overflow bug there is', () => {
  fails('adv-realistic-content', '<p>Lorem ipsum dolor sit amet, consectetur.</p>');
  passes('adv-realistic-content', '<p>The Lord of the Rings: The Fellowship of the Ring</p>');
});

test('adv-semantic-separate — a state must not read as branding', () => {
  fails('adv-semantic-separate', ':root{--accent:#e9b84c;--success:#e9b84c}');
  passes('adv-semantic-separate', ':root{--accent:#e9b84c;--success:#7fd6a2}');
  passes('adv-semantic-separate', ':root{--accent:#e9b84c}');   // nothing to compare against
});

test('adv-reduced-transparency — the fourth preference query', () => {
  fails('adv-reduced-transparency', '.glass{backdrop-filter:blur(12px);background:rgba(255,255,255,0.08)}');
  passes('adv-reduced-transparency', '.glass{backdrop-filter:blur(12px)}@media (prefers-reduced-transparency: reduce){.glass{backdrop-filter:none}}');
  passes('adv-reduced-transparency', '.solid{background:#101216}');
});

test('feas-canvas-a11y-mirror — a bare canvas is invisible to assistive tech and to test selectors', () => {
  fails('feas-canvas-a11y-mirror', '<canvas width="400" height="200"></canvas>');
  passes('feas-canvas-a11y-mirror', '<canvas aria-label="Watch time by month"></canvas>');
  passes('feas-canvas-a11y-mirror', '<div>no canvas here</div>');
});

test('every C6 detector is registered against a real rule id', async () => {
  const RULES = (await import('node:fs')).readFileSync(new URL('../../data/design-rules.json', import.meta.url), 'utf8');
  const ids = new Set(JSON.parse(RULES).rules.map((r) => r.id));
  for (const id of Object.keys(DETECTORS)) assert.ok(ids.has(id), `detector "${id}" has no rule`);
});
