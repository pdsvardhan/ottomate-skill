// P2 — the pixel comparison. Must-fail and must-pass per behaviour, in plain Node.
//
// The fixtures come from a minimal encoder written below. That is enough to exercise every filter
// type, but NOT enough on its own: an encoder and a decoder written in the same sitting can share a
// misunderstanding and round-trip perfectly. So the suite ALSO decodes a real Chromium screenshot
// (captured on VAULT7A, committed as a fixture) and asserts known pixel values. See the
// `real Chromium PNG` test at the bottom.
// run: node --test pixel.test.mjs

import { test } from 'node:test';
import assert from 'node:assert/strict';
import zlib from 'node:zlib';
import { existsSync, readFileSync } from 'node:fs';
import { decodePNG, pixelAt } from './png-decode.mjs';
import { comparePNG, pixelDelta, accentPixelShare, worstRegionContrast, divergenceVerdict } from './pixel-compare.mjs';

// ── a minimal PNG encoder, for fixtures only ────────────────────────────────────────────────────
const CRC_TABLE = (() => {
  const t = new Int32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c;
  }
  return t;
})();
function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}
function chunk(type, data) {
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
  const td = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(td));
  return Buffer.concat([len, td, crc]);
}
function paeth(a, b, c) {
  const p = a + b - c, pa = Math.abs(p - a), pb = Math.abs(p - b), pc = Math.abs(p - c);
  if (pa <= pb && pa <= pc) return a;
  return pb <= pc ? b : c;
}
/** pixels: (x,y) => [r,g,b,a]. filterFor: (y) => 0..4 */
function encodePNG(width, height, pixels, { channels = 4, filterFor = () => 0 } = {}) {
  const bpp = channels, rowBytes = width * bpp;
  const rawRows = [];
  for (let y = 0; y < height; y++) {
    const row = Buffer.alloc(rowBytes);
    for (let x = 0; x < width; x++) {
      const p = pixels(x, y);
      for (let c = 0; c < channels; c++) row[x * bpp + c] = p[c] ?? 255;
    }
    rawRows.push(row);
  }
  const out = [];
  for (let y = 0; y < height; y++) {
    const ft = filterFor(y);
    const cur = rawRows[y], prev = y > 0 ? rawRows[y - 1] : Buffer.alloc(rowBytes);
    const enc = Buffer.alloc(rowBytes);
    for (let x = 0; x < rowBytes; x++) {
      const a = x >= bpp ? cur[x - bpp] : 0;
      const b = prev[x];
      const c = x >= bpp ? prev[x - bpp] : 0;
      let v;
      switch (ft) {
        case 0: v = cur[x]; break;
        case 1: v = cur[x] - a; break;
        case 2: v = cur[x] - b; break;
        case 3: v = cur[x] - ((a + b) >> 1); break;
        case 4: v = cur[x] - paeth(a, b, c); break;
        default: throw new Error('bad filter');
      }
      enc[x] = v & 0xff;
    }
    out.push(Buffer.from([ft]), enc);
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0); ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; ihdr[9] = channels === 4 ? 6 : 2; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', zlib.deflateSync(Buffer.concat(out))),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

const solid = (w, h, colour, opts) => encodePNG(w, h, () => colour, opts);

// ── decoder ─────────────────────────────────────────────────────────────────────────────────────
test('decodePNG — round-trips a known image under EVERY filter type', () => {
  const px = (x, y) => [(x * 7) & 0xff, (y * 13) & 0xff, (x * y) & 0xff, 255];
  for (const ft of [0, 1, 2, 3, 4]) {
    const img = decodePNG(encodePNG(9, 6, px, { filterFor: () => ft }));
    assert.equal(img.width, 9); assert.equal(img.height, 6); assert.equal(img.channels, 4);
    for (let y = 0; y < 6; y++) {
      for (let x = 0; x < 9; x++) {
        assert.deepEqual(pixelAt(img, x, y), px(x, y), `filter ${ft} mismatched at ${x},${y}`);
      }
    }
  }
  // and with filters MIXED per row, which is what a real encoder emits
  const mixed = decodePNG(encodePNG(9, 6, px, { filterFor: (y) => y % 5 }));
  assert.deepEqual(pixelAt(mixed, 8, 5), px(8, 5));
});

test('decodePNG — RGB (colour type 2) is handled, alpha defaults to opaque', () => {
  const img = decodePNG(solid(4, 4, [10, 20, 30], { channels: 3 }));
  assert.equal(img.channels, 3);
  assert.deepEqual(pixelAt(img, 2, 2), [10, 20, 30, 255]);
});

test('decodePNG — refuses what it cannot read instead of returning plausible garbage', () => {
  assert.throws(() => decodePNG(Buffer.from('not a png at all')), /signature/);
  const png = solid(4, 4, [1, 2, 3, 255]);
  const interlaced = Buffer.from(png); interlaced[8 + 8 + 12] = 1;  // IHDR interlace byte
  assert.throws(() => decodePNG(interlaced), /interlaced/);
  const deep = Buffer.from(png); deep[8 + 8 + 8] = 16;              // IHDR bit depth
  assert.throws(() => decodePNG(deep), /bit depth 16/);
});

// ── comparison ──────────────────────────────────────────────────────────────────────────────────
test('comparePNG — identical panels score ~0, black vs white scores 1', () => {
  const a = solid(40, 40, [120, 130, 140, 255]);
  const same = comparePNG(a, solid(40, 40, [120, 130, 140, 255]));
  assert.equal(same.fraction, 0, 'byte-identical renders must be zero, not merely small');
  assert.ok(same.meanDelta < 1e-9);

  const far = comparePNG(solid(40, 40, [0, 0, 0, 255]), solid(40, 40, [255, 255, 255, 255]));
  assert.equal(far.fraction, 1, 'every pixel differs');
  assert.ok(far.maxDelta > 0.99, `black vs white should saturate the scale, got ${far.maxDelta}`);
});

test('comparePNG — a subtle but real change is detected; imperceptible noise is not', () => {
  const base = solid(40, 40, [128, 128, 128, 255]);
  // a 1-unit shift is below any sane perceptual threshold
  const noise = comparePNG(base, solid(40, 40, [129, 128, 128, 255]));
  assert.equal(noise.fraction, 0, 'a 1/255 shift is not a design difference');
  // a visible tint change is
  const tint = comparePNG(base, solid(40, 40, [128, 100, 160, 255]));
  assert.ok(tint.fraction > 0.9, `a visible recolour must register, got ${tint.fraction}`);
});

test('comparePNG — a partial change reports a partial fraction, which the string metric could not', () => {
  // change exactly a quarter of the image
  const half = encodePNG(40, 40, (x, y) => (x < 20 && y < 20 ? [255, 0, 0, 255] : [255, 255, 255, 255]));
  const plain = solid(40, 40, [255, 255, 255, 255]);
  const r = comparePNG(plain, half);
  assert.ok(Math.abs(r.fraction - 0.25) < 0.01, `expected ~0.25 of the panel changed, got ${r.fraction}`);
});

test('comparePNG — a size mismatch is REPORTED, never silently cropped', () => {
  const r = comparePNG(solid(40, 40, [0, 0, 0, 255]), solid(20, 40, [0, 0, 0, 255]));
  assert.equal(r.sizeMismatch, true);
  assert.deepEqual(r.sizes, ['40x40', '20x40']);
});

test('pixelDelta — transparency is composited, not compared raw', () => {
  // two fully transparent pixels of different nominal colour are the SAME rendering
  assert.equal(pixelDelta([255, 0, 0, 0], [0, 0, 255, 0]), 0);
  // and an opaque red over white is not
  assert.ok(pixelDelta([255, 0, 0, 255], [255, 255, 255, 255]) > 0.3);
});

// ── the rule-facing helpers ─────────────────────────────────────────────────────────────────────
test('accentPixelShare — measures paint, not declarations', () => {
  const quarterAccent = encodePNG(40, 40, (x, y) => (x < 20 && y < 20 ? [220, 40, 60, 255] : [250, 250, 250, 255]));
  const r = accentPixelShare(quarterAccent, [[220, 40, 60]]);
  assert.ok(Math.abs(r.share - 0.25) < 0.01, `expected ~25% accent pixels, got ${r.share}`);
  const none = accentPixelShare(solid(20, 20, [250, 250, 250, 255]), [[220, 40, 60]]);
  assert.equal(none.share, 0);
  assert.equal(accentPixelShare(solid(4, 4, [0, 0, 0, 255]), []).share, null, 'no accents supplied is not a measurement');
});

test('worstRegionContrast — finds the WORST patch, not the average', () => {
  // left half near-white, right half black; white text is unreadable on the left only
  const split = encodePNG(64, 64, (x) => (x < 32 ? [255, 255, 255, 255] : [0, 0, 0, 255]));
  const r = worstRegionContrast(split, [255, 255, 255], { x: 0, y: 0, w: 64, h: 64 });
  assert.ok(r.worstContrast < 1.2, `white on the white half must report ~1:1, got ${r.worstContrast}`);
  assert.ok(r.at.x < 32, 'and must point at the offending region');
  // the same text over the dark half alone is fine
  const dark = worstRegionContrast(split, [255, 255, 255], { x: 32, y: 0, w: 32, h: 64 });
  assert.ok(dark.worstContrast > 20, `white on black should be ~21:1, got ${dark.worstContrast}`);
});

// ── the divergence verdict ──────────────────────────────────────────────────────────────────────
test('divergenceVerdict — byte-identical panels are REFUSED, a real difference passes', () => {
  const p = solid(60, 60, [22, 26, 34, 255]);
  const identical = divergenceVerdict(comparePNG(p, solid(60, 60, [22, 26, 34, 255])));
  assert.equal(identical.differ, false, 'this is the gate hole reproduced on 2026-07-27');
  assert.match(identical.why, /same panel/);

  // The measured Screenroom r1 profile: ~8% of pixels differing, peak ~0.93.
  const changed = encodePNG(60, 60, (x, y) => (x < 8 && y < 36 ? [233, 184, 76, 255] : [22, 26, 34, 255]));
  const real = divergenceVerdict(comparePNG(p, changed));
  assert.equal(real.differ, true, real.why);
});

test('divergenceVerdict — differences too faint to see are not options either', () => {
  const base = solid(60, 60, [128, 128, 128, 255]);
  // every pixel shifts, but by an amount below the perceptual floor
  const faint = comparePNG(base, solid(60, 60, [131, 129, 130, 255]));
  const v = divergenceVerdict(faint, { minFraction: 0 });
  assert.equal(v.differ, false, `a sub-perceptual shift is not a design option: ${v.why}`);
  assert.match(v.why, /below what an eye resolves/);
});

test('divergenceVerdict — a size difference is a real difference, not an error', () => {
  const v = divergenceVerdict(comparePNG(solid(60, 60, [0, 0, 0, 255]), solid(40, 60, [0, 0, 0, 255])));
  assert.equal(v.differ, true);
  assert.match(v.why, /different sizes/);
});

// ── the independent check: a PNG this code did not produce ──────────────────────────────────────
test('decodePNG — a real Chromium screenshot, not one of our own fixtures', (t) => {
  const fixture = new URL('./fixtures/chromium-swatch.png', import.meta.url);
  if (!existsSync(fixture)) {
    t.skip('fixtures/chromium-swatch.png absent — regenerate with tools/capture-fixture.mjs on VAULT7A');
    return;
  }
  const img = decodePNG(readFileSync(fixture));
  // The page is a 120x60 render: left half #3395A9 (a real theme-extract accent), right half #101418.
  assert.equal(img.width, 120);
  assert.equal(img.height, 60);
  const left = pixelAt(img, 30, 30), right = pixelAt(img, 90, 30);
  assert.deepEqual(left.slice(0, 3), [51, 149, 169], `left swatch decoded as ${left}`);
  assert.deepEqual(right.slice(0, 3), [16, 20, 24], `right swatch decoded as ${right}`);
});
