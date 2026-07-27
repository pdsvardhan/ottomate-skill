// Phase-3b host runner: render a variant-set out.html in real Chromium, inject computed-checks.js,
// print the findings JSON. THE COMPUTED PASS RUNS WHERE CHROMIUM LIVES — the server has @playwright +
// chromium; Windows does not. Run it from inside the ottomate dir (or copy alongside node_modules) so
// `playwright` resolves. Usage: node run-computed.mjs <out.html> <computed-checks.js> [profile]
//   node run-computed.mjs ./out.html ./computed-checks.js P2
//
// P1 added two things page JS provably cannot do for itself:
//   1. TWO record sets, one per colour scheme — adv-dark-mode-type-optical compares them, and a
//      single pass can only ever return notApplicable.
//   2. FORCED PSEUDO-STATES. CSS cannot be told "pretend this is :hover" from script; only CDP's
//      CSS.forcePseudoState can. floor-focus-ring, adv-state-delta-relative depend on it, and without
//      it they must report notApplicable rather than pass.
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

/**
 * Resolve pseudo-state styles for every interactive element, keyed by `tag.cls`.
 * Returns {} — never a fake pass — if CDP is unavailable or the protocol shape changes.
 */
async function collectPseudoStates(page) {
  const out = {};
  let cdp;
  try {
    cdp = await page.context().newCDPSession(page);
    await cdp.send('DOM.enable');
    await cdp.send('CSS.enable');
  } catch (e) {
    return { __unavailable: `CDP unavailable: ${String(e).slice(0, 100)}` };
  }
  try {
    const { root } = await cdp.send('DOM.getDocument', { depth: -1, pierce: true });
    // CDP's DOM.querySelectorAll does NOT pierce shadow roots. Every harness panel renders inside a
    // declarative shadow root, so a document-level query found zero controls and the merge silently
    // produced nothing — while meta still said "forced via CDP". Walk the pierced tree instead.
    const INTERACTIVE = new Set(['button', 'a', 'input', 'select', 'textarea', 'summary']);
    const found = [];
    (function walk(node) {
      if (!node) return;
      if (node.localName && INTERACTIVE.has(node.localName)) {
        const attrs = node.attributes || [];
        const i = attrs.indexOf('class');
        const cls = (i >= 0 ? (attrs[i + 1] || '') : '').split(/\s+/)[0] || '';
        found.push({ nodeId: node.nodeId, key: `${node.localName}.${cls}` });
      }
      for (const c of node.children || []) walk(c);
      for (const s of node.shadowRoots || []) walk(s);
      if (node.contentDocument) walk(node.contentDocument);
    })(root);

    for (const { nodeId, key } of found) {
      const read = async (states) => {
        await cdp.send('CSS.forcePseudoState', { nodeId, forcedPseudoClasses: states });
        const { computedStyle } = await cdp.send('CSS.getComputedStyleForNode', { nodeId });
        const m = Object.fromEntries(computedStyle.map((p) => [p.name, p.value]));
        return m;
      };
      try {
        const focus = await read(['focus', 'focus-visible']);
        const hover = await read(['hover']);
        const active = await read(['active']);
        await cdp.send('CSS.forcePseudoState', { nodeId, forcedPseudoClasses: [] });
        out[key] = {
          focus: {
            outlineStyle: focus['outline-style'], outlineWidth: focus['outline-width'],
            outlineColor: focus['outline-color'], boxShadow: focus['box-shadow'],
          },
          hover: { backgroundColor: hover['background-color'] },
          active: { backgroundColor: active['background-color'] },
        };
      } catch { /* leave this element out rather than invent a state for it */ }
    }
  } catch (e) {
    return { __unavailable: `pseudo-state walk failed: ${String(e).slice(0, 100)}` };
  }
  return out;
}

async function collect(browser, colorScheme) {
  const page = await browser.newPage({ colorScheme, viewport: { width: 1400, height: 900 } });
  await page.goto('file://' + htmlPath, { waitUntil: 'load' });
  await page.waitForTimeout(300); // let layout settle
  await page.addScriptTag({ path: checksPath });
  const findings = await page.evaluate(
    ([p, d]) => window.OTTO_COMPUTED.computedChecks(document, { profile: p, dark: d }),
    [profile, colorScheme === 'dark'],
  );
  const pseudo = await collectPseudoStates(page);
  await page.close();
  return { findings, pseudo };
}

const browser = await chromium.launch();
try {
  const dark = await collect(browser, 'dark');
  const light = await collect(browser, 'light');

  // Merge the forced pseudo-states onto the records they belong to, and carry BOTH schemes' records
  // through so the cross-mode rule has two sets to compare.
  const pseudoNote = dark.pseudo.__unavailable || light.pseudo.__unavailable || null;
  for (const [set, src] of [[dark, dark.pseudo], [light, light.pseudo]]) {
    for (const panel of set.findings.records || []) {
      for (const row of panel.rows) {
        const st = src[`${row.tag}.${row.cls}`];
        if (st) Object.assign(row, st);
      }
    }
  }
  const out = dark.findings;
  out.recordsLight = light.findings.records;
  out.tokensLight = light.findings.tokens;
  // Report the COUNT, not just "it ran". The first version said "forced via CDP" while attaching
  // zero states, because the walk found no controls — a green-looking line over an empty result is
  // exactly the shape of claim this program exists to avoid.
  const attached = Object.keys(dark.pseudo).filter((k) => k !== '__unavailable').length;
  out.meta = {
    ...(out.meta || {}),
    schemes: ['dark', 'light'],
    pseudoStates: pseudoNote ? 'UNAVAILABLE' : (attached ? `forced via CDP on ${attached} control(s)` : 'NONE FOUND — no control was resolved, so state rules are NOT checked'),
  };
  if (pseudoNote) out.meta.pseudoStateNote = pseudoNote;
  console.log(JSON.stringify(out, null, 2));
} finally {
  await browser.close();
}
