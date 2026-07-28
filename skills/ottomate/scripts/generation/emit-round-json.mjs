// emit-round-json.mjs — Phase 4 R1.1. Make a round AUTO-produce the live grid + legibility banner.
//
// The WS1.1/WS1.2 gap: a round rendered the live per-variant grid + banner only because I hand-wrote
// `variant_previews` and `banner` into round.json. This wires it into the publish path: given the round's
// per-variant interactive HTML files + the banner inputs, it copies the files beside index.html and returns
// the `variant_previews` + a SELF-STYLED banner (theme vars inlined, so it renders on the app's own page)
// for round.json. The deployed RoundPicker already reads both. No hand-editing.

import { readFileSync, copyFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildBanner } from './round-banner.mjs';
import { loadTheme, flattenScheme } from '../theming/build-theme.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const BANNER_CSS = () => readFileSync(path.join(HERE, 'round-banner.css'), 'utf8');

/**
 * Copy each per-variant HTML file into the round dir and return the `variant_previews` list the grid reads.
 * @param {Array<{label:string, path:string}>} variantFiles
 * @param {string} destDir   the round dir (where index.html lives)
 * @param {(p:string)=>string} [resolveRel]  resolve a manifest-relative path
 * @returns {Array<{label:string, file:string}>}
 */
export function buildVariantPreviews(variantFiles = [], destDir, resolveRel = (p) => p) {
  const out = [];
  for (const v of variantFiles) {
    const src = resolveRel(v.path);
    if (!existsSync(src)) throw new Error(`variant file not found: ${v.path} (${src}) — a round cannot advertise a preview it does not have`);
    const base = path.basename(src);
    copyFileSync(src, path.join(destDir, base));
    out.push({ label: v.label, file: base });
  }
  return out;
}

/**
 * The banner html, SELF-STYLED with the project theme's light vars inlined (scoped), so it renders correctly
 * injected into the app's own (differently-themed) page. Falls back to the bare banner html if no theme.
 * @param {object} bannerInputs  buildBanner inputs {decided, held, deferred, variantCount, archetype}
 * @param {string|null} themeFile
 */
export function selfStyledBanner(bannerInputs, themeFile = null) {
  const banner = buildBanner(bannerInputs);
  if (!themeFile || !existsSync(themeFile)) return banner.html;
  const light = flattenScheme(loadTheme(themeFile), 'light');
  const vars = light.map((r) => `${r.cssVar}:${r.css};`).join('');
  return `<div class="rb-wrap"><style>.rb-wrap{${vars}}\n${BANNER_CSS()}</style>${banner.html}</div>`;
}

/**
 * The extras to merge into round.json: `variant_previews` (the grid) + `banner` (legibility). Both are
 * OPTIONAL — a legacy round with neither still publishes and falls back to the single index.html iframe.
 * @returns {{variant_previews?:Array, banner?:string}}
 */
export function buildRoundJsonExtras(manifest, destDir, { themeFile = null, resolveRel = (p) => p } = {}) {
  const extras = {};
  if (Array.isArray(manifest.variant_files) && manifest.variant_files.length) {
    extras.variant_previews = buildVariantPreviews(manifest.variant_files, destDir, resolveRel);
  }
  if (manifest.banner && manifest.banner.decided) {
    extras.banner = selfStyledBanner(manifest.banner, themeFile);
  }
  return extras;
}
