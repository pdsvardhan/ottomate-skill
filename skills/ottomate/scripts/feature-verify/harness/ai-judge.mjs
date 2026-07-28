// P3-A: the AI-visual-judge — ADVISORY orchestration. The Claude judge pass itself is dispatched by the
// skill (a fresh sub-agent, blind to the diff, reading screenshots + the rubric); this module owns the
// deterministic guardrails around it: the tier gate, the spatial cross-check that DISCARDS any claim the
// DOM/geometry layer contradicts (VLMs are ~58% at geometry — the model flags, the layer decides), the
// multi-sample reconcile, and the verdict — which is structurally incapable of a gating pass.
// See docs/plans/2026-07-28-task3-P3A-ai-visual-judge-plan.md.

import { layersForTier } from './change-tier.mjs';

/** Whether/how the judge fires for a tier: 'none' (<T2) | 'glance' (T2) | 'full' (T3). One source. */
export function judgeGate(tier) {
  return layersForTier(tier).judge;
}

// A spatial claim_type → the deterministic fact that can AFFIRMATIVELY contradict it. `ok:true` on that
// fact means "the layer measured no such problem", so a judge claim of that problem is a hallucination.
const SPATIAL_CONTRADICTORS = {
  overflow: (f) => f.overflow?.ok === true,
  'off-canvas': (f) => f.overflow?.ok === true,
  clipping: (f) => f.hardClip?.ok === true,
  'cut-off': (f) => f.hardClip?.ok === true,
  truncation: (f) => f.hardClip?.ok === true,
  contrast: (f) => f.contrast?.ok === true,
  'low-contrast': (f) => f.contrast?.ok === true,
  'not-visible': (f) => f.contrast?.ok === true,
  // overlap: contradicted when the DOM re-measured the judge's OWN cited selectors and found no overlap
  // (facts.regionOverlap.overlaps === []), or the layout is geometrically clean with nothing measured.
  overlap: (f) => f.regionOverlap ? (f.regionOverlap.overlaps?.length ?? 0) === 0 : f.overflow?.ok === true,
  collision: (f) => f.regionOverlap ? (f.regionOverlap.overlaps?.length ?? 0) === 0 : f.overflow?.ok === true,
};

/**
 * Cross-check the judge's findings against the deterministic layer. A SPATIAL claim the layer
 * affirmatively contradicts is DISCARDED (with a reason); a spatial claim the layer can't measure is
 * KEPT but flagged `unverified`; non-spatial (taste/state) findings pass through untouched.
 * @returns {{kept: object[], discarded: {finding:object, reason:string}[]}}
 */
export function crossCheckSpatialClaims(findings, deterministicFacts = {}) {
  const kept = [];
  const discarded = [];
  for (const f of findings ?? []) {
    if (!f.spatial) { kept.push(f); continue; }
    const contradictor = SPATIAL_CONTRADICTORS[f.claim_type];
    if (!contradictor) { kept.push({ ...f, unverified: true }); continue; } // layer can't measure it → soft-keep
    if (contradictor(deterministicFacts)) {
      discarded.push({ finding: f, reason: `deterministic layer contradicts "${f.claim_type}" (measured no such problem) — discarded to neutralise VLM spatial-blindness` });
    } else {
      kept.push({ ...f, corroborated: true }); // the layer also sees a problem → a REAL finding
    }
  }
  return { kept, discarded };
}

/** Stable identity for a finding across samples (dimension + claim + cited region). */
function findingKey(f) {
  return `${f.dimension ?? ''}|${f.claim_type ?? ''}|${f.region ?? ''}`;
}

/**
 * Reconcile 2–3 T3 judge passes (order-randomised upstream). A finding in ALL samples is `agreed`; a
 * finding in only some is `no-confidence` (→ human). A single pass is tagged `single-pass`, never
 * presented as reconciled.
 */
export function reconcileSamples(samples) {
  const n = (samples ?? []).length;
  if (n === 0) return [];
  if (n === 1) return (samples[0] ?? []).map((f) => ({ ...f, confidence: 'single-pass' }));
  const seen = new Map(); // key → { finding, count }
  for (const sample of samples) for (const f of sample ?? []) {
    const k = findingKey(f);
    if (!seen.has(k)) seen.set(k, { finding: f, count: 0 });
    seen.get(k).count++;
  }
  return [...seen.values()].map(({ finding, count }) => ({
    ...finding,
    confidence: count === n ? 'agreed' : 'no-confidence',
  }));
}

/**
 * The advisory cell recorded on the case as `judge_verdict`. Bands: clean | warn | flag. A `flag`
 * finding OR any `no-confidence` → band `flag` (needs a human). **`gating` is ALWAYS false and there is
 * no code path that returns a gating pass — the judge can never bless.**
 */
export function judgeVerdict(findings) {
  const list = findings ?? [];
  const hasFlag = list.some((f) => f.verdict === 'flag');
  const hasNoConfidence = list.some((f) => f.confidence === 'no-confidence');
  const hasWarn = list.some((f) => f.verdict === 'warn');
  const band = hasFlag || hasNoConfidence ? 'flag' : hasWarn ? 'warn' : 'clean';
  return {
    band,
    gating: false, // structural: advisory-only, never a gating pass
    needs_human: band === 'flag',
    findings: list,
    note: 'advisory vision-proxy — NOT a gating pass; a green case may be downgraded to warn, never blessed',
  };
}

/**
 * Fold the advisory verdict into a case outcome. A judge can DOWNGRADE a clean/pass case to `warn`, but
 * never upgrade (a `fail` stays `fail`; a pass never becomes a gating pass). Fail-safe direction only.
 */
export function applyJudgeToOutcome(deterministicOutcome, verdict) {
  if (deterministicOutcome === 'fail') return 'fail';               // a red stays red
  if (verdict.band === 'flag' && deterministicOutcome === 'pass') return 'warn'; // downgrade only
  return deterministicOutcome;
}
