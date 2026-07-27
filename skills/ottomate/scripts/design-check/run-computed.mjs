// Phase-3b host runner: render a variant-set out.html in real Chromium, inject computed-checks.js,
// print the findings JSON. THE COMPUTED PASS RUNS WHERE CHROMIUM LIVES — the server has @playwright +
// chromium; Windows does not. Run it from inside the ottomate dir (or copy alongside node_modules) so
// `playwright` resolves. Usage: node run-computed.mjs <out.html> <computed-checks.js> [profile]
//   node run-computed.mjs ./out.html ./computed-checks.js P2
import path from 'node:path';
import { pathToFileURL } from 'node:url';

// ESM resolves a bare specifier from THE FILE'S OWN location, not from process.cwd() — so spawning
// this with a cwd where playwright is installed does NOT make `import 'playwright'` work when the
// script itself lives elsewhere (e.g. a copied skill tree in /tmp). Found while inlining the computed
// pass, T2. OTTO_PW_ROOT names the install to import from, by absolute path.
const pwRoot = process.env.OTTO_PW_ROOT;
const { chromium } = pwRoot
  ? await import(pathToFileURL(path.join(pwRoot, 'node_modules', 'playwright', 'index.mjs')).href)
    .catch(() => import(pathToFileURL(path.join(pwRoot, 'node_modules', 'playwright', 'index.js')).href))
  : await import('playwright');
const [, , htmlPath, checksPath, profile = 'P2'] = process.argv;
const browser = await chromium.launch();
try {
  const page = await browser.newPage({ colorScheme: 'dark', viewport: { width: 1400, height: 900 } });
  await page.goto('file://' + htmlPath, { waitUntil: 'load' });
  await page.waitForTimeout(300); // let layout settle
  await page.addScriptTag({ path: checksPath });
  const findings = await page.evaluate((p) => window.OTTO_COMPUTED.computedChecks(document, { profile: p }), profile);
  console.log(JSON.stringify(findings, null, 2));
} finally {
  await browser.close();
}
