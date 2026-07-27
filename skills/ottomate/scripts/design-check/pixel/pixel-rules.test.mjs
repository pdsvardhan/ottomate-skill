// P2 — the three pixel rules. Must-fail AND must-pass per rule, plus notApplicable where the input
// simply is not there. These three were the last round-scope rules that no method could reach.
// run: node --test pixel-rules.test.mjs

import { test } from 'node:test';
import assert from 'node:assert/strict';
import zlib from 'node:zlib';
import { advAccentBudget, advGlassLegibility, advMotionBehindText, PIXEL_RULES } from './pixel-rules.mjs';

// minimal encoder (same as pixel.test.mjs — fixtures only)
const CRC = (() => { const t = new Int32Array(256); for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; t[n] = c; } return t; })();
function crc32(b) { let c = 0xffffffff; for (let i = 0; i < b.length; i++) c = CRC[(c ^ b[i]) & 0xff] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; }
function chunk(type, data) {
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
  const td = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(td));
  return Buffer.concat([len, td, crc]);
}
function png(w, h, px) {
  const rows = [];
  for (let y = 0; y < h; y++) {
    const row = Buffer.alloc(w * 4 + 1);
    for (let x = 0; x < w; x++) { const p = px(x, y); for (let c = 0; c < 4; c++) row[1 + x * 4 + c] = p[c] ?? 255; }
    rows.push(row);
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4); ihdr[8] = 8; ihdr[9] = 6;
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr), chunk('IDAT', zlib.deflateSync(Buffer.concat(rows))), chunk('IEND', Buffer.alloc(0)),
  ]);
}
const fails = (r, why) => { assert.equal(r.pass, false, why || r.detail); return r; };
const passes = (r) => { assert.equal(r.pass, true, r.detail); return r; };
const notApplicable = (r) => { assert.equal(r.notApplicable, true, `expected notApplicable: ${r.detail}`); return r; };

const ACCENT = [233, 184, 76];      // #e9b84c — Screenroom's real accent
const NEUTRAL = [22, 26, 34, 255];

// share of a 100x100 panel painted accent, by row count
const withAccentRows = (rows) => png(100, 100, (x, y) => (y < rows ? [...ACCENT, 255] : NEUTRAL));

test('adv-accent-budget — accent flooding the panel is caught; ~10% passes', () => {
  const flooded = fails(advAccentBudget(withAccentRows(45), [ACCENT]));
  assert.match(flooded.detail, /reads cheap/);
  passes(advAccentBudget(withAccentRows(10), [ACCENT]));
});

test('adv-accent-budget — accent nowhere is ALSO a finding, not a pass', () => {
  const dead = fails(advAccentBudget(withAccentRows(1), [ACCENT]), 'restraint past the floor is deadness');
  assert.match(dead.detail, /reads dead/);
  notApplicable(advAccentBudget(withAccentRows(10), []));
});

test('adv-accent-budget — counts PAINT, which surface-counting cannot see', () => {
  // One declaration, half the panel. colour_budget (surfaces) would call this exemplary.
  const oneSurfaceHalfPanel = png(100, 100, (x, y) => (y < 50 ? [...ACCENT, 255] : NEUTRAL));
  assert.equal(advAccentBudget(oneSurfaceHalfPanel, [ACCENT]).pass, false);
});

test('adv-glass-legibility — white text over a bright composited backdrop is caught', () => {
  // The backdrop behind the text box is near-white on the left, dark on the right.
  const backdrop = png(80, 80, (x) => (x < 40 ? [245, 245, 245, 255] : [18, 18, 20, 255]));
  const r = fails(advGlassLegibility(backdrop, [
    { label: '.glass-title', color: [255, 255, 255], region: { x: 0, y: 0, w: 80, h: 80 } },
  ]), 'white on a near-white composite is the exact failure getComputedStyle cannot see');
  assert.match(r.detail, /worst region/);

  // the same text confined to the dark half is fine
  passes(advGlassLegibility(backdrop, [
    { label: '.glass-title', color: [255, 255, 255], region: { x: 40, y: 0, w: 40, h: 80 } },
  ]));
});

test('adv-glass-legibility — large text gets 3:1, and no glass means nothing to sample', () => {
  // a mid grey backdrop: ~3.5:1 against white — under 4.5 but over 3
  const mid = png(80, 80, () => [119, 119, 119, 255]);
  fails(advGlassLegibility(mid, [{ label: '.body', color: [255, 255, 255], region: { x: 0, y: 0, w: 80, h: 80 } }]));
  passes(advGlassLegibility(mid, [{ label: '.hero', color: [255, 255, 255], largeText: true, region: { x: 0, y: 0, w: 80, h: 80 } }]));
  notApplicable(advGlassLegibility(mid, []));
});

test('adv-motion-behind-text — a region that moves at rest is caught; a still one passes', () => {
  const still = png(60, 60, () => [20, 22, 28, 255]);
  const shifted = png(60, 60, (x, y) => (y < 30 ? [210, 90, 40, 255] : [20, 22, 28, 255]));
  fails(advMotionBehindText([still, shifted]), 'movement under reading copy is a defect');
  passes(advMotionBehindText([still, png(60, 60, () => [20, 22, 28, 255])]));
});

test('adv-motion-behind-text — one frame cannot be judged, and is never a pass', () => {
  const r = notApplicable(advMotionBehindText([png(10, 10, () => [0, 0, 0, 255])]));
  assert.match(r.detail, /fewer than two frames/);
});

test('all three pixel rules are registered', () => {
  for (const id of ['adv-accent-budget', 'adv-glass-legibility', 'adv-motion-behind-text']) {
    assert.equal(typeof PIXEL_RULES[id], 'function', `${id} is not registered`);
  }
});
