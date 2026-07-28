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
// Passthrough / wrapper components that assemble NOTHING — a component rendering only these is not
// orchestrating (C12(2) D3: shadcn `const Comp = asChild ? Slot : "button"` made button read composite).
const PASSTHROUGH_COMPONENTS = new Set(['Slot', 'Fragment', 'Comp', 'Children', 'Suspense', 'Provider']);
// Full-page utilities that mark a surface even without a landmark tag (C12(2) D5).
const SURFACE_UTILS = new Set(['min-h-screen', 'h-screen', 'min-h-dvh', 'h-dvh', 'min-h-full']);
const CLASS_HELPERS = ['cn', 'cva', 'clsx', 'cx', 'twMerge', 'twJoin', 'classnames', 'classNames'];

// Case-insensitive dedupe-preserving collector.
function uniq(xs) { return [...new Set(xs.filter(Boolean))]; }

/**
 * Is this a Tailwind utility rather than a nameable component part? (C12(2) D4.) Utilities stay in
 * evidence — they still rank questions — but must never be offered as a "part" a round could vary,
 * because "vary the `absolute` part" is meaningless. Heuristic and openly so: it recognises the
 * utility grammar (state/breakpoint prefixes + the utility stems), erring toward calling a thing a
 * utility only on a clear match, so a semantic class like `chip` or `cardbase` survives.
 */
export function isTailwindUtility(cls) {
  const c = String(cls);
  if (/^(sm|md|lg|xl|2xl|hover|focus|focus-visible|focus-within|active|disabled|group|group-hover|peer|dark|first|last|odd|even|motion-safe|motion-reduce|aria|data|before|after|placeholder|file|marker|selection|rtl|ltr|open|print|supports)[:-]/.test(c)) return true;
  return /^(flex|grid|table|block|inline|inline-flex|inline-block|hidden|contents|container|absolute|relative|fixed|sticky|static|isolate|float-|clear-|box-|(min-|max-)?[wh]-|size-|-?p[xytrbl]?-|-?m[xytrbl]?-|gap-|gap-[xy]-|space-[xy]-|-?inset-|-?top-|-?right-|-?bottom-|-?left-|-?z-|order-|col-|row-|grid-|auto-|justify-|items-|content-|self-|place-|text-|font-|leading-|tracking-|align-|whitespace-|break-|truncate$|line-clamp-|list-|bg-|from-|via-|to-|border($|-)|rounded($|-)|divide-|ring($|-)|shadow($|-)|opacity-|mix-blend-|backdrop-|blur$|blur-|brightness-|contrast-|drop-shadow($|-)|grayscale$|invert$|saturate-|sepia$|transition($|-)|duration-|ease-|delay-|animate-|scale-|-?rotate-|-?translate-|-?skew-|origin-|transform$|cursor-|select-|resize$|resize-|scroll-|snap-|touch-|will-change-|overflow($|-)|overscroll-|object-|aspect-|columns-|w-full|h-full|w-screen|h-screen|pointer-events-|appearance-|outline($|-)|underline$|overline$|line-through$|no-underline$|uppercase$|lowercase$|capitalize$|normal-case$|italic$|not-italic$|antialiased$|subpixel-antialiased$|tabular-nums$|slashed-zero$|fill-|stroke-|sr-only$|not-sr-only$|flex-|shrink($|-)|grow($|-)|basis-|p-|m-|w-|h-)/.test(c);
}

// R2.2 (F-4): a camelCase token that the stylesheet does NOT style is a JS ternary variable that leaked
// through the className regex (isCredit, isPaid, periodOpen), not a CSS class / part. Real CSS classes are
// kebab-case or lowercase; a genuinely camelCase styled class would appear in the stylesheet's selectors.
export function isJsIdentifierLeak(cls, cssSelectors = []) {
  const c = String(cls);
  if (cssSelectors.includes(c)) return false;                 // it IS styled → treat as a real part
  return /[a-z][A-Z]/.test(c) || /^(is|has|should|can|will|are|was|did|does)[A-Z]/.test(c);
}

/** Extract the balanced-paren argument text of every `name(...)` call, for the given helper names. */
function extractCallArgs(src, names) {
  const out = [];
  const re = new RegExp(`\\b(?:${names.join('|')})\\s*\\(`, 'g');
  let m;
  while ((m = re.exec(src))) {
    let i = m.index + m[0].length, depth = 1;
    const start = i;
    for (; i < src.length && depth > 0; i++) {
      if (src[i] === '(') depth++;
      else if (src[i] === ')') depth--;
    }
    out.push(src.slice(start, i - 1));
    re.lastIndex = i; // continue after this call
  }
  return out;
}

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
  // A child component may be bare (`<OwnChip>`) or namespaced (`<AvatarPrimitive.Root>`, the Radix
  // idiom) — C12(2) D2. Record the namespace ROOT so `<X.Root>` counts as assembling X.
  const childComponents = uniq([...src.matchAll(/<([A-Z][A-Za-z0-9_]*)(?:\.[A-Za-z0-9_]+)?[\s/>]/g)].map((m) => m[1]));
  const dataRoles = uniq([...src.matchAll(/data-role\s*=\s*["'{`]([a-zA-Z0-9_-]+)/g)].map((m) => m[1]));
  const dataOids = uniq([...src.matchAll(/data-oid\s*=\s*["'{`]([^"'`}]+)/g)].map((m) => m[1]));

  // className="a b", className={`a ${x} b`}, class="a b" — AND classes inside cn()/cva()/clsx() call
  // arguments, which the attribute matcher never sees (C12(2) D1: shadcn's whole idiom lives there).
  const attrClassText = [...src.matchAll(/class(?:Name)?\s*=\s*(?:"([^"]*)"|'([^']*)'|\{`([^`]*)`\})/g)]
    .map((m) => m[1] ?? m[2] ?? m[3] ?? '');
  const helperClassText = extractCallArgs(src, CLASS_HELPERS)
    .flatMap((args) => [...args.matchAll(/["'`]([^"'`]*)["'`]/g)].map((s) => s[1]));
  const classNames = uniq(
    [...attrClassText, ...helperClassText]
      .flatMap((s) => s.split(/[\s${}]+/))
      .filter((c) => /^[a-zA-Z][\w:-]*$/.test(c)),
  );

  const cssSelectors = uniq([...sheet.matchAll(/\.([a-zA-Z][\w-]*)/g)].map((m) => m[1]));
  const cssProps = uniq([...sheet.matchAll(/([a-z-]{3,})\s*:/g)].map((m) => m[1]));

  const landmarkRoles = uniq([
    ...elements.filter((e) => LANDMARK_TAGS.has(e)),
    ...[...src.matchAll(/role\s*=\s*["']([a-z]+)["']/g)].map((m) => m[1]).filter((r) => LANDMARK_ROLES.has(r)),
  ]);
  // Surface signals a landmark tag misses (C12(2) D5): a full-page height utility or role="main".
  const surfaceSignals = uniq([
    ...classNames.filter((c) => SURFACE_UTILS.has(c)),
    ...(/role\s*=\s*["']main["']/.test(src) ? ['role=main'] : []),
  ]);
  const interactiveEls = uniq([
    ...elements.filter((e) => INTERACTIVE_TAGS.has(e)),
    ...(/onClick|onKeyDown|onSubmit/.test(src) ? ['handler'] : []),
  ]);
  // Child components that actually assemble something — passthroughs excluded (C12(2) D3).
  const orchestratedChildren = childComponents.filter((c) => !PASSTHROUGH_COMPONENTS.has(c));
  // Classes that could name a part: not Tailwind utilities (C12(2) D4).
  const semanticClasses = classNames.filter((c) => !isTailwindUtility(c));

  return {
    elements, childComponents, orchestratedChildren, dataRoles, dataOids, classNames, semanticClasses,
    cssSelectors, cssProps, landmarkRoles, surfaceSignals, interactiveEls,
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
  // A full-page component often has no landmark tag, just a page-height utility (C12(2) D5).
  if ((ev.surfaceSignals ?? []).length) {
    return { tier: 'surface', why: `page-level signal(s): ${ev.surfaceSignals.join(', ')}` };
  }
  // Count only children that ASSEMBLE something — a lone `<Slot>`/`<Comp>` passthrough is not
  // orchestration (C12(2) D3: it made shadcn button/badge read composite).
  const children = ev.orchestratedChildren ?? ev.childComponents;
  if (children.length >= 1) {
    return { tier: 'composite', why: `assembles named component(s): ${children.slice(0, 4).join(', ')}` };
  }
  if (ev.interactiveEls.length >= 2) {
    return { tier: 'composite', why: `orchestrates ${ev.interactiveEls.length} interactive regions` };
  }
  // Found by a test, 2026-07-27: a card with a media well, a badge, a caption and one button was
  // classified `primitive` because it imports no child component and has only one interactive
  // element — yet it plainly orchestrates parts. C1 §3.1 classifies by ORCHESTRATION, and four
  // separately-styled regions is orchestration whether or not they were extracted into components.
  // Use SEMANTIC classes styled by the sheet — Tailwind utilities are not parts (C12(2) D4).
  const styledParts = (ev.semanticClasses ?? ev.classNames).filter((c) => ev.cssSelectors.includes(c));
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
  // R2.2 (F-4): 'group'/'peer' are Tailwind INTERACTION MARKERS, not parts, even though a `.group:hover`
  // rule makes them appear "styled" — the real cointrail derivation's only "part" was `group`.
  const MARKERS = new Set(['group', 'peer']);
  const notPart = (c) => MARKERS.has(c) || isJsIdentifierLeak(c, ev.cssSelectors);
  const styled = uniq((ev.semanticClasses ?? ev.classNames).filter((c) => ev.cssSelectors.includes(c) && !notPart(c)));
  // R2.2 (F-4): drop JS-identifier leaks (isCredit/isPaid/periodOpen) and markers — they are not parts.
  const semantic = uniq((ev.semanticClasses ?? ev.classNames.filter((c) => !isTailwindUtility(c)))
    .filter((c) => !notPart(c)));
  const children = ev.orchestratedChildren ?? ev.childComponents;
  // Resolve parts FULLY before anything reads them: an earlier draft computed `questions` against a
  // parts list that had not fallen back yet, and every question ended up naming a part that did not
  // exist. The validator caught it, which is the point of having one. Preference order (C12(2) D4):
  // data-role → styled classes → SEMANTIC classes (Tailwind utilities are never parts) → the
  // component's own children → raw classes as the last resort.
  const parts = ev.dataRoles.length ? ev.dataRoles
    : styled.length ? styled
      : semantic.length ? semantic.slice(0, 10)
        : children.length ? children.slice(0, 8)
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
  // R2.2 (F-4): a media question (media-aspect) may only be EVIDENCED when there is an actual media well —
  // otherwise it is a false axis on a data panel. Without media evidence it can still sit in `possible`,
  // ranked and visible, but it never counts as a hit that lands it in `chosen`.
  const hasMedia = (ev.elements ?? []).some((e) => /^(img|video|picture|source|iframe|canvas|svg|model-viewer)$/i.test(e))
    || [...(ev.classNames ?? []), ...(ev.dataRoles ?? [])].some((c) => /media|thumb|poster|avatar|image|cover|hero|banner/i.test(c));
  const isMediaQ = (q) => /media|aspect|thumb|cover/i.test(q.id);
  const likely = scored.filter((s) => s.hit && !(isMediaQ(s.q) && !hasMedia)).map((s) => s.q);
  const possible = scored.filter((s) => !likely.includes(s.q)).map((s) => s.q);
  // Choose the EVIDENCED questions when any exist; the rest stay in `possible`, ranked and visible,
  // never silently dropped (the module's ethos). Dumping every tier question into `chosen` on weak
  // evidence guaranteed an over-wide round the composition rule then rejected (C12(2) D6) — the honest
  // signal is "few evidenced, low confidence", not "all of them are contested".
  const chosen = likely.length ? likely : scored.filter((s) => !(isMediaQ(s.q) && !hasMedia)).map((s) => s.q);

  const partFor = (q) => parts.find((p) => (q.evidence_any ?? []).some((k) => p.toLowerCase().includes(k)))
    ?? parts[0] ?? name;

  return {
    tier,
    tier_why: why,
    parts,
    part_source: ev.dataRoles.length ? 'data-role (authoritative)'
      : styled.length ? 'class names the stylesheet actually styles'
        : semantic.length ? 'semantic (non-utility) class names — weak, no stylesheet to confirm'
          : children.length ? 'child components — no semantic classes found'
            : 'raw class names only — NO CSS and no semantic names, so this is very weak',
    required_states: tier === 'surface' ? ['rest'] : ['rest', 'hover', 'focus-visible', 'active', 'disabled'],
    required_variant_floor: 'a default plus one state-signalling treatment',
    questions: chosen.map((q) => ({ q: q.id, part: partFor(q) })),
    likely: likely.map((q) => q.id),
    possible: possible.map((q) => q.id),
    // R2.2 (F-4): only data-role earns 'high'; a REAL multi-part anatomy (≥2 styled parts confirmed by the
    // stylesheet) earns 'medium'; a thin/leaked/marker-only derivation is 'low', NOT 'medium' — an
    // over-confident "medium" on junk parts is exactly what let the cointrail derivation ship.
    confidence: ev.dataRoles.length ? 'high' : (styled.length >= 2 && ev.hasCss) ? 'medium' : 'low',
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
