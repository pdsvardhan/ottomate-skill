// C10 — accent contrast guaranteed at derivation time. run: node --test theme-extract.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { relLuminance, contrastRatio, hexLuminance, normaliseForContrast } from './theme-extract.mjs';

const rgbToHsv = (r, g, b) => {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b), d = max - min;
  let h = 0;
  if (d) { if (max === r) h = ((g - b) / d) % 6; else if (max === g) h = (b - r) / d + 2; else h = (r - g) / d + 4; h *= 60; if (h < 0) h += 360; }
  return { h, s: max === 0 ? 0 : d / max, v: max };
};
const DARK_BG = hexLuminance('#101216');

test('WCAG luminance + contrast sanity: black vs white is 21:1', () => {
  assert.ok(Math.abs(contrastRatio(relLuminance(0, 0, 0), relLuminance(255, 255, 255)) - 21) < 0.1);
});

test('MUST FIX — a dark accent that FAILS 3:1 on #101216 before, passes after normalising', () => {
  const deepBlue = { r: 26, g: 42, b: 90 }; // #1a2a5a — a plausible accent from a dark poster
  const before = contrastRatio(relLuminance(deepBlue.r, deepBlue.g, deepBlue.b), DARK_BG);
  assert.ok(before < 3, `precondition: it fails 3:1 (was ${before.toFixed(2)})`);
  const { h, s, v } = rgbToHsv(deepBlue.r, deepBlue.g, deepBlue.b);
  const n = normaliseForContrast(h, s, v);
  assert.ok(n.contrast >= 3, `after: clears 3:1 (got ${n.contrast.toFixed(2)})`);
  assert.equal(n.adjusted, true);
});

test('MUST PASS — the gold #e9b84c is already in band and is NOT moved', () => {
  const { h, s, v } = rgbToHsv(0xe9, 0xb8, 0x4c);
  const n = normaliseForContrast(h, s, v);
  // luminance ~0.52, well inside [0.116, 0.75] and vivid — value must be unchanged
  assert.equal(n.v, v, 'value unchanged');
  assert.ok(n.contrast >= 3);
});

test('MUST PASS — a very light accent still clears 3:1 on the dark canvas after the fix', () => {
  const { h, s, v } = rgbToHsv(0xf0, 0xe6, 0xc8); // pale cream
  const n = normaliseForContrast(h, s, v);
  assert.ok(n.contrast >= 3);
  assert.ok(n.v <= v + 1e-9, 'a light colour is never raised further');
});

test('the floor and background are honoured — a stricter floor raises the luminance more', () => {
  const { h, s, v } = rgbToHsv(26, 42, 90);
  const at3 = normaliseForContrast(h, s, v, { contrastFloor: 3 });
  const at45 = normaliseForContrast(h, s, v, { contrastFloor: 4.5 });
  assert.ok(at45.lum >= at3.lum, 'a higher floor demands more luminance');
  assert.ok(at45.contrast >= 4.5 - 0.05);
});

test('chroma is clamped into the band — a near-grey accent is pushed to a minimum vividness', () => {
  const n = normaliseForContrast(40, 0.05, 0.6, { chromaRange: [0.35, 0.9] });
  assert.ok(n.s >= 0.35);
});

// D-1 (2026-07-28) — the final-test-pass regression: two REAL radarr poster raws (#64, #78) are so
// saturated + dark that raising V alone caps out at 2.8:1. The desaturation fallback must clear 3:1.
test('D-1 — a saturated deep-indigo poster raw that V-raising could not fix now clears 3:1', () => {
  for (const [name, hex] of [['#64', 0x16145c], ['#78', 0x15125e]]) {
    const r = (hex >> 16) & 255, g = (hex >> 8) & 255, b = hex & 255;
    const before = contrastRatio(relLuminance(r, g, b), hexLuminance('#101216'));
    assert.ok(before < 3, `${name} raw should fail before (got ${before.toFixed(2)})`);
    const { h, s, v } = rgbToHsv(r, g, b);
    const n = normaliseForContrast(h, s, v);
    assert.ok(n.contrast >= 3, `${name} clears 3:1 after (got ${n.contrast.toFixed(2)})`);
    assert.ok(n.s < s, `${name} was desaturated to reach the floor (s ${s.toFixed(2)} -> ${n.s.toFixed(2)})`);
  }
});

test('D-1 — the desaturation fallback still leaves gold #e9b84c untouched (never fires unnecessarily)', () => {
  const { h, s, v } = rgbToHsv(0xe9, 0xb8, 0x4c);
  const n = normaliseForContrast(h, s, v);
  assert.equal(n.s, Math.min(Math.max(s, 0.35), 0.9), 'saturation only clamped to the band, never desaturated');
});
