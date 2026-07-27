// Tests for the source constraint checker.
//
// DISCIPLINE: every implemented rule gets BOTH a case that must FAIL and a case that must PASS.
// A detector with only a passing test proves nothing — it is indistinguishable from a stub that
// returns true. That is exactly the overclaim two verifiers have already caught this program making.

import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
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

// Downgraded block_owner -> advise 2026-07-23: DSD shadow-isolation makes a cross-variant collision
// harmless, so it now ANNOTATES rather than blocks (else it would reject legitimate isolated sets).
test('block-svg-id-collision still DETECTS shared ids/classes/keyframes/:root, now as advisory', () => {
  const a = `<svg><linearGradient id="grain"/></svg>`;
  const b = `<svg><linearGradient id="grain"/></svg>`;
  let r = runCheck({ variants: { A: a, B: b }, rules: RULES });
  assert.ok(r.advisories.some((f) => f.rule === 'block-svg-id-collision'), 'shared SVG id');
  assert.equal(r.pass, true, 'collision is advisory now — it must NOT block a DSD-isolated set');

  r = runCheck({ variants: { A: `<style>@keyframes pulse{}</style>`, B: `<style>@keyframes pulse{}</style>` }, rules: RULES });
  assert.ok(r.advisories.some((f) => f.rule === 'block-svg-id-collision'), 'shared @keyframes name');

  r = runCheck({ variants: { A: `<style>.card{color:red}</style>`, B: `<style>.card{color:blue}</style>` }, rules: RULES });
  assert.ok(r.advisories.some((f) => f.rule === 'block-svg-id-collision'), 'shared class');

  r = runCheck({ variants: { A: `<style>:root{--accent:#f00}</style>`, B: `<style>:root{--accent:#00f}</style>` }, rules: RULES });
  assert.ok(r.advisories.some((f) => f.rule === 'block-svg-id-collision'), 'shared :root custom property');
});

test('block-svg-id-collision is silent when variants are namespaced', () => {
  const r = runCheck({
    variants: {
      A: `<svg><linearGradient id="v1-grain"/></svg><style>.v1-card{color:red}</style>`,
      B: `<svg><linearGradient id="v2-grain"/></svg><style>.v2-card{color:blue}</style>`,
    },
    rules: RULES,
  });
  assert.ok(![...r.blocked, ...r.advisories].some((f) => f.rule === 'block-svg-id-collision'));
});

// ── A3 batch source detectors ─────────────────────────────────────────────────

test('adv-token-layer-direction flags a name mixing colour + role, and a too-deep chain', () => {
  assert.ok(fires('adv-token-layer-direction', `<style>:root{--color-blue-action:#00f}.b{color:var(--color-blue-action)}</style>`), 'colour+role in one name');
  assert.ok(fires('adv-token-layer-direction', `<style>:root{--a:var(--b);--b:var(--c);--c:var(--d);--d:var(--e);--e:#000}</style>`), '4-hop chain exceeds the 3-hop cap');
  assert.ok(!fires('adv-token-layer-direction', `<style>:root{--blue-600:#2563eb;--color-action:var(--blue-600)}.b{color:var(--color-action)}</style>`));
});

test('adv-raw-value-drift flags a literal that duplicates a token value', () => {
  assert.ok(fires('adv-raw-value-drift', `<style>:root{--radius-2:8px}.c{border-radius:8px}</style>`));
  assert.ok(!fires('adv-raw-value-drift', `<style>:root{--radius-2:8px}.c{border-radius:var(--radius-2)}</style>`));
  assert.ok(!fires('adv-raw-value-drift', `<style>:root{--radius-2:8px}.c{margin:0;padding:1px}</style>`), '0 and 1px are exempt');
});

test('adv-single-icon-set flags mixed icon grids/strokes', () => {
  assert.ok(fires('adv-single-icon-set', `<svg viewBox="0 0 24 24" stroke-width="2"></svg><svg viewBox="0 0 20 20" stroke-width="2"></svg>`), 'mixed grid');
  assert.ok(fires('adv-single-icon-set', `<svg viewBox="0 0 24 24" stroke-width="2"></svg><svg viewBox="0 0 24 24" stroke-width="1.5"></svg>`), 'mixed stroke');
  assert.ok(!fires('adv-single-icon-set', `<svg viewBox="0 0 24 24" stroke-width="2"></svg><svg viewBox="0 0 24 24" stroke-width="2"></svg>`));
});

test('adv-no-image-distortion flags object-fit: fill', () => {
  assert.ok(fires('adv-no-image-distortion', `<style>img{object-fit:fill}</style>`));
  assert.ok(!fires('adv-no-image-distortion', `<style>img{object-fit:cover;object-position:center}</style>`));
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
  // a hex COLOUR in a gradient must NOT be mistaken for an ID selector (regression from the first real round)
  assert.ok(!fires('adv-css-layer-order', `<style>.p{background:linear-gradient(90deg,#0a5,#ffcf8a,#a05)}</style>`), 'hex colour is not an ID selector');
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

test('adv-no-slop-tells FIRES on the templated-tax signatures', () => {
  const { DETECTORS } = D;
  const fn = DETECTORS['adv-no-slop-tells'].fn;
  const strip = fn('.stat{border-left:3px solid #e9b84c}');
  assert.equal(strip.pass, false, 'the coloured left strip is the most reliable tell F2 names');
  assert.match(strip.detail, /left strip/);
  const centred = fn('.a{text-align:center}.b{text-align:center}.c{text-align:center}.d{text-align:center}');
  assert.equal(centred.pass, false, 'centring everything is the no-decision default');
  const oneRadius = fn('.a{border-radius:8px}.b{border-radius:8px}.c{border-radius:8px}.d{border-radius:8px}.e{border-radius:8px}');
  assert.equal(oneRadius.pass, false, 'one radius on everything means no ladder');
});

test('adv-no-slop-tells PASSES honest source — it must not fire on a real design', () => {
  const { DETECTORS } = D;
  const fn = DETECTORS['adv-no-slop-tells'].fn;
  const honest = '.card{border-radius:12px}.chip{border-radius:999px}.badge{border-radius:3px}'
    + '.t{text-align:left}.n{text-align:right}';
  const r = fn(honest);
  assert.equal(r.pass, true, r.detail);
});

test('every enforced rule names a test AND either has a detector or is gate-enforced', () => {
  for (const rule of RULES.rules) {
    if (rule.status !== 'enforced') continue;
    assert.ok(rule.enforced_by, `rule "${rule.id}" claims enforced without naming a test`);
    // A rule is legitimately enforced by one of FOUR subsystems, each naming its own suite:
    //   - a design-check source detector (DETECTOR_IDS below)
    //   - the isolation gate / variant harness
    //   - the COMPUTED checker (browser)
    //   - the LEDGER (method:'ledger') — rules about the decision GRAPH rather than the artifact.
    //     `lock-regression-gate` is the snapshot differ; `seq-parents-locked` is buildRoundInput
    //     excluding locked axes from the contested set. Both were built and left marked `pending`,
    //     which hides real coverage — the mirror image of overclaiming, and just as wrong.
    const elsewhereEnforced = /isolation-gate\.test|harness-dsd\.test|computed-checks|computed-rules[\w-]*\.test|pixel[\w-]*\.test|ledger-context\.test|method-routing\.test/.test(rule.enforced_by);
    assert.ok(DETECTOR_IDS.has(rule.id) || elsewhereEnforced, `rule "${rule.id}" claims enforced but has no detector and is not gate/computed-enforced`);
  }
});

// The check above matches a SUBSTRING, so a rule can pass it by mentioning a suite in passing —
// which is exactly what happened when the P1 computed rules were first flipped: their prose named
// `computed-checks.js` and matched by accident, while the real suite (`computed-rules-p1.test.mjs`)
// was not in the alternation at all. A guard that can be satisfied by coincidence is not a guard.
test('every test file named in an enforced_by actually exists on disk', () => {
  const here = fileURLToPath(new URL('.', import.meta.url));
  const roots = [here, path.join(here, 'pixel'), path.join(here, '..', 'preview-build'), path.join(here, '..', 'generation')];
  const missing = [];
  for (const rule of RULES.rules) {
    if (rule.status !== 'enforced' || !rule.enforced_by) continue;
    for (const name of rule.enforced_by.match(/[\w.-]+\.test\.mjs/g) ?? []) {
      if (!roots.some((r) => existsSync(path.join(r, name)))) missing.push(`${rule.id} -> ${name}`);
    }
  }
  assert.deepEqual(missing, [], `enforced_by names a test file that does not exist: ${missing.join(', ')}`);
});
const D = await import('./checks.mjs');
const DETECTOR_IDS = new Set(Object.keys(D.DETECTORS));
