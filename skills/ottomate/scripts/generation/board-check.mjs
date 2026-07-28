// board-check.mjs — rung A "style boards" schema + distinctness checker (C4, §5C, 2026-07-28).
//
// §5C rung A is 3–5 whole-vibe direction boards, each a named palette + a type voice + a mood + a hero
// sample. `design-directions.json` holds the 20 named directions and the router maps rung A, but
// NOTHING enforced what a board must contain or that the boards are actually DIFFERENT directions —
// two boards that differ only in their accent are not two directions, they are one with a swatch
// changed. This is that enforcement. PURE, zero-dependency (the colour maths are inline).
//
// The renderer (boards ARE a variant set with a different card) and a real rung-A round are the
// harness-side follow-up; this is the mechanical core that a round runner calls before rendering.

// ── colour maths: hex → Lab → ΔE (CIE76), enough to say "these palettes are the same direction" ──
function hexToRgb(hex) {
  const h = String(hex).replace('#', '');
  if (!/^[0-9a-fA-F]{6}$/.test(h)) return null;
  return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16));
}
function rgbToLab([r, g, b]) {
  let [R, G, B] = [r, g, b].map((v) => { v /= 255; return v > 0.04045 ? ((v + 0.055) / 1.055) ** 2.4 : v / 12.92; });
  let x = (R * 0.4124 + G * 0.3576 + B * 0.1805) / 0.95047;
  let y = (R * 0.2126 + G * 0.7152 + B * 0.0722);
  let z = (R * 0.0193 + G * 0.1192 + B * 0.9505) / 1.08883;
  [x, y, z] = [x, y, z].map((v) => (v > 0.008856 ? Math.cbrt(v) : 7.787 * v + 16 / 116));
  return [116 * y - 16, 500 * (x - y), 200 * (y - z)];
}
function deltaE(a, b) {
  const la = rgbToLab(a), lb = rgbToLab(b);
  return Math.hypot(la[0] - lb[0], la[1] - lb[1], la[2] - lb[2]);
}
const luminance = ([r, g, b]) => 0.2126 * r + 0.7152 * g + 0.0722 * b;

/** Board-to-board palette distance: mean ΔE over swatches matched by luminance order. Low = same look. */
export function paletteDistance(p1, p2) {
  const a = p1.map(hexToRgb).filter(Boolean).sort((x, y) => luminance(x) - luminance(y));
  const b = p2.map(hexToRgb).filter(Boolean).sort((x, y) => luminance(x) - luminance(y));
  const n = Math.min(a.length, b.length);
  if (!n) return Infinity;
  let sum = 0;
  for (let i = 0; i < n; i++) sum += deltaE(a[i], b[i]);
  return sum / n;
}

/**
 * How many swatches of the smaller palette have a near-identical match in the other (order-independent).
 * This is the right test for "same direction": a mean ΔE dilutes a single very-different accent, but
 * "differs in only ONE swatch" is exactly the accent-swap this rule must catch.
 */
export function sharedSwatches(p1, p2, tol = 8) {
  const a = p1.map(hexToRgb).filter(Boolean);
  const b = p2.map(hexToRgb).filter(Boolean);
  let shared = 0;
  for (const x of a) if (b.some((y) => deltaE(x, y) < tol)) shared++;
  return { shared, n: Math.min(a.length, b.length), differing: Math.min(a.length, b.length) - shared };
}

/**
 * One board's schema: { direction, palette:[4-6 hex], type_voice:{display,body}, mood:[3-5 words], hero_sample }.
 * @returns {{ok:boolean, problems:string[]}}
 */
export function validateBoard(board, { minPalette = 4, maxPalette = 6, minMood = 3, maxMood = 5 } = {}) {
  const p = [];
  if (!board || typeof board !== 'object') return { ok: false, problems: ['not a board object'] };
  if (!board.direction || !String(board.direction).trim()) p.push('missing `direction` (a named direction)');
  const pal = Array.isArray(board.palette) ? board.palette : null;
  if (!pal) p.push('missing `palette` array');
  else {
    if (pal.length < minPalette || pal.length > maxPalette) p.push(`palette has ${pal.length} colours — needs ${minPalette}–${maxPalette}`);
    const bad = pal.filter((h) => !hexToRgb(h));
    if (bad.length) p.push(`palette has non-hex entr(ies): ${bad.join(', ')}`);
  }
  const tv = board.type_voice;
  if (!tv || !tv.display || !tv.body) p.push('missing `type_voice.{display,body}`');
  const mood = Array.isArray(board.mood) ? board.mood.filter((m) => String(m).trim()) : null;
  if (!mood || mood.length < minMood || mood.length > maxMood) p.push(`\`mood\` needs ${minMood}–${maxMood} words`);
  if (!board.hero_sample || !String(board.hero_sample).trim()) p.push('missing `hero_sample`');
  return { ok: p.length === 0, problems: p };
}

/**
 * A whole rung-A set: count bounds, each board valid, and pairwise DISTINCTNESS — two boards whose
 * palettes are within ΔE are the same direction wearing two hats, and are refused.
 * @returns {{ok:boolean, problems:string[], boards:Array, tooClose:Array}}
 */
export function checkBoardSet(boards, { minBoards = 3, maxBoards = 5, swatchTol = 8 } = {}) {
  const problems = [];
  const list = Array.isArray(boards) ? boards : [];
  if (list.length < minBoards || list.length > maxBoards) {
    problems.push(`a rung-A set is ${minBoards}–${maxBoards} boards, got ${list.length}`);
  }
  list.forEach((b, i) => {
    const v = validateBoard(b);
    if (!v.ok) problems.push(`board ${i + 1}${b?.direction ? ` (${b.direction})` : ''}: ${v.problems.join('; ')}`);
  });

  // Distinctness: two boards are the SAME direction if their palettes differ in at most one swatch —
  // that is the accent-swap this rule exists to reject. A mean ΔE would wave it through, because four
  // identical swatches dilute one very-different accent.
  const tooClose = [];
  for (let i = 0; i < list.length; i++) {
    for (let j = i + 1; j < list.length; j++) {
      if (!Array.isArray(list[i]?.palette) || !Array.isArray(list[j]?.palette)) continue;
      const s = sharedSwatches(list[i].palette, list[j].palette, swatchTol);
      if (s.differing <= 1) {
        tooClose.push({ a: i + 1, b: j + 1, differing: s.differing, shared: s.shared, aDir: list[i].direction, bDir: list[j].direction });
        problems.push(`boards ${i + 1} (${list[i].direction}) and ${j + 1} (${list[j].direction}) share ${s.shared} of ${s.n} swatches and differ in only ${s.differing} — not two directions, one with a swatch changed`);
      }
    }
  }
  return { ok: problems.length === 0, problems, boards: list, tooClose };
}

export function formatBoardCheck(result) {
  if (result.ok) return `board set OK — ${result.boards.length} distinct directions`;
  return 'board set REFUSED:\n' + result.problems.map((p) => `  - ${p}`).join('\n');
}
