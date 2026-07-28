// Theme-from-content extractor (Task 2, §Theme-from-content) — the core differentiator.
// Derives each asset's dominant VIBRANT colour so a card's border always harmonises with its
// real artwork (impossible with fixed hues). ImageMagick v6 `convert` (present on VAULT7A).
// Pluggable: swap this module for a JS lib / colour API — build-preview.mjs only needs extractAccent().

import { execFileSync } from 'node:child_process';

// ── colour maths ────────────────────────────────────────────────────────────
function rgbToHsv(r, g, b) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b), d = max - min;
  let h = 0;
  if (d !== 0) {
    if (max === r) h = ((g - b) / d) % 6;
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h *= 60; if (h < 0) h += 360;
  }
  const s = max === 0 ? 0 : d / max;
  return { h, s, v: max };
}
function hsvToRgb(h, s, v) {
  const c = v * s, x = c * (1 - Math.abs(((h / 60) % 2) - 1)), m = v - c;
  let r = 0, g = 0, b = 0;
  if (h < 60) [r, g, b] = [c, x, 0];
  else if (h < 120) [r, g, b] = [x, c, 0];
  else if (h < 180) [r, g, b] = [0, c, x];
  else if (h < 240) [r, g, b] = [0, x, c];
  else if (h < 300) [r, g, b] = [x, 0, c];
  else [r, g, b] = [c, 0, x];
  return { r: Math.round((r + m) * 255), g: Math.round((g + m) * 255), b: Math.round((b + m) * 255) };
}
const toHex = (r, g, b) => '#' + [r, g, b].map((n) => n.toString(16).padStart(2, '0')).join('').toUpperCase();
const clamp = (n, lo, hi) => Math.max(lo, Math.min(hi, n));

// ── WCAG contrast (C10) ──────────────────────────────────────────────────────
// Contrast is a function of RELATIVE LUMINANCE, not HSV value — a vivid-but-dark hue (a deep blue at
// V 0.9) can still fail against a dark surface. This is what A1 §3.10 means by "normalise L".
export function relLuminance(r, g, b) {
  const f = (c) => { c /= 255; return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; };
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
}
export function contrastRatio(l1, l2) {
  const a = Math.max(l1, l2), b = Math.min(l1, l2);
  return (a + 0.05) / (b + 0.05);
}
export const hexLuminance = (hex) => {
  const h = String(hex).replace('#', '');
  return relLuminance(parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16));
};

/**
 * Normalise a derived accent so its contrast against the target background is GUARANTEED at derivation
 * time (C10, owner ruling: dark canvas #101216, floor 3:1). Corrective, not gratuitous — a colour
 * already inside the band is returned unchanged. Luminance is monotone in HSV value at fixed h,s, so
 * V is the knob. Chroma is clamped into a band first so the result is neither neon nor muddy.
 * @returns {{r,g,b,h,s,v, lum, contrast, adjusted:boolean}}
 */
export function normaliseForContrast(h, s, v, opts = {}) {
  const bgLum = opts.bgLuminance ?? relLuminance(0x10, 0x12, 0x16); // #101216
  const floor = opts.contrastFloor ?? 3.0;
  const [sLo, sHi] = opts.chromaRange ?? [0.35, 0.9];
  const Llo = floor * (bgLum + 0.05) - 0.05;        // exact luminance that clears the floor on the bg
  const Lhi = opts.maxLum ?? 0.75;                   // above this it washes toward white, losing hue
  const s0 = clamp(s, sLo, sHi);
  const lumOf = (vv) => { const { r, g, b } = hsvToRgb(h, s0, vv); return relLuminance(r, g, b); };

  let v0 = v, lum = lumOf(v0), adjusted = false;
  if (lum < Llo) { // too dark for the floor — raise V (monotone) until it clears, with a small margin
    for (let i = 0; i < 80 && lumOf(v0) < Llo; i++) v0 = Math.min(1, v0 + 0.02);
    adjusted = true;
  } else if (lum > Lhi) { // washing out — bring it down into the band
    for (let i = 0; i < 80 && lumOf(v0) > Lhi; i++) v0 = Math.max(0, v0 - 0.02);
    adjusted = true;
  }
  adjusted = adjusted || s0 !== s;
  const { r, g, b } = hsvToRgb(h, s0, v0);
  lum = relLuminance(r, g, b);
  return { r, g, b, h, s: s0, v: v0, lum, contrast: contrastRatio(lum, bgLum), adjusted };
}

// ── histogram via ImageMagick ────────────────────────────────────────────────
function histogram(imgPath) {
  // Quantise to a small palette, print the colour histogram. `%c` + histogram:info:- yields lines like:
  //   "      1234: (222, 88, 41) #DE5829 srgb(222,88,41)"
  const out = execFileSync(
    'convert',
    [`${imgPath}[0]`, '-resize', '120x120', '-colors', '8', '-depth', '8', '-format', '%c', 'histogram:info:-'],
    { encoding: 'utf8', maxBuffer: 4 * 1024 * 1024 },
  );
  const colors = [];
  for (const line of out.split('\n')) {
    const m = line.match(/^\s*(\d+):.*?#([0-9A-Fa-f]{6})/);
    if (!m) continue;
    const count = parseInt(m[1], 10);
    const hex = m[2];
    colors.push({
      count,
      r: parseInt(hex.slice(0, 2), 16),
      g: parseInt(hex.slice(2, 4), 16),
      b: parseInt(hex.slice(4, 6), 16),
      hex: '#' + hex.toUpperCase(),
    });
  }
  return colors;
}

/**
 * The dominant vibrant colour, boosted to read as a border on BOTH light and dark backgrounds.
 * Returns { hex, raw, hsv, score, fallback }. `hex` is the token to inject as --card-accent.
 * opts.minSat/minVal skip near-grey/near-black; opts.borderSat/borderValRange do the contrast boost.
 */
export function extractAccent(imgPath, opts = {}) {
  const minSat = opts.minSat ?? 0.12;
  const minVal = opts.minVal ?? 0.15;
  const borderSat = opts.borderSat ?? 0.55;       // vivid enough to read as an accent
  const [vLo, vHi] = opts.borderValRange ?? [0.55, 0.92]; // mid-high so it reads on light AND dark
  const colors = histogram(imgPath);
  if (colors.length === 0) return { hex: '#888888', raw: '#888888', hsv: { h: 0, s: 0, v: 0.5 }, score: 0, fallback: 'no-histogram' };

  const total = colors.reduce((s, c) => s + c.count, 0) || 1;
  let best = null;
  for (const c of colors) {
    const { h, s, v } = rgbToHsv(c.r, c.g, c.b);
    if (v < minVal || s < minSat) continue; // skip near-black / near-grey
    const prevalence = c.count / total;
    // sqrt(prevalence) so a small-but-vivid colour still competes with a large muted one
    const score = s * v * Math.sqrt(prevalence);
    if (!best || score > best.score) best = { ...c, h, s, v, score };
  }
  let fallback = null;
  if (!best) {
    // whole poster is grey/dark — take the most prevalent colour and treat it as a muted accent
    const c = colors.slice().sort((a, b) => b.count - a.count)[0];
    const { h, s, v } = rgbToHsv(c.r, c.g, c.b);
    best = { ...c, h, s, v, score: 0 };
    fallback = 'all-grey-or-dark';
  }

  // Contrast-GUARANTEED accent (C10): keep the hue and a vivid-enough saturation, then normalise
  // LUMINANCE into the band that clears the floor against the target background. HSV value alone does
  // not guarantee contrast — a dark hue at high V still fails on a dark surface. `vHi`/`borderValRange`
  // is retained only as the starting point; the normalise is what makes the guarantee.
  const bh = best.h;
  const bs = Math.max(best.s, borderSat);
  const bv = best.v < vLo ? vLo : best.v;
  const n = normaliseForContrast(bh, bs, bv, {
    bgLuminance: opts.bgLuminance, contrastFloor: opts.contrastFloor, chromaRange: opts.chromaRange, maxLum: opts.maxLum,
  });
  return { hex: toHex(n.r, n.g, n.b), raw: best.hex, hsv: { h: n.h, s: n.s, v: n.v }, score: best.score, fallback, contrast: Number(n.contrast.toFixed(2)) };
}

// CLI: node theme-extract.mjs <image>  →  prints the accent hex
if (import.meta.url === `file://${process.argv[1]}`) {
  const img = process.argv[2];
  if (!img) { console.error('usage: node theme-extract.mjs <image>'); process.exit(1); }
  const r = extractAccent(img);
  console.log(JSON.stringify(r, null, 2));
}
