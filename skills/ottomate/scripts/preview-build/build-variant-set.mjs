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
import { fileURLToPath } from 'node:url';
import { extractAccent } from './theme-extract.mjs';
import { runGate, formatGate, RUNG_NAMES } from './isolation-gate.mjs';
import { runCheck, formatCheck, annotationsByVariant } from '../design-check/design-check.mjs';

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

// Deterministic shuffle when a seed is given, so a rerun reproduces the same layout for the same round
// but a NEW round reshuffles (G3 §3.6: randomise slot order on every presentation, not just the first).
function shuffle(arr, seed) {
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

  const axis = cfg.axis ?? {};
  const variants = cfg.variants ?? [];
  const control = cfg.control ?? {};
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
      renderedMarkup[v.label] = readFileSync(p, 'utf8');
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

  const data = {
    title: cfg.title ?? 'Variant set',
    subtitle: cfg.subtitle ?? '',
    axis: { name: axis.name, parameter: axis.parameter, rung: axis.rung, rungName: RUNG_NAMES[axis.rung] },
    colorBudget: cfg.colorBudget ?? null,
    panels,
    cards,
  };

  const templatePath = path.isAbsolute(cfg.template) ? cfg.template
    : path.join(HERE, cfg.template ?? 'template.variant-set.html');
  let html = readFileSync(templatePath, 'utf8')
    .replaceAll('{{TITLE}}', escapeHtml(data.title))
    .replaceAll('{{SUBTITLE}}', escapeHtml(data.subtitle))
    .replaceAll('{{AXIS_NAME}}', escapeHtml(axis.name ?? ''))
    .replaceAll('{{AXIS_PARAM}}', escapeHtml(axis.parameter ?? ''))
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
    accents: tokens,
  }, null, 2));

  const kb = Math.round(Buffer.byteLength(html) / 1024);
  console.log(`\npreview:  ${outHtml} (${kb} KB, ${panels.length} panels, ${cards.length} shared cards)`);
  console.log(`manifest: ${outManifest}`);
  console.log(`slots:    ${panels.map((p) => `${p.slot}=${p.label}`).join('  ')}`);
  console.log('\nPublish with the Artifact tool using the SAME file_path every round (stable URL).');
}

main();
