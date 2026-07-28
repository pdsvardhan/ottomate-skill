// computed-runner.mjs — run the computed pass AS PART OF a round, or say plainly that it could not.
//
// T2, 2026-07-27. The computed checker (contrast · cross-component coherence · appearance divergence)
// already worked, but only as a separate manual command run after the fact — and a manual step is a
// step that gets skipped. It is the only thing that proves the panels genuinely LOOK different rather
// than merely reading differently, which is the backstop the whole stylistic-bundle model rests on.
//
// THE FAILURE MODE THIS IS BUILT AGAINST: reporting a pass for a check that never ran. `run-computed`
// imports `playwright`, which resolves only where the server's node_modules are. So this returns one
// of three states and never blurs them:
//   ran         chromium rendered the page and the checks executed
//   unavailable no chromium here — SAY SO. Never a pass.
//   failed      the runner itself broke — also not a pass.

import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { runComputedRules } from './computed-rules.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));

/**
 * @param {string} htmlPath   the emitted variant-set page
 * @param {object} [opts]
 * @param {string} [opts.cwd] a directory where `playwright` resolves (on VAULT7A: /opt/homeserver/ottomate).
 *                            Without it the pass is `unavailable` — it is NOT silently skipped.
 * @param {string} [opts.profile]
 * @returns {{state:'ran'|'unavailable'|'failed', findings?:Array, why?:string}}
 */
export function runComputedPass(htmlPath, { cwd = null, profile = 'P1', timeoutMs = 120000 } = {}) {
  if (!cwd) {
    return { state: 'unavailable', why: 'no `computed.cwd` configured — the computed pass needs a directory where `playwright` resolves (on VAULT7A: /opt/homeserver/ottomate). NOT run, and therefore NOT passed.' };
  }
  if (!existsSync(path.join(cwd, 'node_modules', 'playwright'))) {
    return { state: 'unavailable', why: `playwright is not installed under ${cwd} — the computed pass cannot run here. NOT run, and therefore NOT passed.` };
  }
  const runner = path.join(HERE, 'run-computed.mjs');
  const checks = path.join(HERE, 'computed-checks.js');
  const res = spawnSync(process.execPath, [runner, path.resolve(htmlPath), checks, profile],
    { cwd, encoding: 'utf8', timeout: timeoutMs, maxBuffer: 32 * 1024 * 1024,
      env: { ...process.env, OTTO_PW_ROOT: cwd } });
  if (res.error || res.status !== 0) {
    return { state: 'failed', why: `run-computed exited ${res.status}: ${(res.stderr || res.error?.message || '').slice(0, 400)}` };
  }
  try {
    return { state: 'ran', findings: JSON.parse(res.stdout) };
  } catch (e) {
    return { state: 'failed', why: `run-computed produced unparseable output: ${String(e).slice(0, 200)}` };
  }
}

// The real shape, confirmed by running it: { contrast:[], divergence:[], coherence:[], meta:{} }.
// I had assumed a flat array and the first inline run threw — recorded because guessing a shape and
// asserting on the guess is how a checker ends up reporting a pass for something it never parsed.
export function blockingFindings(findings, opts = {}) {
  return allFindings(findings, opts).filter((f) => !f.advise);
}

/**
 * Assemble each panel's rule input from what the browser pass collected.
 *
 * Two of the P1 rules cannot be answered from one record set, and wiring this wrong is invisible —
 * they simply return notApplicable forever and nobody notices the rule is inert:
 *   - adv-dark-mode-type-optical compares the SAME role across colour schemes, so the light-scheme
 *     rows are concatenated in (each row carries its own `dark` flag).
 *   - adv-token-adherence needs the panel's RESOLVED token set, which the collector reads off the
 *     shadow host's custom properties.
 */
function panelInputs(f) {
  const lightByLabel = new Map((f.recordsLight ?? []).map((p) => [p.label, p.rows ?? []]));
  const tokensByLabel = new Map((f.tokens ?? []).map((t) => [t.label, t.values ?? []]));
  return (f.records ?? []).map((panel) => ({
    label: panel.label,
    rows: [...(panel.rows ?? []), ...(lightByLabel.get(panel.label) ?? [])],
    opts: { 'adv-token-adherence': { tokens: tokensByLabel.get(panel.label) ?? [] } },
  }));
}

/** Everything the computed pass found, blocking and advisory alike. */
export function allFindings(findings, { profile = 'P1', roundType = 'whole-direction' } = {}) {
  const f = findings ?? {};
  const out = [];
  // Contrast: block at P2/P3, advise at P1 (the audience-profile ruling). Text over an image or a
  // gradient comes back as `review`, never a silent pass.
  for (const c of f.contrast ?? []) {
    if (c.ratio != null && c.need != null && c.ratio < c.need && profile !== 'P1') {
      out.push({ rule: 'floor-contrast', detail: `${c.label}: "${c.text}" ${c.ratio}:1 < ${c.need}:1` });
    }
  }
  // R3.2 (F-9): divergence is the WHOLE-DIRECTION backstop — variants must LOOK different, or the set is
  // not a set of options. But a ONE-AXIS CONTROLLED round is SUPPOSED to look near-identical except the
  // named axis; there the isolation gate's control-diff governs, and the divergence floor must NOT
  // false-block it (the two gates were mutually opposed only because both ran on every round). So the
  // divergence block applies to whole-direction rounds only.
  if (roundType !== 'one-axis') {
    for (const d of f.divergence ?? []) {
      if (d.differ === false) {
        out.push({ rule: 'computed-axis-divergence', detail: `${(d.pair ?? []).join(' / ')}: resolved-style distance ${d.distance} — these render nearly identically` });
      }
    }
  }
  // colour budget: ADVISORY, not blocking (owner ruling 2026-07-29, WS1.0). The accent-count budget was
  // F-8: it mis-counted cointrail's cool-neutral slate as accents and could not pass a legitimate
  // >4-category data-viz — it contorted the design to appease a miscounting check. Legibility is now
  // owned by the per-theme CONTRAST GATE (theming/contrast-gate.mjs), which is correct and fail-closed;
  // the budget stays as a soft "lots of accents?" signal (advise), never a block. Monochrome: still just
  // reported (restraint is not absence).
  for (const c of f.colourBudget ?? []) {
    if (c.withinBudget === false) {
      out.push({ rule: 'colour_budget', advise: true, detail: `${c.label}: ${c.distinctAccents} distinct accent colours across ${c.surfaces} surfaces, soft budget ${c.budget} — ${c.colours.slice(0, 4).join(', ')} (advisory since WS1.0; legibility is enforced by the per-theme contrast gate)` });
    }
  }
  // C6 batch 3 + P1: the pure computed rules, evaluated over the records the browser collected.
  for (const { label, rows, opts } of panelInputs(f)) {
    const verdicts = runComputedRules(rows, opts);
    for (const [id, v] of Object.entries(verdicts)) {
      // Two of the P1 rules are BLOCK-floor, not advise. They follow the same audience-profile
      // treatment floor-contrast already gets above: block at P2/P3, advise at P1.
      const isFloor = id === 'floor-not-colour-alone' || id === 'floor-focus-ring' || id === 'floor-target-size';
      if (v.pass === false) out.push({ rule: id, advise: !(isFloor && profile !== 'P1'), detail: `${label}: ${v.detail}` });
    }
  }
  for (const c of f.coherence ?? []) {
    if (c.coherent === false) out.push({ rule: 'adv-cross-component-coherence', detail: c.detail ?? JSON.stringify(c).slice(0, 160) });
  }
  return out;
}

// Everything worth showing, blocking or not.
export function summariseFindings(findings) {
  const f = findings ?? {};
  return {
    contrast: (f.contrast ?? []).length,
    contrastFails: (f.contrast ?? []).filter((c) => c.ratio != null && c.need != null && c.ratio < c.need).length,
    divergencePairs: (f.divergence ?? []).length,
    divergenceFails: (f.divergence ?? []).filter((d) => d.differ === false).length,
    computedRuleFails: panelInputs(f).reduce((a, p) => a + Object.values(runComputedRules(p.rows, p.opts)).filter((v) => v.pass === false).length, 0),
    coherence: (f.coherence ?? []).length,
    colourOverBudget: (f.colourBudget ?? []).filter((c) => c.withinBudget === false).length,
    monochromePanels: (f.colourBudget ?? []).filter((c) => c.monochrome).length,
  };
}

export function formatComputed(result, profile = 'P1') {
  if (result.state === 'unavailable') return `computed pass: UNAVAILABLE — ${result.why}`;
  if (result.state === 'failed') return `computed pass: FAILED TO RUN — ${result.why}`;
  const sum = summariseFindings(result.findings);
  const blocking = blockingFindings(result.findings, { profile });
  const lines = [`computed pass: ran — contrast ${sum.contrastFails}/${sum.contrast} below floor · divergence ${sum.divergenceFails}/${sum.divergencePairs} pairs too alike · colour ${sum.colourOverBudget} over budget${sum.monochromePanels ? ` (${sum.monochromePanels} monochrome — reported, not blocked)` : ''} · ${sum.computedRuleFails} computed advisories · ${blocking.length} blocking`];
  for (const f of blocking) lines.push(`  BLOCK ${f.rule ?? f.id ?? '?'}: ${f.detail ?? f.message ?? ''}`);
  for (const f of allFindings(result.findings, { profile }).filter((x) => x.advise).slice(0, 8)) {
    lines.push(`  advise ${f.rule}: ${f.detail}`);
  }
  return lines.join('\n');
}
