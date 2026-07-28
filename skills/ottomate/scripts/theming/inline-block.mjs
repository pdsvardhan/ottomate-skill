// inline-block.mjs — WS1.1. Produce SELF-CONTAINED variant HTML: replace every <link rel="stylesheet">
// with an inline <style> of the file's contents. Self-contained HTML is what renders correctly inside a
// `sandbox="allow-scripts"` iframe (no allow-same-origin) — the app's proven preview pattern (iter-77),
// and what the live grid serves. One page, no external CSS fetch, themes itself.
//
// Usage: node inline-block.mjs blocks/spending-variant.html > out.html

import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export function inlineHtml(htmlPath) {
  const dir = path.dirname(htmlPath);
  let html = readFileSync(htmlPath, 'utf8');
  html = html.replace(/<link\s+rel=["']stylesheet["']\s+href=["']([^"']+)["']\s*\/?>/g, (_m, href) => {
    const css = readFileSync(path.resolve(dir, href), 'utf8');
    return `<style>/* inlined from ${href} */\n${css}\n</style>`;
  });
  return html;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const p = process.argv[2];
  if (!p) { console.error('usage: node inline-block.mjs <html> > out.html'); process.exit(1); }
  process.stdout.write(inlineHtml(p));
}
