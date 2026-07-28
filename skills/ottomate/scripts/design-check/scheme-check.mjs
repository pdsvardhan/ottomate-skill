// scheme-check.mjs — C8: assert the floors hold in BOTH light and dark (half of AC4, 2026-07-28).
//
// A design that clears contrast in light and fails in dark is half-broken, and a single-scheme review
// never sees it. The computed collector already tags each record with `dark`; this runs the floors over
// records collected under each scheme and names the failing scheme. The per-scheme COLLECTION (run the
// harness once per prefers-color-scheme in real Chromium) is the browser half; this is the assertion.

import { rgb, paintedBg, contrast, COMPUTED_RULES } from './computed-rules.mjs';

const ok = (detail) => ({ pass: true, detail });
const no = (detail) => ({ pass: false, detail });
const na = (detail) => ({ pass: true, detail, notApplicable: true });

/**
 * Per-element text-vs-own-background contrast. Honest about scope: only elements that PAINT their own
 * background and carry text are measured — resolving the nearest opaque ancestor for an inherited
 * background is a browser job, not something to fake over flat records.
 */
export function schemeContrastFloor(els, { min = 4.5 } = {}) {
  const checked = [];
  for (const e of els ?? []) {
    const fg = rgb(e?.styles?.color);
    const bg = paintedBg(e);
    if (!fg || !bg || !String(e?.text ?? '').trim()) continue;
    checked.push({ ratio: contrast(fg, bg) });
  }
  if (!checked.length) return na('no text-on-own-background elements to measure');
  const bad = checked.filter((c) => c.ratio < min);
  return bad.length
    ? no(`${bad.length}/${checked.length} text element(s) below ${min}:1 (worst ${Math.min(...bad.map((b) => b.ratio)).toFixed(2)}:1)`)
    : ok(`${checked.length} text element(s) clear ${min}:1`);
}

// The floors that must hold in EVERY scheme. Contrast is the headline (AC4); the always-floors ride
// along and return notApplicable when the panel has no control/ring/colour-coded state.
export const SCHEME_FLOORS = {
  'floor-contrast': schemeContrastFloor,
  'floor-not-colour-alone': COMPUTED_RULES['floor-not-colour-alone'],
  'floor-focus-ring': COMPUTED_RULES['floor-focus-ring'],
  'floor-target-size': COMPUTED_RULES['floor-target-size'],
};

/**
 * Assert the floors hold in BOTH schemes. Records must be collected once per prefers-color-scheme.
 * @param {{light?:Array, dark?:Array}} schemes
 * @returns {{ok:boolean, measured:string[], perScheme:object, failing:Array, why:string}}
 */
export function assertBothSchemes({ light = null, dark = null } = {}, opts = {}) {
  const present = [['light', light], ['dark', dark]].filter(([, v]) => Array.isArray(v));
  const measured = present.map(([n]) => n);
  if (present.length < 2) {
    return {
      ok: false, measured, perScheme: {}, failing: [],
      why: `both schemes must be collected before presenting; measured only [${measured.join(', ') || 'none'}]. A scheme not measured is not a scheme that passed.`,
    };
  }
  const perScheme = {};
  const failing = [];
  for (const [name, els] of present) {
    const floors = {};
    for (const [id, fn] of Object.entries(SCHEME_FLOORS)) {
      try { floors[id] = fn(els, opts[id] ?? {}); } catch (e) { floors[id] = no(`rule threw: ${String(e).slice(0, 80)}`); }
      if (floors[id].pass === false) failing.push({ scheme: name, rule: id, detail: floors[id].detail });
    }
    perScheme[name] = { pass: Object.values(floors).every((f) => f.pass !== false), floors };
  }
  return {
    ok: failing.length === 0, measured, perScheme, failing,
    why: failing.length
      ? `floor failure(s) by scheme: ${failing.map((f) => `${f.rule}@${f.scheme}`).join(', ')}`
      : `floors hold in both schemes (measured: ${measured.join(', ')})`,
  };
}

export function formatSchemes(r) {
  if (r.ok) return `light+dark: PASS — floors hold in both (measured ${r.measured.join(', ')})`;
  return `light+dark: BLOCK — ${r.why}\n` + r.failing.map((f) => `  ${f.scheme}: ${f.rule} — ${f.detail}`).join('\n');
}
