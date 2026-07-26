// Structural test for the declarative-shadow-DOM isolation of markup-mode panels.
//
// SCOPE HONESTY: this proves the emitted STRUCTURE — that each variant's markup and its <style> land
// in their OWN <template shadowrootmode="open">, so a shared class / id / @keyframes cannot leak across
// panels. It does NOT prove RENDERING — that a browser attaches the shadow roots and scopes the
// cascade. That was verified separately by running the probe in the real Artifact sandbox 2026-07-23
// (artifact 1d77da20; see docs/plans/2026-07-23-C1-harness-dsd-isolation.md). Node cannot see the
// cascade, so do not upgrade this to a rendering claim.

import test from 'node:test';
import assert from 'node:assert/strict';
import { renderPanelStatic } from './build-variant-set.mjs';

// Two panels that deliberately COLLIDE — same class, same SVG gradient id, same @keyframes name.
// In the leaky (shared-document) world these overwrite each other; wrapped in separate shadow roots
// they are independent.
const panelA = {
  slot: 'A', label: 'flat', caption: 'flat', tokens: { radius: '0px' },
  markup: '<style>.box{color:#0a0}@keyframes pulse{}</style><svg><linearGradient id="grad"/></svg><div class="box">A</div>',
};
const panelB = {
  slot: 'B', label: 'raised', caption: 'raised', tokens: { radius: '16px' },
  markup: '<style>.box{color:#a0a}@keyframes pulse{}</style><svg><linearGradient id="grad"/></svg><div class="box">B</div>',
};

test('each markup panel is wrapped in its own declarative shadow root', () => {
  const html = renderPanelStatic(panelA) + renderPanelStatic(panelB);
  const roots = html.match(/<template shadowrootmode="open">/g) || [];
  assert.equal(roots.length, 2, 'exactly one shadow root per panel');
});

test('a colliding class lives in SEPARATE shadow roots, so it cannot leak', () => {
  const html = renderPanelStatic(panelA) + renderPanelStatic(panelB);
  // Split into the two template bodies and assert each carries its OWN colour.
  const bodies = html.split('<template shadowrootmode="open">').slice(1);
  assert.equal(bodies.length, 2);
  assert.ok(bodies[0].includes('color:#0a0'), 'panel A keeps its green');
  assert.ok(bodies[1].includes('color:#a0a'), 'panel B keeps its purple');
  assert.ok(!bodies[0].includes('color:#a0a'), "panel A's root does not contain B's style");
  assert.ok(!bodies[1].includes('color:#0a0'), "panel B's root does not contain A's style");
});

test('panel chrome (head + meta) stays OUTSIDE the shadow root', () => {
  const html = renderPanelStatic(panelA);
  const beforeTemplate = html.split('<template')[0];
  assert.ok(beforeTemplate.includes('vs-panel-head'), 'head is outside the shadow root');
  assert.ok(html.includes('<div class="vs-meta">'), 'meta present');
  // The variant markup must be INSIDE a template, not loose in the document. This is the load-bearing
  // assertion: if the markup were outside the template it would render in the page's scope and leak.
  const looseBox = html.replace(/<template[\s\S]*?<\/template>/g, '');
  assert.ok(!looseBox.includes('class="box"'), 'no variant markup leaks outside the shadow root');
  assert.ok(!looseBox.includes('id="grad"'), 'no variant SVG id leaks outside the shadow root');
});

test('a <script> inside a variant is flagged as inert, not silently dropped', () => {
  const withScript = { ...panelA, markup: '<div class="box">A</div><script>doThing()</script>' };
  const html = renderPanelStatic(withScript);
  assert.match(html, /vs-warn/, 'the meta flags that the script will not run');
  assert.match(html, /will not run/);
  // and it is still emitted inside the (inert) template, not executed
  assert.ok(html.includes('<template shadowrootmode="open">'));
});

test('markup with $ (regex-special) survives — it is not a replacement pattern', () => {
  const dollar = { ...panelA, markup: '<div class="box">$1 &amp; $$ price</div>' };
  const html = renderPanelStatic(dollar);
  assert.ok(html.includes('$1 &amp; $$ price'), 'literal $ preserved');
});

test('no head/meta values are left unescaped', () => {
  // caption is truthy so it (not label) fills vs-level; a token key/value carry angle brackets too.
  // Distinctive injection markers (<inj>) so the meta's own legitimate <b> tags don't confuse the check.
  const nasty = { slot: 'A', label: 'unused', caption: '"><script>alert(1)</script>', tokens: { 'k<inj>': 'v<inj>' }, markup: '<div>ok</div>' };
  const html = renderPanelStatic(nasty);
  const chrome = html.split('<template')[0] + html.split('</template>')[1];
  assert.ok(!chrome.includes('<script>'), 'the caption cannot inject a <script> tag');
  assert.ok(!chrome.includes('<inj>'), 'a token key or value cannot inject a tag');
  assert.ok(chrome.includes('&lt;script&gt;'), 'the caption is present in escaped form');
  assert.ok(chrome.includes('&lt;inj&gt;'), 'token markers present in escaped form');
});
