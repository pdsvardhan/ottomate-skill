// ban-raw-values.mjs — Phase 0 WS0.2. The "components read only semantic tokens" lint (spec §8).
//
// Flags a Block/Part that hard-codes a design value the theme is supposed to own: a raw colour (hex /
// rgb()/hsl() / a CSS colour name), a raw easing (cubic-bezier() or a timing keyword), or a hard-coded
// border-radius / box-shadow. Those must be `var(--...)` so a theme swap re-skins the Block without
// touching it. This is the enforcement half of the semantic-token seam — it makes "reads only semantic
// tokens" checkable instead of a claim, and it is the lint the `normalize` skill grows into.
//
// HARD (fail-closed): colour, easing, radius, shadow literals — exactly the theme's contract
//   (colour/radius/shadow/motion). ADVISORY (warn, never blocks): raw px/rem spacing/size, because
//   cointrail has no spacing-scale token yet; flagging it fail-closed would false-fail every real Block
//   (the F-7 "a rule that misfires trains you to ignore it" trap).
//
// Only declaration VALUES are scanned (right of `:`); selectors/class names are never colour-matched.
// `var(--token)` (and its fallback) is the allowed shape and is blanked before matching.
//
// Usage:  node ban-raw-values.mjs blocks/category-breakdown.block.css [more.css ...]

import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const NAMED_COLORS = new Set([
  'white', 'black', 'red', 'green', 'blue', 'yellow', 'orange', 'purple', 'pink', 'gray', 'grey',
  'silver', 'gold', 'teal', 'cyan', 'magenta', 'lime', 'navy', 'maroon', 'olive', 'aqua', 'fuchsia',
  'indigo', 'violet', 'crimson', 'coral', 'salmon', 'tomato', 'khaki', 'plum', 'orchid', 'slategray',
  'slategrey', 'tan', 'beige', 'ivory', 'turquoise', 'lavender', 'brown',
]);
const EASING_KEYWORDS = new Set([
  'ease', 'ease-in', 'ease-out', 'ease-in-out', 'linear', 'step-start', 'step-end',
  'bounce', 'elastic', 'spring', 'back',
]);
const TIMING_PROPS = /^(transition|animation)(-timing-function)?$/;
const RADIUS_PROP = /^border(-[a-z]+)?-radius$|^border-radius$/;
const SHADOW_PROP = /^(-webkit-)?box-shadow$|^filter$/;
const SPACING_PROP = /^(padding|margin|gap|row-gap|column-gap|width|height|min-width|min-height|max-width|max-height|top|right|bottom|left|inset|font-size|line-height|letter-spacing|translate|left|flex-basis)/;
const LENGTH = /(?<![\w.])-?\d*\.?\d+(px|rem|em)\b/g;
const ALLOWED_LENGTHS = new Set(['0', '1px']); // hairline + zero are structural, never a token

const stripComments = (s) => s.replace(/\/\*[\s\S]*?\*\//g, '');
const blankVars = (s) => s.replace(/var\(\s*--[a-z0-9-]+\s*(?:,[^()]*)?\)/gi, ' '); // keep length, drop content

/** All `prop: value` declarations, with the value's line number (1-based). */
function declarations(css) {
  const out = [];
  const re = /(^|[;{}])\s*(-{0,2}[a-zA-Z][a-zA-Z-]*)\s*:\s*([^;{}]+)/g;
  let m;
  while ((m = re.exec(css)) !== null) {
    const prop = m[2].toLowerCase();
    const value = m[3].trim();
    const line = css.slice(0, m.index + m[0].indexOf(m[3])).split('\n').length;
    out.push({ prop, value, line });
  }
  return out;
}

/**
 * Lint one CSS source. Returns findings, most-severe first is not enforced — the caller ranks.
 * @returns {{file?:string, findings:Array, blocking:number, advisory:number}}
 */
export function lintCss(css, { file } = {}) {
  const findings = [];
  const add = (severity, category, d, detail) =>
    findings.push({ severity, category, prop: d.prop, line: d.line, value: d.value.slice(0, 60), detail, file });

  for (const d of declarations(stripComments(css))) {
    if (d.prop.startsWith('--')) continue;                 // a token DEFINITION is the theme's job, not a Block's — but if a Block defines one we still lint its raw value below via colour/length
    const bare = blankVars(d.value);

    // 1. colour literals (HARD)
    const hex = bare.match(/#[0-9a-fA-F]{3,8}\b/g) || [];
    const funcs = bare.match(/\b(rgb|rgba|hsl|hsla)\s*\(/gi) || [];
    const named = (bare.match(/[a-z]+/gi) || []).filter((w) => NAMED_COLORS.has(w.toLowerCase()));
    for (const h of hex) add('block', 'colour', d, `raw hex ${h} — use a semantic colour token (var(--color-*))`);
    for (const f of funcs) add('block', 'colour', d, `raw ${f.replace(/\s*\($/, '()')} colour — use var(--color-*)`);
    for (const n of named) add('block', 'colour', d, `named colour "${n}" — use var(--color-*)`);

    // 2. easing literals (HARD) — only in a timing context, so linear-gradient() etc. are not colour/easing.
    if (TIMING_PROPS.test(d.prop)) {
      if (/cubic-bezier\s*\(/i.test(bare)) add('block', 'easing', d, 'raw cubic-bezier() — use var(--motion-ease-*)');
      for (const w of (bare.match(/[a-z-]+/gi) || [])) if (EASING_KEYWORDS.has(w.toLowerCase())) add('block', 'easing', d, `raw easing "${w}" — use var(--motion-ease-*)`);
      if (/steps\s*\(/i.test(bare)) add('block', 'easing', d, 'raw steps() timing — use a motion token');
    }

    // 3. hard-coded radius / shadow (HARD) — these are contract tokens.
    if (RADIUS_PROP.test(d.prop) && LENGTH.test(bare)) { LENGTH.lastIndex = 0; add('block', 'radius', d, 'hard-coded radius — use var(--radius-*)'); }
    if (SHADOW_PROP.test(d.prop)) {
      const rest = bare.replace(/\b(none|inset)\b/gi, '').trim();
      if (rest.length) add('block', 'shadow', d, 'hard-coded shadow/filter — use var(--shadow-*)');
    }

    // 4. raw spacing/size length (ADVISORY) — no spacing-scale token yet.
    if (SPACING_PROP.test(d.prop) && !RADIUS_PROP.test(d.prop)) {
      const lens = (bare.match(LENGTH) || []).filter((l) => !ALLOWED_LENGTHS.has(l));
      LENGTH.lastIndex = 0;
      if (lens.length) add('advisory', 'spacing', d, `raw length ${[...new Set(lens)].join(', ')} — a future spacing scale would tokenise this`);
    }
  }
  return {
    file,
    findings,
    blocking: findings.filter((f) => f.severity === 'block').length,
    advisory: findings.filter((f) => f.severity === 'advisory').length,
  };
}

export function lintFile(file) {
  return lintCss(readFileSync(file, 'utf8'), { file });
}

export function formatReport(r) {
  const lines = [`ban-raw-values · ${r.file ?? '(css)'} · ${r.blocking ? 'BLOCK ❌' : 'PASS ✅'} (${r.blocking} blocking, ${r.advisory} advisory)`];
  for (const f of r.findings) {
    const mark = f.severity === 'block' ? 'BLOCK' : 'adv  ';
    lines.push(`  ${mark} L${String(f.line).padEnd(3)} ${f.category.padEnd(7)} ${f.prop}: ${f.detail}`);
  }
  return lines.join('\n');
}

// ── CLI ────────────────────────────────────────────────────────────────────────────────────────
function main() {
  const files = process.argv.slice(2).filter((a) => !a.startsWith('--'));
  if (!files.length) { console.error('usage: node ban-raw-values.mjs <file.css> [...]'); process.exit(2); }
  let blocking = 0;
  for (const f of files) {
    const r = lintFile(f);
    console.log(formatReport(r));
    blocking += r.blocking;
  }
  process.exit(blocking ? 1 : 0);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();
