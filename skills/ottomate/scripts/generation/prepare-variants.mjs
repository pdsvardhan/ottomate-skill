// prepare-variants.mjs — Phase 4 R1.2. Turn a round's AUTHORED per-variant HTML into interactive,
// self-contained, token-CLEAN files ready for the live grid — the missing automation behind F-14.
//
// The generation sub-agent authors one interactive Block HTML per variant (the spending-variant.html
// pattern: real motion/3D, `<link>` to the theme + block css). This step makes each SELF-CONTAINED
// (inline the CSS via inline-block, so it renders inside a sandbox=allow-scripts iframe — the app's proven
// pattern, not Sandpack), LINTS each variant's block css with ban-raw-values (fail-closed — a variant that
// bakes a raw hex/easing is refused), and returns the `variant_files` list publish-round (R1.1) turns into
// the round.json grid. Replaces the JS-inert static DSD default for cluster/page scope.

import { writeFileSync, existsSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import { inlineHtml } from '../theming/inline-block.mjs';
import { lintFile } from '../theming/ban-raw-values.mjs';

const slug = (s) => String(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

/**
 * @param {Array<{label:string, html:string, blockCss?:string}>} variants
 * @param {string} outDir   where the self-contained files are written
 * @param {(p:string)=>string} [resolveRel]
 * @returns {{ok:boolean, blocking:number, variant_files:Array<{label,path}>, lintReports:Array}}
 */
export function prepareVariants(variants = [], outDir, resolveRel = (p) => p) {
  if (!Array.isArray(variants) || variants.length < 2) throw new Error(`a variant set needs at least 2 variants; got ${variants?.length ?? 0}`);
  mkdirSync(outDir, { recursive: true });
  const variant_files = [];
  const lintReports = [];
  let blocking = 0;

  for (const v of variants) {
    const htmlPath = resolveRel(v.html);
    if (!existsSync(htmlPath)) throw new Error(`variant html not found: ${v.html} (${htmlPath})`);
    // fail-closed token check on the variant's block css (if declared)
    if (v.blockCss) {
      const rep = lintFile(resolveRel(v.blockCss));
      lintReports.push({ label: v.label, blocking: rep.blocking, findings: rep.findings.filter((f) => f.severity === 'block') });
      blocking += rep.blocking;
    }
    const selfContained = inlineHtml(htmlPath);
    const outName = `${slug(v.label) || 'variant'}.selfcontained.html`;
    const outPath = path.join(outDir, outName);
    writeFileSync(outPath, selfContained);
    variant_files.push({ label: v.label, path: outPath });
  }

  return { ok: blocking === 0, blocking, variant_files, lintReports };
}

export function formatPrepare(r) {
  const lines = [`prepare-variants · ${r.ok ? 'OK ✅' : 'BLOCKED ❌'} · ${r.variant_files.length} interactive variant(s), ${r.blocking} raw-value block(s)`];
  for (const rep of r.lintReports) if (rep.blocking) lines.push(`  BLOCK ${rep.label}: ${rep.findings.map((f) => f.detail).slice(0, 2).join('; ')}`);
  return lines.join('\n');
}
