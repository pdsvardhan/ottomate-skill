// C2 — the asset-fetcher (§5D-A). run: node --test asset-fetch.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fetchAsset, fetchAllAssets } from './asset-fetch.mjs';

const okRes = (bytes) => ({ ok: true, status: 200, arrayBuffer: async () => bytes });
const img = (n) => new Uint8Array([0x89, 0x50, 0x4e, 0x47, n]).buffer; // PNG magic + a marker byte

test('MUST PASS (api) — three images resolve to three buffers, ready to inline', async () => {
  let i = 0;
  const fetchImpl = async () => okRes(img(++i));
  const specs = [{ kind: 'api', url: 'http://p/1' }, { kind: 'api', url: 'http://p/2' }, { kind: 'api', url: 'http://p/3' }];
  const out = await fetchAllAssets(specs, { fetchImpl });
  assert.equal(out.length, 3);
  assert.ok(out.every((o) => Buffer.isBuffer(o.bytes) && o.bytes.length > 0));
  assert.equal(out[0].source.kind, 'api');
});

test('MUST FAIL (api) — a source that 500s on every attempt throws naming the URL and attempt count', async () => {
  let calls = 0;
  const fetchImpl = async () => { calls++; return { ok: false, status: 500, arrayBuffer: async () => new ArrayBuffer(0) }; };
  await assert.rejects(
    fetchAsset({ kind: 'api', url: 'http://p/dead' }, { fetchImpl, retries: 3, backoffMs: 1 }),
    (e) => /http:\/\/p\/dead/.test(e.message) && /3 attempt/.test(e.message),
  );
  assert.equal(calls, 3, 'it retried exactly `retries` times');
});

test('MUST FAIL — the all-or-nothing helper throws if ANY asset fails (no partial set to the build)', async () => {
  let i = 0;
  const fetchImpl = async () => (++i === 2 ? { ok: false, status: 503, arrayBuffer: async () => new ArrayBuffer(0) } : okRes(img(i)));
  await assert.rejects(fetchAllAssets(
    [{ kind: 'api', url: 'http://p/a' }, { kind: 'api', url: 'http://p/b' }, { kind: 'api', url: 'http://p/c' }],
    { fetchImpl, retries: 1, backoffMs: 1 },
  ), /http:\/\/p\/b/);
});

test('MUST PASS (fs regression) — the fs path returns the file bytes byte-identically', async () => {
  const dir = mkdtempSync(path.join(tmpdir(), 'otto-af-'));
  const p = path.join(dir, 'poster.jpg');
  const content = Buffer.from([1, 2, 3, 4, 5, 250, 251]);
  writeFileSync(p, content);
  const out = await fetchAsset({ kind: 'fs', root: dir, path: 'poster.jpg' });
  assert.deepEqual(out.bytes, content);
  assert.equal(out.source.kind, 'fs');
  assert.deepEqual(Buffer.from(readFileSync(p)), out.bytes);
});

test('MUST PASS (cache) — the second fetch of the same URL is served from cache; fetch runs once', async () => {
  const dir = mkdtempSync(path.join(tmpdir(), 'otto-afc-'));
  let calls = 0;
  const fetchImpl = async () => { calls++; return okRes(img(7)); };
  const spec = { kind: 'api', url: 'http://p/cacheme' };
  const a = await fetchAsset(spec, { fetchImpl, cacheDir: dir });
  const b = await fetchAsset(spec, { fetchImpl, cacheDir: dir });
  assert.equal(calls, 1, 'the network was hit once');
  assert.equal(b.cached, true);
  assert.deepEqual(a.bytes, b.bytes);
});

test('MUST FAIL (timeout) — a source that never responds is abandoned after the hard timeout', async () => {
  const fetchImpl = () => new Promise(() => {}); // never resolves
  await assert.rejects(
    fetchAsset({ kind: 'api', url: 'http://p/hang' }, { fetchImpl, retries: 1, timeoutMs: 30, backoffMs: 1 }),
    /timed out|failed after/,
  );
});

test('an unknown source kind is refused', async () => {
  await assert.rejects(fetchAsset({ kind: 'carrier-pigeon', url: 'x' }, {}), /unknown source kind/);
});
