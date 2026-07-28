# C2 — the asset-fetcher (§5D-A) · unit plan

**Written 2026-07-28.** Today the pipeline reads local files (`assetRoot` + `cards[].image`). §5D-A
asks for real content pulled from **project APIs**, retry- and timeout-robust, failing the build rather
than silently substituting a placeholder. Nothing existed.

## Build — `scripts/preview-build/asset-fetch.mjs`, pure + injectable

1. A per-asset **source spec**, pluggable: `{kind:'fs', root, path}` (today's behaviour, kept
   byte-identical) or `{kind:'api', url, headers}`.
2. `fetchAsset(spec, opts)` — `fs` reads the local file; `api` fetches with **bounded retry +
   backoff + a hard timeout**, and on exhaustion **throws** naming the URL and the attempt count. It
   never substitutes a placeholder — the placeholder guard exists precisely because a silent fallback
   once shipped.
3. `fetchAllAssets(specs, opts)` — **all-or-nothing**: resolves every asset or throws, so the build
   never receives a partial set and never writes a partial page.
4. Cache fetched bytes under the scratch dir keyed by URL, so a round is reproducible offline and a
   rebuild does not re-hit the project.
5. `fetchImpl` is injected (default global `fetch`) so it is unit-testable without a network.

## Acceptance — must-fail AND must-pass

- **Must-pass (api):** a source that returns three images resolves to three buffers, ready to inline.
- **Must-fail (api):** a source that 500s on every attempt **throws** naming the URL and the attempt
  count; a test asserts nothing is returned (the build would get no partial set).
- **Must-pass (fs regression):** the `fs` path returns the file's exact bytes — byte-identical to
  today's local read.
- **Must-pass (cache):** the second fetch of the same URL is served from cache (the mock `fetch` is
  called once).
- **Must-fail (timeout):** a source that never responds is abandoned after the hard timeout, not hung.
