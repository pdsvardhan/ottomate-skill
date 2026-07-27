// rubric-score.mjs — the OBJECTIVE half of the 4×25 rubric, and only that half.
//
// T9, 2026-07-27. The 6→3 filter is model judgment with nothing under it. Contrast, size ratios and
// token adherence are computable; hierarchy, restraint and "does this feel like the product" are not.
// Partial mechanisation beats none — but only if the two are never mixed.
//
// THE RULE THIS MODULE EXISTS TO ENFORCE ON ITSELF: a computed number and a judgment are reported
// SEPARATELY and never summed into one score. The moment they are added together, a model's opinion
// acquires the authority of a measurement, and nobody downstream can tell which was which. So
// `scoreObjective` returns only what it measured, `total` is deliberately absent, and `mergeVerdict`
// keeps both halves visible in the output.
//
// Input is the COMPUTED findings (from computed-checks.js) plus the panel source — i.e. this scores
// what actually rendered, not what was declared.

export const OBJECTIVE_ROWS = {
  legibility_contrast: {
    band: 'Legibility',
    what: 'fraction of sampled text at or above its WCAG floor',
    max: 25,
  },
  craft_token_adherence: {
    band: 'Craft',
    what: 'fraction of colour literals routed through a token rather than hardcoded',
    max: 25,
  },
  craft_scale_discipline: {
    band: 'Craft',
    what: 'how few distinct font sizes and radii the panel uses (a ladder, not a scatter)',
    max: 25,
  },
};

function pct(n, d) { return d === 0 ? null : n / d; }

/**
 * Score ONE panel on the computable rows only.
 * @param {object} o
 * @param {Array} o.contrast      that panel's contrast findings
 * @param {string} o.source       the panel's markup+CSS
 * @returns {{rows:object, measured:number, notMeasured:string[]}}
 */
export function scoreObjective({ contrast = [], source = '' } = {}) {
  const rows = {};
  const notMeasured = [];

  // 1. contrast — the one rubric row with an unambiguous floor
  const total = contrast.length;
  const ok = contrast.filter((c) => c.ratio != null && c.need != null && c.ratio >= c.need).length;
  const p = pct(ok, total);
  if (p == null) notMeasured.push('legibility_contrast (no text sampled)');
  else rows.legibility_contrast = { score: Math.round(p * 25), of: 25, detail: `${ok}/${total} text samples meet their floor` };

  // 2. token adherence — a colour literal outside a custom-property declaration is drift.
  // Counting only DECLARATION sites, so a value inside `--token: #xxx` is the token, not a violation.
  const clean = String(source).replace(/\/\*[\s\S]*?\*\//g, '');
  const declaredTokens = new Set([...clean.matchAll(/--[\w-]+\s*:\s*(#[0-9a-fA-F]{3,8})/g)].map((m) => m[1].toLowerCase()));
  const usedLiterals = [...clean.matchAll(/(?<!--[\w-]{0,40}:\s*)(#[0-9a-fA-F]{3,8})\b/g)].map((m) => m[1].toLowerCase());
  const drifting = usedLiterals.filter((h) => declaredTokens.has(h));   // duplicates a token = drift
  const tp = usedLiterals.length ? 1 - drifting.length / usedLiterals.length : null;
  if (tp == null) notMeasured.push('craft_token_adherence (no colour literals)');
  else rows.craft_token_adherence = { score: Math.round(tp * 25), of: 25, detail: `${drifting.length}/${usedLiterals.length} colour literals duplicate a declared token` };

  // 3. scale discipline — a type/radius LADDER, not a scatter. A5/A2: few steps, deliberately chosen.
  const sizes = new Set([...clean.matchAll(/font-size\s*:\s*([\d.]+(?:px|rem|em))/g)].map((m) => m[1]));
  const radii = new Set([...clean.matchAll(/border-radius\s*:\s*([\d.]+(?:px|rem|%)|\d+)/g)].map((m) => m[1]));
  const steps = sizes.size + radii.size;
  if (steps === 0) notMeasured.push('craft_scale_discipline (no sizes or radii)');
  else {
    // 6 steps or fewer is a ladder; 14+ is a scatter. Linear between, clamped.
    const s = Math.max(0, Math.min(1, (14 - steps) / 8));
    rows.craft_scale_discipline = { score: Math.round(s * 25), of: 25, detail: `${sizes.size} font sizes + ${radii.size} radii = ${steps} steps` };
  }

  const measured = Object.values(rows).reduce((a, r) => a + r.score, 0);
  return { rows, measured, outOf: Object.keys(rows).length * 25, notMeasured };
}

/**
 * Keep the halves apart. There is deliberately NO combined total: adding a judgment to a measurement
 * launders an opinion into a number.
 * @param {object} objective  from scoreObjective
 * @param {{band:string, note:string}} [judgment]  the model's own read, verbatim
 */
export function mergeVerdict(objective, judgment = null) {
  return {
    measured: { score: objective.measured, outOf: objective.outOf, rows: objective.rows, notMeasured: objective.notMeasured },
    judged: judgment ? { band: judgment.band, note: judgment.note } : null,
    combined: null,   // intentionally null — see the module header
  };
}

export function formatRubric(v, label = '') {
  const l = [`${label ? label + ': ' : ''}measured ${v.measured.score}/${v.measured.outOf} (objective rows only)`];
  for (const [k, r] of Object.entries(v.measured.rows)) l.push(`  ${k.padEnd(24)} ${r.score}/${r.of}  ${r.detail}`);
  for (const n of v.measured.notMeasured) l.push(`  not measured: ${n}`);
  l.push(v.judged ? `  judgment (NOT a measurement): ${v.judged.band} — ${v.judged.note}`
    : '  judgment: none recorded — the subjective rows of the rubric are still the model\'s call');
  return l.join('\n');
}
