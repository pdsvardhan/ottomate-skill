// Stage 4 S5 + S6. Must-FAIL and must-PASS per rule.

import test from 'node:test';
import assert from 'node:assert/strict';
import { tokeniseReport, frameworkCoupling, gradeComponent } from './grade-component.mjs';

const TOKENISED = `
export default function Card() {
  return <div style={{ background: 'var(--surface)', color: 'var(--text)', borderRadius: 'var(--radius)' }} />;
}`;

const LITERAL = `
export default function Card() {
  return <div style={{ background: '#fff', color: '#111827' }} />;
}`;

// ── S5 tokenisation ────────────────────────────────────────────────────────────────────────────

test('MUST PASS — a component using only var(--…) scores no tokenisation penalty', () => {
  const r = tokeniseReport(TOKENISED);
  assert.equal(r.literalColours, 0);
  assert.equal(r.penalty, 0);
  assert.equal(r.tokenRefs, 3);
});

test('MUST FAIL — a literal #fff in a background is flagged AND costs at least one band', () => {
  const r = tokeniseReport(LITERAL);
  assert.equal(r.literalColours, 2);
  assert.ok(r.penalty >= 1, 'a flag with no consequence is a flag nobody reads');
  assert.ok(r.samples.includes('#fff'));
});

test('MUST PASS — a literal inside SVG path data is NOT counted as a colour', () => {
  const svg = `export default function I(){return <svg><path d="M0 0h24v24H0z" fill="var(--fg)"/></svg>;}`;
  assert.equal(tokeniseReport(svg).literalColours, 0,
    'path geometry is not a design decision; counting it would train people to ignore the flag');
});

test('MUST PASS — a hex inside a comment or an import is not counted', () => {
  const src = `// see #ffffff in the old design\nimport x from "./a#b";\nexport default function C(){return <b style={{color:'var(--t)'}}/>;}`;
  assert.equal(tokeniseReport(src).literalColours, 0);
});

test('a mostly-tokenised component is penalised LESS than a fully literal one', () => {
  const mostly = `export default function C(){return <b style={{a:'var(--x)',b:'var(--y)',c:'var(--z)',d:'var(--w)',e:'#fff'}}/>;}`;
  assert.ok(tokeniseReport(mostly).penalty < tokeniseReport(LITERAL).penalty);
});

test('an empty or absent source is UNMEASURABLE, not a pass', () => {
  assert.equal(tokeniseReport('').measurable, false);
  assert.equal(tokeniseReport(null).measurable, false);
  assert.equal(tokeniseReport('').penalty, 0, 'unmeasurable must not invent a penalty either');
});

test('framework coupling is REPORTED, listing the exact unresolvable imports', () => {
  const src = `import { cn } from "@/lib/utils";\nimport React from "react";\nimport { X } from "lucide-react";`;
  const c = frameworkCoupling(src);
  assert.deepEqual(c.aliasImports, ['@/lib/utils']);
  assert.ok(c.externalDeps.includes('react') && c.externalDeps.includes('lucide-react'));
});

// ── S6 grading ─────────────────────────────────────────────────────────────────────────────────

const PERFECT = {
  library: 'ottomate', author: 'pdsv', spdx_id: 'MIT',
  dark_light_compat: true, responsive: true, dependencies: [],
};

test('MUST PASS — fully provenanced, MIT, tokenised, dark/light, zero-dependency grades A and ships', () => {
  const g = gradeComponent(PERFECT, TOKENISED);
  assert.equal(g.grade, 'A', JSON.stringify(g.factors));
  assert.equal(g.ships, true);
  assert.equal(g.gateReason, null);
});

test('MUST FAIL — a RED-licence component cannot reach A or B, whatever else is true', () => {
  const g = gradeComponent({ ...PERFECT, spdx_id: 'CC-BY-NC-4.0' }, TOKENISED);
  assert.ok(!['A', 'B'].includes(g.grade), `got ${g.grade}`);
  assert.equal(g.ships, false);
  assert.match(g.gateReason, /gate, not a weighted term/);
});

test('MUST FAIL — an excluded source grades F outright', () => {
  const g = gradeComponent(
    { ...PERFECT, library: 'x', source_url: 'https://www.shadertoy.com/view/a', licence_url: 'u', attribution: 'a', retrieved_at: 1 },
    TOKENISED,
  );
  assert.equal(g.grade, 'F');
  assert.equal(g.ships, false);
});

test('MUST PASS — an unmeasurable factor shrinks the denominator and is listed, never scored zero', () => {
  const partial = { library: 'ottomate', author: 'p', spdx_id: 'MIT' }; // no dark_light/responsive/deps
  const g = gradeComponent(partial, TOKENISED);
  const names = g.unmeasurable.map((u) => u.name);
  assert.deepEqual(names.sort(), ['dark_light', 'dependencies', 'responsive']);
  assert.equal(g.factors.length, 4, 'denominator is the measurable factors only');
  assert.equal(g.grade, 'A', 'three unset fields must not drag a good component down to D');
});

test('MUST FAIL — a component with NOTHING measurable grades F rather than defaulting to a pass', () => {
  // No source, and provenance/licence both absent -> the two scored factors are 0.
  const g = gradeComponent({});
  assert.equal(g.ships, false);
  assert.equal(g.grade, 'F');
});

test('literal colours pull the grade down by a real band — S5 has consequences', () => {
  const good = gradeComponent(PERFECT, TOKENISED);
  const bad = gradeComponent(PERFECT, LITERAL);
  assert.ok(bad.score < good.score);
  assert.notEqual(bad.grade, good.grade, 'a baked-in #fff must actually cost something');
});

test('an alias import costs portability outright — it will not resolve outside its origin repo', () => {
  const g = gradeComponent(PERFECT, `import { cn } from "@/lib/utils";\n${TOKENISED}`);
  const p = g.factors.find((f) => f.name === 'portability');
  assert.equal(p.score, 0);
  assert.match(p.note, /alias import/);
});

test('grandfathered provenance scores half, not zero — the debt is recorded, not forgiven or ignored', () => {
  const debt = gradeComponent({ library: 'magicui', spdx_id: 'MIT', author: 'x' }, TOKENISED);
  const full = gradeComponent({ ...PERFECT }, TOKENISED);
  const dp = debt.factors.find((f) => f.name === 'provenance');
  const fp = full.factors.find((f) => f.name === 'provenance');
  assert.equal(fp.score, 1);
  assert.ok(dp.score < 1, 'missing provenance must cost something');
});

test('every factor carries a note, so a grade can always be explained rather than asserted', () => {
  const g = gradeComponent(PERFECT, LITERAL);
  for (const f of g.factors) {
    assert.equal(typeof f.name, 'string');
    assert.equal(typeof f.score, 'number');
    assert.ok(f.score >= 0 && f.score <= 1, `${f.name} out of range`);
  }
  assert.ok(g.factors.find((f) => f.name === 'tokenisation').note.includes('literal colour'));
});
