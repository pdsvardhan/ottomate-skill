// contrast-gate.mjs — Phase 0 WS0.2. The per-theme contrast gate (spec §8).
//
// A FAIL-CLOSED publish gate that runs the WCAG contrast check PER THEME, PER SCHEME, at the TOKEN
// layer — over the semantic foreground<->background pairings a theme declares, before anything renders.
// This is what kills the "invisible text" class at the source (a theme whose on-surface disappears on
// its surface never ships) and REPLACES F-8's crude, DOM-only accent-count colour budget, which
// mis-counted cool-neutral slate as accents and could not pass cointrail's own palette.
//
// Why token-level, not DOM-level: the colour budget needed a real browser and still under/over-read.
// The pairings a design system PROMISES ("on-surface goes on surface") are knowable from the tokens
// alone, so the gate needs no Chromium and produces a must-pass/must-fail in plain Node. The rendered
// per-element check (scheme-check.mjs) still runs later as a backstop; this catches the class of bug at
// authoring time.
//
// Reuses the WCAG maths from the design-check layer (computed-rules.mjs `contrast`) — one implementation
// of the ratio, not two — and the resolved token values from build-theme.mjs, so the gate checks
// exactly what the CSS ships.
//
// Usage:
//   node contrast-gate.mjs --theme cointrail.tokens.json            # PASS/BLOCK, exit 0/1
//   node contrast-gate.mjs --theme _fixtures/broken-theme.tokens.json   # the must-fail case

import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { contrast } from '../design-check/computed-rules.mjs';
import { loadTheme, resolvedColorMap } from './build-theme.mjs';

// WCAG floor by pairing kind. text=4.5 (1.4.3), large=3 (1.4.3 large), ui=3 (1.4.11 non-text).
// decorative + chart are ADVISORY: a subtle card border and a data-viz swatch are not text, and
// gating them fail-closed false-fails legitimate design (the "misfire trains you to ignore it" trap).
export const KIND_FLOOR = { text: 4.5, large: 3, ui: 3, decorative: 3, chart: 3 };
const ADVISORY_KINDS = new Set(['decorative', 'chart']);

/** #rgb / #rrggbb / #rrggbbaa -> [r,g,b] (alpha ignored — pairings are declared over opaque tokens). */
export function hexToRgb(hex) {
  let h = String(hex).trim().replace(/^#/, '');
  if (h.length === 3) h = h.split('').map((c) => c + c).join('');
  if (h.length !== 6 && h.length !== 8) throw new Error(`not an opaque hex colour: "${hex}"`);
  return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16));
}

function pairings(theme) {
  const p = theme.$extensions?.['com.ottomate.contrast']?.pairings;
  if (!Array.isArray(p) || !p.length) {
    throw new Error('theme declares no $extensions["com.ottomate.contrast"].pairings — a gate with nothing to check is not a gate (fail closed)');
  }
  return p;
}

/**
 * Check one scheme. Every declared pairing is measured; blocking failures are the non-advisory kinds
 * below their floor.
 * @returns {{scheme,ok,results:Array,failing:Array,advisoryFails:Array}}
 */
export function checkScheme(theme, scheme) {
  const colors = resolvedColorMap(theme, scheme);
  const results = [];
  for (const pr of pairings(theme)) {
    const fgHex = colors[pr.fg];
    const bgHex = colors[pr.bg];
    if (fgHex == null || bgHex == null) {
      // a pairing that names a token the theme does not define is itself a failure — never skip silently.
      results.push({ ...pr, scheme, ratio: null, min: KIND_FLOOR[pr.kind] ?? 4.5, pass: false,
        advisory: false, note: `missing token(s): ${[!fgHex && pr.fg, !bgHex && pr.bg].filter(Boolean).join(', ')}` });
      continue;
    }
    const min = KIND_FLOOR[pr.kind] ?? 4.5;
    const ratio = Math.round(contrast(hexToRgb(fgHex), hexToRgb(bgHex)) * 100) / 100;
    results.push({ ...pr, scheme, fgHex, bgHex, ratio, min, pass: ratio >= min, advisory: ADVISORY_KINDS.has(pr.kind) });
  }
  const failing = results.filter((r) => !r.pass && !r.advisory);
  const advisoryFails = results.filter((r) => !r.pass && r.advisory);
  return { scheme, ok: failing.length === 0, results, failing, advisoryFails };
}

/**
 * Run the gate over every scheme the theme defines. Fail-closed: ok is true only if NO non-advisory
 * pairing is below its floor in ANY scheme.
 */
export function contrastGate(theme, { schemes = Object.keys(theme.semantic ?? {}) } = {}) {
  const perScheme = {};
  const failing = [];
  const advisories = [];
  for (const s of schemes) {
    const r = checkScheme(theme, s);
    perScheme[s] = r;
    failing.push(...r.failing);
    advisories.push(...r.advisoryFails);
  }
  const themeName = theme.$meta?.theme ?? 'theme';
  return {
    theme: themeName,
    ok: failing.length === 0,
    schemes: perScheme,
    failing,
    advisories,
    why: failing.length
      ? `${failing.length} text/UI pairing(s) below floor: ${failing.map((f) => `${f.fg}/${f.bg}@${f.scheme} ${f.ratio ?? 'missing'}:1<${f.min}`).join('; ')}`
      : `all text/UI pairings clear their floor in [${schemes.join(', ')}]${advisories.length ? ` (${advisories.length} advisory note(s))` : ''}`,
  };
}

export function formatGate(g) {
  const lines = [`contrast gate · theme="${g.theme}" · ${g.ok ? 'PASS ✅' : 'BLOCK ❌'}`];
  for (const [scheme, r] of Object.entries(g.schemes)) {
    lines.push(`  [${scheme}] ${r.ok ? 'pass' : 'BLOCK'}`);
    for (const p of r.results) {
      const tag = p.advisory ? 'adv ' : '    ';
      const mark = p.pass ? 'ok ' : (p.advisory ? 'warn' : 'FAIL');
      lines.push(`  ${tag}${mark}  ${String(p.ratio ?? '—').toString().padStart(5)}:1 (need ${p.min})  ${p.fg} on ${p.bg}${p.note ? ` — ${p.note}` : ''}`);
    }
  }
  lines.push(`  → ${g.why}`);
  return lines.join('\n');
}

// ── CLI ────────────────────────────────────────────────────────────────────────────────────────
function main() {
  const argv = process.argv.slice(2);
  const i = argv.indexOf('--theme');
  if (i === -1 || !argv[i + 1]) { console.error('usage: node contrast-gate.mjs --theme <file.json>'); process.exit(2); }
  const theme = loadTheme(argv[i + 1]);
  const g = contrastGate(theme);
  console.log(formatGate(g));
  process.exit(g.ok ? 0 : 1);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();
