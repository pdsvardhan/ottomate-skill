// design-intent.mjs — one vague line in, a resolved design target out. Or a QUESTION.
//
// U3 + U4, 2026-07-27. The owner's real input is short and context-bound: "need to redesign this",
// "new button here", "visual overhaul". Everything downstream (composition, prior art, the round)
// needs a target and a scope, and getting either wrong wastes a whole round.
//
// THE LOAD-BEARING BEHAVIOUR IS THE REFUSAL. When nothing matches, or when two candidates are within
// a whisker of each other, this returns `action:'ask'`. It never guesses a target. A confidently
// wrong target is worse than a question, because the round still renders and looks fine.
//
// The worklist (U4) is the other half of the same model: every source the owner named — a DOM
// comment, a passing dislike, a rebuild, a new feature — already funnels into an `iteration_items`
// row, and that row already carries target_kind + target_id. So the worklist is a QUERY, not a table.

// ── scope ────────────────────────────────────────────────────────────────────────────────────────
const SCOPE_CUES = [
  [/\b(whole|entire|full)\s+(app|site|product)\b|\boverhaul\b|\bredesign everything\b|\bfrom scratch\b|\brebuild\b/i, 'site'],
  [/\bthis (page|screen|view)\b|\bthe \w+ page\b|\bpage\b/i, 'page'],
  [/\bthese\b|\bthis (section|area|region|group|row of)\b|\bcluster\b/i, 'cluster'],
];
export function inferScope(text) {
  for (const [re, scope] of SCOPE_CUES) if (re.test(text)) return scope;
  return 'component';
}

// ── is this even a design request? ───────────────────────────────────────────────────────────────
const DESIGN_CUES = /\b(design|redesign|restyle|look|feel|ugly|bland|spacing|colou?r|font|type|layout|rounded|radius|shadow|animation|hover|polish|overhaul|visual|theme|style)\b/i;
const BUILD_CUES = /\b(add|new|build|create|implement|wire|endpoint|api|bug|crash|error|broken|fails?|slow)\b/i;
export function isDesignIntent(text) {
  const design = DESIGN_CUES.test(text);
  const build = BUILD_CUES.test(text);
  // "new button here" is BOTH: it creates something and that something needs a look. Treated as
  // design-bearing, because a new UI element always carries design decisions even when the sentence
  // is phrased as construction.
  if (design) return { is_design: true, why: 'names a design concern' };
  if (build && /\b(button|card|nav|menu|modal|form|input|badge|chip|header|footer|page|screen|icon|list|table|banner|tab)\b/i.test(text)) {
    return { is_design: true, why: 'creates a UI element, which carries design decisions' };
  }
  return { is_design: false, why: 'no design concern and no UI element named' };
}

// ── target resolution ────────────────────────────────────────────────────────────────────────────
function norm(s) { return String(s ?? '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim(); }
function tokens(s) { return norm(s).split(' ').filter((t) => t.length > 2); }

function score(text, cand) {
  const t = tokens(text);
  const hay = new Set(tokens([cand.name, cand.target_id, cand.title, cand.category].filter(Boolean).join(' ')));
  let s = 0;
  for (const tok of t) if (hay.has(tok)) s += 2;
  // a bare deictic ("this", "here") carries no evidence at all — it must come from context
  return s;
}

const DEICTIC = /\b(this|that|here|there|it)\b/i;

/**
 * @param {string} text
 * @param {object} ctx
 * @param {Array<object>} [ctx.candidates]  { target_id, name?, title?, category?, kind? }
 * @param {string} [ctx.focusTargetId]      what the owner is demonstrably looking at (an open design
 *                                          page, the last DOM comment). This is what makes "this" resolvable.
 * @param {number} [ctx.margin]             how far ahead the winner must be. Default 2 = one whole token.
 */
export function resolveTarget(text, { candidates = [], focusTargetId = null, margin = 2 } = {}) {
  const scored = candidates
    .map((c) => ({ ...c, score: score(text, c) }))
    .sort((a, b) => b.score - a.score);
  const named = scored.filter((c) => c.score > 0);

  // Context wins for a deictic phrase — that is the whole reason context exists.
  if (!named.length && focusTargetId && DEICTIC.test(text)) {
    const c = candidates.find((x) => x.target_id === focusTargetId);
    return { target: c ?? { target_id: focusTargetId }, confidence: 'context', why: 'deictic phrase resolved from what the owner is looking at' };
  }
  if (!named.length) {
    return { target: null, confidence: 'none', why: focusTargetId
      ? 'nothing in the text names a target, and the phrasing is not deictic so the open page cannot be assumed'
      : 'nothing in the text names a target and there is no context to resolve it from' };
  }
  if (named.length > 1 && named[0].score - named[1].score < margin) {
    return { target: null, confidence: 'ambiguous', why: `"${named[0].name ?? named[0].target_id}" and "${named[1].name ?? named[1].target_id}" score within ${margin}`, tied: named.slice(0, 3) };
  }
  return { target: named[0], confidence: 'named', why: `matched on ${tokens(text).filter((t) => tokens([named[0].name, named[0].target_id].join(' ')).includes(t)).join(', ')}` };
}

/** The whole intake in one call. `action` is 'run' or 'ask' — never a silent guess. */
export function classifyIntent(text, ctx = {}) {
  const design = isDesignIntent(text);
  const scope = inferScope(text);
  // A site-scope overhaul does not need a component target; the project IS the target.
  if (scope === 'site') {
    return { ...design, scope, target: { target_id: ctx.projectSlug ?? null, kind: 'site' }, confidence: 'scope', action: design.is_design ? 'run' : 'ask' };
  }
  const r = resolveTarget(text, ctx);
  const action = (design.is_design && r.target) ? 'run' : 'ask';
  return {
    ...design, scope, target: r.target, confidence: r.confidence, why_target: r.why, tied: r.tied,
    action,
    ask: action === 'ask'
      ? (!design.is_design ? 'This does not read as a design request — say what should change about how it looks, or route it as a build item.'
        : r.confidence === 'ambiguous' ? `Which one? ${(r.tied ?? []).map((t) => t.name ?? t.target_id).join(' / ')}`
          : 'Which component or page? Nothing in that names a target, and I will not guess one.')
      : null,
  };
}

// ── U4: the worklist ─────────────────────────────────────────────────────────────────────────────

// Which iteration item types carry UI. Written down rather than implied, because a silent mapping is
// how a worklist quietly stops showing half the work.
export const UI_ITEM_TYPES = new Set([
  'component_modification', 'page_modification', 'revamp', 'new_feature_request', 'bug',
]);
const DEAD_STATUSES = new Set(['rejected', 'integrated']);

/**
 * PURE. The design worklist for a project, from rows the app already has.
 * @param {Array<object>} items       iteration_items rows
 * @param {Array<object>} components  components rows
 * @param {Array<object>} decisions   design_decisions rows
 */
export function buildWorklist(items = [], components = [], decisions = []) {
  const settled = new Set(decisions.filter((d) => d.status === 'locked').map((d) => d.target_id));
  const touched = new Set(decisions.map((d) => d.target_id));

  const fromItems = items
    .filter((i) => i && UI_ITEM_TYPES.has(i.item_type) && !DEAD_STATUSES.has(i.status)
      && ['component', 'page'].includes(i.target_kind ?? ''))
    .map((i) => ({
      source: 'iteration item', source_id: i.id, kind: i.target_kind, target_id: i.target_id,
      label: i.title, item_type: i.item_type, status: i.status,
      settled: settled.has(i.target_id), touched: touched.has(i.target_id),
      at: i.updated_at ?? i.created_at ?? 0,
    }));

  const fromSlots = components
    .filter((c) => c && !c.picked && !c.skip_reason)
    .map((c) => ({
      source: 'unpicked component slot', source_id: c.id, kind: 'component',
      target_id: c.name, label: c.name, item_type: null, status: 'unpicked',
      settled: settled.has(c.name), touched: touched.has(c.name),
      at: c.updated_at ?? c.created_at ?? 0,
    }));

  // Unsettled first — a target with locked decisions is a worse use of a round than one with none.
  // Then most recently raised. Then, among equals, the ones already explored but not locked.
  return [...fromItems, ...fromSlots].sort((a, b) => {
    if (a.settled !== b.settled) return a.settled ? 1 : -1;
    const at = Number(b.at) - Number(a.at);
    if (at) return at;
    if (a.touched !== b.touched) return a.touched ? -1 : 1;
    return String(a.label).localeCompare(String(b.label));
  });
}
