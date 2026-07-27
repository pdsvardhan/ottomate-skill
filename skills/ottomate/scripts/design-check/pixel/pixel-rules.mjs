// pixel-rules.mjs — the three rules that could only ever be answered by sampling pixels. P2.
//
// Same pure-function shape as computed-rules.mjs: measurements in, verdict out, so each has a
// must-fail and a must-pass case runnable in plain Node. The host (run-pixel.mjs) only CAPTURES.

import { accentPixelShare, worstRegionContrast, comparePNG } from './pixel-compare.mjs';

const ok = (detail) => ({ pass: true, detail });
const no = (detail) => ({ pass: false, detail });
const na = (detail) => ({ pass: true, detail, notApplicable: true });

/**
 * adv-accent-budget — ~10% of PIXELS, ±5.
 *
 * The numeric form of the owner's colour-budget rule, and deliberately a different instrument from
 * `colour_budget`: that one counts SURFACES, this one counts paint. A design can declare the accent
 * on two surfaces and still flood the panel with it, which surface-counting scores as exemplary.
 */
export function advAccentBudget(png, accents, { accent_pct = 10, tolerance_pct = 5 } = {}) {
  if (!accents?.length) return na('no accent colours declared — nothing to measure a budget against');
  const { share, pixels, total } = accentPixelShare(png, accents);
  if (share == null) return na('accent share could not be measured');
  const pct = share * 100;
  const lo = Math.max(0, accent_pct - tolerance_pct), hi = accent_pct + tolerance_pct;
  if (pct > hi) {
    return no(`accent covers ${pct.toFixed(1)}% of pixels (budget ${accent_pct}±${tolerance_pct}%) — accent everywhere reads cheap; ${pixels} of ${total} px`);
  }
  if (pct < lo) {
    // THE DENOMINATOR IS THE WHOLE PANEL, content imagery included. On a poster-card grid the art
    // occupies most of the render and carries its own colour, so the accent's share of *design*
    // surface is higher than this number. Said in the finding itself rather than quietly widening
    // the tolerance: the threshold is the doctrine's, and the reader gets what they need to judge.
    return no(`accent covers only ${pct.toFixed(1)}% of pixels (budget ${accent_pct}±${tolerance_pct}%) — accent nowhere reads dead. Note: measured over the whole panel including content imagery, which dilutes the share on an art-heavy component`);
  }
  return ok(`accent covers ${pct.toFixed(1)}% of pixels, within the ${accent_pct}±${tolerance_pct}% budget`);
}

/**
 * adv-glass-legibility — the contrast half, at last measurable.
 *
 * THE CAVEAT IS PART OF THE RULE, not a footnote to it. The effective background behind a glass
 * surface is the blurred composite, which getComputedStyle provably cannot report — that is why this
 * rule sat unenforceable. Sampling the rendered region fixes the *measurement*, but this still does
 * not know which pixels the glyphs cover, so it reports the WORST-CASE REGION contrast behind the
 * text box. That is a real, conservative measurement, and the register must claim exactly that and
 * no more.
 */
export function advGlassLegibility(png, surfaces, { text_ratio = 4.5, large_text_ratio = 3 } = {}) {
  if (!surfaces?.length) return na('no translucent surface with text — nothing behind which to sample');
  const problems = [];
  for (const s of surfaces) {
    const need = s.largeText ? large_text_ratio : text_ratio;
    const { worstContrast, at } = worstRegionContrast(png, s.color, s.region);
    if (worstContrast == null) { problems.push(`${s.label}: region could not be sampled`); continue; }
    if (worstContrast < need) {
      problems.push(`${s.label}: worst region ${worstContrast.toFixed(2)}:1 behind the text (needs ${need}:1)${at ? ` at ${at.x},${at.y}` : ''}`);
    }
  }
  return problems.length
    ? no(`${problems.join('; ')} — measured on the composited backdrop, which is what a reader sees`)
    : ok(`${surfaces.length} glass surface(s) clear their contrast floor at worst-case sampling`);
}

/**
 * adv-motion-behind-text — visible movement behind reading text AT REST is a defect.
 *
 * `frames` are captures of the same region with no interaction between them. If the region behind
 * text changes while nobody is touching anything, something is moving under the copy.
 */
export function advMotionBehindText(frames, { minFraction = 0.002, minMaxDelta = 0.15 } = {}) {
  if (!frames || frames.length < 2) return na('fewer than two frames captured — motion cannot be judged');
  const worst = { fraction: 0, maxDelta: 0 };
  for (let i = 1; i < frames.length; i++) {
    const c = comparePNG(frames[0], frames[i]);
    if (c.fraction > worst.fraction) { worst.fraction = c.fraction; worst.maxDelta = c.maxDelta; }
  }
  if (worst.fraction <= minFraction || worst.maxDelta < minMaxDelta) {
    return ok(`the region behind text is still at rest (${(worst.fraction * 100).toFixed(2)}% of pixels drifted, peak ${worst.maxDelta.toFixed(3)})`);
  }
  return no(`${(worst.fraction * 100).toFixed(1)}% of the pixels behind reading text change at rest (peak ${worst.maxDelta.toFixed(2)}) — movement under copy is a defect, and auto-motion past 5s needs a pause control`);
}

export const PIXEL_RULES = {
  'adv-accent-budget': advAccentBudget,
  'adv-glass-legibility': advGlassLegibility,
  'adv-motion-behind-text': advMotionBehindText,
};
