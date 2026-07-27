// Stage 4 S7 — dedupe, structurally AND visually.
//
// H1 asks for both because they miss different things. Structural comparison catches a literal
// re-upload; it does NOT catch a re-implementation — the same card written twice by different hands
// produces different markup and identical pixels. Visual comparison catches that, and misses the case
// where two components look different only because of the demo content they happen to render.
//
// THE THRESHOLD IS INVERTED FROM P2's, and this is the part most likely to be got wrong by reuse.
// P2's `divergenceVerdict` asks "are these different ENOUGH?" with a deliberately LOW floor (0.5% of
// pixels), because a controlled variant set is designed to be mostly identical. Dedupe asks the
// opposite question — "are these the SAME thing?" — and needs a HIGH similarity bar. Reusing 0.005
// here would declare almost every pair a duplicate.
//
// A duplicate is REPORTED, never auto-rejected: two components can look identical and differ in
// licence, provenance or dependency weight, and picking the survivor is a judgement.
//
// PURE apart from the optional PNG input, which is passed in already decoded.

import { comparePNG } from '../design-check/pixel/pixel-compare.mjs';

// ── structural: the frequency-aware fingerprint that replaced set-based Jaccard ─────────────────

const TAG = /<([a-zA-Z][a-zA-Z0-9-]*)/g;
const CLASS = /class(?:Name)?\s*=\s*["'{]([^"'}]+)/g;
const PROP = /(?:^|[;{\s])([a-z-]+)\s*:/g;

/** Frequency-aware bag of tags, classes and CSS properties. */
export function fingerprint(src) {
  const bag = new Map();
  const add = (k) => bag.set(k, (bag.get(k) ?? 0) + 1);
  if (typeof src !== 'string' || src.trim() === '') return bag;
  for (const m of src.matchAll(TAG)) add(`t:${m[1].toLowerCase()}`);
  for (const m of src.matchAll(CLASS)) for (const c of m[1].split(/\s+/)) { if (c) add(`c:${c}`); }
  for (const m of src.matchAll(PROP)) add(`p:${m[1].toLowerCase()}`);
  return bag;
}

/** Cosine similarity over the frequency vectors. 1 = identical distribution. */
export function structuralSimilarity(srcA, srcB) {
  const a = fingerprint(srcA);
  const b = fingerprint(srcB);
  if (a.size === 0 || b.size === 0) return null;   // unmeasurable, NOT "different"
  let dot = 0;
  let na = 0;
  let nb = 0;
  for (const [k, v] of a) { na += v * v; if (b.has(k)) dot += v * b.get(k); }
  for (const v of b.values()) nb += v * v;
  if (na === 0 || nb === 0) return null;
  return dot / (Math.sqrt(na) * Math.sqrt(nb));
}

// ── thresholds, stated where they can be argued with ───────────────────────────────────────────

export const THRESHOLDS = {
  // Calibrate against known pairs before trusting these; they are a starting bar, not a law.
  structural_same: 0.97,   // at/above: structurally the same component
  structural_near: 0.85,   // at/above: near enough to be worth a visual check
  // A HIGH bar, the inverse of P2's low divergence floor. `comparePNG` returns `fraction` = the share
  // of pixels differing beyond a per-pixel threshold; two renders of the same component differ in
  // almost none of them.
  visual_same_max_fraction: 0.02,
};

/**
 * @param {{id:string, src:string, png?:object}} candidate
 * @param {Array<{id:string, src:string, png?:object}>} existing
 * @returns {{duplicates:Array, nearMisses:Array, checked:number, visualChecks:number}}
 */
export function findDuplicates(candidate, existing = []) {
  const duplicates = [];
  const nearMisses = [];
  let visualChecks = 0;

  for (const other of existing) {
    if (other.id === candidate.id) continue;
    const s = structuralSimilarity(candidate.src, other.src);

    let visual = null;
    // Render-compare when BOTH have pixels — including when the structural score is low, because a
    // re-implementation is exactly the case structural comparison misses.
    if (candidate.png && other.png) {
      visualChecks += 1;
      const cmp = comparePNG(candidate.png, other.png);
      visual = { fraction: cmp.fraction, same: cmp.fraction <= THRESHOLDS.visual_same_max_fraction };
    }

    const structuralSame = s !== null && s >= THRESHOLDS.structural_same;
    const visualSame = visual?.same === true;

    if (structuralSame || visualSame) {
      duplicates.push({
        id: other.id,
        structural: s,
        visual,
        by: structuralSame && visualSame ? 'both'
          : structuralSame ? 'structural'
            : 'visual-only (a re-implementation — different source, same render)',
        // Reported, never auto-rejected.
        action: 'report',
      });
    } else if (s !== null && s >= THRESHOLDS.structural_near) {
      nearMisses.push({ id: other.id, structural: s, visual });
    }
  }
  return { duplicates, nearMisses, checked: existing.length, visualChecks };
}

/** Which of two duplicates should survive: the better-provenanced one, and say why. */
export function preferSurvivor(a, b) {
  const score = (r) => (r.spdx_id ? 2 : 0) + (r.author ? 1 : 0) + (r.source_url ? 1 : 0)
    + (r.provenance_debt ? -1 : 0);
  const sa = score(a);
  const sb = score(b);
  if (sa === sb) {
    return { survivor: null, why: 'equally provenanced — this is an owner judgement, not a rule' };
  }
  const winner = sa > sb ? a : b;
  return { survivor: winner.id, why: `better provenance (${Math.max(sa, sb)} vs ${Math.min(sa, sb)})` };
}
