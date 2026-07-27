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
/**
 * A background that is actually PAINTED. `rgba(0, 0, 0, 0)` is the computed value of every element
 * with no background at all, and it parses to pure black — so surface rules were counting every
 * transparent div as a pure-black surface. Found on the first real-Chromium run of the P1 collector:
 * `adv-dark-surface-floor` reported "6 surfaces at or near pure black" on a page with one dark card.
 */
export function paintedBg(e) {
  const raw = String(e?.styles?.backgroundColor ?? '');
  const alpha = /rgba\(\s*[\d.]+\s*,\s*[\d.]+\s*,\s*[\d.]+\s*,\s*([\d.]+)\s*\)/.exec(raw);
  if (alpha && parseFloat(alpha[1]) === 0) return null;
  return rgb(raw);
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
  const surfaces = els.map(paintedBg).filter((c) => c && lum(c) < 0.25);
  if (!surfaces.length) return na('no dark surfaces measured');
  const tooDark = surfaces.filter((c) => Math.max(...c) < floor);
  return tooDark.length
    ? no(`${tooDark.length} surface(s) at or near pure black — there is no darker step left for elevation`)
    : ok(`${surfaces.length} dark surface(s) sit above the black floor`);
}

// ── adv-neutral-tint — a perfectly neutral grey next to a warm accent reads as dirty. ─────────────
export function advNeutralTint(els, { minChroma = 2, maxChroma = 30 } = {}) {
  const greys = els.map(paintedBg).filter((c) => c && chroma(c) <= maxChroma);
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

// ══ P1 · the computed tail ══════════════════════════════════════════════════════════════════════
//
// Extra record fields these read, which the collector must populate (half 2 of the unit — a rule
// enforced in Node and inert in production is enforcement in name only):
//   hasIcon                     — does the element contain an <svg>/<img> child
//   focus:{outlineStyle,outlineWidth,outlineColor,boxShadow}  — resolved under a forced :focus-visible
//   hover:{backgroundColor} · active:{backgroundColor}        — resolved under forced pseudo-states
//   styles.marginTop / marginBottom / letterSpacing
//   dark                        — which colour-scheme this record set was collected under
//
// ── colour maths ────────────────────────────────────────────────────────────────────────────────
// Implemented here rather than reused from computed-checks.js on purpose. That file's `deltaE` is
// CIE76 and says so in its own comment; `adv-token-adherence` specifies ΔE2000 at a tolerance of
// 1–2, and at that tolerance the two metrics genuinely disagree — CIE76 over-reports difference in
// saturated blues, which is exactly where a brand accent tends to sit. Calling CIE76 "ΔE2000" would
// be a quiet false claim. The coarse CIE76 gate elsewhere is untouched.
function srgbToLab(c) {
  const f = (v) => { v /= 255; return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); };
  const [r, g, b] = [f(c[0]), f(c[1]), f(c[2])];
  let x = (r * 0.4124 + g * 0.3576 + b * 0.1805) / 0.95047;
  let y = (r * 0.2126 + g * 0.7152 + b * 0.0722);
  let z = (r * 0.0193 + g * 0.1192 + b * 0.9505) / 1.08883;
  const p = (t) => (t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116);
  [x, y, z] = [p(x), p(y), p(z)];
  return [116 * y - 16, 500 * (x - y), 200 * (y - z)];
}
/** CIEDE2000. Sharma/Wu/Dalal formulation. */
export function deltaE2000(c1, c2) {
  const [L1, a1, b1] = srgbToLab(c1), [L2, a2, b2] = srgbToLab(c2);
  const rad = Math.PI / 180, deg = 180 / Math.PI;
  const C1 = Math.hypot(a1, b1), C2 = Math.hypot(a2, b2);
  const Cb = (C1 + C2) / 2;
  const G = 0.5 * (1 - Math.sqrt(Cb ** 7 / (Cb ** 7 + 25 ** 7)));
  const ap1 = (1 + G) * a1, ap2 = (1 + G) * a2;
  const Cp1 = Math.hypot(ap1, b1), Cp2 = Math.hypot(ap2, b2);
  const hp = (b, ap) => { if (b === 0 && ap === 0) return 0; const h = Math.atan2(b, ap) * deg; return h < 0 ? h + 360 : h; };
  const hp1 = hp(b1, ap1), hp2 = hp(b2, ap2);
  const dLp = L2 - L1, dCp = Cp2 - Cp1;
  let dhp = 0;
  if (Cp1 * Cp2 !== 0) {
    dhp = hp2 - hp1;
    if (dhp > 180) dhp -= 360; else if (dhp < -180) dhp += 360;
  }
  const dHp = 2 * Math.sqrt(Cp1 * Cp2) * Math.sin((dhp * rad) / 2);
  const Lbp = (L1 + L2) / 2, Cbp = (Cp1 + Cp2) / 2;
  let hbp;
  if (Cp1 * Cp2 === 0) hbp = hp1 + hp2;
  else if (Math.abs(hp1 - hp2) <= 180) hbp = (hp1 + hp2) / 2;
  else hbp = hp1 + hp2 < 360 ? (hp1 + hp2 + 360) / 2 : (hp1 + hp2 - 360) / 2;
  const T = 1 - 0.17 * Math.cos((hbp - 30) * rad) + 0.24 * Math.cos(2 * hbp * rad)
    + 0.32 * Math.cos((3 * hbp + 6) * rad) - 0.20 * Math.cos((4 * hbp - 63) * rad);
  const dTheta = 30 * Math.exp(-(((hbp - 275) / 25) ** 2));
  const Rc = 2 * Math.sqrt(Cbp ** 7 / (Cbp ** 7 + 25 ** 7));
  const Sl = 1 + (0.015 * (Lbp - 50) ** 2) / Math.sqrt(20 + (Lbp - 50) ** 2);
  const Sc = 1 + 0.045 * Cbp, Sh = 1 + 0.015 * Cbp * T;
  const Rt = -Math.sin(2 * dTheta * rad) * Rc;
  return Math.sqrt((dLp / Sl) ** 2 + (dCp / Sc) ** 2 + (dHp / Sh) ** 2 + Rt * (dCp / Sc) * (dHp / Sh));
}
function chan(v) { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }
export function contrast(c1, c2) {
  const l1 = 0.2126 * chan(c1[0]) + 0.7152 * chan(c1[1]) + 0.0722 * chan(c1[2]);
  const l2 = 0.2126 * chan(c2[0]) + 0.7152 * chan(c2[1]) + 0.0722 * chan(c2[2]);
  const [hi, lo] = l1 >= l2 ? [l1, l2] : [l2, l1];
  return (hi + 0.05) / (lo + 0.05);
}
/** Perceptual lightness on 0–1, so the doctrine's ΔL bands (0.04–0.06) mean what they say. */
const lab_L = (c) => srgbToLab(c)[0] / 100;
function hueOf(c) {
  const [r, g, b] = c.map((v) => v / 255);
  const max = Math.max(r, g, b), min = Math.min(r, g, b), d = max - min;
  if (d < 1e-6) return null;
  let h = max === r ? ((g - b) / d) % 6 : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
  h *= 60;
  return h < 0 ? h + 360 : h;
}
const hueGap = (h1, h2) => { const d = Math.abs(h1 - h2) % 360; return d > 180 ? 360 - d : d; };
const role = (e) => `${e.tag}.${e.cls}`;
const isHeading = (e) => /^h[1-6]$/.test(e.tag);
const isLargeText = (e) => e.styles?.fontSize >= 24 || (e.styles?.fontSize >= 18.66 && parseInt(e.styles?.fontWeight, 10) >= 700);

// ── floor-not-colour-alone — colour is CARRYING meaning only when two or more cues in the same role
// differ in hue. One coloured thing is decoration. If those cues are identical in every non-colour
// channel — text, icon, weight, shape — then colour is the only channel, and a colour-blind or
// greyscale reader gets nothing.
export function floorNotColourAlone(els, { minChroma = 30 } = {}) {
  const cues = els.filter((e) => {
    const bg = paintedBg(e), fg = rgb(e.styles?.color);
    return (bg && chroma(bg) >= minChroma) || (fg && chroma(fg) >= minChroma);
  });
  const groups = new Map();
  for (const e of cues) { const k = role(e); if (!groups.has(k)) groups.set(k, []); groups.get(k).push(e); }
  const multi = [...groups.entries()].filter(([, g]) => g.length >= 2);
  if (!multi.length) return na('no repeated chromatic cue — colour is not distinguishing states here');

  const broken = [];
  for (const [k, g] of multi) {
    const hues = g.map((e) => hueOf(rgb(e.styles?.backgroundColor) ?? rgb(e.styles?.color) ?? [0, 0, 0])).filter((h) => h != null);
    if (hues.length < 2) continue;
    const varies = hues.some((h) => hueGap(h, hues[0]) > 20);
    if (!varies) continue;                         // same hue throughout: not encoding state by colour
    const second = new Set(g.map((e) => `${(e.text || '').trim()}|${e.hasIcon ? 'i' : ''}|${e.styles?.fontWeight ?? ''}|${e.styles?.borderRadius ?? ''}`));
    if (second.size === 1) broken.push(k);
  }
  return broken.length
    ? no(`${broken.join(', ')} — cues differ in hue but are identical in text, icon, weight and shape, so colour is the only channel carrying the state`)
    : ok(`${multi.length} repeated chromatic cue group(s), each with a second channel`);
}

// ── floor-focus-ring — A5 over A4 (arbitrated). forced-colors DELETES box-shadow, so a shadow-only
// ring leaves a Windows High Contrast user with no visible focus at all.
export function floorFocusRing(els, { minPx = 2, minContrast = 3, surface = null } = {}) {
  const focusable = els.filter((e) => e.focus);
  if (!focusable.length) return na('no focus states collected — NOT checked, and therefore NOT passed');
  const problems = [];
  for (const e of focusable) {
    const f = e.focus;
    const width = parseFloat(f.outlineWidth) || 0;
    const drawn = f.outlineStyle && f.outlineStyle !== 'none' && width > 0;
    if (!drawn) {
      problems.push(`${role(e)}: ${f.boxShadow && f.boxShadow !== 'none' ? 'focus ring drawn with box-shadow only — forced-colors removes it' : 'no visible focus indicator'}`);
      continue;
    }
    if (width < minPx) { problems.push(`${role(e)}: outline ${width}px, floor is ${minPx}px`); continue; }
    const ring = rgb(f.outlineColor);
    const own = paintedBg(e);
    const behind = rgb(surface) ?? own;
    for (const [label, against] of [['the component', own], ['the surface behind it', behind]]) {
      if (ring && against && contrast(ring, against) < minContrast) {
        problems.push(`${role(e)}: focus ring ${contrast(ring, against).toFixed(2)}:1 against ${label}, floor is ${minContrast}:1`);
      }
    }
  }
  return problems.length ? no(problems.slice(0, 4).join('; ')) : ok(`${focusable.length} focusable element(s) carry a conforming focus ring`);
}

// ── adv-state-delta-relative — A1 §3.9. A state delta is a direction-aware lightness move, so ONE
// rule works in both modes. A second hardcoded hex is the tell: the hue jumps.
export function advStateDeltaRelative(els, { hover_dL = [0.04, 0.06], press_dL = [0.08, 0.10], hueTolerance = 10 } = {}) {
  const staged = els.filter((e) => paintedBg(e) && (e.hover || e.active));
  if (!staged.length) return na('no hover/press states collected');
  const problems = [];
  for (const e of staged) {
    const base = paintedBg(e);
    const dark = e.dark ?? lab_L(base) < 0.5;
    for (const [name, st, band] of [['hover', e.hover, hover_dL], ['press', e.active, press_dL]]) {
      const c = st && rgb(st.backgroundColor);
      if (!c) continue;
      const dL = lab_L(c) - lab_L(base);
      const hb = hueOf(base), hc = hueOf(c);
      if (hb != null && hc != null && hueGap(hb, hc) > hueTolerance) {
        problems.push(`${role(e)} ${name}: hue moves ${hueGap(hb, hc).toFixed(0)}° — that is a second hardcoded colour, not a lightness move`);
        continue;
      }
      if (Math.abs(dL) < 1e-4) { problems.push(`${role(e)} ${name}: no lightness change at all`); continue; }
      const wantPositive = dark;                     // dark surfaces lighten, light surfaces darken
      if ((dL > 0) !== wantPositive) problems.push(`${role(e)} ${name}: moves the wrong way for a ${dark ? 'dark' : 'light'} surface (ΔL ${dL.toFixed(3)})`);
      else if (Math.abs(dL) < band[0] - 0.005 || Math.abs(dL) > band[1] + 0.02) {
        problems.push(`${role(e)} ${name}: ΔL ${Math.abs(dL).toFixed(3)} outside the ${band[0]}–${band[1]} band`);
      }
    }
  }
  return problems.length ? no(problems.slice(0, 4).join('; ')) : ok(`${staged.length} element(s) move state by a relative lightness delta`);
}

// ── adv-derivation-contrast-guarantee — A1 §3.10/§3.11. Never paint a surface with the RAW extracted
// pick: normalise L and clamp C so contrast is guaranteed at derivation time, not hoped for later.
export function advDerivationContrastGuarantee(els, { minChroma = 30, minContrast = 4.5, largeTextContrast = 3 } = {}) {
  const painted = els.filter((e) => {
    const bg = paintedBg(e);
    return bg && chroma(bg) >= minChroma && e.text && e.text.trim() && rgb(e.styles?.color);
  });
  if (!painted.length) return na('no accent-painted surface carrying text');
  const bad = [];
  for (const e of painted) {
    const need = isLargeText(e) ? largeTextContrast : minContrast;
    const c = contrast(rgb(e.styles.color), paintedBg(e));
    if (c < need) bad.push(`${role(e)} ${c.toFixed(2)}:1 (needs ${need}:1)`);
  }
  return bad.length
    ? no(`accent surface painted with a colour that was never normalised for contrast: ${bad.slice(0, 4).join(', ')} — clamp L and C at derivation time, not after`)
    : ok(`${painted.length} accent surface(s) clear contrast against their own text`);
}

// ── adv-density-scale — A3 §3.11/§3.12, Carbon-verified. Dense grids get their own 4px scale.
export function advDensityScale(els, { step_px = 4, target_review_below = 32, minRows = 15 } = {}) {
  const groups = new Map();
  for (const e of els) { if (!(e.h > 0)) continue; const k = role(e); if (!groups.has(k)) groups.set(k, []); groups.get(k).push(e.h); }
  const grids = [...groups.entries()].filter(([, hs]) => hs.length >= minRows);
  if (!grids.length) return na(`no repeated row group of ${minRows}+ — density scale does not apply`);
  const problems = [];
  for (const [k, hs] of grids) {
    const distinct = [...new Set(hs.map((h) => Math.round(h * 10) / 10))];
    const offStep = distinct.filter((h) => Math.abs(h / step_px - Math.round(h / step_px)) > 0.13);
    if (offStep.length) problems.push(`${k}: row heights off the ${step_px}px density step (${offStep.slice(0, 4).join(', ')})`);
    const tiny = distinct.filter((h) => h < target_review_below);
    if (tiny.length) problems.push(`${k}: rows at ${tiny.join(', ')}px are below ${target_review_below}px and need a target-size review`);
    if (distinct.length > 2) problems.push(`${k}: ${distinct.length} distinct row heights — a density band is one height, not a scatter`);
  }
  return problems.length ? no(problems.slice(0, 4).join('; ')) : ok(`${grids.length} dense grid(s) on the ${step_px}px density scale`);
}

// ── adv-whitespace-first — A3 §3.14. A heading carries 1.5–2× more space above than below. That
// asymmetry says "this heading belongs to what FOLLOWS" at zero colour cost.
// Known limit: adjacent margins collapse, and a resolved margin cannot show that. Advisory tier.
export function advWhitespaceFirst(els, { above_below_ratio = [1.5, 2] } = {}) {
  const headings = els.filter((e) => isHeading(e) && ((e.styles?.marginTop ?? 0) > 0 || (e.styles?.marginBottom ?? 0) > 0));
  if (!headings.length) return na('no headings with non-zero margins');
  const problems = [];
  for (const e of headings) {
    const above = e.styles.marginTop ?? 0, below = e.styles.marginBottom ?? 0;
    if (below === 0) continue;                                  // maximum asymmetry, nothing to fault
    const r = above / below;
    if (r <= 1) problems.push(`${role(e)}: ${above}px above vs ${below}px below — the heading reads as belonging to what precedes it`);
    else if (r < above_below_ratio[0]) problems.push(`${role(e)}: ratio ${r.toFixed(2)}, below the ${above_below_ratio[0]}× that makes the grouping legible`);
  }
  return problems.length ? no(problems.slice(0, 4).join('; ')) : ok(`${headings.length} heading(s) carry the space asymmetry`);
}

// ── adv-body-type — G2 dim 3. Body text ≥14px with 1.4–1.6 leading.
export function advBodyType(els, { min_px = 14, line_height_min = 1.4, line_height_max = 1.6 } = {}) {
  const body = els.filter((e) => !isHeading(e) && e.text && e.text.trim().length > 40 && e.styles?.fontSize > 0);
  if (!body.length) return na('no running body text to measure');
  const problems = [];
  for (const e of body) {
    if (e.styles.fontSize < min_px) problems.push(`${role(e)}: ${e.styles.fontSize}px body text, floor is ${min_px}px`);
    const lh = e.styles.lineHeight > 0 ? e.styles.lineHeight / e.styles.fontSize : null;
    if (lh != null && (lh < line_height_min - 0.01 || lh > line_height_max + 0.01)) {
      problems.push(`${role(e)}: leading ${lh.toFixed(2)} outside ${line_height_min}–${line_height_max}`);
    }
  }
  return problems.length ? no(problems.slice(0, 4).join('; ')) : ok(`${body.length} body text block(s) within the type floor`);
}

// ── adv-token-adherence — G2 dim 2, tolerance from C2 §3.10. Compares the COMPUTED colour against
// the RESOLVED token value: a source grep cannot see cascade resolution or color-mix()/oklch() output.
export function advTokenAdherence(els, { tokens = [], delta_e_pass = 1, delta_e_warn = 2 } = {}) {
  const swatches = tokens.map((t) => rgb(t)).filter(Boolean);
  if (!swatches.length) return na('no declared token set to compare against');
  const used = [];
  for (const e of els) {
    for (const [prop, v] of [['color', e.styles?.color], ['background', e.styles?.backgroundColor]]) {
      const c = prop === 'background' ? paintedBg(e) : rgb(v);
      if (!c) continue;
      used.push({ role: role(e), prop, c });
    }
  }
  if (!used.length) return na('no colours measured');
  const drift = [];
  for (const u of used) {
    const nearest = Math.min(...swatches.map((s) => deltaE2000(u.c, s)));
    if (nearest > delta_e_warn) drift.push(`${u.role} ${u.prop} ΔE${nearest.toFixed(1)}`);
  }
  return drift.length
    ? no(`${drift.length}/${used.length} colour(s) outside ΔE2000 ${delta_e_warn} of any declared token: ${[...new Set(drift)].slice(0, 4).join(', ')} — a one-off hex is drift, not a decision`)
    : ok(`all ${used.length} colours trace to the token set (ΔE2000 ≤ ${delta_e_warn}; ${delta_e_pass} is the clean bar)`);
}

// ── adv-dark-mode-type-optical — A2 §3.8. Light-on-dark blooms, so identical weight AND tracking in
// both modes means one of them is wrong. A1 rule 66 owns the chromatic half; this is the optical half.
export function advDarkModeTypeOptical(els, { weight_reduction_pct = [10, 15], tracking_increase_em = [0.01, 0.02] } = {}) {
  const light = new Map(), dark = new Map();
  for (const e of els) {
    if (!e.text || !e.text.trim() || !(e.styles?.fontSize > 0)) continue;
    (e.dark ? dark : light).set(role(e), e);
  }
  const shared = [...light.keys()].filter((k) => dark.has(k));
  if (!shared.length) return na('records for only one colour scheme — nothing to compare');
  const problems = [];
  for (const k of shared) {
    const l = light.get(k), d = dark.get(k);
    const lw = parseInt(l.styles.fontWeight, 10) || 400, dw = parseInt(d.styles.fontWeight, 10) || 400;
    const lt = (l.styles.letterSpacing ?? 0) / l.styles.fontSize, dt = (d.styles.letterSpacing ?? 0) / d.styles.fontSize;
    const drop = ((lw - dw) / lw) * 100;
    const open = dt - lt;
    if (drop <= 0 && open <= 0.0005) {
      problems.push(`${k}: identical weight (${lw}) and tracking in both modes — light-on-dark blooms, so one of them is wrong`);
    } else if (drop > 0 && drop < weight_reduction_pct[0] - 2 && open < tracking_increase_em[0] - 0.002) {
      problems.push(`${k}: weight drops only ${drop.toFixed(1)}% and tracking opens ${open.toFixed(4)}em — below the ${weight_reduction_pct[0]}% / ${tracking_increase_em[0]}em adjustment`);
    }
  }
  return problems.length ? no(problems.slice(0, 4).join('; ')) : ok(`${shared.length} role(s) carry a dark-mode optical adjustment`);
}

export const COMPUTED_RULES = {
  'floor-not-colour-alone': floorNotColourAlone,
  'floor-focus-ring': floorFocusRing,
  'adv-state-delta-relative': advStateDeltaRelative,
  'adv-derivation-contrast-guarantee': advDerivationContrastGuarantee,
  'adv-density-scale': advDensityScale,
  'adv-whitespace-first': advWhitespaceFirst,
  'adv-body-type': advBodyType,
  'adv-token-adherence': advTokenAdherence,
  'adv-dark-mode-type-optical': advDarkModeTypeOptical,
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
