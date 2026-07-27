// png-decode.mjs — a minimal PNG reader. P2, owner decision D16: hand-rolled, zero dependency.
//
// Playwright's screenshot() hands back a PNG buffer; zlib is in Node core. Decoding it is inflate
// plus un-filtering scanlines, which is ordinary code — not a reason to take a dependency.
//
// DELIBERATELY NARROW: 8-bit, non-interlaced, colour type 2 (RGB) or 6 (RGBA) — what Chromium
// actually emits. Everything else throws, naming what it got. A decoder that silently mis-reads a
// format still produces a divergence number, and that number looks entirely reasonable while meaning
// nothing at all. Failing loudly is the only safe behaviour for something feeding a gate.

import zlib from 'node:zlib';

const SIG = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

const COLOUR_CHANNELS = { 0: 1, 2: 3, 4: 2, 6: 4 };

function paeth(a, b, c) {
  const p = a + b - c;
  const pa = Math.abs(p - a), pb = Math.abs(p - b), pc = Math.abs(p - c);
  if (pa <= pb && pa <= pc) return a;
  return pb <= pc ? b : c;
}

/**
 * @param {Buffer} buf a PNG file
 * @returns {{width:number,height:number,channels:number,data:Buffer}} data is row-major, 8-bit.
 */
export function decodePNG(buf) {
  if (!Buffer.isBuffer(buf)) buf = Buffer.from(buf);
  if (buf.length < 8 || !buf.subarray(0, 8).equals(SIG)) {
    throw new Error('not a PNG: signature mismatch');
  }
  let pos = 8;
  let ihdr = null;
  const idat = [];
  while (pos + 8 <= buf.length) {
    const length = buf.readUInt32BE(pos);
    const type = buf.toString('ascii', pos + 4, pos + 8);
    const dataStart = pos + 8;
    if (dataStart + length > buf.length) throw new Error(`truncated PNG: chunk ${type} claims ${length} bytes`);
    if (type === 'IHDR') {
      ihdr = {
        width: buf.readUInt32BE(dataStart),
        height: buf.readUInt32BE(dataStart + 4),
        bitDepth: buf[dataStart + 8],
        colourType: buf[dataStart + 9],
        compression: buf[dataStart + 10],
        filter: buf[dataStart + 11],
        interlace: buf[dataStart + 12],
      };
    } else if (type === 'IDAT') {
      idat.push(buf.subarray(dataStart, dataStart + length));
    } else if (type === 'IEND') {
      break;
    }
    pos = dataStart + length + 4; // + CRC
  }
  if (!ihdr) throw new Error('PNG has no IHDR');
  if (ihdr.bitDepth !== 8) throw new Error(`unsupported PNG bit depth ${ihdr.bitDepth} (only 8 is handled)`);
  if (ihdr.interlace !== 0) throw new Error('unsupported interlaced PNG (Adam7)');
  const channels = COLOUR_CHANNELS[ihdr.colourType];
  if (channels == null) throw new Error(`unsupported PNG colour type ${ihdr.colourType}`);
  if (!idat.length) throw new Error('PNG has no IDAT data');

  const raw = zlib.inflateSync(Buffer.concat(idat));
  const { width, height } = ihdr;
  const bpp = channels;                 // bytes per pixel at 8-bit
  const rowBytes = width * bpp;
  const expected = (rowBytes + 1) * height;
  if (raw.length < expected) throw new Error(`PNG data short: ${raw.length} bytes, expected ${expected}`);

  const out = Buffer.alloc(rowBytes * height);
  let rp = 0;
  for (let y = 0; y < height; y++) {
    const ft = raw[rp++];
    const rowStart = y * rowBytes;
    const prevStart = (y - 1) * rowBytes;
    for (let x = 0; x < rowBytes; x++) {
      const v = raw[rp + x];
      const a = x >= bpp ? out[rowStart + x - bpp] : 0;
      const b = y > 0 ? out[prevStart + x] : 0;
      const c = x >= bpp && y > 0 ? out[prevStart + x - bpp] : 0;
      let val;
      switch (ft) {
        case 0: val = v; break;
        case 1: val = v + a; break;
        case 2: val = v + b; break;
        case 3: val = v + ((a + b) >> 1); break;
        case 4: val = v + paeth(a, b, c); break;
        default: throw new Error(`unknown PNG filter type ${ft} on row ${y}`);
      }
      out[rowStart + x] = val & 0xff;
    }
    rp += rowBytes;
  }
  return { width, height, channels, data: out };
}

/** Read one pixel as [r,g,b,a]; a is 255 for an RGB image. */
export function pixelAt(img, x, y) {
  const i = (y * img.width + x) * img.channels;
  const d = img.data;
  return img.channels === 4 ? [d[i], d[i + 1], d[i + 2], d[i + 3]] : [d[i], d[i + 1], d[i + 2], 255];
}
