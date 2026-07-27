// Variant harness — the core of Task 2. ONE command, N labelled variants, ONE page, ONE stable URL.
//
//   node build-variant-set.mjs <variant-set.json>
//
// Emits ONLY IF THE ISOLATION GATE PASSES:
//   <output>.html      one page, N panels side by side, presentation order RANDOMISED (G3 §3.6)
//   <manifest>.json    axis, per-variant resolved tokens, the slot->variant mapping, gate result
//
// If the gate fails: prints why, writes NOTHING, exits 2. The caller regenerates. A set that has not
// been proven to differ on its named axis and match on every other is never shown (G1 §4.3 step 5).
//
// Content (posters, copy, ratings) is built ONCE and shared by every panel — "functionally identical,
// stylistically distinct" (G1 §3.7) is a structural guarantee here, not a hope.

import { readFileSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { extractAccent } from './theme-extract.mjs';
import { runGate, formatGate, RUNG_NAMES } from './isolation-gate.mjs';
import { runCheck, formatCheck, annotationsByVariant } from '../design-check/design-check.mjs';
import { runComputedPass, blockingFindings, formatComputed } from '../design-check/computed-runner.mjs';
import { checkSourcePolicy, formatSource } from '../generation/catalog-source.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const MIME = { '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp' };

function toDataUri(imgPath, width) {
  const buf = execFileSync('convert', [`${imgPath}[0]`, '-strip', '-resize', `${width}x`, '-quality', '82', 'jpg:-'],
    { maxBuffer: 32 * 1024 * 1024 });
  return `data:image/jpeg;base64,${buf.toString('base64')}`;
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
}

// ── shared content INTO a markup panel (U6a) ────────────────────────────────────────────────────
// Found while planning Stage 1: the harness had only SIX template-level placeholders and none were
// per-card, so a markup-mode panel received no shared content at all. Theme-from-content and markup
// mode were therefore incompatible — which is a structural reason the first real round fell back to
// CSS gradients. Token mode never hit this because its shared component is rendered from
// VARIANT_DATA on the client.
//
// The content is CONTROL, not axis: every panel gets the same cards in the same order, which is what
// makes "functionally identical, stylistically distinct" structural rather than hopeful. Text is
// escaped; the image is a data: URI produced upstream and must NOT be escaped.
const CARD_SLOT_RE = /\{\{(IMG|TITLE|META|ACCENT|RATING)_(\d+)\}\}/g;

export function fillCardSlots(markup, cards = []) {
  if (!markup || !cards.length) return markup;
  return markup.replace(CARD_SLOT_RE, (whole, kind, nStr) => {
    const c = cards[Number(nStr) - 1];
    if (!c) return whole;               // leave it — the placeholder guard downstream fails loudly
    switch (kind) {
      case 'IMG':    return c.img ?? whole;
      case 'TITLE':  return escapeHtml(c.title ?? '');
      case 'META':   return escapeHtml(c.meta ?? '');
      case 'ACCENT': return c.accent ?? whole;
      case 'RATING': return c.rating == null ? '' : escapeHtml(String(c.rating));
      default:       return whole;
    }
  });
}

// Static panel render for MARKUP mode — each variant's markup goes into its OWN declarative shadow
// root, so ids / classes / @keyframes / :root custom properties CANNOT leak across panels. Verified
// isolating in the real Artifact sandbox 2026-07-23 (probe artifact 1d77da20). `innerHTML` does NOT
// parse `<template shadowrootmode>` (a deliberate security decision), so these MUST be emitted
// statically at build time and never injected client-side — that is the whole reason this render is
// in Node and not in the template's script. Panel chrome (head + meta) stays OUTSIDE the shadow root:
// it uses the page's own .vs-* styles. KNOWN BOUND: <template> content is inert, so a <script> inside
// a variant will not execute — fine for the style/layout axes this harness compares; a genuinely
// JS-driven variant is out of scope. See docs/plans/2026-07-23-C1-harness-dsd-isolation.md.
export function renderPanelStatic(p) {
  const t = p.tokens || {};
  const bits = [];
  if (p.rubric) bits.push(`<span><b>rubric</b> ${escapeHtml(p.rubric)}</span>`);
  if (p.constraints_honoured) bits.push(`<span><b>constraints</b> ${escapeHtml(p.constraints_honoured)}</span>`);
  for (const k of Object.keys(t)) bits.push(`<span><b>${escapeHtml(k)}</b> ${escapeHtml(t[k])}</span>`);
  const flagsScript = /<script[\s>]/i.test(p.markup || '')
    ? '<span class="vs-warn"><b>note</b> &lt;script&gt; in this variant will not run (declarative shadow DOM is inert)</span>'
    : '';
  return `<section class="vs-panel" aria-label="Option ${escapeHtml(p.slot)}">`
    + `<div class="vs-panel-head"><span class="vs-slot">${escapeHtml(p.slot)}</span>`
    + `<span class="vs-level">${escapeHtml(p.caption || p.label)}</span></div>`
    + '<div class="vs-panel-body"><div class="vs-shadow-host">'
    + `<template shadowrootmode="open"><style>:host{display:block}</style>${p.markup || ''}</template>`
    + '</div></div>'
    + `<div class="vs-meta">${flagsScript}${bits.join('')}</div>`
    + '</section>';
}

// Deterministic shuffle when a seed is given, so a rerun reproduces the same layout for the same round
// but a NEW round reshuffles (G3 §3.6: randomise slot order on every presentation, not just the first).
/**
 * C7 — the colour budget must be STATED, not silently absent. The *honoured* half is enforced in
 * pixels and blocks (P2); this closes the *stated* half: a round config must carry a budget or an
 * explicit, reasoned exception. AC9. Pure + exported so it is testable without a build.
 * @returns {{ok:boolean, budget?:number|object, reason?:string}}
 */
export function validateColourBudget(cfg) {
  const b = cfg?.colorBudget ?? cfg?.colourBudget;
  if (b == null) {
    return { ok: false, reason: 'colorBudget is required — give a positive number of accent surfaces (e.g. 4), or an explicit {mode:"unconstrained", why:"…"}. A budget silently absent is exactly what this rule prevents.' };
  }
  if (typeof b === 'number') {
    return b > 0 ? { ok: true, budget: b } : { ok: false, reason: `colorBudget must be a positive number of surfaces, got ${b}` };
  }
  if (b && typeof b === 'object') {
    if (b.mode === 'unconstrained') {
      return (b.why && String(b.why).trim())
        ? { ok: true, budget: b }
        : { ok: false, reason: 'colorBudget {mode:"unconstrained"} requires a non-empty `why` — an unstated exception is not a stated choice.' };
    }
    if (typeof b.surfaces === 'number' && b.surfaces > 0) return { ok: true, budget: b };
    return { ok: false, reason: `colorBudget object must be {mode:"unconstrained", why} or {surfaces:<n>}, got ${JSON.stringify(b)}` };
  }
  return { ok: false, reason: `colorBudget must be a number or an object, got ${typeof b}` };
}

export function shuffle(arr, seed) {
  const a = [...arr];
  let s = seed == null ? Math.floor(Math.random() * 2 ** 31) : seed;
  const rnd = () => { s = (s * 1103515245 + 12345) & 0x7fffffff; return s / 0x7fffffff; };
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function main() {
  const configPath = process.argv[2];
  if (!configPath) { console.error('usage: node build-variant-set.mjs <variant-set.json>'); process.exit(1); }
  const cfg = JSON.parse(readFileSync(configPath, 'utf8'));

  // C7 — the colour budget must be STATED before any work happens (AC9). Fail closed like the gate.
  const cb = validateColourBudget(cfg);
  if (!cb.ok) {
    console.error(`\ncolour budget: FAIL — ${cb.reason}\nNOTHING WRITTEN.`);
    process.exit(2);
  }
  console.log(`colour budget: ${typeof cb.budget === 'number' ? cb.budget + ' accent surface(s)' : (cb.budget.mode === 'unconstrained' ? 'UNCONSTRAINED — ' + cb.budget.why : JSON.stringify(cb.budget))}`);

  const axis = cfg.axis ?? {};
  const variants = cfg.variants ?? [];
  // T6: `buildRoundInput` works out which axes are INHERITED from prior art (same archetype, locked
  // on another target) and used to hand them back only for a human to copy into the config by hand —
  // so an inherited value was a note, not a frozen control. Merged here, with the config winning on a
  // genuine conflict so a deliberate override is still possible.
  const inherited = cfg.inheritedControls ?? {};
  const control = { ...Object.fromEntries(Object.entries(inherited).map(([k, v]) => [k, v?.value ?? v])), ...(cfg.control ?? {}) };
  if (Object.keys(inherited).length) {
    console.log(`inherited controls: ${Object.keys(inherited).join(', ')} (from prior art)`);
  }
  const assetRoot = cfg.assetRoot ?? '';

  // ── shared content: built ONCE, identical in every panel (this IS the control set) ──────────
  const cards = [];
  const tokens = [];
  for (const c of cfg.cards ?? []) {
    const imgPath = path.isAbsolute(c.image) ? c.image : path.join(assetRoot, c.image);
    const ext = path.extname(imgPath).toLowerCase();
    if (!MIME[ext]) throw new Error(`unsupported image type: ${imgPath}`);
    const accent = extractAccent(imgPath);
    cards.push({
      title: c.title, meta: c.meta ?? c.year ?? '', rating: c.rating ?? null,
      owned: !!c.owned, img: toDataUri(imgPath, cfg.posterWidth ?? 340), accent: accent.hex,
    });
    tokens.push({ title: c.title, accent: accent.hex, raw: accent.raw, fallback: accent.fallback });
  }

  // ── resolved per-variant token sets: control + this variant's axis values ────────────────────
  const resolved = {};
  const renderedMarkup = {};
  for (const v of variants) {
    resolved[v.label] = { ...control, ...(v.axis_values ?? {}) };
    if (v.panelTemplate) {
      const p = path.isAbsolute(v.panelTemplate) ? v.panelTemplate : path.join(path.dirname(configPath), v.panelTemplate);
      // Fill the shared content into the panel BEFORE the gate, so every check reads the artifact that
      // will actually render rather than a template. Same principle as the axis-realised check.
      renderedMarkup[v.label] = fillCardSlots(readFileSync(p, 'utf8'), cards);
    }
  }

  // ── THE GATE — before anything is emitted ───────────────────────────────────────────────────
  const gate = runGate(cfg, Object.keys(renderedMarkup).length ? renderedMarkup : null);
  console.log(`axis: ${axis.name ?? '(unnamed)'} — ${axis.parameter ?? '(no parameter stated)'}`);
  console.log(`rung: ${axis.rung ?? '?'} (${RUNG_NAMES[axis.rung] ?? '?'})   variants: ${variants.length}`);
  console.log(formatGate(gate));
  if (!gate.pass) {
    console.error('\nNOTHING WRITTEN. Fix the set and rerun — do not present this to the owner.');
    process.exit(2);
  }

  // ── THE CONSTRAINT CHECKER (Phase 3a, source-method rules) ─────────────────────────────────
  // Runs after the gate, still before anything is emitted. Same fail-closed principle.
  // Only meaningful in MARKUP mode: in token mode every panel renders the same shared component and
  // differs only by inline custom properties, so there is no per-variant source to check. Saying so
  // out loud beats printing a pass that checked nothing.
  let checkAnnotations = {};
  if (Object.keys(renderedMarkup).length) {
    const check = runCheck({
      variants: renderedMarkup,
      contract: cfg.contract ?? {},
      profile: cfg.audienceProfile ?? 'P1',
      floorOverrides: cfg.floorOverrides ?? {},
    });
    console.log(formatCheck(check));
    checkAnnotations = annotationsByVariant(check, Object.keys(renderedMarkup));
    if (!check.pass) {
      console.error('\nNOTHING WRITTEN. A blocked set is never presented (doctrine §5, fail closed).');
      process.exit(2);
    }
  } else {
    console.log('constraint check: SKIPPED — token mode has no per-variant source (see design-check.mjs header)');
  }

  // ── C2: source policy — was the catalog even CONSIDERED? ───────────────────────────────────
  // 179 components exist and the method never looked at them. library-first (the default) allows a
  // bespoke variant freely, but requires it to say what the catalog could not do.
  {
    const sp = checkSourcePolicy(variants, {
      policy: cfg.contract?.source_policy ?? 'library-first',
      candidates: cfg.catalogCandidates ?? [],
    });
    console.log(formatSource(sp, cfg.catalogCandidates ?? []));
    if (!sp.pass) {
      console.error('\nNOTHING WRITTEN. A set that never considered the catalog is not a library-first set.');
      process.exit(2);
    }
  }

  // ── presentation: randomise slot order, keep the mapping in the manifest ────────────────────
  const order = shuffle(variants.map((v) => v.label), cfg.shuffleSeed);
  const SLOTS = ['A', 'B', 'C', 'D', 'E'];
  const panels = order.map((label, i) => {
    const v = variants.find((x) => x.label === label);
    return {
      slot: SLOTS[i],
      label,                                  // non-evaluative axis-level descriptor (gate-checked)
      caption: v.caption ?? '',
      tokens: resolved[label],
      markup: renderedMarkup[label] ?? null,  // null = render the shared component with these tokens
      constraints_honoured: v.constraints_honoured ?? checkAnnotations[label] ?? null, // filled by the checker
      rubric: v.rubric ?? null,                             // filled by the rubric pass (build item 2)
    };
  });

  // ── MARKUP mode → pre-render each panel as an isolated declarative shadow root, statically. ──────
  // Token mode is structurally immune (it varies only inline custom properties on one shared
  // component), so it stays on the client-side renderer below and PANELS_HTML is empty.
  const markupMode = Object.keys(renderedMarkup).length > 0;
  const panelsHtml = markupMode ? panels.map(renderPanelStatic).join('') : '';

  const data = {
    title: cfg.title ?? 'Variant set',
    subtitle: cfg.subtitle ?? '',
    axis: { name: axis.name, parameter: axis.parameter, rung: axis.rung, rungName: RUNG_NAMES[axis.rung] },
    colorBudget: cfg.colorBudget ?? null,
    // In markup mode the markup is already in PANELS_HTML; strip it from the JSON so it does not ship
    // twice (weight budget — adv-weight-budget). Token mode keeps its panels intact for the client render.
    panels: markupMode ? panels.map((p) => ({ ...p, markup: null })) : panels,
    cards,
  };

  // `template` is optional (defaults to the shell in this dir). Resolve the NAME first — calling
  // path.isAbsolute(undefined) throws, which crashed any config that omitted `template`.
  const tplName = cfg.template ?? 'template.variant-set.html';
  const templatePath = path.isAbsolute(tplName) ? tplName : path.join(HERE, tplName);
  let html = readFileSync(templatePath, 'utf8')
    .replaceAll('{{TITLE}}', escapeHtml(data.title))
    .replaceAll('{{SUBTITLE}}', escapeHtml(data.subtitle))
    .replaceAll('{{AXIS_NAME}}', escapeHtml(axis.name ?? ''))
    .replaceAll('{{AXIS_PARAM}}', escapeHtml(axis.parameter ?? ''))
    .replaceAll('{{PANELS_HTML}}', () => panelsHtml)
    .replaceAll('{{VARIANT_DATA}}', () => JSON.stringify(data).replace(/</g, '\\u003c'));

  const leftover = html.match(/\{\{[A-Z0-9_]+\}\}/g);
  if (leftover) throw new Error(`unfilled placeholders left in preview: ${[...new Set(leftover)].join(', ')}`);

  const rel = (p, d) => (path.isAbsolute(p ?? d) ? (p ?? d) : path.join(path.dirname(configPath), p ?? d));
  const outHtml = rel(cfg.output, 'variant-set.html');
  const outManifest = rel(cfg.manifest, 'variant-set.manifest.json');

  writeFileSync(outHtml, html);
  writeFileSync(outManifest, JSON.stringify({
    generated_at: new Date().toISOString(),
    axis: data.axis,
    control,
    variants: variants.map((v) => ({ label: v.label, axis_values: v.axis_values, resolved: resolved[v.label] })),
    slot_mapping: Object.fromEntries(panels.map((p) => [p.slot, p.label])),
    gate: { pass: gate.pass, checks: gate.checks },
    colour_budget: cb.budget, // C7: the stated choice, carried into the round record so it is auditable
    accents: tokens,
  }, null, 2));

  const kb = Math.round(Buffer.byteLength(html) / 1024);
  console.log(`\npreview:  ${outHtml} (${kb} KB, ${panels.length} panels, ${cards.length} shared cards)`);
  console.log(`manifest: ${outManifest}`);
  console.log(`slots:    ${panels.map((p) => `${p.slot}=${p.label}`).join('  ')}`);
  // ── THE COMPUTED PASS (T2) — inline, after emit, because it needs the rendered page ────────────
  // It was a separate manual command until 2026-07-27, and a manual step is a step that gets skipped.
  // It cannot be silently omitted: with no Chromium it reports UNAVAILABLE, never a pass.
  const computed = runComputedPass(outHtml, { cwd: cfg.computed?.cwd ?? null, profile: cfg.audienceProfile ?? 'P1' });
  console.log(formatComputed(computed, cfg.audienceProfile ?? 'P1'));
  if (computed.state === 'ran') {
    const blocking = blockingFindings(computed.findings, { profile: cfg.audienceProfile ?? 'P1' });
    if (blocking.length) {
      console.error('\nThe page was written but MUST NOT be presented — a computed rule blocks it. Fix and rerun.');
      process.exit(2);
    }
  }

  // The artifact path was RETIRED 2026-07-27 (owner decision): a round is published into the
  // Ottomate app, where the picks are made against the ledger on the same screen.
  console.log('\nPublish with: node ../generation/publish-round.mjs --manifest <round.json> \\');
  console.log('                --previews-dir /mnt/storage/ottomate/assets/previews \\');
  console.log('                --api http://127.0.0.1:8110 --token-file /opt/homeserver/ottomate/.token');
}

// Run as a CLI only. Importing the module (e.g. from the test) must NOT execute main().
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main();
