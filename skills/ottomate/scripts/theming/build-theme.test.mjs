// Tests for build-theme.mjs — DTCG resolution + CSS emit. run: node --test build-theme.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadTheme, resolveValue, flattenScheme, resolvedColorMap, emitCss, cssValue } from './build-theme.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const theme = loadTheme(path.join(HERE, 'cointrail.tokens.json'));

test('resolveValue follows a semantic->primitive alias to a concrete hex', () => {
  // semantic.light.color.surface -> {primitive.color.white} -> #ffffff
  const tok = theme.semantic.light.color.surface;
  assert.equal(resolveValue(theme, tok.$value), '#ffffff');
});

test('resolveValue passes through non-alias values (cubicBezier array, shadow string)', () => {
  assert.deepEqual(resolveValue(theme, [0.4, 0, 0.2, 1]), [0.4, 0, 0.2, 1]);
  assert.equal(resolveValue(theme, '9999px'), '9999px');
});

test('an unresolved alias throws (fail loud, never emit a broken var)', () => {
  assert.throws(() => resolveValue(theme, '{primitive.color.nope}'), /unresolved token alias/);
});

test('an alias cycle is caught, not looped forever', () => {
  const t = { a: { $value: '{b}' }, b: { $value: '{a}' } };
  assert.throws(() => resolveValue(t, '{a}'), /cycle/);
});

test('flattenScheme exposes ONLY the semantic tier as --group-leaf vars', () => {
  const light = flattenScheme(theme, 'light');
  const byVar = Object.fromEntries(light.map((r) => [r.cssVar, r.css]));
  assert.equal(byVar['--color-surface'], '#ffffff');
  assert.equal(byVar['--color-on-surface'], '#0f172a');
  assert.equal(byVar['--radius-md'], '0.75rem');
  assert.equal(byVar['--motion-ease-standard'], 'cubic-bezier(0.4, 0, 0.2, 1)');
  // no primitive ever leaks into a var name
  assert.ok(light.every((r) => !r.cssVar.includes('primitive')));
});

test('dark scheme resolves to cointrail dark values, not light ones', () => {
  const dark = Object.fromEntries(flattenScheme(theme, 'dark').map((r) => [r.cssVar, r.css]));
  assert.equal(dark['--color-surface'], '#0e0e18');
  assert.equal(dark['--color-on-surface'], '#f1f5f9');
  assert.equal(dark['--color-action'], '#60a5fa');
});

test('resolvedColorMap returns only colour tokens, path->hex', () => {
  const m = resolvedColorMap(theme, 'light');
  assert.equal(m['color.surface'], '#ffffff');
  assert.equal(m['color.action'], '#1d4ed8');
  assert.ok(!('radius.md' in m), 'non-colour tokens are excluded');
});

test('cssValue renders a cubicBezier as a CSS cubic-bezier()', () => {
  assert.equal(cssValue('cubicBezier', [0, 0, 0.2, 1]), 'cubic-bezier(0, 0, 0.2, 1)');
});

test('emitCss writes both a light block and a .dark block under [data-theme]', () => {
  const css = emitCss(theme, { themeName: 'cointrail' });
  assert.match(css, /\[data-theme="cointrail"\] \{/);
  assert.match(css, /\[data-theme="cointrail"\]\.dark \{/);
  assert.match(css, /--color-surface: #ffffff;/);
});
