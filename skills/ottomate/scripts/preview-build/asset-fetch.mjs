// asset-fetch.mjs — pull round content from a project source (§5D-A, C2, 2026-07-28).
//
// Today the pipeline only reads local files. This adds a pluggable per-asset source: `fs` (kept
// byte-identical) or `api` (real project endpoint, retry + backoff + a hard timeout). The load-bearing
// rule: on failure it THROWS — it never silently substitutes a placeholder, because a silent fallback
// once shipped and the placeholder guard exists to catch exactly that. `fetchAllAssets` is
// all-or-nothing so the build never writes a partial page.
//
// PURE + injectable: `fetchImpl` defaults to global fetch, so it is unit-testable with no network.

import { readFileSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function withTimeout(promise, ms, label) {
  if (!ms) return promise;
  let t;
  const timeout = new Promise((_, reject) => { t = setTimeout(() => reject(new Error(`timed out after ${ms}ms: ${label}`)), ms); });
  return Promise.race([promise.finally(() => clearTimeout(t)), timeout]);
}

const cacheKey = (url) => createHash('sha1').update(String(url)).digest('hex').slice(0, 16);

/**
 * Resolve ONE asset to its bytes.
 * @param {{kind:'fs',root?:string,path:string}|{kind:'api',url:string,headers?:object}} spec
 * @param {object} [opts]
 * @param {Function} [opts.fetchImpl]  defaults to global fetch
 * @param {Function} [opts.readFile]   defaults to fs.readFileSync (for the fs path)
 * @param {number}  [opts.retries]     api attempts (default 3)
 * @param {number}  [opts.backoffMs]   base backoff, multiplied by attempt (default 50)
 * @param {number}  [opts.timeoutMs]   hard per-attempt timeout (default 5000)
 * @param {string}  [opts.cacheDir]    when set, api bytes are cached by URL
 * @returns {Promise<{bytes:Buffer, source:object, cached?:boolean}>}
 */
export async function fetchAsset(spec, opts = {}) {
  const { fetchImpl = globalThis.fetch, readFile = readFileSync, retries = 3, backoffMs = 50, timeoutMs = 5000, cacheDir = null } = opts;

  if (spec?.kind === 'fs') {
    const p = path.isAbsolute(spec.path) ? spec.path : path.join(spec.root ?? '', spec.path);
    return { bytes: Buffer.from(readFile(p)), source: { kind: 'fs', path: p } };
  }

  if (spec?.kind === 'api') {
    if (!spec.url) throw new Error('asset-fetch: api spec needs a url');
    const cacheFile = cacheDir ? path.join(cacheDir, cacheKey(spec.url)) : null;
    if (cacheFile && existsSync(cacheFile)) {
      return { bytes: Buffer.from(readFileSync(cacheFile)), source: { kind: 'api', url: spec.url }, cached: true };
    }
    if (typeof fetchImpl !== 'function') throw new Error('asset-fetch: no fetch implementation available');

    let lastErr;
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        const res = await withTimeout(fetchImpl(spec.url, { headers: spec.headers ?? {} }), timeoutMs, spec.url);
        if (!res || res.ok === false) throw new Error(`HTTP ${res?.status ?? '?'}`);
        const bytes = Buffer.from(await res.arrayBuffer());
        if (!bytes.length) throw new Error('empty body');
        if (cacheFile) { mkdirSync(path.dirname(cacheFile), { recursive: true }); writeFileSync(cacheFile, bytes); }
        return { bytes, source: { kind: 'api', url: spec.url, attempt } };
      } catch (e) {
        lastErr = e;
        if (attempt < retries) await sleep(backoffMs * attempt);
      }
    }
    // NEVER a placeholder — fail the build loudly, naming the URL and how many times we tried.
    throw new Error(`asset-fetch: ${spec.url} failed after ${retries} attempt(s) — ${lastErr?.message ?? 'unknown error'}`);
  }

  throw new Error(`asset-fetch: unknown source kind "${spec?.kind}"`);
}

/**
 * Resolve MANY assets — all or nothing. If any one cannot be resolved, the whole call throws and the
 * caller writes no partial page. Order is preserved.
 * @param {Array} specs
 * @returns {Promise<Array<{bytes:Buffer, source:object}>>}
 */
export async function fetchAllAssets(specs, opts = {}) {
  const results = [];
  for (const spec of specs ?? []) results.push(await fetchAsset(spec, opts)); // sequential = deterministic + gentle on the source
  return results;
}
