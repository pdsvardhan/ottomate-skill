// harness/project-oracles.ts — the seam between the shared feature-verify runner and a project's
// held-out oracles (ottomate to-do #717, 2026-09-07).
//
// Before this, run-matrix.feature-verify.spec.ts was one 17k-line file: the generic runner plus every
// screenroom oracle inline. mapsofbharat ran screenroom's file; every screenroom edit forced a manual
// re-sync of the shared copy; adding a third project meant editing a 17k-line file, so nobody did.
//
// Now the runner is generic and loads a project's oracle module at run time:
//   <repo_root>/tests/e2e/feature-verify/oracles/index.ts
// The module's default export is a FACTORY: (rt: Runtime) => ProjectOracles. It receives the shared
// config + Matrix, and setters for the API context and the loaded matrix (created later in beforeAll),
// so the moved code keeps its original `let api` / `let m` semantics unchanged. The registry stays
// HELD OUT: the matrix references oracles by NAME only and can never inject assertion logic.
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import type { APIRequestContext, Page, expect as PlaywrightExpect } from '@playwright/test';
import type { FeatureVerifyConfig, Matrix } from './index';
import { ActionLog } from './action-log.mjs';

/** What an oracle returns. Byte-identical to the type the monolith declared. */
export type Check = { ok: boolean; detail: string; observed?: unknown; action_log?: unknown };
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type OracleFn = (page: Page, api: APIRequestContext, params: any) => Promise<Check>;
export type OracleRegistry = Record<string, OracleFn>;

/** What the runner hands a project module. `harness` lets a module without its own harness copy
 *  (mapsofbharat) use shared utilities without importing them by path. */
export interface Runtime {
  cfg: FeatureVerifyConfig;
  matrix: Matrix;
  harness: { ActionLog: typeof ActionLog; expect: typeof PlaywrightExpect };
}

/** What a project module's factory returns. Everything but REGISTRY is optional. */
export interface ProjectOracles {
  REGISTRY: OracleRegistry;
  /** Extra HTTP headers for the owner API context (screenroom: the Authentik identity headers). */
  ownerHeaders?: Record<string, string>;
  /** Called once the API context exists / the matrix is loaded — the module's own `api` / `m`. */
  setApi?: (api: APIRequestContext) => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  setMatrix?: (m: any) => void;
  /** Runs after the API context exists, before the matrix loads (screenroom: prove we are the owner). */
  beforeAll?: (api: APIRequestContext) => Promise<void>;
  /** Start-of-run reclaim sweeps keyed by name; the runner calls the one its matrix declares. */
  sweeps?: Record<string, (api: APIRequestContext) => Promise<string[]>>;
}

const HERE = path.dirname(fileURLToPath(import.meta.url));

/** repo_root for a slug from the manifest beside the harness — the fallback when FV_PROJECT_ROOT is unset. */
function manifestRoot(slug: string): string | null {
  const manifest = path.join(HERE, '..', 'feature-verify-apps.json');
  if (!existsSync(manifest)) return null;
  try {
    const apps = (JSON.parse(readFileSync(manifest, 'utf8')).apps ?? []) as Array<{ slug: string; repo_root?: string }>;
    return apps.find((a) => a.slug === slug)?.repo_root ?? null;
  } catch { return null; }
}

export function projectOracleModulePath(slug: string): string | null {
  const root = process.env.FV_PROJECT_ROOT || manifestRoot(slug);
  return root ? path.join(root, 'tests', 'e2e', 'feature-verify', 'oracles', 'index.ts') : null;
}

/**
 * Load a project's oracle module and run its factory. A project with no module gets an empty
 * registry — every case then records `skipped: no registered oracle`, which is visible, not silent.
 * A module that exists but is malformed is a hard error: a broken registry must never look like
 * "nothing to verify".
 */
export async function loadProjectOracles(rt: Runtime): Promise<ProjectOracles> {
  const file = projectOracleModulePath(rt.cfg.projectSlug);
  if (!file || !existsSync(file)) {
    console.warn(`[fv] no project oracle module for '${rt.cfg.projectSlug}' (${file ?? 'no repo root known'}) — only built-in oracles are available`);
    return { REGISTRY: {} };
  }
  const mod = await import(pathToFileURL(file).href);
  const make = mod.default;
  if (typeof make !== 'function') throw new Error(`[fv] ${file}: default export must be a factory (rt) => ProjectOracles`);
  const out = make(rt) as ProjectOracles;
  if (!out || typeof out !== 'object' || !out.REGISTRY || typeof out.REGISTRY !== 'object') {
    throw new Error(`[fv] ${file}: factory returned no REGISTRY`);
  }
  console.log(`[fv] loaded ${Object.keys(out.REGISTRY).length} project oracle(s) from ${file}`);
  return out;
}
