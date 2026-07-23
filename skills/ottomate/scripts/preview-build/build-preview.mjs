// One-command preview build (Task 2 §4) — fetch → extract → inject → emit a self-contained page.
// The real run's #1 friction was doing this in ~5 manual round-trips per mockup; this is ONE step.
//
//   node build-preview.mjs <config.json>
//
// Emits: <output>.html (body-content-only — publish directly via the Artifact tool to a STABLE URL)
//        <tokensOut>.json (the extracted per-card accents — feed into ui_master_plans.design_ledger)
// Fails loudly if ANY {{placeholder}} is left unfilled (a fake/empty preview misleads — §5).

import { readFileSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { extractAccent } from './theme-extract.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));

const MIME = { '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp' };

// Downscale + strip a poster and return a data: URI (keeps the self-contained artifact small + fast).
function toDataUri(imgPath, width) {
  const buf = execFileSync(
    'convert',
    [`${imgPath}[0]`, '-strip', '-resize', `${width}x`, '-quality', '82', 'jpg:-'],
    { maxBuffer: 32 * 1024 * 1024 },
  );
  return `data:image/jpeg;base64,${buf.toString('base64')}`;
}

function main() {
  const configPath = process.argv[2];
  if (!configPath) { console.error('usage: node build-preview.mjs <config.json>'); process.exit(1); }
  const cfg = JSON.parse(readFileSync(configPath, 'utf8'));
  const assetRoot = cfg.assetRoot ?? '';
  const posterWidth = cfg.posterWidth ?? 360;

  const cards = [];
  const tokens = [];
  for (const c of cfg.cards ?? []) {
    const imgPath = path.isAbsolute(c.image) ? c.image : path.join(assetRoot, c.image);
    const ext = path.extname(imgPath).toLowerCase();
    if (!MIME[ext]) throw new Error(`unsupported image type: ${imgPath}`);
    const accent = extractAccent(imgPath);
    const img = toDataUri(imgPath, posterWidth);
    cards.push({ title: c.title, meta: c.meta ?? c.year ?? '', rating: c.rating ?? null, owned: !!c.owned, img, accent: accent.hex });
    tokens.push({ title: c.title, accent: accent.hex, raw: accent.raw, fallback: accent.fallback });
  }

  const data = {
    title: cfg.title ?? 'Preview',
    subtitle: cfg.subtitle ?? '',
    colorBudget: cfg.colorBudget ?? null,
    cards,
  };

  const templatePath = path.isAbsolute(cfg.template) ? cfg.template : path.join(HERE, cfg.template ?? 'template.card-wall.html');
  let html = readFileSync(templatePath, 'utf8');
  // replaceAll throughout: a literal token appearing twice (e.g. also in a template comment) would
  // otherwise swallow the substitution and leave the real one unfilled.
  html = html
    .replaceAll('{{TITLE}}', escapeHtml(data.title))
    .replaceAll('{{SUBTITLE}}', escapeHtml(data.subtitle))
    .replaceAll('{{PREVIEW_DATA}}', () => JSON.stringify(data).replace(/</g, '\\u003c'));

  // §5 guardrail: no placeholder may survive into the emitted preview.
  const leftover = html.match(/\{\{[A-Z0-9_]+\}\}/g);
  if (leftover) throw new Error(`unfilled placeholders left in preview: ${[...new Set(leftover)].join(', ')}`);

  const outHtml = path.isAbsolute(cfg.output) ? cfg.output : path.join(path.dirname(configPath), cfg.output ?? 'preview.html');
  const outTokens = path.isAbsolute(cfg.tokensOut) ? cfg.tokensOut : path.join(path.dirname(configPath), cfg.tokensOut ?? 'tokens.json');
  writeFileSync(outHtml, html);
  writeFileSync(outTokens, JSON.stringify({ generated_at: new Date().toISOString(), cards: tokens }, null, 2));

  const kb = Math.round(Buffer.byteLength(html) / 1024);
  console.log(`preview: ${outHtml} (${kb} KB, ${cards.length} cards)`);
  console.log(`tokens:  ${outTokens}`);
  for (const t of tokens) console.log(`  ${t.accent}  ${t.title}${t.fallback ? '  [' + t.fallback + ']' : ''}`);
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
}

main();
