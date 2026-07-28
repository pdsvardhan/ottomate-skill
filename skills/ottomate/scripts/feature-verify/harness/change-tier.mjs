// P3-C1: the CHANGE-TIER spine — verification scales to the change (owner insight). The tier is
// inferred from the *kinds* of impacted files (max-wins), with an owner override. It selects which
// deterministic layers run AND whether the P3-A AI-judge fires. Pure + fail-closed: an unknown /
// empty diff resolves to T3 (verify the MOST, never the least). See docs/plans/2026-07-28-task3-P3C-*.

// Per-file tier by path shape, checked most-specific-first. A file is:
//   T3 — a page / route / layout / app-shell (a whole view or the frame around it, or a redesign)
//   T2 — a component (a reusable UI unit)
//   T1 — a style / token change (colour/spacing on existing markup)
//   T0 — backend / api / lib / config / copy (no rendered surface of its own)
const PAGE = [
  /(^|\/)app\/(.*\/)?(page|route|layout|template|default|loading|error|not-found)\.[tj]sx?$/,
  /(^|\/)pages\/.*\.[tj]sx?$/,                      // Next pages-router (incl. _app/_document = the shell)
  /(^|\/)src\/routes\/.*\+(page|layout|server|error)\.(svelte|[tj]s)$/, // SvelteKit
  /(^|\/)src\/pages\/.*\.(astro|vue|svelte|[tj]sx?)$/,                   // Astro / Nuxt pages
  /\.html?$/,
];
const COMPONENT = [
  /(^|\/)components?\/.*\.[tj]sx?$/,   // anything under components/ (incl. its .ts logic)
  /\.(vue|svelte|astro)$/,            // a single-file component (routes already caught above)
  /\.[tj]sx$/,                        // any JSX/TSX not caught as a page → a component
];
const STYLE = [
  /\.(css|scss|sass|less|styl|pcss)$/,
  /(^|\/)(tokens|theme|design-tokens|colors?|palette)\.(css|scss|less|[tj]s|json)$/,
];

const RANK = { T0: 0, T1: 1, T2: 2, T3: 3 };

/** One file → its tier. Order encodes precedence (page > component > style > backend/copy). */
export function classifyFile(path) {
  const p = String(path).replace(/\\/g, '/');
  if (PAGE.some((r) => r.test(p))) return 'T3';
  if (COMPONENT.some((r) => r.test(p))) return 'T2';
  if (STYLE.some((r) => r.test(p))) return 'T1';
  return 'T0';
}

/**
 * Infer the change tier from a set of impacted (repo-relative) files.
 * @param {string[]} files
 * @param {{override?: 'T0'|'T1'|'T2'|'T3'}} [opts]
 * @returns {{tier:string, reason:string, perFile:Record<string,string>, unknown:boolean, override:boolean}}
 */
export function inferTier(files, opts = {}) {
  const override = opts.override;
  if (override && RANK[override] !== undefined) {
    return { tier: override, reason: `owner override → ${override}`, perFile: {}, unknown: false, override: true };
  }
  const list = (files ?? []).map(String).filter(Boolean);
  if (list.length === 0) {
    // Fail-closed: we could not observe the change scope → verify the most, not the least.
    return { tier: 'T3', reason: 'unknown change scope (no files) — fail-closed to T3', perFile: {}, unknown: true, override: false };
  }
  const perFile = {};
  let top = 'T0';
  for (const f of list) {
    const t = classifyFile(f);
    perFile[f] = t;
    if (RANK[t] > RANK[top]) top = t;
  }
  const driver = Object.entries(perFile).find(([, t]) => t === top)?.[0];
  return { tier: top, reason: `max-wins → ${top} (driven by ${driver})`, perFile, unknown: false, override: false };
}

/**
 * The layer plan for a tier: which deterministic layers run + how the P3-A judge fires.
 * Layer names match harness/matrix.mjs LAYERS. The judge is advisory-only regardless.
 */
export function layersForTier(tier) {
  switch (tier) {
    case 'T0': return { deterministic: ['implicit', 'system-state'], judge: 'none' };
    case 'T1': return { deterministic: ['implicit', 'system-state', 'visual'], judge: 'none' };
    case 'T2': return { deterministic: ['implicit', 'system-state', 'visual', 'metamorphic'], judge: 'glance' };
    case 'T3': return { deterministic: ['implicit', 'system-state', 'visual', 'metamorphic'], judge: 'full' };
    default: throw new Error(`layersForTier: unknown tier "${tier}"`);
  }
}
