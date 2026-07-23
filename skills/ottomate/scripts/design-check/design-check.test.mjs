// Tests for the source constraint checker.
//
// DISCIPLINE: every implemented rule gets BOTH a case that must FAIL and a case that must PASS.
// A detector with only a passing test proves nothing — it is indistinguishable from a stub that
// returns true. That is exactly the overclaim two verifiers have already caught this program making.

import test from 'node:test';
import assert from 'node:assert/strict';
import { runCheck, resolveFloor, loadRules, formatCheck, annotationsByVariant } from './design-check.mjs';
import { stripComments, visibleText, actionLabels, animationNames } from './checks.mjs';

const RULES = loadRules();

// Findings for one rule id, from a single variant.
function fire(ruleId, source, contract = {}, profile = 'P1') {
  const r = runCheck({ variants: { A: source }, contract, profile, rules: RULES });
  return [...r.blocked, ...r.advisories].filter((f) => f.rule === ruleId);
}
const fires = (ruleId, src, contract) => fire(ruleId, src, contract).length > 0;

// A minimal variant that violates nothing — the baseline every "good" case builds on.
const CLEAN = `<style>
  .card { border-radius: 8px; padding: 16px; background: #14161c; color: #eef0f4; }
  .card:hover .act { opacity: 1; }
  .card:focus-within .act { opacity: 1; }
  .act { opacity: 0; }
</style>
<article class="card"><h3>Blade Runner</h3><button type="button">Play film</button></article>`;

// ── helpers ─────────────────────────────────────────────────────────────────

test('helpers behave', () => {
  assert.equal(stripComments('a<!-- x -->b'), 'a b');
  assert.equal(stripComments('a/* x */b'), 'a b');
  assert.ok(stripComments('src="https://x"').includes('https://'), '// in a URL must survive');
  assert.equal(visibleText('<style>.a{}</style><p>Hi</p>'), 'Hi');
  assert.deepEqual(actionLabels('<button>Play film</button>'), ['Play film']);
  assert.deepEqual(animationNames('@keyframes fade-up { }').sort(), ['fade-up']);
});

// ── the profile filter is executable, not prose ─────────────────────────────

test('resolveFloor returns DIFFERENT sets per profile', () => {
  const p1 = resolveFloor('P1', RULES);
  const p3 = resolveFloor('P3', RULES);
  assert.ok(p1.block.length < p3.block.length, 'P3 must block more than P1');
  assert.ok(p3.block.includes('floor-target-size'), 'P3 blocks target size');
  assert.ok(p1.skip.includes('floor-target-size'), 'P1 skips target size');
  assert.ok(p1.advise.includes('floor-contrast'), 'P1 advises contrast (their eyes, their call)');
  assert.ok(p3.block.includes('floor-contrast'), 'P3 blocks contrast');
  assert.throws(() => resolveFloor('P9', RULES), /unknown audience profile/);
});

test('a per-project override beats the profile preset', () => {
  const strict = resolveFloor('P1', RULES, { 'floor-target-size': 'block' });
  assert.ok(strict.block.includes('floor-target-size'), 'the profile is a preset, not a straitjacket');
});

// ── feasibility: fail closed, never profile-filtered ────────────────────────

test('feas-no-eval fires on dynamic code and not on clean source', () => {
  assert.ok(fires('feas-no-eval', `<script>eval("1+1")</script>`));
  assert.ok(fires('feas-no-eval', `<script>const f = new Function("return 1")</script>`));
  assert.ok(fires('feas-no-eval', `<a href="javascript:void(0)">x</a>`));
  assert.ok(!fires('feas-no-eval', CLEAN));
});

test('feas-no-wasm fires on WebAssembly and on Rive by name', () => {
  assert.ok(fires('feas-no-wasm', `<script>WebAssembly.instantiate(b)</script>`));
  assert.ok(fires('feas-no-wasm', `<script>/* rive-runtime bundled */ const r = rive-runtime;</script>`.replace('/*', '').replace('*/', '')));
  assert.ok(!fires('feas-no-wasm', CLEAN));
});

test('feas-no-network fires on remote refs AND on placeholder services', () => {
  assert.ok(fires('feas-no-network', `<script src="https://cdn.example.com/x.js"></script>`));
  assert.ok(fires('feas-no-network', `<style>@import url("https://fonts.googleapis.com/css2?family=Inter");</style>`));
  assert.ok(fires('feas-no-network', `<img src="https://placehold.co/600x400">`), 'placeholder service');
  assert.ok(fires('feas-no-network', `<img src="https://api.dicebear.com/7.x/initials/svg?seed=x">`), 'DiceBear HTTP API');
  assert.ok(!fires('feas-no-network', CLEAN));
  assert.ok(!fires('feas-no-network', `<img src="data:image/svg+xml;base64,AAA">`), 'a data: URI is not a network call');
});

test('feas-no-inline-handlers fires on on* attributes only in markup', () => {
  assert.ok(fires('feas-no-inline-handlers', `<button onclick="go()">x</button>`));
  assert.ok(!fires('feas-no-inline-handlers', `<script>el.addEventListener('click', go)</script>`));
  assert.ok(!fires('feas-no-inline-handlers', CLEAN));
});

test('feasibility blocks regardless of profile — a blank panel is blank for everyone', () => {
  for (const profile of ['P1', 'P2', 'P3']) {
    const r = runCheck({ variants: { A: `<script>eval("x")</script>` }, profile, rules: RULES });
    assert.equal(r.pass, false, `must block at ${profile}`);
    assert.ok(r.blocked.some((f) => f.tier === 'block_feasibility'));
  }
});

// ── the Phase-1 blocker's static half ───────────────────────────────────────

test('block-svg-id-collision catches shared ids, classes, keyframes and :root props', () => {
  const a = `<svg><linearGradient id="grain"/></svg>`;
  const b = `<svg><linearGradient id="grain"/></svg>`;
  let r = runCheck({ variants: { A: a, B: b }, rules: RULES });
  assert.ok(r.blocked.some((f) => f.rule === 'block-svg-id-collision'), 'shared SVG id');

  r = runCheck({ variants: { A: `<style>@keyframes pulse{}</style>`, B: `<style>@keyframes pulse{}</style>` }, rules: RULES });
  assert.ok(r.blocked.some((f) => f.rule === 'block-svg-id-collision'), 'shared @keyframes name');

  r = runCheck({ variants: { A: `<style>.card{color:red}</style>`, B: `<style>.card{color:blue}</style>` }, rules: RULES });
  assert.ok(r.blocked.some((f) => f.rule === 'block-svg-id-collision'), 'shared class the later panel would override');

  r = runCheck({ variants: { A: `<style>:root{--accent:#f00}</style>`, B: `<style>:root{--accent:#00f}</style>` }, rules: RULES });
  assert.ok(r.blocked.some((f) => f.rule === 'block-svg-id-collision'), 'shared :root custom property goes document-wide');
});

test('block-svg-id-collision passes when variants are namespaced', () => {
  const r = runCheck({
    variants: {
      A: `<svg><linearGradient id="v1-grain"/></svg><style>.v1-card{color:red}</style>`,
      B: `<svg><linearGradient id="v2-grain"/></svg><style>.v2-card{color:blue}</style>`,
    },
    rules: RULES,
  });
  assert.ok(!r.blocked.some((f) => f.rule === 'block-svg-id-collision'));
});

// ── the owner's constraint contract ─────────────────────────────────────────

test('contract must_use fires when a required component is absent', () => {
  const contract = { must_use: ['mc-shine-border'] };
  assert.ok(fires('contract-must-use', CLEAN, contract));
  assert.ok(!fires('contract-must-use', `${CLEAN}<div data-mc="mc-shine-border"></div>`, contract));
  assert.ok(!fires('contract-must-use', CLEAN, {}), 'no constraint declared = nothing to violate');
});

test('contract animation_vocab blocks anything outside the declared vocabulary', () => {
  const contract = { animation_vocab: ['fade-up'] };
  assert.ok(fires('contract-animation-vocab', `<style>@keyframes bounce{}</style>`, contract));
  assert.ok(!fires('contract-animation-vocab', `<style>@keyframes fade-up{}</style>`, contract));
  assert.ok(!fires('contract-animation-vocab', CLEAN, contract), 'no animation at all is within any vocabulary');
});

test('contract forbidden detects each named technique', () => {
  const cases = {
    glassmorphism: `<style>.g{backdrop-filter:blur(12px)}</style>`,
    parallax: `<style>.p{background-attachment:fixed}</style>`,
    bounce: `<style>.b{transition-timing-function:cubic-bezier(.34,1.56,.64,1)}</style>`,
    glow: `<style>.w{box-shadow:0 0 24px #7cf}</style>`,
    'gradient-text': `<style>.t{background:linear-gradient(#f00,#00f);background-clip:text}</style>`,
  };
  for (const [technique, src] of Object.entries(cases)) {
    assert.ok(fires('contract-forbidden', src, { forbidden: [technique] }), `${technique} must be detected`);
    assert.ok(!fires('contract-forbidden', CLEAN, { forbidden: [technique] }), `${technique} must not false-positive`);
  }
});

test('contract forbidden reports an undetectable technique as unverified, not as a pass', () => {
  const f = fire('contract-forbidden', CLEAN, { forbidden: ['vibes'] });
  assert.equal(f.length, 1);
  assert.match(f[0].detail, /NO DETECTOR/);
});

// ── advisory detectors ──────────────────────────────────────────────────────

test('adv-no-font-smoothing fires on the property but NOT on a comment mentioning it', () => {
  assert.ok(fires('adv-no-font-smoothing', `<style>body{-webkit-font-smoothing:antialiased}</style>`));
  assert.ok(
    !fires('adv-no-font-smoothing', `<style>/* no -webkit-font-smoothing: macOS-only [E2 §3.13] */\nbody{line-height:1.5}</style>`),
    'our own templates carry this string in a comment — stripping comments is load-bearing',
  );
});

test('adv-action-label-specific fires on bare generic labels', () => {
  assert.ok(fires('adv-action-label-specific', `<button>Submit</button>`));
  assert.ok(fires('adv-action-label-specific', `<button>Learn more</button>`));
  assert.ok(!fires('adv-action-label-specific', `<button>Delete file</button>`));
  assert.ok(!fires('adv-action-label-specific', CLEAN));
});

test('adv-error-copy-shape fires on blaming vocabulary in visible copy', () => {
  assert.ok(fires('adv-error-copy-shape', `<p class="err">Invalid input</p>`));
  assert.ok(fires('adv-error-copy-shape', `<p>Sorry, an error occurred</p>`));
  assert.ok(!fires('adv-error-copy-shape', `<p>Enter your first name</p>`));
});

test('adv-no-implementation-vocabulary scans visible text, not class names', () => {
  assert.ok(fires('adv-no-implementation-vocabulary', `<p>Value is null</p>`));
  assert.ok(fires('adv-no-implementation-vocabulary', `<p>STATUS_PENDING</p>`));
  assert.ok(!fires('adv-no-implementation-vocabulary', `<div class="isActive"><p>Now playing</p></div>`),
    'a class name is not user-facing copy');
  assert.ok(!fires('adv-no-implementation-vocabulary', CLEAN));
});

test('adv-css-layer-order fires on !important, ID selectors and a wrong @layer order', () => {
  assert.ok(fires('adv-css-layer-order', `<style>.a{color:red!important}</style>`));
  assert.ok(fires('adv-css-layer-order', `<style>#hero{color:red}</style>`));
  assert.ok(fires('adv-css-layer-order', `<style>@layer utilities, components;</style>`), 'utilities before components');
  assert.ok(!fires('adv-css-layer-order', `<style>@layer reset, base, tokens, layout, components, utilities;</style>`));
  assert.ok(!fires('adv-css-layer-order', CLEAN));
});

test('adv-inline-style-attr fires on real declarations but exempts custom-property-only', () => {
  assert.ok(fires('adv-inline-style-attr', `<div style="color:red">x</div>`));
  assert.ok(!fires('adv-inline-style-attr', `<div style="--pad:14px;--gap:14px">x</div>`),
    'per-instance custom properties are how the harness token mode works');
});

test('adv-webkit-prefix-pair fires on a missing prefix and a mis-copied keyword', () => {
  assert.ok(fires('adv-webkit-prefix-pair', `<style>.g{backdrop-filter:blur(8px)}</style>`));
  assert.ok(!fires('adv-webkit-prefix-pair', `<style>.g{-webkit-backdrop-filter:blur(8px);backdrop-filter:blur(8px)}</style>`));
  assert.ok(fires('adv-webkit-prefix-pair', `<style>.m{-webkit-mask-composite:exclude}</style>`),
    'WebKit wants xor, not the standard exclude');
});

test('adv-not-default-inter flags an unexamined default typeface', () => {
  assert.ok(fires('adv-not-default-inter', `<style>body{font-family:"Inter",sans-serif}</style>`));
  assert.ok(!fires('adv-not-default-inter', `<style>body{font-family:"Public Sans",sans-serif}</style>`));
});

test('adv-hover-control-focus-within fires when a hover reveal has no keyboard path', () => {
  assert.ok(fires('adv-hover-control-focus-within', `<style>.act{opacity:0}.card:hover .act{opacity:1}</style>`));
  assert.ok(!fires('adv-hover-control-focus-within', CLEAN), 'CLEAN pairs :hover with :focus-within');
});

test('adv-weight-budget fires past the snappy target', () => {
  const fat = 'x'.repeat(1100 * 1024);
  assert.ok(fires('adv-weight-budget', fat));
  assert.ok(!fires('adv-weight-budget', CLEAN));
});

// ── runner semantics ────────────────────────────────────────────────────────

test('an unimplemented rule is reported as SKIPPED, never as a pass', () => {
  const r = runCheck({ variants: { A: CLEAN }, rules: RULES });
  assert.ok(r.skipped.length > 0);
  assert.ok(r.skipped.some((s) => s.rule === 'adv-cross-component-coherence'), 'a computed rule is out of scope here');
  const implemented = new Set(r.skipped.map((s) => s.rule));
  assert.ok(!implemented.has('feas-no-eval'), 'an implemented rule must not appear as skipped');
});

test('advisories never block; a clean variant passes with annotations available', () => {
  const r = runCheck({ variants: { A: `${CLEAN}<button>Submit</button>` }, rules: RULES });
  assert.ok(r.advisories.some((f) => f.rule === 'adv-action-label-specific'));
  assert.equal(r.pass, true, 'advice must not stop a build');
  const ann = annotationsByVariant(r, ['A']);
  assert.match(ann.A, /adv-action-label-specific/);
});

// Namespacing only `card` is not enough — `.act` is shared too, which the collision detector caught
// on the first run. Kept as a reminder that partial namespacing is the easy mistake here.
const ns = (src, p) => src.replace(/card/g, `${p}card`).replace(/\bact\b/g, `${p}act`);

test('a fully clean set passes with zero findings', () => {
  const r = runCheck({ variants: { A: ns(CLEAN, 'v1'), B: ns(CLEAN, 'v2') }, rules: RULES });
  assert.equal(r.blocked.length, 0, formatCheck(r));
  assert.equal(r.advisories.length, 0, formatCheck(r));
  assert.ok(r.checked > 0);
});

test('every implemented detector id exists in design-rules.json (no drift)', async () => {
  const { DETECTORS } = await import('./checks.mjs');
  const known = new Set(RULES.rules.map((r) => r.id));
  for (const id of Object.keys(DETECTORS)) {
    assert.ok(known.has(id), `detector "${id}" has no rule in design-rules.json`);
  }
});

test('every rule marked enforced has a detector (the register cannot lie)', () => {
  for (const rule of RULES.rules) {
    if (rule.status === 'enforced') {
      assert.ok(DETECTOR_IDS.has(rule.id), `rule "${rule.id}" claims enforced but has no detector`);
      assert.ok(rule.enforced_by, `rule "${rule.id}" claims enforced without naming a test`);
    }
  }
});
const DETECTOR_IDS = new Set(Object.keys((await import('./checks.mjs')).DETECTORS));
