// Feature-verify harness — L4 MECHANICAL-VISUAL layer (Task 3, Track B), SELF-CONTAINED (owner ruling
// 2026-07-28: the verifier ships its OWN checks, not Task-2's). Deterministic, no baseline, no model —
// computed from the DOM + a screenshot + axe-core. Catches the owner's own logged complaints:
// "cut off at proj…", "tags not visible", "not responsive", "low contrast". VLMs are ~58% at geometry
// (T1) so geometry is done in JS, never model-judged.

import type { Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import type { StateCheck } from './system-state';

/** No horizontal overflow: the document must not scroll sideways, and no element may extend past the
 *  viewport right edge (WCAG F104 reflow). The "not responsive / empty space" complaint. Reliable. */
export async function checkNoHorizontalOverflow(page: Page): Promise<StateCheck> {
  const r = await page.evaluate(() => {
    const de = document.documentElement;
    const vw = de.clientWidth;
    const docOverflow = de.scrollWidth - vw;
    const offenders: string[] = [];
    if (docOverflow > 1) {
      for (const el of Array.from(document.querySelectorAll('*')) as HTMLElement[]) {
        const b = el.getBoundingClientRect();
        if (b.width > 0 && b.right > vw + 1) {
          const cls = String(el.className || '').trim().split(/\s+/)[0];
          offenders.push(`${el.tagName.toLowerCase()}${cls ? '.' + cls : ''} (right ${Math.round(b.right)} > ${vw})`);
          if (offenders.length >= 6) break;
        }
      }
    }
    return { vw, docScrollWidth: de.scrollWidth, docOverflow, offenders };
  });
  return r.docOverflow > 1
    ? { ok: false, detail: `horizontal overflow ${r.docOverflow}px — ${r.offenders.join('; ') || '(no single offender isolated)'}`, observed: r }
    : { ok: true, detail: `no horizontal overflow (scrollWidth ${r.docScrollWidth} ≤ ${r.vw})`, observed: r };
}

/** Hard-clipped text: content overflowing a hidden box WITHOUT an ellipsis (i.e. text silently lost —
 *  the "cut off at proj…" bug). Intentional `text-overflow:ellipsis` truncations are counted but do NOT
 *  fail (they are a designed affordance), so this does not false-positive on deliberate truncation. */
export async function checkNoHardClippedText(page: Page): Promise<StateCheck> {
  const r = await page.evaluate(() => {
    const hardClipped: string[] = [];
    let ellipsisCount = 0;
    for (const el of Array.from(document.querySelectorAll('*')) as HTMLElement[]) {
      if (el.scrollWidth - el.clientWidth <= 1) continue; // horizontal overflow only
      const cs = getComputedStyle(el);
      const hidden = cs.overflowX === 'hidden' || cs.overflow === 'hidden';
      if (!hidden) continue;
      const t = (el.textContent || '').trim();
      if (!t) continue;
      if (cs.textOverflow === 'ellipsis') { ellipsisCount++; continue; }
      if (hardClipped.length < 8) hardClipped.push(`${el.tagName.toLowerCase()}: "${t.slice(0, 30)}${t.length > 30 ? '…' : ''}"`);
    }
    return { hardClipped, ellipsisCount };
  });
  return r.hardClipped.length === 0
    ? { ok: true, detail: `no hard-clipped text (${r.ellipsisCount} intentional ellipsis truncations ignored)`, observed: r }
    : { ok: false, detail: `${r.hardClipped.length} hard-clipped element(s): ${r.hardClipped.slice(0, 4).join(' · ')}`, observed: r };
}

/** P3-A cross-check: re-measure the SPECIFIC elements an AI-judge cited as "overlapping" and report the
 *  real pairwise intersections. Targeted (only the cited selectors) so it does not false-positive on the
 *  many legitimately-stacked elements a general collision scan would flag. The judge FLAGS an overlap;
 *  this is the DOM deciding — an overlap claim with `overlaps: []` is a hallucination and gets discarded
 *  by `crossCheckSpatialClaims`. */
export async function measureRegionsOverlap(page: Page, selectors: string[]): Promise<{ overlaps: [string, string, number][]; measured: Record<string, { x: number; y: number; w: number; h: number } | null> }> {
  return page.evaluate((sels: string[]) => {
    const box = (s: string) => {
      const el = document.querySelector(s) as HTMLElement | null;
      if (!el) return null;
      const r = el.getBoundingClientRect();
      return r.width > 0 && r.height > 0 ? { x: r.x, y: r.y, w: r.width, h: r.height, right: r.right, bottom: r.bottom } : null;
    };
    const measured: Record<string, { x: number; y: number; w: number; h: number } | null> = {};
    const boxes: Record<string, ReturnType<typeof box>> = {};
    for (const s of sels) { const b = box(s); boxes[s] = b; measured[s] = b ? { x: Math.round(b.x), y: Math.round(b.y), w: Math.round(b.w), h: Math.round(b.h) } : null; }
    const overlaps: [string, string, number][] = [];
    for (let i = 0; i < sels.length; i++) for (let j = i + 1; j < sels.length; j++) {
      const a = boxes[sels[i]], b = boxes[sels[j]];
      if (!a || !b) continue;
      const ox = Math.max(0, Math.min(a.right, b.right) - Math.max(a.x, b.x));
      const oy = Math.max(0, Math.min(a.bottom, b.bottom) - Math.max(a.y, b.y));
      const area = ox * oy;
      if (area > 1) overlaps.push([sels[i], sels[j], Math.round(area)]);
    }
    return { overlaps, measured };
  }, selectors);
}

/** axe-core contrast (self-hosted, deterministic) — the "tags not visible / low contrast" complaint. */
export async function checkAxeContrast(page: Page): Promise<StateCheck> {
  const results = await new AxeBuilder({ page }).withRules(['color-contrast']).analyze();
  const v = results.violations;
  if (v.length === 0) return { ok: true, detail: 'axe: no color-contrast violations', observed: { violations: 0 } };
  const nodes = v.reduce((n, x) => n + x.nodes.length, 0);
  return {
    ok: false,
    detail: `axe: ${nodes} color-contrast violation node(s)`,
    observed: { violations: v.map((x) => ({ id: x.id, impact: x.impact, count: x.nodes.length, sample: x.nodes[0]?.target, help: x.nodes[0]?.any?.[0]?.message?.slice(0, 120) })) },
  };
}
