// Feature-verify harness — L1 IMPLICIT-ORACLE layer (Task 3, Track B). Spec-free "nothing is
// obviously broken" checks over a POPULATION, not a single happy path: no 4xx/5xx, JSON well-formed,
// non-empty, no console/page errors. Catches the "one link/item in N is broken" class — the media
// "/youtube one link → 400 downloads" and "one download link 404s" bugs a happy path never sees.

import type { APIRequestContext, Page } from '@playwright/test';
import type { StateCheck } from './system-state';

/** GET every url; a single non-2xx / non-JSON / predicate-failure fails the whole population,
 *  naming the offenders. This is the implicit oracle: a 4xx/5xx is universally wrong, no spec needed. */
export async function assertPopulationOk<T = unknown>(
  request: APIRequestContext,
  urls: string[],
  predicate?: (json: T, url: string) => StateCheck,
): Promise<StateCheck> {
  const failures: string[] = [];
  for (const url of urls) {
    const res = await request.get(url);
    if (!res.ok()) { failures.push(`${url} → HTTP ${res.status()}`); continue; }
    let json: T;
    try { json = (await res.json()) as T; } catch { failures.push(`${url} → non-JSON body`); continue; }
    if (predicate) { const p = predicate(json, url); if (!p.ok) failures.push(`${url}: ${p.detail}`); }
  }
  return failures.length === 0
    ? { ok: true, detail: `all ${urls.length} endpoint(s) 200 + well-formed`, observed: { checked: urls.length } }
    : { ok: false, detail: `${failures.length}/${urls.length} failed — ${failures.slice(0, 6).join(' · ')}`, observed: { failures, checked: urls.length } };
}

/** Attach console.error + pageerror collectors to a page; returns the growing list to assert on. */
export function collectPageErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));
  page.on('console', (m) => { if (m.type() === 'error') errors.push(`console.error: ${m.text()}`); });
  return errors;
}
