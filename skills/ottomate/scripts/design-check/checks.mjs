// Source-method detectors for the design constraint checker.
//
// Every function here answers a question that is visible IN THE VARIANT'S SOURCE TEXT. Anything that
// needs cascade resolution, computed values, or a rendered box is method:"computed" and lives in
// Phase 3b — that boundary is the `method` field in data/design-rules.json, not a judgement call.
//
// Contract: a detector returns { pass, detail }. `detail` is shown to the owner, so it names the
// offending text, not just the rule.
//
// Scope:
//   'variant' — fn(source, rule, contract) for each variant independently
//   'set'     — fn(variants, rule, contract) where variants is { [label]: source }

// ── text extraction ─────────────────────────────────────────────────────────────────────────────
// Comments must be stripped before pattern scanning, and this is not hypothetical: our own preview
// templates now carry the literal string "-webkit-font-smoothing" inside a CSS comment explaining why
// it is absent. Without this, adv-no-font-smoothing would fire on the very fix that satisfied it.
//
// Block comments only. A naive `//` strip would eat the `//` in every https:// URL, which is exactly
// what feas-no-network needs to see.
export function stripComments(src) {
  return src
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/\/\*[\s\S]*?\*\//g, ' ');
}

// User-visible text: what a reader actually reads. Copy rules must NOT scan class names, ids or code,
// or they fire on everything.
export function visibleText(src) {
  const body = stripComments(src)
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ');
  const attrs = [];
  const attrRe = /\s(?:aria-label|placeholder|title|alt)\s*=\s*"([^"]*)"/gi;
  let m;
  while ((m = attrRe.exec(body)) !== null) attrs.push(m[1]);
  return (body.replace(/<[^>]*>/g, ' ') + ' ' + attrs.join(' ')).replace(/\s+/g, ' ').trim();
}

// The text of every actionable element — what a button actually says.
export function actionLabels(src) {
  const body = stripComments(src).replace(/<script[\s\S]*?<\/script>/gi, ' ');
  const out = [];
  const re = /<(button|a)\b[^>]*>([\s\S]*?)<\/\1>/gi;
  let m;
  while ((m = re.exec(body)) !== null) {
    const text = m[2].replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
    if (text) out.push(text);
  }
  return out;
}

function hits(src, patterns, flags = 'gi') {
  const found = [];
  for (const p of patterns) {
    const re = new RegExp(p, flags);
    const m = src.match(re);
    if (m) found.push(...m.slice(0, 3));
  }
  return found;
}

const ok = (detail) => ({ pass: true, detail });
const no = (detail) => ({ pass: false, detail });

// ── feasibility: does it run at all ─────────────────────────────────────────────────────────────

function feasNoEval(src, rule) {
  const found = hits(stripComments(src), rule.params.patterns);
  return found.length
    ? no(`dynamic code found: ${found.join(', ')} — blocked by a no-eval CSP in every engine`)
    : ok('no eval / new Function / string-timer / javascript: URI');
}

function feasNoWasm(src, rule) {
  const clean = stripComments(src);
  const found = hits(clean, rule.params.patterns);
  const libs = (rule.params.known_blocked ?? []).filter((l) => clean.includes(l));
  if (found.length || libs.length) {
    const why = libs.length ? ` (${libs.join(', ')} needs WebAssembly)` : '';
    return no(`WebAssembly reference${why}: ${[...found, ...libs].join(', ')} — 'wasm-unsafe-eval' is a SEPARATE CSP keyword and is not granted`);
  }
  return ok('no WebAssembly');
}

function feasNoNetwork(src, rule) {
  const clean = stripComments(src);
  const found = hits(clean, rule.params.patterns);
  const svc = (rule.params.known_placeholder_services ?? []).filter((h) => clean.includes(h));
  if (found.length || svc.length) {
    const why = svc.length
      ? ` — placeholder service(s) ${svc.join(', ')}; use a deterministic seeded inline SVG (doctrine 153) or an initials avatar at the L=0.179 crossover (doctrine 154)`
      : '';
    return no(`network reference: ${[...found, ...svc].join(', ')}${why}`);
  }
  return ok('no network reference');
}

function feasNoInlineHandlers(src, rule) {
  // Scoped to real HTML attributes; `on` inside a JS string or a CSS value must not match.
  const clean = stripComments(src).replace(/<script[\s\S]*?<\/script>/gi, ' ').replace(/<style[\s\S]*?<\/style>/gi, ' ');
  const found = hits(clean, rule.params.patterns);
  return found.length
    ? no(`inline event handler(s): ${found.map((s) => s.trim()).join(', ')} — a strict hash-based script-src does not cover them; use addEventListener`)
    : ok('no inline event-handler attributes');
}

// ── owner integrity: cross-variant namespace collision ──────────────────────────────────────────
// The static half of the Phase-1 blocker. All N variants are injected into ONE document, so a shared
// id makes url(#id) resolve to the FIRST match and a shared class lets the LAST <style> block win.
// The set then differs in source and matches on screen — precisely what the isolation gate forbids.

const NS_EXTRACTORS = {
  svg_id: (s) => [...s.matchAll(/<(?:linearGradient|radialGradient|filter|clipPath|mask|pattern|symbol|marker)\b[^>]*\bid\s*=\s*"([^"]+)"/gi)].map((m) => m[1]),
  keyframes_name: (s) => [...s.matchAll(/@keyframes\s+([A-Za-z_][\w-]*)/gi)].map((m) => m[1]),
  root_custom_property: (s) => {
    const out = [];
    for (const blk of s.matchAll(/:root\s*\{([^}]*)\}/gi)) {
      for (const p of blk[1].matchAll(/(--[\w-]+)\s*:/g)) out.push(p[1]);
    }
    return out;
  },
  css_class: (s) => {
    const out = [];
    // Only classes the variant DEFINES in its own <style>, not ones it merely uses.
    for (const st of s.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/gi)) {
      for (const c of st[1].matchAll(/\.(-?[_a-zA-Z][\w-]*)\s*[,{:.\s]/g)) out.push(c[1]);
    }
    return out;
  },
};

function blockSvgIdCollision(variants, rule) {
  const labels = Object.keys(variants);
  if (labels.length < 2) return ok('single variant — no cross-variant collision possible');
  const collisions = [];
  for (const ns of rule.params.namespaces) {
    const extract = NS_EXTRACTORS[ns];
    if (!extract) continue;
    const owners = new Map();
    for (const label of labels) {
      for (const name of new Set(extract(stripComments(variants[label])))) {
        if (!owners.has(name)) owners.set(name, []);
        owners.get(name).push(label);
      }
    }
    for (const [name, who] of owners) {
      if (who.length > 1) collisions.push(`${ns} "${name}" declared by ${who.join(' + ')}`);
    }
  }
  return collisions.length
    ? no(`variants share a namespace in one document — the later panel silently overrides the earlier: ${collisions.slice(0, 6).join('; ')}`)
    : ok('no cross-variant id / class / keyframes / :root collisions');
}

// ── the owner's constraint contract (block_owner, never profile-filtered) ───────────────────────

function contractMustUse(src, _rule, contract) {
  const want = contract?.must_use ?? [];
  if (!want.length) return ok('no must_use constraint declared');
  const missing = want.filter((id) => !src.includes(id));
  return missing.length
    ? no(`required master_components missing from the variant: ${missing.join(', ')}`)
    : ok(`all ${want.length} required component(s) present`);
}

// Animation vocabulary. Collects @keyframes names, animation-name values, and the identifier tokens of
// the `animation:` shorthand (excluding the shorthand's own keywords). Documented limit: it does not
// resolve an animation name supplied through a custom property.
const ANIM_KEYWORDS = new Set([
  'none', 'infinite', 'alternate', 'alternate-reverse', 'reverse', 'normal', 'forwards', 'backwards',
  'both', 'running', 'paused', 'linear', 'ease', 'ease-in', 'ease-out', 'ease-in-out', 'step-start',
  'step-end', 'initial', 'inherit', 'unset', 'revert',
]);

export function animationNames(src) {
  const s = stripComments(src);
  const names = new Set();
  for (const m of s.matchAll(/@keyframes\s+([A-Za-z_][\w-]*)/gi)) names.add(m[1]);
  for (const m of s.matchAll(/animation-name\s*:\s*([^;}]+)/gi)) {
    for (const n of m[1].split(',')) { const t = n.trim(); if (t && !ANIM_KEYWORDS.has(t)) names.add(t); }
  }
  for (const m of s.matchAll(/(?<!-)\banimation\s*:\s*([^;}]+)/gi)) {
    for (const part of m[1].split(',')) {
      for (const tok of part.trim().split(/\s+/)) {
        if (/^[A-Za-z_][\w-]*$/.test(tok) && !ANIM_KEYWORDS.has(tok) && !/^(cubic-bezier|steps)$/.test(tok)) names.add(tok);
      }
    }
  }
  return [...names];
}

function contractAnimationVocab(src, _rule, contract) {
  const vocab = contract?.animation_vocab;
  if (!vocab || !vocab.length) return ok('no animation_vocab constraint declared');
  const used = animationNames(src);
  const outside = used.filter((n) => !vocab.includes(n));
  return outside.length
    ? no(`animation(s) outside the declared vocabulary [${vocab.join(', ')}]: ${outside.join(', ')}`)
    : ok(used.length ? `all animations within vocabulary (${used.join(', ')})` : 'no animation used');
}

const FORBIDDEN_DETECTORS = {
  glassmorphism: (s) => (/backdrop-filter\s*:/i.test(s) ? 'backdrop-filter' : (/filter\s*:[^;}]*blur\(/i.test(s) && /(rgba|hsla)\([^)]*0?\.\d+\s*\)/i.test(s) ? 'filter:blur() over a translucent surface' : null)),
  parallax: (s) => (/background-attachment\s*:\s*fixed/i.test(s) ? 'background-attachment:fixed'
    : /animation-timeline\s*:\s*scroll\(/i.test(s) ? 'animation-timeline:scroll()'
    : /addEventListener\s*\(\s*['"]scroll['"]/i.test(s) && /transform/i.test(s) ? 'scroll listener altering transform' : null),
  bounce: (s) => {
    if (/\b(bounce|elastic|back)(-|\b)/i.test(s) && /(animation|transition|cubic-bezier|@keyframes)/i.test(s)) return 'bounce/elastic/back easing name';
    for (const m of s.matchAll(/cubic-bezier\(\s*([-\d.]+)\s*,\s*([-\d.]+)\s*,\s*([-\d.]+)\s*,\s*([-\d.]+)\s*\)/gi)) {
      const y1 = parseFloat(m[2]); const y2 = parseFloat(m[4]);
      if (y1 < 0 || y1 > 1 || y2 < 0 || y2 > 1) return `overshoot curve ${m[0]}`;
    }
    return null;
  },
  glow: (s) => {
    for (const m of s.matchAll(/(?:box-shadow|drop-shadow)\s*:?\s*\(?\s*0\s+0\s+(\d+)/gi)) {
      if (parseInt(m[1], 10) > 0) return `offsetless shadow ${m[0].trim()}`;
    }
    return null;
  },
  'gradient-text': (s) => (/background-clip\s*:\s*text/i.test(s) && /gradient\(/i.test(s) ? 'background-clip:text over a gradient' : null),
};

function contractForbidden(src, rule, contract) {
  const banned = contract?.forbidden ?? [];
  if (!banned.length) return ok('no forbidden techniques declared');
  const clean = stripComments(src);
  const found = [];
  for (const t of banned) {
    const d = FORBIDDEN_DETECTORS[t];
    if (!d) { found.push(`${t} (NO DETECTOR — cannot be checked, treated as unverified)`); continue; }
    const why = d(clean);
    if (why) found.push(`${t}: ${why}`);
  }
  return found.length ? no(`forbidden technique(s) present — ${found.join('; ')}`) : ok(`none of [${banned.join(', ')}] present`);
}

// ── C8: anti-slop tells (F2's templated tax) ────────────────────────────────────────────────────
// The signatures F2 identifies as the most reliable "this was generated" tells. ADVISORY, never
// blocking: each is legitimate somewhere, and a hard block would turn a taste heuristic into a law.
// But they must be SEEN — the entire failure mode is that nobody notices. Our own card-wall template
// still carries the coloured left strip (a logged defect the owner deferred), which is precisely why
// this is worth detecting rather than trusting ourselves not to do it.
function advNoSlopTells(src) {
  const s = stripComments(src);
  const tells = [];

  // 1. the coloured 2-4px left strip on a stat or card — F2's single most reliable tell
  if (/border-left\s*:\s*[234]px\s+solid/i.test(s)
      || /::before[^{]*\{[^}]*width\s*:\s*[234]px/i.test(s)) {
    tells.push('coloured 2-4px left strip on a surface');
  }

  // 2. an emoji doing an icon's job
  if (/[\u{1F300}-\u{1FAFF}]|[\u{2600}-\u{27BF}]/u.test(s)) {
    tells.push('emoji used as UI iconography');
  }

  // 3. everything centred — what you get when no layout decision was made
  const centred = (s.match(/text-align\s*:\s*center/gi) || []).length;
  if (centred >= 4) {
    tells.push('text-align:center x' + centred + ' — centring everything is the no-decision default');
  }

  // 4. a rainbow gradient standing in for a palette
  if (/linear-gradient\([^)]*#[0-9a-f]{3,8}[^)]*#[0-9a-f]{3,8}[^)]*#[0-9a-f]{3,8}/i.test(s)) {
    tells.push('3+ stop rainbow gradient');
  }

  // 5. one radius on everything — no ladder, no concentric nesting (A4 116)
  const radiusDecls = s.match(/border-radius\s*:\s*[\d.]+(?:px|rem)/gi) || [];
  const distinctRadii = new Set(radiusDecls.map((m) => m.split(':')[1].trim()));
  if (radiusDecls.length >= 5 && distinctRadii.size === 1) {
    tells.push('one radius (' + [...distinctRadii][0] + ') on ' + radiusDecls.length + ' elements — no ladder');
  }

  return tells.length
    ? no('anti-slop tells present: ' + tells.join('; '))
    : ok('no templated-tax tells detected');
}

// ── advisory detectors ──────────────────────────────────────────────────────────────────────────

function advNoFontSmoothing(src, rule) {
  const found = hits(stripComments(src), rule.params.patterns);
  return found.length
    ? no(`${found.join(', ')} — non-standard and macOS-only, so it is a no-op here and only makes Mac viewers see a lighter design`)
    : ok('no font-smoothing override');
}

function advActionLabel(src, rule) {
  const banned = new Set(rule.params.banned_bare.map((s) => s.toLowerCase()));
  const [minW, maxW] = rule.params.word_count;
  const bad = [];
  for (const label of actionLabels(src)) {
    const plain = label.replace(/[^\w\s]/g, '').trim();
    if (!plain) continue;
    if (banned.has(plain.toLowerCase())) { bad.push(`"${label}" is a bare generic label`); continue; }
    const w = plain.split(/\s+/).length;
    if (w > maxW) bad.push(`"${label}" is ${w} words (max ${maxW})`);
    else if (w < minW && !banned.has(plain.toLowerCase())) bad.push(`"${label}" is ${w} word — prefer verb + object`);
  }
  return bad.length ? no(bad.slice(0, 5).join('; ')) : ok('action labels are specific verb+object');
}

function advErrorCopy(src, rule) {
  const text = visibleText(src).toLowerCase();
  const found = rule.params.banned_words.filter((w) => new RegExp(`\\b${w.replace(/ /g, '\\s+')}\\b`, 'i').test(text));
  return found.length
    ? no(`blaming or hedging words in user-facing copy: ${found.join(', ')} — say what happened, why (if it helps), and how to fix it`)
    : ok('no banned error-copy vocabulary');
}

function advImplementationVocabulary(src, rule) {
  const text = visibleText(src);
  const found = hits(text, rule.params.patterns, 'g');
  return found.length
    ? no(`implementation vocabulary leaked into user-facing copy: ${[...new Set(found)].slice(0, 6).join(', ')}`)
    : ok('no implementation vocabulary in visible copy');
}

function advCssArchitecture(src, rule) {
  const css = [...stripComments(src).matchAll(/<style[^>]*>([\s\S]*?)<\/style>/gi)].map((m) => m[1]).join('\n');
  if (!css.trim()) return ok('no stylesheet in this variant');
  const problems = [];
  if (rule.params.forbid_important && /!important/i.test(css)) {
    problems.push('!important present — it collapses the system AND reverses @layer order');
  }
  // An ID used as a *style* selector, not an anchor target or a JS hook. Exclude hex COLOURS — a value
  // like `,#ffcf8a,` inside a gradient matches the selector shape but is not a selector (hex starts
  // with a-f too). A 3/4/6/8-digit all-hex name in value position is a colour, not an ID.
  const idSel = [...css.matchAll(/(^|[\s,>+~{}])#([A-Za-z][\w-]*)\s*[,{]/g)]
    .map((m) => m[2])
    .filter((name) => !(/^[0-9a-fA-F]+$/.test(name) && [3, 4, 6, 8].includes(name.length)))
    .map((name) => `#${name}`);
  if (rule.params.forbid_id_selectors && idSel.length) {
    problems.push(`ID selector(s) used for styling: ${[...new Set(idSel)].slice(0, 4).join(', ')}`);
  }
  const declared = [...css.matchAll(/@layer\s+([^;{]+)[;{]/gi)].map((m) => m[1]).join(',')
    .split(',').map((s) => s.trim()).filter(Boolean);
  if (declared.length > 1) {
    const want = rule.params.layer_order;
    const idx = declared.map((l) => want.indexOf(l)).filter((i) => i >= 0);
    if (idx.some((v, i) => i > 0 && v < idx[i - 1])) {
      problems.push(`@layer order is ${declared.join(' → ')}, expected ${want.join(' → ')}`);
    }
  }
  return problems.length ? no(problems.join('; ')) : ok('CSS architecture clean');
}

function advInlineStyleAttr(src, rule) {
  const clean = stripComments(src);
  const all = [...clean.matchAll(/\sstyle\s*=\s*"([^"]*)"/gi)].map((m) => m[1]);
  // Exempt: a style attribute carrying only custom properties — that is a per-instance parameter,
  // which is exactly how the harness's token mode works and is not the failure this rule targets.
  const offenders = all.filter((v) => v.split(';').some((d) => d.trim() && !d.trim().startsWith('--')));
  return offenders.length > (rule.params.max_inline_style_attrs ?? 0)
    ? no(`${offenders.length} inline style attribute(s) — governed by style-src-attr and dropped under a hash-based policy; prefer one <style> block plus classes`)
    : ok(all.length ? `${all.length} style attribute(s), all custom-property-only (exempt)` : 'no inline style attributes');
}

function advWebkitPrefix(src, rule) {
  const clean = stripComments(src);
  const problems = [];
  for (const [std, prefixed] of Object.entries(rule.params.pairs)) {
    if (new RegExp(`(?<!-)\\b${std}\\s*:`, 'i').test(clean) && !clean.includes(prefixed)) {
      problems.push(`${std} without ${prefixed}`);
    }
  }
  // The prefixed mask keywords genuinely differ; copying the standard keyword across is a silent no-op.
  for (const m of clean.matchAll(/-webkit-mask-composite\s*:\s*([\w-]+)/gi)) {
    if (Object.keys(rule.params.keyword_map).includes(m[1].toLowerCase())) {
      problems.push(`-webkit-mask-composite: ${m[1]} is a standard keyword — WebKit wants "${rule.params.keyword_map[m[1].toLowerCase()]}"`);
    }
  }
  return problems.length ? no(problems.join('; ')) : ok('vendor prefixes paired correctly');
}

function advNotInter(src, rule) {
  const clean = stripComments(src);
  const found = rule.params.flagged.filter((f) => new RegExp(`font-family[^;}]*["']?${f}\\b`, 'i').test(clean));
  return found.length
    ? no(`${found.join(', ')} used without a recorded rationale — excellent but everywhere; consider ${rule.params.suggested_alternatives.slice(0, 3).join(', ')}`)
    : ok('no unexamined default typeface');
}

function advHoverControlFocusWithin(src, rule) {
  const css = [...stripComments(src).matchAll(/<style[^>]*>([\s\S]*?)<\/style>/gi)].map((m) => m[1]).join('\n');
  if (!css.trim()) return ok('no stylesheet in this variant');
  const bad = [];
  for (const m of css.matchAll(/([^{}]*:hover[^{}]*)\{([^}]*)\}/gi)) {
    const selector = m[1].trim();
    const reveals = /(opacity\s*:\s*1|visibility\s*:\s*visible|display\s*:\s*(?!none)[\w-]+|transform\s*:\s*translate)/i.test(m[2]);
    if (!reveals) continue;
    const base = selector.replace(/:hover/g, '').trim();
    const hasFocus = new RegExp(`${base.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*:focus-within|:focus-within`, 'i').test(css);
    if (!hasFocus) bad.push(selector);
  }
  return bad.length
    ? no(`control revealed on :hover with no :focus-within equivalent (${bad.slice(0, 3).join(', ')}) — unreachable by anyone who tabbed here, including a solo mouse+keyboard owner (WCAG 2.1.1)`)
    : ok('hover reveals have keyboard equivalents');
}

function advWeightBudget(src, rule) {
  const kb = Math.round(Buffer.byteLength(src, 'utf8') / 1024);
  if (kb > rule.params.acceptable_kb) return no(`${kb} KB — over the ${rule.params.acceptable_kb} KB budget-event threshold`);
  if (kb > rule.params.snappy_kb) return no(`${kb} KB — past the ${rule.params.snappy_kb} KB "snappy" target, still under the ${rule.params.acceptable_kb} KB ceiling`);
  return ok(`${kb} KB, within the ${rule.params.snappy_kb} KB snappy budget`);
}

// ── A3 batch: more source detectors (Phase-1 quick win) ─────────────────────────────────────────

function collectStyleCss(src) {
  return [...stripComments(src).matchAll(/<style[^>]*>([\s\S]*?)<\/style>/gi)].map((m) => m[1]).join('\n');
}

// Every --name: value declaration, and the var(--other) it references.
function tokenGraph(css) {
  const value = new Map();  // --name -> raw value
  const edges = new Map();  // --name -> [--referenced]
  for (const m of css.matchAll(/(--[\w-]+)\s*:\s*([^;}]+)/g)) {
    const name = m[1]; const val = m[2].trim();
    value.set(name, val);
    const refs = [...val.matchAll(/var\(\s*(--[\w-]+)/g)].map((r) => r[1]);
    edges.set(name, refs);
  }
  return { value, edges };
}

const ROLE_WORDS = /\b(primary|secondary|tertiary|action|danger|success|warning|info|error|surface|muted|subtle|emphasis|brand|accent|positive|negative|critical|link|focus|hover|disabled|selected)\b/i;
const COLOUR_WORDS = /\b(blue|red|green|yellow|orange|purple|pink|teal|cyan|magenta|gr[ae]y|black|white|slate|zinc|neutral|indigo|violet|amber|lime|emerald|rose|sky|stone|fuchsia)\b/i;

function advTokenLayerDirection(src, rule) {
  const css = collectStyleCss(src);
  if (!css.trim()) return ok('no stylesheet');
  const { edges } = tokenGraph(css);
  if (edges.size === 0) return ok('no custom properties declared');
  const problems = [];
  const maxHops = rule.params?.max_alias_hops ?? 3;
  // depth + cycle via DFS with a visiting stack
  const depthOf = (start) => {
    const seen = new Set();
    let max = 0;
    const walk = (n, d, stack) => {
      if (stack.has(n)) { problems.push(`alias cycle through ${n}`); return; }
      if (d > max) max = d;
      const next = edges.get(n) || [];
      const s2 = new Set(stack); s2.add(n);
      for (const r of next) { if (!seen.has(n + '>' + r)) { seen.add(n + '>' + r); walk(r, d + 1, s2); } }
    };
    walk(start, 0, new Set());
    return max;
  };
  for (const name of edges.keys()) {
    const d = depthOf(name);
    if (d > maxHops) problems.push(`${name} alias chain is ${d} hops (max ${maxHops})`);
    // a name carrying BOTH a colour word and a role word welds a decision to a value (C2 §3.2)
    if (COLOUR_WORDS.test(name) && ROLE_WORDS.test(name)) problems.push(`${name} mixes a colour word and a role word — a primitive named for its role or a semantic named for its colour breaks theming`);
  }
  return problems.length ? no([...new Set(problems)].slice(0, 5).join('; ')) : ok('token layers flow cleanly, alias depth within budget');
}

const LENGTH_RE = /^-?\d*\.?\d+(px|rem|em|%)$/;
const DUR_RE = /^-?\d*\.?\d+m?s$/;
const HEX_RE = /^#[0-9a-fA-F]{3,8}$/;
const DRIFT_EXEMPT = new Set(['0', '0px', '1px', '100%', 'auto', 'none', '0s', '0ms']);

function advRawValueDrift(src) {
  const css = collectStyleCss(src);
  if (!css.trim()) return ok('no stylesheet');
  const { value } = tokenGraph(css);
  // map token VALUE -> token name (only literal values, not var() refs)
  const byValue = new Map();
  for (const [name, val] of value) {
    const v = val.trim();
    if (!v.startsWith('var(') && (LENGTH_RE.test(v) || DUR_RE.test(v) || HEX_RE.test(v))) byValue.set(v.toLowerCase(), name);
  }
  if (byValue.size === 0) return ok('no literal-valued tokens to drift from');
  const hits2 = [];
  // scan non-token declarations for a literal equal to a token's value
  for (const m of css.matchAll(/(?:^|[;{])\s*([a-z-]+)\s*:\s*([^;}]+)/gi)) {
    const prop = m[1].trim(); const val = m[2].trim();
    if (prop.startsWith('--')) continue;          // a token declaration itself
    for (const tok of val.split(/\s+/)) {
      const t = tok.trim().toLowerCase();
      if (DRIFT_EXEMPT.has(t)) continue;
      if (byValue.has(t)) hits2.push(`${prop}: ${tok} duplicates ${byValue.get(t)} — route it through the token`);
    }
  }
  return hits2.length ? no([...new Set(hits2)].slice(0, 5).join('; ')) : ok('no raw values duplicate a token');
}

function advSingleIconSet(src) {
  const clean = stripComments(src);
  const svgs = [...clean.matchAll(/<svg\b[^>]*>/gi)].map((m) => m[0]);
  const iconlike = [];
  for (const tag of svgs) {
    const vb = /viewBox\s*=\s*"([^"]+)"/i.exec(tag);
    if (!vb) continue;
    const nums = vb[1].trim().split(/[\s,]+/).map(Number);
    if (nums.length !== 4) continue;
    const w = nums[2], h = nums[3];
    if (w > 64 || h > 64 || Math.abs(w - h) > 2) continue;  // not an icon-grid svg
    const sw = /stroke-width\s*=\s*"?([\d.]+)/i.exec(tag);
    iconlike.push({ grid: `${w}x${h}`, stroke: sw ? sw[1] : null });
  }
  if (iconlike.length < 2) return ok(iconlike.length ? '1 icon svg — nothing to compare' : 'no icon svgs');
  const grids = new Set(iconlike.map((i) => i.grid));
  const strokes = new Set(iconlike.map((i) => i.stroke).filter(Boolean));
  const problems = [];
  if (grids.size > 1) problems.push(`mixed icon grids: ${[...grids].join(', ')}`);
  if (strokes.size > 1) problems.push(`mixed stroke widths: ${[...strokes].join(', ')}`);
  return problems.length ? no(`${problems.join('; ')} — one icon set, one grid, one stroke (D2 §3.1)`) : ok(`${iconlike.length} icons, consistent grid/stroke`);
}

function advNoImageDistortion(src, rule) {
  const found = hits(collectStyleCss(src) + ' ' + stripComments(src), rule.params?.patterns ?? ['object-fit\\s*:\\s*fill']);
  return found.length
    ? no(`object-fit: fill distorts images — use cover with a focal object-position (D2 §3.13)`)
    : ok('no object-fit: fill');
}

// ── registry ────────────────────────────────────────────────────────────────────────────────────
// Keyed by the rule id in data/design-rules.json. A rule with no entry here is SKIPPED and reported
// as skipped — never as a pass. That distinction is the whole point of the register's Enforced? field.

// ── C6 batch 2: source detectors ────────────────────────────────────────────────────────────────
// Everything here reads the TEXT of a variant. No browser, no dependencies. Each one is paired with a
// must-fail and a must-pass case in design-check.test.mjs — a detector with only a passing test is
// indistinguishable from a stub that returns true.

const C6_DUR_RE = /(\d+(?:\.\d+)?)\s*(ms|s)\b/g;
function durationsMs(s) {
  const out = [];
  for (const m of s.matchAll(C6_DUR_RE)) {
    const n = parseFloat(m[1]);
    out.push(m[2] === 's' ? n * 1000 : n);
  }
  return out;
}
function hasMotion(s) {
  return /transition\s*:|animation\s*:|@keyframes/i.test(s);
}

// floor-reduced-motion — BLOCK-floor. Motion without an opt-out is not a style choice, it is an
// accessibility failure for people who get sick from it.
function floorReducedMotion(src) {
  const s = stripComments(src);
  if (!hasMotion(s)) return ok('no motion declared, so nothing to opt out of');
  return /@media[^{]*prefers-reduced-motion/i.test(s)
    ? ok('motion is present and prefers-reduced-motion is honoured')
    : no('motion is declared with NO prefers-reduced-motion block — there is no way to turn it off');
}

// adv-motion-duration — B1's role ladder. Anything past ~600ms in UI motion reads as sluggish; a 0ms
// transition is a transition that does not exist.
function advMotionDuration(src) {
  const s = stripComments(src);
  if (!hasMotion(s)) return ok('no motion declared');
  const bad = durationsMs(s).filter((d) => d > 600 || (d > 0 && d < 60));
  return bad.length
    ? no(`motion durations outside the role ladder (60-600ms): ${[...new Set(bad)].join(', ')}ms`)
    : ok('all durations sit inside the role ladder');
}

// adv-compositor-only — animating anything but transform/opacity forces layout or paint per frame.
const CHEAP = new Set(['transform', 'opacity', 'filter', 'backdrop-filter']);
function advCompositorOnly(src) {
  const s = stripComments(src);
  const props = new Set();
  for (const m of s.matchAll(/transition\s*:\s*([^;}]+)/gi)) {
    for (const part of m[1].split(',')) {
      const first = part.trim().split(/\s+/)[0];
      if (first && first !== 'all' && !/^\d/.test(first)) props.add(first);
      if (first === 'all') props.add('all');
    }
  }
  const costly = [...props].filter((p) => !CHEAP.has(p) && p !== 'all'
    && /^(width|height|top|left|right|bottom|margin|padding|border-width|font-size|line-height)/.test(p));
  if (props.has('all')) return no('transition: all — animates every property that ever changes, including layout ones');
  return costly.length
    ? no(`transitions on layout/paint properties: ${costly.join(', ')} — only transform and opacity are compositor-cheap`)
    : ok('transitions stay on compositor-friendly properties');
}

// adv-easing-direction — linear easing on UI motion reads mechanical; B1 wants ease-out for entering.
function advEasingDirection(src) {
  const s = stripComments(src);
  if (!hasMotion(s)) return ok('no motion declared');
  return /transition[^;}]*\blinear\b|animation[^;}]*\blinear\b/i.test(s)
    ? no('linear easing on UI motion — reads mechanical; entering motion should decelerate (ease-out)')
    : ok('no linear easing on UI motion');
}

// adv-stagger-cap — a staggered list where the last item waits too long stops feeling responsive.
function advStaggerCap(src) {
  const s = stripComments(src);
  const delays = [];
  for (const m of s.matchAll(/(?:transition-delay|animation-delay)\s*:\s*([^;}]+)/gi)) {
    delays.push(...durationsMs(m[1]));
  }
  const worst = delays.length ? Math.max(...delays) : 0;
  return worst > 500
    ? no(`largest stagger delay ${worst}ms — past ~500ms the last item feels broken, not choreographed`)
    : ok(delays.length ? `largest stagger delay ${worst}ms` : 'no stagger delays');
}

// adv-flash-limit — anything repeating faster than 3Hz is a seizure risk (WCAG 2.3.1).
function advFlashLimit(src) {
  const s = stripComments(src);
  const problems = [];
  for (const m of s.matchAll(/animation\s*:\s*([^;}]+)/gi)) {
    const decl = m[1];
    if (!/infinite/i.test(decl)) continue;
    const ds = durationsMs(decl).filter((d) => d > 0);
    if (ds.length && Math.min(...ds) < 333) problems.push(`${Math.min(...ds)}ms infinite`);
  }
  return problems.length
    ? no(`repeating animation faster than 3Hz: ${problems.join(', ')} — seizure risk (WCAG 2.3.1)`)
    : ok('no sub-333ms infinite animation');
}

// adv-zindex-ladder — arbitrary z-index numbers are how stacking bugs are born.
function advZindexLadder(src) {
  const s = stripComments(src);
  const vals = [...s.matchAll(/z-index\s*:\s*(-?\d+)/gi)].map((m) => parseInt(m[1], 10));
  if (!vals.length) return ok('no z-index used');
  const wild = vals.filter((v) => Math.abs(v) > 100);
  const distinct = new Set(vals);
  if (wild.length) return no(`z-index values outside a ladder: ${[...new Set(wild)].join(', ')} — 9999 is not a layer, it is an argument`);
  return distinct.size > 6
    ? no(`${distinct.size} distinct z-index values — a ladder has a few named steps, not a scatter`)
    : ok(`${distinct.size} z-index step(s), all within a ladder`);
}

// adv-focus-ring-not-shadow-only — arbitrated A5 over A4: forced-colors DELETES box-shadow, so a
// shadow-only focus ring leaves a High Contrast user with no visible focus at all.
function advFocusRingNotShadowOnly(src) {
  const s = stripComments(src);
  const blocks = [...s.matchAll(/:focus(?:-visible)?[^{]*\{([^}]*)\}/gi)].map((m) => m[1]);
  if (!blocks.length) return ok('no focus styling declared here');
  const bad = blocks.filter((b) => /box-shadow/i.test(b) && !/outline\s*:/i.test(b));
  return bad.length
    ? no('focus ring drawn with box-shadow and no outline — forced-colors removes box-shadow, leaving no visible focus')
    : ok('focus styling uses outline');
}

// adv-icon-delivery-inline-svg — D2: one icon set, delivered inline. An icon font ships a whole
// alphabet to draw an arrow and breaks when the font fails.
function advIconDelivery(src) {
  const s = stripComments(src);
  const tells = [];
  if (/font-family\s*:[^;}]*(material icons|font ?awesome|glyphicon|icomoon)/i.test(s)) tells.push('icon font');
  if (/<i\s+class\s*=\s*["'][^"']*\b(fa|fas|far|fab|material-icons|glyphicon)\b/i.test(s)) tells.push('<i class="fa…"> icon markup');
  return tells.length
    ? no(`icons delivered by ${tells.join(' + ')} — inline SVG is the delivery that survives a failed font`)
    : ok('no icon-font delivery detected');
}

// adv-deterministic-placeholder — D2 §3.14. A placeholder that changes on every render makes a
// variant set un-comparable: two panels differ because the dice differed, not because the design did.
function advDeterministicPlaceholder(src) {
  const s = stripComments(src);
  return /Math\.random|crypto\.getRandomValues|\?random|\/random\b/i.test(s)
    ? no('non-deterministic placeholder content — a variant set must not differ because the dice differed')
    : ok('placeholder content is deterministic');
}

// adv-realistic-content — F2: lorem ipsum and one-word strings hide every overflow bug there is.
function advRealisticContent(src) {
  const s = stripComments(src);
  return /lorem ipsum|dolor sit amet/i.test(s)
    ? no('lorem ipsum in a variant — placeholder prose hides the overflow and wrapping the real copy will cause')
    : ok('no lorem ipsum');
}

// adv-semantic-separate — C2/A1: if success/error/warning are drawn in the brand accent, a state stops
// reading as a state and starts reading as branding.
function advSemanticSeparate(src) {
  const s = stripComments(src);
  const semantic = [...s.matchAll(/--(?:success|error|danger|warning|info)[\w-]*\s*:\s*([^;}]+)/gi)].map((m) => m[1].trim().toLowerCase());
  const accents = [...s.matchAll(/--(?:accent|brand|primary|au)[\w-]*\s*:\s*([^;}]+)/gi)].map((m) => m[1].trim().toLowerCase());
  if (!semantic.length || !accents.length) return ok('not enough declared tokens to compare');
  const clash = semantic.filter((v) => accents.includes(v));
  return clash.length
    ? no(`semantic colour(s) identical to the brand accent: ${[...new Set(clash)].join(', ')} — a state must not read as branding`)
    : ok('semantic colours are distinct from the accent');
}

// adv-reduced-transparency — A4 §3.7 added the fourth preference query. Translucency without an
// opt-out is unreadable for people who need opacity.
function advReducedTransparency(src) {
  const s = stripComments(src);
  const translucent = /backdrop-filter|rgba?\([^)]*0?\.\d+\s*\)|hsla?\([^)]*0?\.\d+\s*\)|opacity\s*:\s*0?\.\d/i.test(s);
  if (!translucent) return ok('nothing translucent declared');
  return /prefers-reduced-transparency/i.test(s)
    ? ok('translucency present and prefers-reduced-transparency honoured')
    : no('translucent surfaces with no prefers-reduced-transparency fallback');
}

// feas-canvas-a11y-mirror — a <canvas> with no DOM equivalent is invisible to a screen reader and to
// every test selector.
function feasCanvasA11yMirror(src) {
  const s = stripComments(src);
  if (!/<canvas[\s>]/i.test(s)) return ok('no canvas used');
  return /<canvas[^>]*>[\s\S]*?<[a-z]/i.test(s) || /aria-label\s*=/.test(s)
    ? ok('canvas carries fallback content or a label')
    : no('<canvas> with no DOM mirror or label — invisible to assistive tech and to test selectors');
}

// ── C6 batch 4: the feasibility tail ────────────────────────────────────────────────────────────
// A purpose-built @supports reader rather than a postcss dependency. The plugin has no package.json
// and its portability across Windows and VAULT7A is worth more than a parser we can write here.
// This does not need to be a full CSS parser — it needs to answer one question: which risky features
// does this variant use, and are they guarded?

// Features that are NOT safely assumable and therefore want a guard or a fallback. Each is here
// because it silently produces NOTHING (not a degraded look — nothing) where unsupported.
export const RISKY_FEATURES = {
  'backdrop-filter': /backdrop-filter\s*:/i,
  'container-queries': /@container\b|container-type\s*:/i,
  'has-selector': /:has\(/i,
  'subgrid': /grid-template-(?:rows|columns)\s*:[^;}]*\bsubgrid\b/i,
  'anchor-positioning': /anchor-name\s*:|position-anchor\s*:/i,
  'scroll-timeline': /animation-timeline\s*:|scroll-timeline\s*:/i,
  'color-mix': /color-mix\(/i,
  'oklch': /\boklch\(/i,
  'text-wrap-balance': /text-wrap\s*:\s*balance/i,
};

/**
 * Every feature named inside an `@supports` condition, however nested. Deliberately tolerant: it
 * reads the CONDITION text, not a full grammar, because all we need to know is "was this guarded".
 */
export function supportsGuarded(src) {
  const guarded = new Set();
  for (const m of String(src).matchAll(/@supports\s+([^{]+)\{/gi)) {
    const cond = m[1];
    for (const [name, re] of Object.entries(RISKY_FEATURES)) {
      if (re.test(cond)) guarded.add(name);
    }
    // `@supports (backdrop-filter: blur(1px))` names the property directly
    for (const p of cond.matchAll(/\(\s*([a-z-]+)\s*:/gi)) {
      if (RISKY_FEATURES[p[1].toLowerCase()]) guarded.add(p[1].toLowerCase());
    }
  }
  return guarded;
}

// feas-baseline-gate — a risky feature used with no @supports guard and no fallback declaration.
// BLOCK-feasibility: unlike a taste rule, this is about whether the thing renders at all.
function feasBaselineGate(src) {
  const s = stripComments(src);
  const guarded = supportsGuarded(s);
  const used = Object.entries(RISKY_FEATURES)
    .filter(([, re]) => re.test(s))
    .map(([name]) => name);
  if (!used.length) return ok('no non-baseline features used');
  const unguarded = used.filter((f) => !guarded.has(f));
  return unguarded.length
    ? no(`non-baseline feature(s) used with no @supports guard: ${unguarded.join(', ')} — where unsupported these produce nothing at all, not a degraded look`)
    : ok(`${used.length} non-baseline feature(s), all guarded: ${used.join(', ')}`);
}

// feas-degradation-bottom-rung — H2's escalation ladder. If a variant reaches for an advanced
// technique, SOMETHING must still be there when it is unavailable: a guard, a fallback declaration
// before the risky one, or a plain background beneath a filter.
function feasDegradationBottomRung(src) {
  const s = stripComments(src);
  const used = Object.entries(RISKY_FEATURES).filter(([, re]) => re.test(s)).map(([n]) => n);
  if (!used.length) return ok('nothing to degrade from');
  const guarded = supportsGuarded(s);
  const problems = [];
  for (const f of used) {
    if (guarded.has(f)) continue;
    // A fallback is a plainer declaration of the same property earlier in the same block.
    if (f === 'backdrop-filter' && /background(?:-color)?\s*:\s*(?:#|rgb|hsl)/i.test(s)) continue;
    if (f === 'color-mix' || f === 'oklch') {
      if (/(?:color|background(?:-color)?)\s*:\s*(?:#[0-9a-f]{3,8}|rgba?\()/i.test(s)) continue;
    }
    if (f === 'text-wrap-balance') continue;          // purely cosmetic; absence degrades gracefully
    problems.push(f);
  }
  return problems.length
    ? no(`no bottom rung for: ${problems.join(', ')} — neither an @supports guard nor a plainer fallback declaration`)
    : ok('every advanced technique has a bottom rung');
}

export const DETECTORS = {
  'feas-baseline-gate': { scope: 'variant', fn: feasBaselineGate },
  'feas-degradation-bottom-rung': { scope: 'variant', fn: feasDegradationBottomRung },
  'floor-reduced-motion': { scope: 'variant', fn: floorReducedMotion },
  'adv-motion-duration': { scope: 'variant', fn: advMotionDuration },
  'adv-compositor-only': { scope: 'variant', fn: advCompositorOnly },
  'adv-easing-direction': { scope: 'variant', fn: advEasingDirection },
  'adv-stagger-cap': { scope: 'variant', fn: advStaggerCap },
  'adv-flash-limit': { scope: 'variant', fn: advFlashLimit },
  'adv-zindex-ladder': { scope: 'variant', fn: advZindexLadder },
  'adv-focus-ring-not-shadow-only': { scope: 'variant', fn: advFocusRingNotShadowOnly },
  'adv-icon-delivery-inline-svg': { scope: 'variant', fn: advIconDelivery },
  'adv-deterministic-placeholder': { scope: 'variant', fn: advDeterministicPlaceholder },
  'adv-realistic-content': { scope: 'variant', fn: advRealisticContent },
  'adv-semantic-separate': { scope: 'variant', fn: advSemanticSeparate },
  'adv-reduced-transparency': { scope: 'variant', fn: advReducedTransparency },
  'feas-canvas-a11y-mirror': { scope: 'variant', fn: feasCanvasA11yMirror },
  'adv-no-slop-tells': { scope: 'variant', fn: advNoSlopTells },
  'feas-no-eval': { scope: 'variant', fn: feasNoEval },
  'feas-no-wasm': { scope: 'variant', fn: feasNoWasm },
  'feas-no-network': { scope: 'variant', fn: feasNoNetwork },
  'feas-no-inline-handlers': { scope: 'variant', fn: feasNoInlineHandlers },
  'block-svg-id-collision': { scope: 'set', fn: blockSvgIdCollision },
  'adv-no-font-smoothing': { scope: 'variant', fn: advNoFontSmoothing },
  'adv-action-label-specific': { scope: 'variant', fn: advActionLabel },
  'adv-error-copy-shape': { scope: 'variant', fn: advErrorCopy },
  'adv-no-implementation-vocabulary': { scope: 'variant', fn: advImplementationVocabulary },
  'adv-css-layer-order': { scope: 'variant', fn: advCssArchitecture },
  'adv-inline-style-attr': { scope: 'variant', fn: advInlineStyleAttr },
  'adv-webkit-prefix-pair': { scope: 'variant', fn: advWebkitPrefix },
  'adv-not-default-inter': { scope: 'variant', fn: advNotInter },
  'adv-hover-control-focus-within': { scope: 'variant', fn: advHoverControlFocusWithin },
  'adv-weight-budget': { scope: 'variant', fn: advWeightBudget },
  // A3 batch (Phase-1 quick win)
  'adv-token-layer-direction': { scope: 'variant', fn: advTokenLayerDirection },
  'adv-raw-value-drift': { scope: 'variant', fn: advRawValueDrift },
  'adv-single-icon-set': { scope: 'variant', fn: advSingleIconSet },
  'adv-no-image-distortion': { scope: 'variant', fn: advNoImageDistortion },
};

// The owner's contract lives in constraint_contract_schema, not rules[]. Synthetic ids, tier
// block_owner, never profile-filtered.
export const CONTRACT_DETECTORS = {
  'contract-must-use': { key: 'must_use', scope: 'variant', fn: contractMustUse },
  'contract-animation-vocab': { key: 'animation_vocab', scope: 'variant', fn: contractAnimationVocab },
  'contract-forbidden': { key: 'forbidden', scope: 'variant', fn: contractForbidden },
};
