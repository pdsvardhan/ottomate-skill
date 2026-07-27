// Stage 4 S5 + S6 — the tokenisation report, and the A-F grading runner.
//
// S5 (owner decision 2026-07-27): REPORT and DOWNGRADE, never rewrite. H1 says a baked-in `#fff` is a
// downgrade not an entry, and it is right — but rewriting arbitrary third-party source is where a
// machine mangles a component. A literal inside an SVG `stroke`, a shadow's third colour stop, or a
// `color-mix()` argument is not interchangeable with a token. So this measures; the substitution
// happens only when GRADUATING a locked variant, where the round already produced the token names.
//
// S6: 85% of the catalog already carries a grade that nothing can reproduce. An unreproducible grade
// is the exact class of claim this programme keeps deleting, so the job is not to add grading — it is
// to make the grade DERIVABLE and re-runnable.
//
// Two rules carried over from `rubric-score.mjs`, where the same decisions were made and have held:
//   - an UNMEASURABLE factor shrinks the denominator; it never scores zero.
//   - a measurement and a judgement are never summed into one number.
//
// PURE. Takes a record + its source text.

import { licenceTier, validateProvenance } from './provenance.mjs';

// ── S5: tokenisation ───────────────────────────────────────────────────────────────────────────

// Colour literals in a *styling* position. Deliberately narrow: over-reporting trains people to
// ignore the flag, which is worse than not having it.
const HEX = /#[0-9a-fA-F]{3,8}\b/g;
const FUNC_COLOUR = /\b(?:rgba?|hsla?|oklch|lab|lch)\s*\(/g;
const TOKEN_REF = /var\(\s*--[a-zA-Z0-9-]+/g;
const PX_LITERAL = /(?<![\w-])\d+(?:\.\d+)?px\b/g;

/** Strip the places a "colour" is not a design decision: SVG path data, urls, imports, comments. */
function stripNonStyling(src) {
  return src
    .replace(/<path[^>]*\sd="[^"]*"/g, '<path')          // path geometry, not colour
    .replace(/\bd=\{?["'`][^"'`]*["'`]\}?/g, 'd=""')      // JSX path data
    .replace(/\/\*[\s\S]*?\*\//g, '')                     // block comments
    .replace(/(^|[^:])\/\/[^\n]*/g, '$1')                 // line comments
    .replace(/^\s*import[^\n]*$/gm, '')                   // import lines
    .replace(/url\((?:[^)]*)\)/g, 'url()');
}

/**
 * @param {string} src
 * @returns {{literalColours:number, literalSpacing:number, tokenRefs:number, ratio:number|null,
 *            penalty:number, samples:string[], measurable:boolean}}
 */
export function tokeniseReport(src) {
  if (typeof src !== 'string' || src.trim() === '') {
    return { literalColours: 0, literalSpacing: 0, tokenRefs: 0, ratio: null, penalty: 0, samples: [], measurable: false };
  }
  const clean = stripNonStyling(src);
  const hexes = clean.match(HEX) ?? [];
  const funcs = clean.match(FUNC_COLOUR) ?? [];
  const tokens = clean.match(TOKEN_REF) ?? [];
  const pxs = clean.match(PX_LITERAL) ?? [];

  const literalColours = hexes.length + funcs.length;
  const literalSpacing = pxs.length;
  const tokenRefs = tokens.length;
  const total = literalColours + tokenRefs;
  const ratio = total === 0 ? null : tokenRefs / total;

  // A flag with no consequence is a flag nobody reads — so this returns a real band penalty.
  let penalty = 0;
  if (literalColours > 0) penalty += ratio !== null && ratio >= 0.8 ? 1 : 2;
  if (literalSpacing > 6) penalty += 1;

  return {
    literalColours, literalSpacing, tokenRefs, ratio, penalty,
    samples: [...new Set(hexes)].slice(0, 5),
    measurable: true,
  };
}

/** Framework coupling — reported, never stripped. S5 option (a). */
export function frameworkCoupling(src) {
  // An EMPTY source is unmeasurable, not clean. Reporting "no alias imports" for a component whose
  // source we never read would score portability 1.0 on no evidence — found by the must-fail test for
  // "nothing measurable grades F", which was landing on E because of exactly this.
  if (typeof src !== 'string' || src.trim() === '') return { aliasImports: [], externalDeps: [], measurable: false };
  const alias = [...src.matchAll(/from\s+["'](@\/[^"']+)["']/g)].map((m) => m[1]);
  const ext = [...src.matchAll(/from\s+["']([a-z@][^"']*)["']/g)]
    .map((m) => m[1]).filter((m) => !m.startsWith('@/') && !m.startsWith('.'));
  return { aliasImports: [...new Set(alias)], externalDeps: [...new Set(ext)], measurable: true };
}

// ── S6: the grade ──────────────────────────────────────────────────────────────────────────────

const BANDS = ['A', 'B', 'C', 'D', 'E', 'F'];

/**
 * Grade a component A-F. Only A/B ship.
 *
 * The licence is a GATE, not a weighted term: no accumulation of other virtues can lift a RED-licence
 * component into a shipping band. A weighted licence term would let a beautiful, well-tokenised,
 * dependency-free -NC asset average its way into production.
 *
 * @param {object} rec   a master_components-shaped record
 * @param {string} [src] the component source, when available
 */
export function gradeComponent(rec = {}, src = null) {
  const prov = validateProvenance(rec);
  const licence = licenceTier(rec.spdx_id);
  const tok = tokeniseReport(src ?? '');
  const coupling = frameworkCoupling(src ?? '');

  const factors = [];
  const unmeasurable = [];

  // Each factor scores 0..1, or declares itself unmeasurable.
  const push = (name, score, note) => factors.push({ name, score, note });
  const skip = (name, why) => unmeasurable.push({ name, why });

  // 1. provenance completeness
  push('provenance', prov.ok ? 1 : (prov.provenance_debt ? 0.5 : 0),
    prov.ok ? 'complete' : prov.reason);

  // 2. licence quality (scored too, but the gate below is what actually binds)
  push('licence', licence.tier === 'GREEN' ? 1 : licence.tier === 'AMBER' ? 0.6 : 0, licence.why);

  // 3. tokenisation
  if (tok.measurable) {
    push('tokenisation', tok.penalty === 0 ? 1 : Math.max(0, 1 - tok.penalty * 0.4),
      tok.penalty === 0 ? 'no literals in styling positions' : `${tok.literalColours} literal colour(s), ${tok.literalSpacing} px literal(s)`);
  } else skip('tokenisation', 'no source available to read');

  // 4. framework coupling
  if (coupling.measurable) {
    const bad = coupling.aliasImports.length;
    push('portability', bad === 0 ? 1 : 0, bad === 0 ? 'no unresolvable alias imports' : `${bad} alias import(s) that will not resolve outside their origin repo`);
  } else skip('portability', 'no source available to read');

  // 5/6. declared capabilities — only scored when the field was actually set
  if (typeof rec.dark_light_compat === 'boolean') push('dark_light', rec.dark_light_compat ? 1 : 0, '');
  else skip('dark_light', 'field never set');
  if (typeof rec.responsive === 'boolean') push('responsive', rec.responsive ? 1 : 0, '');
  else skip('responsive', 'field never set');

  // 7. dependency weight
  if (Array.isArray(rec.dependencies)) {
    const n = rec.dependencies.length;
    push('dependencies', n === 0 ? 1 : n <= 2 ? 0.7 : n <= 5 ? 0.4 : 0, `${n} declared`);
  } else skip('dependencies', 'field never set');

  // An unmeasurable factor shrinks the denominator rather than scoring zero.
  const denom = factors.length;
  const raw = denom === 0 ? null : factors.reduce((a, f) => a + f.score, 0) / denom;

  let grade;
  let gateReason = null;
  if (raw === null) {
    grade = 'F';
    gateReason = 'nothing about this component was measurable — an unassessable component does not ship';
  } else {
    const idx = raw >= 0.9 ? 0 : raw >= 0.75 ? 1 : raw >= 0.6 ? 2 : raw >= 0.45 ? 3 : raw >= 0.3 ? 4 : 5;
    grade = BANDS[idx];
    // THE GATE. Applied after scoring so the score stays honest and the override is visible.
    // The cap is RECORDED whenever the licence is RED, even when the score happened to land below B
    // on its own — otherwise a reader seeing "C" cannot tell whether the licence was the reason, and
    // the gate would be invisible exactly when it agreed with the score.
    if (licence.tier === 'RED') {
      const capped = BANDS.indexOf(grade) < BANDS.indexOf('C');
      if (capped) grade = 'C';
      gateReason = `licence is RED (${licence.why}) — ${capped ? 'capped at C' : `already at ${grade}`} regardless of other factors; licence is a gate, not a weighted term`;
    }
    if (prov.excluded && grade !== 'F') {
      grade = 'F';
      gateReason = `excluded source: ${prov.excluded.reason}`;
    }
  }

  return {
    grade,
    ships: grade === 'A' || grade === 'B',
    score: raw,
    factors,
    unmeasurable,
    gateReason,
    tokenisation: tok,
    coupling,
  };
}
