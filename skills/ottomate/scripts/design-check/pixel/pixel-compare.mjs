// pixel-compare.mjs — perceptual per-pixel comparison. P2.
//
// This exists to answer the one question the resolved-style checker structurally cannot:
// DO THESE TWO PANELS ACTUALLY LOOK DIFFERENT? The old `computed-axis-divergence` metric counted the
// fraction of sampled CSS properties whose STRINGS differ, which under-reads and over-reads at the
// same time: `12px` vs `0.75rem` is the same rendering and scores as a difference, while a 1px shadow
// tweak and a total recolour both score as exactly one property.

import { decodePNG, pixelAt } from './png-decode.mjs';

// YIQ weighting — brightness carries most of the perceived difference, so a hue-only shift at equal
// luminance scores lower than a luminance shift of the same RGB magnitude. Same basis pixelmatch uses.
function yiq(r, g, b) {
  return [
    r * 0.29889531 + g * 0.58662247 + b * 0.11448223,
    r * 0.59597799 - g * 0.27417610 - b * 0.32180189,
    r * 0.21147017 - g * 0.52261711 + b * 0.31114694,
  ];
}

/** Composite a pixel over an opaque background. Two transparent pixels of different colour are not a
 * visible difference, and treating them as one is how a divergence score gets inflated by nothing. */
function over(p, bg) {
  const a = p[3] / 255;
  return [
    p[0] * a + bg[0] * (1 - a),
    p[1] * a + bg[1] * (1 - a),
    p[2] * a + bg[2] * (1 - a),
  ];
}

// The YIQ weights produce a SQUARED distance. Black↔white is dy=255 with di=dq=0, so the squared
// maximum along that axis is 0.5053 × 255². Normalising by 255 instead — as the first version did —
// made every delta read ~30% low: black vs white scored 0.71, and a plainly visible grey→purple
// recolour scored under the 0.06 threshold and was reported as no change at all. On a metric whose
// entire job is "do these panels look different?", that error is the whole failure.
//
// Anchored so 1.0 means "as different as black and white". A few hyper-saturated pairs exceed that
// and are clamped, which is deliberate: the scale is easier to reason about than pixelmatch's
// all-pairs maximum, and nothing above 1 needs distinguishing.
const BLACK_WHITE_SQ = 0.5053 * 255 * 255;

/** Perceptual distance between two RGBA pixels, 0–1. */
export function pixelDelta(p1, p2, bg = [255, 255, 255]) {
  const [r1, g1, b1] = over(p1, bg);
  const [r2, g2, b2] = over(p2, bg);
  const [y1, i1, q1] = yiq(r1, g1, b1);
  const [y2, i2, q2] = yiq(r2, g2, b2);
  const dy = y1 - y2, di = i1 - i2, dq = q1 - q2;
  const d = 0.5053 * dy * dy + 0.299 * di * di + 0.1957 * dq * dq;
  return Math.min(1, Math.sqrt(d / BLACK_WHITE_SQ));
}

/**
 * Compare two PNG buffers (or already-decoded images).
 *
 * @returns {{width,height,differing,total,fraction,meanDelta,maxDelta,sizeMismatch}}
 *   `fraction` is the headline: the share of pixels differing by more than `threshold`.
 *   A size mismatch is REPORTED, never silently cropped — two panels of different sizes is itself a
 *   finding, and quietly comparing the overlap would hide it.
 */
export function comparePNG(a, b, { threshold = 0.06, background = [255, 255, 255] } = {}) {
  const A = Buffer.isBuffer(a) || a instanceof Uint8Array ? decodePNG(a) : a;
  const B = Buffer.isBuffer(b) || b instanceof Uint8Array ? decodePNG(b) : b;
  const sizeMismatch = A.width !== B.width || A.height !== B.height;
  const width = Math.min(A.width, B.width);
  const height = Math.min(A.height, B.height);
  let differing = 0, sum = 0, maxDelta = 0;
  const total = width * height;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const d = pixelDelta(pixelAt(A, x, y), pixelAt(B, x, y), background);
      sum += d;
      if (d > maxDelta) maxDelta = d;
      if (d > threshold) differing++;
    }
  }
  return {
    width, height, total, differing,
    fraction: total ? differing / total : 0,
    meanDelta: total ? sum / total : 0,
    maxDelta,
    sizeMismatch,
    ...(sizeMismatch ? { sizes: [`${A.width}x${A.height}`, `${B.width}x${B.height}`] } : {}),
  };
}

/**
 * `computed-axis-divergence`, measured in pixels.
 *
 * THE FLOOR IS LOW ON PURPOSE, and the reasoning matters more than the number:
 *
 * A controlled variant set is *designed* to be mostly identical. The isolation gate requires
 * everything outside the named axis to be held constant, so in a well-formed set the poster art, the
 * grid, and the copy are byte-identical by construction and only the axis-bearing chrome moves. A
 * high "percentage of pixels differing" floor would therefore reject exactly the well-controlled sets
 * the gate demands, and reward sloppy ones. This check is a NEAR-IDENTITY GUARD — "is there any real
 * rendered difference at all?" — not a score of how different two panels are.
 *
 * Calibrated against the failure it exists to catch, not against a round we wanted to pass:
 *   byte-identical panels (the reproduced 2026-07-27 gate hole) measure EXACTLY 0.0000
 *   the real Screenroom r1 panels measure 0.0809 / 0.1108 / 0.1581, maxDelta 0.93
 * Two orders of magnitude apart, so the floor is not a fitted parameter.
 *
 * `maxDelta` is checked separately: a set can differ across many pixels by an amount no one can see
 * (an anti-aliasing shift), and that is not an option either.
 */
export function divergenceVerdict(cmp, { minFraction = 0.005, minMaxDelta = 0.15 } = {}) {
  if (cmp.sizeMismatch) {
    return { differ: true, why: `panels render at different sizes (${(cmp.sizes ?? []).join(' vs ')}) — a real layout difference` };
  }
  if (cmp.fraction < minFraction) {
    return { differ: false, why: `only ${(cmp.fraction * 100).toFixed(2)}% of pixels differ (floor ${(minFraction * 100).toFixed(1)}%) — these render as the same panel` };
  }
  if (cmp.maxDelta < minMaxDelta) {
    return { differ: false, why: `${(cmp.fraction * 100).toFixed(1)}% of pixels differ but the strongest difference is only ${cmp.maxDelta.toFixed(3)} — below what an eye resolves` };
  }
  return { differ: true, why: `${(cmp.fraction * 100).toFixed(1)}% of pixels differ, peak ${cmp.maxDelta.toFixed(2)}` };
}

/**
 * adv-accent-budget by PIXEL SHARE rather than by counting declarations.
 * A design that declares the accent once and paints half the panel with it is over budget; counting
 * declarations says it is fine.
 */
export function accentPixelShare(img, accents, { tolerance = 0.08 } = {}) {
  const A = Buffer.isBuffer(img) || img instanceof Uint8Array ? decodePNG(img) : img;
  const targets = accents.map((c) => (Array.isArray(c) ? c : null)).filter(Boolean);
  if (!targets.length) return { share: null, why: 'no accent colours supplied' };
  let hit = 0;
  const total = A.width * A.height;
  for (let y = 0; y < A.height; y++) {
    for (let x = 0; x < A.width; x++) {
      const p = pixelAt(A, x, y);
      if (targets.some((t) => pixelDelta(p, [...t, 255]) <= tolerance)) hit++;
    }
  }
  return { share: total ? hit / total : 0, pixels: hit, total };
}

/**
 * Worst-case contrast of a foreground colour against a REGION of the render.
 *
 * This is the honest half of adv-glass-legibility. The effective background behind a glass surface is
 * the blurred composite, which getComputedStyle provably cannot report — but a screenshot can be
 * sampled. What this returns is a real measurement of the worst region; it is NOT a full legibility
 * verdict, because that also needs to know which pixels the text actually covers.
 */
export function worstRegionContrast(img, fg, region, { cells = 8 } = {}) {
  const A = Buffer.isBuffer(img) || img instanceof Uint8Array ? decodePNG(img) : img;
  const { x = 0, y = 0, w = A.width, h = A.height } = region ?? {};
  const chan = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); };
  const lum = (c) => 0.2126 * chan(c[0]) + 0.7152 * chan(c[1]) + 0.0722 * chan(c[2]);
  const lf = lum(fg);
  let worst = Infinity, worstAt = null;
  const cw = Math.max(1, Math.floor(w / cells)), ch = Math.max(1, Math.floor(h / cells));
  for (let cy = y; cy < y + h; cy += ch) {
    for (let cx = x; cx < x + w; cx += cw) {
      let r = 0, g = 0, b = 0, n = 0;
      for (let py = cy; py < Math.min(cy + ch, y + h, A.height); py++) {
        for (let px = cx; px < Math.min(cx + cw, x + w, A.width); px++) {
          const p = pixelAt(A, px, py); r += p[0]; g += p[1]; b += p[2]; n++;
        }
      }
      if (!n) continue;
      const lb = lum([r / n, g / n, b / n]);
      const [hi, lo] = lf >= lb ? [lf, lb] : [lb, lf];
      const ratio = (hi + 0.05) / (lo + 0.05);
      if (ratio < worst) { worst = ratio; worstAt = { x: cx, y: cy }; }
    }
  }
  return { worstContrast: worst === Infinity ? null : worst, at: worstAt, cells };
}
