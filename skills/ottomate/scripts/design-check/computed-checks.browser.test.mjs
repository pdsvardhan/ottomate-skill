// Automated BROWSER test for the computed checker's DOM pass. Runs where Chromium lives (the server:
// `@playwright` + chromium are installed) — NOT on Windows. It renders fixtures in real Chromium,
// injects computed-checks.js, and asserts the checks CATCH (a bad set) and PASS (a good set). This is
// the named test behind the computed rules' `enforced` status — the DOM logic a Node unit test cannot
// reach. Run:  cd /opt/homeserver/ottomate/.p3b-demo && node computed-checks.browser.test.mjs
import { chromium } from 'playwright';
import { writeFileSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';

const CHECKS = path.join(path.dirname(fileURLToPath(import.meta.url)), 'computed-checks.js');
const dir = mkdtempSync(path.join(tmpdir(), 'cc-'));

const panel = (label, style, body) =>
  `<section class="vs-panel" aria-label="${label}"><div class="vs-shadow-host"><template shadowrootmode="open"><style>${style}</style>${body}</template></div></section>`;

// CATCH: two near-identical panels (differ only in cta colour) + a low-contrast line + a drifting role.
const CATCH = `<div class="vs-panels">${
  panel('P1', '.card{border-radius:8px;box-shadow:0 4px 12px rgba(0,0,0,.4);background:#222;padding:16px}.cta{color:#0a0;font-weight:700}.meta{color:#777;background:#666;padding:4px}',
    '<article class="card"><p class="meta">low contrast meta</p><button class="cta" data-role="cta">Play film</button></article>')
}${
  panel('P2', '.card{border-radius:8px;box-shadow:0 4px 12px rgba(0,0,0,.4);background:#222;padding:16px}.cta{color:#a0a;font-weight:700}.meta{color:#777;background:#666;padding:4px}',
    '<article class="card"><p class="meta">low contrast meta</p><button class="cta" data-role="cta">Play film</button></article>')
}</div>`;

// PASS: two genuinely different panels; readable text; consistent role.
// Both CTAs are dark text on the amber fill (readable), and the role colour is consistent → no flags.
const PASS = `<div class="vs-panels">${
  panel('A', '.card{border-radius:0;background:#111;padding:12px;border:1px solid #444}.t{color:#eee}.cta{background:#e6a15c;color:#1a1410;font-weight:700;padding:6px 10px}',
    '<article class="card"><h3 class="t">Night Ferry</h3><button class="cta" data-role="cta">Play film</button></article>')
}${
  panel('B', '.card{border-radius:20px;box-shadow:0 10px 30px rgba(0,0,0,.5);background:#1a1410;padding:22px}.t{color:#f2ede6}.cta{background:#e6a15c;color:#1a1410;font-weight:700;padding:6px 10px}',
    '<article class="card"><h3 class="t">Night Ferry</h3><button class="cta" data-role="cta">Play film</button></article>')
}</div>`;

async function run(html, opts = {}) {
  const f = path.join(dir, `f${Math.random().toString(36).slice(2)}.html`);
  writeFileSync(f, html);
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage({ colorScheme: 'dark', viewport: { width: 1200, height: 800 } });
    await page.goto('file://' + f, { waitUntil: 'load' });
    await page.waitForTimeout(200);
    await page.addScriptTag({ path: CHECKS });
    return await page.evaluate((o) => window.OTTO_COMPUTED.computedChecks(document, o), opts);
  } finally { await browser.close(); }
}

let failed = 0;
const t = async (name, fn) => { try { await fn(); console.log('ok  -', name); } catch (e) { failed++; console.log('NOT ok -', name, '\n   ', e.message); } };

await t('CATCH: low contrast is flagged', async () => {
  const r = await run(CATCH, { profile: 'P2' });
  assert.ok(r.contrast.length >= 2, `expected contrast flags, got ${r.contrast.length}`);
  assert.ok(r.contrast.every((c) => c.ratio == null || c.ratio < 4.5));
});
await t('CATCH: cross-component coherence flags the drifting role', async () => {
  const r = await run(CATCH, { profile: 'P2' });
  assert.ok(r.coherence.some((c) => c.role === 'cta'), 'cta colour drift must be caught');
});
await t('CATCH: divergence flags near-identical panels as too similar', async () => {
  const r = await run(CATCH, { profile: 'P2' });
  assert.equal(r.divergence[0].differ, false, `distance ${r.divergence[0].distance} should be below the floor`);
});
await t('PASS: readable, genuinely-different panels clear every check', async () => {
  const r = await run(PASS, { profile: 'P2' });
  assert.equal(r.contrast.length, 0, `expected no contrast flags, got ${JSON.stringify(r.contrast)}`);
  assert.equal(r.coherence.length, 0, 'consistent role → no coherence flag');
  assert.ok(r.divergence.every((d) => d.differ), 'the two different panels must diverge');
});

console.log(failed ? `\n${failed} FAILED` : '\nall browser checks passed');
process.exit(failed ? 1 : 0);
