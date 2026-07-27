// computed-rules.mjs — C6 batch 3. The computed rules as PURE FUNCTIONS.
//
// Written against an array of ELEMENT RECORDS rather than against a live DOM, so every one is
// unit-testable in plain Node with a must-fail and a must-pass case. The browser pass in
// computed-checks.js only has to COLLECT the records and call these; it makes no judgements of its
// own. That split is deliberate: the previous computed rules could only be exercised on the server,
// which meant their edge cases were argued about instead of tested.
//
// A record:
//   { tag, cls, w, h, text, depth, parentRadius, dark, styles: { fontSize, lineHeight, fontFamily,
//     fontWeight, fontVariantNumeric, color, backgroundColor, borderRadius, boxShadow, textAlign,
//     paddingTop, paddingBottom, marginTop } }
// Lengths are NUMBERS in px (the collector resolves them); colours are 'rgb(r, g, b)'.

const ok = (detail) => ({ pass: true, detail });
const no = (detail) => ({ pass: false, detail });
const na = (detail) => ({ pass: true, detail, notApplicable: true });

const INTERACTIVE = new Set(['button', 'a', 'input', 'select', 'textarea', 'summary']);

// A "numeric cell" in the wild carries a unit: "12.4 GB", "46%", "$1,299", "7.9". A digits-only
// regex missed every real one — caught by the first test run.
const NUMERIC_CELL = /^[\s$£€+-]*[\d][\d.,:\s]*\s*(?:[A-Za-z%]{1,3})?\s*$/;
const isNumericCell = (t) => Boolean(t) && /\d/.test(t) && NUMERIC_CELL.test(t);

export function rgb(v) {
  const m = String(v ?? '').match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
  return m ? [+m[1], +m[2], +m[3]] : null;
}
function chroma(c) { return c ? Math.max(...c) - Math.min(...c) : 0; }
function lum(c) { return c ? (0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]) / 255 : 0; }

// ── floor-target-size — WCAG 2.5.8. A control smaller than 24px is a control you miss. ───────────
export function floorTargetSize(els, { min = 24 } = {}) {
  const controls = els.filter((e) => INTERACTIVE.has(e.tag) && e.w > 0 && e.h > 0);
  if (!controls.length) return na('no interactive elements measured');
  const small = controls.filter((e) => e.w < min || e.h < min);
  return small.length
    ? no(`${small.length}/${controls.length} controls below ${min}px: ${small.slice(0, 4).map((e) => `${e.tag}.${e.cls} ${Math.round(e.w)}x${Math.round(e.h)}`).join(', ')}`)
    : ok(`all ${controls.length} controls meet the ${min}px floor`);
}

// ── adv-type-family-count — A2: two families is a system, four is an accident. ────────────────────
export function advTypeFamilyCount(els, { max = 2 } = {}) {
  const fams = new Set(els.map((e) => String(e.styles?.fontFamily ?? '').split(',')[0].trim().replace(/["']/g, '').toLowerCase()).filter(Boolean));
  fams.delete('');
  if (!fams.size) return na('no font families measured');
  return fams.size > max
    ? no(`${fams.size} type families in one component (${[...fams].join(', ')}) — the ceiling is ${max}`)
    : ok(`${fams.size} type famil${fams.size === 1 ? 'y' : 'ies'}`);
}

// ── adv-leading-by-role — A2 §3.5. One global line-height across a 12→48px range is the tell that
// leading was never considered: display text needs tighter leading than body text, not the same.
export function advLeadingByRole(els) {
  const text = els.filter((e) => e.text && e.styles?.fontSize > 0 && e.styles?.lineHeight > 0);
  if (text.length < 3) return na('too little text to judge leading');
  const ratios = text.map((e) => ({ size: e.styles.fontSize, ratio: e.styles.lineHeight / e.styles.fontSize }));
  const small = ratios.filter((r) => r.size <= 14);
  const large = ratios.filter((r) => r.size >= 22);
  if (!small.length || !large.length) return na('no size spread wide enough to judge leading by role');
  const avg = (xs) => xs.reduce((a, r) => a + r.ratio, 0) / xs.length;
  const s = avg(small), l = avg(large);
  return l >= s - 0.05
    ? no(`leading does not tighten with size — small text ${s.toFixed(2)}, large text ${l.toFixed(2)}. Display type needs tighter leading than body type`)
    : ok(`leading tightens with size (${s.toFixed(2)} → ${l.toFixed(2)})`);
}

// ── adv-line-length — 45-75ch. Measured, not guessed: ~0.5em per character for a proportional face.
export function advLineLength(els, { min = 45, max = 80 } = {}) {
  const paras = els.filter((e) => e.text && e.text.length > 80 && e.styles?.fontSize > 0 && e.w > 0);
  if (!paras.length) return na('no running text long enough to measure');
  const bad = paras.map((e) => ({ e, ch: e.w / (e.styles.fontSize * 0.5) }))
    .filter((x) => x.ch < min || x.ch > max);
  return bad.length
    ? no(`${bad.length} text block(s) outside ${min}-${max}ch: ${bad.slice(0, 3).map((x) => `${Math.round(x.ch)}ch`).join(', ')}`)
    : ok(`${paras.length} text block(s) within measure`);
}

// ── adv-tabular-numerals — C3 160. Numbers in a column that are not tabular jitter as they change. ─
export function advTabularNumerals(els) {
  const numeric = els.filter((e) => isNumericCell(e.text));
  if (numeric.length < 2) return na('no columnar numerals found');
  const bad = numeric.filter((e) => !/tabular-nums/.test(String(e.styles?.fontVariantNumeric ?? '')));
  return bad.length
    ? no(`${bad.length}/${numeric.length} numeric cells lack tabular-nums — digits will shift width as values change`)
    : ok(`all ${numeric.length} numeric cells use tabular-nums`);
}

// ── adv-radius-nesting — A4. A child radius larger than its parent's makes the corners run
// un-parallel; concentric nesting wants child ≤ parent.
export function advRadiusNesting(els) {
  const nested = els.filter((e) => e.parentRadius != null && e.styles?.borderRadius != null);
  if (!nested.length) return na('no nested radii measured');
  const bad = nested.filter((e) => e.styles.borderRadius > e.parentRadius + 0.5 && e.parentRadius > 0);
  return bad.length
    ? no(`${bad.length} element(s) have a larger radius than their container: ${bad.slice(0, 3).map((e) => `.${e.cls} ${e.styles.borderRadius}>${e.parentRadius}`).join(', ')}`)
    : ok('nested radii are concentric');
}

// ── adv-shadow-one-light-source — every shadow in a view must fall the same way. ─────────────────
export function advShadowOneLightSource(els) {
  const ys = [];
  for (const e of els) {
    const sh = String(e.styles?.boxShadow ?? '');
    if (!sh || sh === 'none') continue;
    for (const m of sh.matchAll(/(-?\d+(?:\.\d+)?)px\s+(-?\d+(?:\.\d+)?)px/g)) ys.push(parseFloat(m[2]));
  }
  const meaningful = ys.filter((y) => Math.abs(y) > 0.5);
  if (meaningful.length < 2) return na('fewer than two directional shadows');
  const up = meaningful.filter((y) => y < 0).length;
  const down = meaningful.filter((y) => y > 0).length;
  return up && down
    ? no(`shadows fall in two directions (${down} down, ${up} up) — that is two light sources in one view`)
    : ok(`all ${meaningful.length} shadows share one light source`);
}

// ── adv-shadow-tinted-layered — A4 120-121. A single flat pure-black shadow is the default nobody chose.
export function advShadowTintedLayered(els) {
  const shadows = els.map((e) => String(e.styles?.boxShadow ?? '')).filter((s) => s && s !== 'none');
  if (!shadows.length) return na('no shadows used');
  const flatBlack = shadows.filter((s) => {
    const layers = s.split(/,(?![^(]*\))/).length;
    const pureBlack = /rgba?\(0,\s*0,\s*0/.test(s);
    return layers < 2 && pureBlack;
  });
  return flatBlack.length
    ? no(`${flatBlack.length}/${shadows.length} shadow(s) are a single pure-black layer — real depth is layered and tinted toward the surface beneath`)
    : ok(`${shadows.length} shadow(s), layered or tinted`);
}

// ── adv-dark-surface-floor — A1/A4: pure black surfaces kill elevation, because you cannot go darker.
export function advDarkSurfaceFloor(els, { floor = 12 } = {}) {
  const surfaces = els.map((e) => rgb(e.styles?.backgroundColor)).filter((c) => c && lum(c) < 0.25);
  if (!surfaces.length) return na('no dark surfaces measured');
  const tooDark = surfaces.filter((c) => Math.max(...c) < floor);
  return tooDark.length
    ? no(`${tooDark.length} surface(s) at or near pure black — there is no darker step left for elevation`)
    : ok(`${surfaces.length} dark surface(s) sit above the black floor`);
}

// ── adv-neutral-tint — a perfectly neutral grey next to a warm accent reads as dirty. ─────────────
export function advNeutralTint(els, { minChroma = 2, maxChroma = 30 } = {}) {
  const greys = els.map((e) => rgb(e.styles?.backgroundColor)).filter((c) => c && chroma(c) <= maxChroma);
  if (greys.length < 2) return na('not enough neutral surfaces to judge');
  const flat = greys.filter((c) => chroma(c) === 0);
  return flat.length === greys.length
    ? no(`all ${greys.length} neutral surfaces are perfectly untinted — a pure grey beside a warm accent reads as dirty`)
    : ok(`${greys.length - flat.length}/${greys.length} neutrals carry a tint`);
}

// ── scale adherence — few deliberate steps, not a scatter. One function, three rules. ─────────────
function scaleAdherence(values, { label, maxSteps }) {
  const vals = values.filter((v) => typeof v === 'number' && v > 0);
  if (vals.length < 4) return na(`too few ${label} values to judge a scale`);
  const steps = new Set(vals.map((v) => Math.round(v * 10) / 10));
  return steps.size > maxSteps
    ? no(`${steps.size} distinct ${label} values (${[...steps].sort((a, b) => a - b).slice(0, 8).join(', ')}…) — a scale has a few deliberate steps, not a scatter`)
    : ok(`${steps.size} ${label} step(s)`);
}
export const advTypeScale = (els) => scaleAdherence(els.map((e) => e.styles?.fontSize), { label: 'font-size', maxSteps: 7 });
export const advRadiusScale = (els) => scaleAdherence(els.map((e) => e.styles?.borderRadius), { label: 'border-radius', maxSteps: 5 });
export const advSpacingScale = (els) => scaleAdherence(
  els.flatMap((e) => [e.styles?.paddingTop, e.styles?.paddingBottom]), { label: 'padding', maxSteps: 8 });

// ── adv-numeric-column-alignment — C3 160. Numbers align right so the digits line up. ────────────
export function advNumericColumnAlignment(els) {
  const numeric = els.filter((e) => isNumericCell(e.text) && e.styles?.textAlign);
  if (numeric.length < 2) return na('no numeric cells to align');
  const bad = numeric.filter((e) => e.styles.textAlign === 'left' || e.styles.textAlign === 'start');
  return bad.length
    ? no(`${bad.length}/${numeric.length} numeric cells are left-aligned — digits only line up on the right`)
    : ok(`all ${numeric.length} numeric cells align right or centre`);
}

export const COMPUTED_RULES = {
  'floor-target-size': floorTargetSize,
  'adv-type-family-count': advTypeFamilyCount,
  'adv-leading-by-role': advLeadingByRole,
  'adv-line-length': advLineLength,
  'adv-tabular-numerals': advTabularNumerals,
  'adv-radius-nesting': advRadiusNesting,
  'adv-shadow-one-light-source': advShadowOneLightSource,
  'adv-shadow-tinted-layered': advShadowTintedLayered,
  'adv-dark-surface-floor': advDarkSurfaceFloor,
  'adv-neutral-tint': advNeutralTint,
  'adv-type-scale': advTypeScale,
  'adv-radius-scale': advRadiusScale,
  'adv-spacing-scale': advSpacingScale,
  'adv-numeric-column-alignment': advNumericColumnAlignment,
};

/** Run every computed rule over one panel's records. */
export function runComputedRules(els, opts = {}) {
  const out = {};
  for (const [id, fn] of Object.entries(COMPUTED_RULES)) {
    try { out[id] = fn(els, opts[id] ?? {}); }
    catch (e) { out[id] = no(`rule threw: ${String(e).slice(0, 120)}`); }
  }
  return out;
}
