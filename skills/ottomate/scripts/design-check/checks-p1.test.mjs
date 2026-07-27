// P1 — the SOURCE half of the panel-rule tail. One MUST-FAIL and one MUST-PASS per rule, plus an
// explicit notApplicable case for each of the four chart rules.
//
// The notApplicable assertions are the load-bearing ones here. A chart rule that silently passes on
// chart-free markup would let four rules claim coverage they never exercised — the easiest way to
// fake a number in this file, and the thing the parent plan called out by name.
// run: node --test checks-p1.test.mjs

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DETECTORS, hasChart, actionLabels } from './checks.mjs';
import { readFileSync } from 'node:fs';

const RULES = JSON.parse(readFileSync(new URL('../../data/design-rules.json', import.meta.url), 'utf8'));
const ruleFor = (id) => RULES.rules.find((r) => r.id === id);
const run = (id, src) => DETECTORS[id].fn(src, ruleFor(id), {});
const fails = (r, why) => { assert.equal(r.pass, false, why || `expected a finding, got: ${r.detail}`); return r; };
const passes = (r) => { assert.equal(r.pass, true, r.detail); return r; };
const notApplicable = (r) => {
  assert.equal(r.notApplicable, true, `expected notApplicable, got pass=${r.pass}: ${r.detail}`);
  return r;
};

// A chart-free variant: a real poster card, of the kind every Screenroom round actually renders.
const NO_CHART = `
  <article class="poster-card">
    <img src="data:image/png;base64,AAA" alt="Poster">
    <h3 class="title">Arrival</h3>
    <p class="meta">2016 · Sci-Fi</p>
    <svg viewBox="0 0 24 24"><rect x="2" y="4" width="20" height="2"/><rect x="2" y="11" width="20" height="2"/><rect x="2" y="18" width="20" height="2"/></svg>
  </article>`;

// A real bar chart: axis furniture present, so hasChart() recognises it.
const barChart = (rects, extra = '') => `
  <figure class="usage-chart" ${extra}>
    <svg viewBox="0 0 200 120">
      <line class="axis" x1="20" y1="100" x2="190" y2="100"/>
      <text x="10" y="104">0</text>
      ${rects}
    </svg>
  </figure>`;

test('hasChart — a hamburger icon is not a chart; an axis-bearing plot is', () => {
  assert.equal(hasChart(NO_CHART), false, 'three decorative rects with no axis must not count as a chart');
  assert.equal(hasChart(barChart('<rect x="30" y="40" width="20" height="60"/>')), true);
});

test('adv-bar-zero-baseline — a declared non-zero minimum is caught', () => {
  const bars = '<rect x="30" y="40" width="20" height="60"/><rect x="60" y="20" width="20" height="80"/><rect x="90" y="55" width="20" height="45"/>';
  fails(run('adv-bar-zero-baseline', barChart(bars, 'data-y-min="20"')),
    'a truncated axis on a length encoding is the exact C3 failure');
  passes(run('adv-bar-zero-baseline', barChart(bars, 'data-y-min="0"')));
  notApplicable(run('adv-bar-zero-baseline', NO_CHART));
});

test('adv-bar-zero-baseline — bars whose bottom edges do not line up are caught', () => {
  // y+height: 100, 100, 82 — the third bar floats, so its length is not comparable.
  const floating = '<rect x="30" y="40" width="20" height="60"/><rect x="60" y="20" width="20" height="80"/><rect x="90" y="55" width="20" height="27"/>';
  const r = fails(run('adv-bar-zero-baseline', barChart(floating)));
  assert.match(r.detail, /baseline/, 'the detail must name what it measured');
});

test('adv-series-cap-and-labels — nine series is past every cap; four labelled ones pass', () => {
  const series = (n) => Array.from({ length: n }, (_, i) => `<path class="series s${i}" stroke="#${i}${i}${i}aa${i}f" d="M0 0"/>`).join('');
  fails(run('adv-series-cap-and-labels', barChart(series(9))));
  passes(run('adv-series-cap-and-labels', barChart(series(4) + '<text class="label">A</text>')));
  notApplicable(run('adv-series-cap-and-labels', NO_CHART));
});

test('adv-series-cap-and-labels — a legend with no direct labels is flagged', () => {
  const series = Array.from({ length: 4 }, (_, i) => `<path class="series" d="M0 0"/>`).join('');
  const r = fails(run('adv-series-cap-and-labels', barChart(series) + '<ul class="legend"><li>A</li></ul>'));
  assert.match(r.detail, /legend/);
});

test('adv-encoding-channel — precise percentages in a donut are caught; a bar plot is not', () => {
  const donut = `<figure class="donut-chart"><svg viewBox="0 0 42 42">
    <circle cx="21" cy="21" r="15.9" stroke-dasharray="42 58"/><text x="10" y="4">axis</text><text>42.5%</text><text>31.2%</text></svg></figure>`;
  fails(run('adv-encoding-channel', donut), 'angle/area read less accurately than position or length');
  passes(run('adv-encoding-channel', barChart('<rect x="30" y="40" width="20" height="60"/><rect x="60" y="20" width="20" height="80"/><rect x="90" y="30" width="20" height="70"/>')));
  notApplicable(run('adv-encoding-channel', NO_CHART));
});

test('adv-p3-meaning-independent — p3 with no sRGB before it is caught', () => {
  fails(run('adv-p3-meaning-independent', '<style>.badge{color:color(display-p3 1 0.2 0.3)}</style>'),
    'on a non-P3 display the cascade has nothing to fall back to');
  passes(run('adv-p3-meaning-independent', '<style>.badge{color:#e11d48;color:color(display-p3 1 0.2 0.3)}</style>'));
  passes(run('adv-p3-meaning-independent', '<style>.badge{color:#e11d48}</style>'));
});

test('adv-p3-meaning-independent — the fallback must be the SAME property', () => {
  fails(run('adv-p3-meaning-independent',
    '<style>.badge{background:#111;color:color(display-p3 1 0.2 0.3)}</style>'),
    'an sRGB background does not make a P3 colour degrade');
});

test('adv-plain-language — a 30-word sentence is caught, ordinary copy is not', () => {
  const longSentence = '<p>' + 'This particular setting will allow you to configure the way that the system behaves whenever a new item happens to arrive in the queue for processing today.' + '</p>';
  fails(run('adv-plain-language', longSentence));
  passes(run('adv-plain-language', '<p>Downloads finished. Two files were added to your library. Open the library to see them.</p>'));
});

test('adv-plain-language — a seven-sentence paragraph is caught', () => {
  const para = '<p>' + 'It runs. It works. It syncs. It scales. It logs. It retries. It exits.' + '</p>';
  const r = fails(run('adv-plain-language', para));
  assert.match(r.detail, /paragraph/);
});

test('adv-plain-language — class names and code are never scanned as prose', () => {
  const codeOnly = '<style>.a-very-long-class-name-that-goes-on{color:red}</style><script>const x = "one two three";</script><div class="x"></div>';
  notApplicable(run('adv-plain-language', codeOnly));
});

// REGRESSION — the first version of this rule measured visibleText() over the whole panel and
// reported all three published Screenroom r1 panels as carrying a 30-word run-on sentence. It was
// reading every independent card label joined by spaces. Card labels are not prose.
test('adv-plain-language — a card of short labels is NOT a run-on sentence', () => {
  const posterCard = `<article class="poster-card">
      <h3 class="title">Arrival</h3>
      <span class="chip">2160p</span><span class="chip">DV</span><span class="chip">Owned</span>
      <span class="meta">2016</span><span class="meta">14.2 GB</span><span class="state">rest · owned</span>
    </article>`;
  notApplicable(run('adv-plain-language', posterCard));

  // and the real thing, byte for byte
  const real = readFileSync(new URL('../../../../docs/rounds/screenroom-postercard-r1/panel-cinema-plate.html', import.meta.url), 'utf8');
  const r = run('adv-plain-language', real);
  assert.equal(r.pass, true, `must not fire on our own published panel: ${r.detail}`);
});

// P3 — actionLabels must read the ACCESSIBLE NAME, not the glyph. Before this, every correctly-built
// icon button in all nine published Screenroom panels was reported as a 1-word label ("i", "▶"),
// which is worse than the rule not running: it trains you to ignore the finding.
test('actionLabels — aria-label wins over inner text, so an icon button reads correctly', () => {
  assert.deepEqual(actionLabels('<button aria-label="Quick look">i</button>'), ['Quick look']);
  assert.deepEqual(actionLabels('<button aria-label="Play film">&#9654;</button>'), ['Play film']);
  assert.deepEqual(actionLabels('<button title="Add to list">+</button>'), ['Add to list'], 'title is the next fallback');
  assert.deepEqual(actionLabels('<button>Save changes</button>'), ['Save changes'], 'plain text still works');
  assert.deepEqual(actionLabels("<a aria-label='Open library' href='#'>x</a>"), ['Open library'], 'single quotes too');
});

test('adv-action-label-specific — no longer fires on a real icon button from our own panels', () => {
  const real = readFileSync(new URL('../../../../docs/rounds/screenroom-postercard-r1/panel-cinema-plate.html', import.meta.url), 'utf8');
  const r = run('adv-action-label-specific', real);
  assert.equal(r.pass, true, `must read the aria-label, not the glyph: ${r.detail}`);
  // and it must still catch a genuinely vague label
  assert.equal(run('adv-action-label-specific', '<button>OK</button><button>Submit</button>').pass, false);
});

test('all five P1 source rules are registered as {scope, fn}, not as bare functions', () => {
  for (const id of ['adv-p3-meaning-independent', 'adv-bar-zero-baseline', 'adv-series-cap-and-labels', 'adv-encoding-channel', 'adv-plain-language']) {
    assert.ok(DETECTORS[id], `${id} is not in DETECTORS`);
    assert.equal(typeof DETECTORS[id].fn, 'function', `${id} must be registered as { scope, fn }`);
    assert.equal(DETECTORS[id].scope, 'variant');
  }
});
