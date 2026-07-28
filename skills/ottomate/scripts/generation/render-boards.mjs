// render-boards.mjs — the rung-A board renderer (C4, 2026-07-28). Boards ARE a variant set with a
// different card: instead of a component in N treatments, it shows N whole-vibe directions side by
// side. Checker-gated (a set that fails checkBoardSet never renders) and self-contained / CSP-safe
// (inline styles, escaped text, no external refs).

import { checkBoardSet } from './board-check.mjs';

const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

function renderBoard(b, i) {
  const swatches = b.palette.map((h) => `<span class="bsw" style="background:${esc(h)}" title="${esc(h)}"></span>`).join('');
  const mood = b.mood.map((m) => `<span class="bchip">${esc(m)}</span>`).join('');
  return `  <article class="board" data-direction="${esc(b.direction)}">
    <div class="bnum">${i + 1}</div>
    <h3 class="bdir">${esc(b.direction)}</h3>
    <div class="bpal">${swatches}</div>
    <p class="btype"><b>Display</b> ${esc(b.type_voice.display)} &nbsp;·&nbsp; <b>Body</b> ${esc(b.type_voice.body)}</p>
    <div class="bmood">${mood}</div>
    <p class="bhero">${esc(b.hero_sample)}</p>
  </article>`;
}

const STYLE = `<style>
  .boards{display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:20px;padding:20px;font-family:system-ui,sans-serif}
  .board{border:1px solid #8883;border-radius:14px;padding:18px;position:relative;background:Canvas;color:CanvasText}
  .bnum{position:absolute;top:12px;right:14px;opacity:.4;font-size:12px}
  .bdir{margin:0 0 12px;font-size:18px;text-transform:capitalize}
  .bpal{display:flex;gap:6px;margin-bottom:12px}
  .bsw{width:34px;height:34px;border-radius:8px;border:1px solid #0002}
  .btype{margin:0 0 10px;font-size:13px;opacity:.85}
  .bmood{display:flex;flex-wrap:wrap;gap:6px;margin-bottom:12px}
  .bchip{font-size:12px;padding:3px 9px;border:1px solid #8884;border-radius:999px}
  .bhero{margin:0;font-size:13px;opacity:.75;font-style:italic}
</style>`;

/**
 * Render a rung-A board set to a self-contained HTML fragment. Refuses (throws) a set the checker
 * rejects — a malformed or non-distinct set must never be presented.
 * @returns {string} HTML
 */
export function renderBoardSet(boards, opts = {}) {
  const check = checkBoardSet(boards, opts.check);
  if (!check.ok) throw new Error('board set refused — not renderable:\n  - ' + check.problems.join('\n  - '));
  return `<!-- rung-A direction boards — generated, do not edit -->\n${STYLE}\n<section class="boards">\n${boards.map(renderBoard).join('\n')}\n</section>\n`;
}
