// anatomy-derive.mjs — read a real component and work out what a design round could vary in it.
//
// U2, 2026-07-27. Possible only because U1 split the anatomy: a component's record is now just its
// tier, its parts, and which universal questions apply — short enough to read off the source, because
// the JSX names the parts.
//
// TWO HALVES, and the boundary is stated rather than blurred:
//   MECHANICAL (here)  gather evidence · infer the tier · VALIDATE a record, fail closed.
//   JUDGMENT (a model) turn evidence into the record — which class is "the media", which is "the
//                      caption". Documented in references/stage-2-anatomy.md.
// `proposeRecord` is a mechanical FIRST DRAFT, not the answer: it is honest about being name-based,
// and the validator is what stops a wrong answer from shipping either way.
//
// Why not just parse? Because the signal is genuinely weak. Screenroom's poster card names its parts
// `pz`, `pf`, `cap`, `own`. No parser knows `pz` is the media well; a reader who sees `aspect-ratio`
// and an `<img>` inside it does. So evidence collection deliberately gathers ELEMENTS and CSS
// PROPERTIES, not just names.

import { questionsForTier, questionRegistry } from './anatomy.mjs';

const LANDMARK_TAGS = new Set(['main', 'nav', 'header', 'footer', 'aside']);
const LANDMARK_ROLES = new Set(['main', 'navigation', 'banner', 'contentinfo', 'complementary']);
const INTERACTIVE_TAGS = new Set(['button', 'a', 'input', 'select', 'textarea', 'summary']);

// Case-insensitive dedupe-preserving collector.
function uniq(xs) { return [...new Set(xs.filter(Boolean))]; }

/**
 * Gather what is actually IN the file. No interpretation here — interpretation is the model's job and
 * the validator's check.
 * @param {string} source  the component file (JSX/TSX/HTML)
 * @param {string} [css]   an associated stylesheet, when one exists
 */
export function collectEvidence(source, css = '') {
  const src = String(source ?? '');
  const sheet = String(css ?? '');

  const elements = uniq([...src.matchAll(/<([a-z][a-z0-9-]*)[\s/>]/g)].map((m) => m[1]));
  const childComponents = uniq([...src.matchAll(/<([A-Z][A-Za-z0-9_]*)[\s/>]/g)].map((m) => m[1]));
  const dataRoles = uniq([...src.matchAll(/data-role\s*=\s*["'{`]([a-zA-Z0-9_-]+)/g)].map((m) => m[1]));
  const dataOids = uniq([...src.matchAll(/data-oid\s*=\s*["'{`]([^"'`}]+)/g)].map((m) => m[1]));

  // className="a b" and className={`a ${x} b`} and class="a b"
  const classNames = uniq(
    [...src.matchAll(/class(?:Name)?\s*=\s*(?:"([^"]*)"|'([^']*)'|\{`([^`]*)`\})/g)]
      .flatMap((m) => (m[1] ?? m[2] ?? m[3] ?? '').split(/[\s${}]+/))
      .filter((c) => /^[a-zA-Z][\w-]*$/.test(c)),
  );

  const cssSelectors = uniq([...sheet.matchAll(/\.([a-zA-Z][\w-]*)/g)].map((m) => m[1]));
  const cssProps = uniq([...sheet.matchAll(/([a-z-]{3,})\s*:/g)].map((m) => m[1]));

  const landmarkRoles = uniq([
    ...elements.filter((e) => LANDMARK_TAGS.has(e)),
    ...[...src.matchAll(/role\s*=\s*["']([a-z]+)["']/g)].map((m) => m[1]).filter((r) => LANDMARK_ROLES.has(r)),
  ]);
  const interactiveEls = uniq([
    ...elements.filter((e) => INTERACTIVE_TAGS.has(e)),
    ...(/onClick|onKeyDown|onSubmit/.test(src) ? ['handler'] : []),
  ]);

  return {
    elements, childComponents, dataRoles, dataOids, classNames,
    cssSelectors, cssProps, landmarkRoles, interactiveEls,
    hasCss: sheet.length > 0,
    hasImage: elements.includes('img') || /background-image/.test(sheet),
    hasAspectRatio: cssProps.includes('aspect-ratio'),
  };
}

/**
 * Tier from evidence (C1 §3.1 — classify by reuse cardinality and orchestration, not by complexity).
 * Returns the tier plus WHY, because an unexplained classification is not checkable.
 */
export function inferTier(ev) {
  if (ev.landmarkRoles.length) {
    return { tier: 'surface', why: `declares landmark(s): ${ev.landmarkRoles.join(', ')}` };
  }
  if (ev.childComponents.length >= 1) {
    return { tier: 'composite', why: `assembles named component(s): ${ev.childComponents.slice(0, 4).join(', ')}` };
  }
  if (ev.interactiveEls.length >= 2) {
    return { tier: 'composite', why: `orchestrates ${ev.interactiveEls.length} interactive regions` };
  }
  // Found by a test, 2026-07-27: a card with a media well, a badge, a caption and one button was
  // classified `primitive` because it imports no child component and has only one interactive
  // element — yet it plainly orchestrates parts. C1 §3.1 classifies by ORCHESTRATION, and four
  // separately-styled regions is orchestration whether or not they were extracted into components.
  const styledParts = ev.classNames.filter((c) => ev.cssSelectors.includes(c));
  if (styledParts.length >= 4) {
    return { tier: 'composite', why: `orchestrates ${styledParts.length} separately-styled parts (${styledParts.slice(0, 4).join(', ')}…)` };
  }
  return { tier: 'primitive', why: 'one concern, nothing named nested inside' };
}

/**
 * A mechanical FIRST DRAFT of the per-component record. Name-based and openly weak — it exists so the
 * model has something to correct rather than a blank page, and so a component with `data-role`
 * stamping (our own convention) derives cleanly with no judgment at all.
 */
export function proposeRecord(ev, { name = 'unnamed' } = {}) {
  const { tier, why } = inferTier(ev);
  // data-role is our own convention and is authoritative when present. Otherwise fall back to class
  // names that the stylesheet actually styles — a class nobody styles is not a part.
  const styled = uniq(ev.classNames.filter((c) => ev.cssSelectors.includes(c)));
  // Resolve parts FULLY before anything reads them: an earlier draft computed `questions` against a
  // parts list that had not fallen back yet, and every question ended up naming a part that did not
  // exist. The validator caught it, which is the point of having one.
  const parts = ev.dataRoles.length ? ev.dataRoles
    : styled.length ? styled
      : ev.classNames.slice(0, 8);

  // Relevance, not a filter. Matching is EXACT on the evidence tokens: a substring fallback fired
  // `row-height` on any rule containing `height`, which is most of them. `questionsForTier` returns everything ANY component of this tier ever
  // asks — for a card that wrongly includes row-height and numeric-alignment, because a table row is
  // also composite. Evidence keywords rank them; the model narrows. Ranking beats silent filtering:
  // a question dropped by a keyword miss would be invisible, whereas a question listed as `possible`
  // is still on the table.
  const haystack = new Set([...ev.classNames, ...ev.elements, ...ev.cssProps, ...ev.dataRoles, ...ev.childComponents]
    .map((s) => String(s).toLowerCase()));
  const scored = questionsForTier(tier).map((q) => ({
    q, hit: (q.evidence_any ?? []).some((k) => haystack.has(k)),
  }));
  const likely = scored.filter((s) => s.hit).map((s) => s.q);
  const possible = scored.filter((s) => !s.hit).map((s) => s.q);
  const chosen = likely.length >= 3 ? likely : scored.map((s) => s.q);

  const partFor = (q) => parts.find((p) => (q.evidence_any ?? []).some((k) => p.toLowerCase().includes(k)))
    ?? parts[0] ?? name;

  return {
    tier,
    tier_why: why,
    parts,
    part_source: ev.dataRoles.length ? 'data-role (authoritative)'
      : styled.length ? 'class names the stylesheet actually styles'
        : 'class names only — NO CSS SUPPLIED, so this is weak',
    required_states: tier === 'surface' ? ['rest'] : ['rest', 'hover', 'focus-visible', 'active', 'disabled'],
    required_variant_floor: 'a default plus one state-signalling treatment',
    questions: chosen.map((q) => ({ q: q.id, part: partFor(q) })),
    likely: likely.map((q) => q.id),
    possible: possible.map((q) => q.id),
    confidence: ev.dataRoles.length ? 'high' : ev.hasCss ? 'medium' : 'low',
  };
}

/**
 * FAIL CLOSED. A record may only ship if every question is real and every part is traceable to the
 * source. This is what stops a derivation — mechanical or model-written — from inventing axes, which
 * doctrine rule 40 forbids.
 */
export function validateRecord(record, ev, registry = questionRegistry()) {
  const problems = [];
  if (!record || typeof record !== 'object') return { ok: false, problems: ['no record'] };

  if (!['primitive', 'composite', 'surface'].includes(record.tier)) {
    problems.push(`tier "${record.tier}" is not one of primitive/composite/surface`);
  }
  const inferred = inferTier(ev).tier;
  if (record.tier && record.tier !== inferred) {
    problems.push(`tier "${record.tier}" contradicts the evidence, which says "${inferred}" (${inferTier(ev).why})`);
  }

  const known = new Set([...ev.classNames, ...ev.dataRoles, ...ev.childComponents, ...ev.elements, ...ev.cssSelectors]);
  for (const p of record.parts ?? []) {
    if (!known.has(p)) problems.push(`part "${p}" appears nowhere in the source — a part must be traceable, not invented`);
  }
  if (!(record.parts ?? []).length) problems.push('no parts — a component with no named parts has nothing to vary');

  for (const e of record.questions ?? []) {
    if (!registry[e.q]) problems.push(`question "${e.q}" is not in the registry`);
    else if (!(registry[e.q].applies_to_tiers ?? []).includes(record.tier)) {
      problems.push(`question "${e.q}" does not apply to a ${record.tier}`);
    }
    if (e.part && !known.has(e.part)) problems.push(`question "${e.q}" names part "${e.part}", which is not in the source`);
  }
  if (!(record.questions ?? []).length) problems.push('no questions — nothing for a round to vary');

  // B2: anything interactive must carry the always-states floor.
  if (record.tier !== 'surface' && ev.interactiveEls.length) {
    for (const s of ['rest', 'hover', 'focus-visible']) {
      if (!(record.required_states ?? []).includes(s)) problems.push(`interactive component is missing required state "${s}"`);
    }
  }
  return { ok: problems.length === 0, problems };
}

export function formatDerivation(ev, record, validation) {
  const l = [];
  l.push(`tier: ${record.tier} — ${record.tier_why}`);
  l.push(`parts (${record.part_source}): ${record.parts.join(', ')}`);
  l.push(`questions (${record.questions.length}): ${record.questions.map((q) => q.q).join(', ')}`);
  if (record.possible?.length) l.push(`  not evidenced, still on the table: ${record.possible.join(', ')}`);
  l.push(`confidence: ${record.confidence}${ev.hasCss ? '' : '  (no stylesheet supplied — say so rather than pretending)'}`);
  l.push(validation.ok ? 'validation: PASS' : `validation: FAIL\n  - ${validation.problems.join('\n  - ')}`);
  return l.join('\n');
}
