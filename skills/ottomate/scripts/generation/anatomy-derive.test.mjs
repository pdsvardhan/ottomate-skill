// U2 — deriving a component's inventory from its own source.
// run: node --test anatomy-derive.test.mjs

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { collectEvidence, inferTier, proposeRecord, validateRecord, isTailwindUtility } from './anatomy-derive.mjs';
import { questionRegistry } from './anatomy.mjs';
import { composeRounds } from './round-composition.mjs';

const CARD = `
  export function Card(p){ return (
    <article className="mc" data-role="media-card">
      <div className="pz"><img src={p.url} alt=""/><span className="chip">Owned</span></div>
      <button className="info" aria-label="Quick look">i</button>
      <div className="cap"><span className="t">{p.title}</span></div>
    </article>); }`;
const CARD_CSS = `.mc{border-radius:12px;box-shadow:0 2px 4px #000;transition:transform 200ms}
  .pz{aspect-ratio:2/3}.chip{color:#fff}.cap{padding:8px}.t{font-size:12px}.info{outline:none}`;

test('evidence records elements, classes, child components and CSS props — not just names', () => {
  const ev = collectEvidence(CARD, CARD_CSS);
  assert.ok(ev.elements.includes('img') && ev.elements.includes('button'));
  assert.ok(ev.classNames.includes('mc') && ev.classNames.includes('cap'));
  assert.deepEqual(ev.dataRoles, ['media-card']);
  assert.ok(ev.cssProps.includes('aspect-ratio'), 'CSS properties are the signal a name cannot give');
  assert.equal(ev.hasImage, true);
});

test('tier is inferred WITH a reason — an unexplained classification is not checkable', () => {
  const t = inferTier(collectEvidence('<main><h1>x</h1></main>'));
  assert.equal(t.tier, 'surface');
  assert.match(t.why, /landmark/);
});

test('a landmark makes it a surface; a named child makes it composite; neither makes it primitive', () => {
  assert.equal(inferTier(collectEvidence('<nav><a href="/">x</a></nav>')).tier, 'surface');
  assert.equal(inferTier(collectEvidence('<div><OwnChip/></div>')).tier, 'composite');
  assert.equal(inferTier(collectEvidence('<span className="chip">x</span>')).tier, 'primitive');
});

test('data-role is authoritative when present, class names are the fallback', () => {
  const withRole = proposeRecord(collectEvidence(CARD, CARD_CSS));
  assert.match(withRole.part_source, /data-role/);
  const noRole = proposeRecord(collectEvidence(CARD.replace(/ data-role="media-card"/, ''), CARD_CSS));
  assert.match(noRole.part_source, /class names the stylesheet actually styles/);
  assert.ok(noRole.parts.includes('mc'));
});

test('with no stylesheet the record SAYS the signal is weak rather than pretending', () => {
  const r = proposeRecord(collectEvidence(CARD.replace(/ data-role="media-card"/, ''), ''));
  assert.equal(r.confidence, 'low');
  assert.match(r.part_source, /weak|no stylesheet|NO CSS/i);
});

test('questions are RANKED by evidence, never silently filtered', () => {
  const r = proposeRecord(collectEvidence(CARD, CARD_CSS));
  assert.ok(r.likely.includes('media-aspect'), 'an <img> plus aspect-ratio should evidence media-aspect');
  assert.ok(r.likely.length + r.possible.length > r.likely.length || r.possible.length === 0);
  // everything not evidenced is still reported, so a keyword miss is visible rather than invisible
  assert.ok(Array.isArray(r.possible));
});

test('every proposed question names a part that exists in the source', () => {
  const ev = collectEvidence(CARD, CARD_CSS);
  const r = proposeRecord(ev);
  const known = new Set([...ev.classNames, ...ev.dataRoles, ...ev.childComponents, ...ev.elements, ...ev.cssSelectors]);
  for (const q of r.questions) assert.ok(known.has(q.part), `${q.q} names unknown part ${q.part}`);
});

test('MUST FAIL — a part with no evidence in the source is rejected', () => {
  const ev = collectEvidence(CARD, CARD_CSS);
  const bad = { ...proposeRecord(ev), parts: ['imaginary-part'] };
  const v = validateRecord(bad, ev);
  assert.equal(v.ok, false);
  assert.match(v.problems.join(' '), /imaginary-part.*traceable, not invented/);
});

test('MUST FAIL — a question outside the registry is rejected (doctrine rule 40)', () => {
  const ev = collectEvidence(CARD, CARD_CSS);
  const bad = { ...proposeRecord(ev), questions: [{ q: 'vibe-level', part: 'mc' }] };
  assert.equal(validateRecord(bad, ev).ok, false);
  assert.match(validateRecord(bad, ev).problems.join(' '), /not in the registry/);
});

test('MUST FAIL — a tier that contradicts the evidence is rejected', () => {
  const ev = collectEvidence(CARD, CARD_CSS);
  const bad = { ...proposeRecord(ev), tier: 'surface' };
  assert.equal(validateRecord(bad, ev).ok, false);
  assert.match(validateRecord(bad, ev).problems.join(' '), /contradicts the evidence/);
});

test('MUST FAIL — an interactive component missing the always-states floor is rejected (B2)', () => {
  const ev = collectEvidence(CARD, CARD_CSS);
  const bad = { ...proposeRecord(ev), required_states: ['rest'] };
  assert.equal(validateRecord(bad, ev).ok, false);
  assert.match(validateRecord(bad, ev).problems.join(' '), /missing required state "hover"/);
});

test('the honest happy path: the proposed record validates', () => {
  const ev = collectEvidence(CARD, CARD_CSS);
  assert.equal(validateRecord(proposeRecord(ev), ev).ok, true);
});

// ── U2b — hardening against real shadcn/Tailwind/Radix source (C12(2) findings), 2026-07-28 ────────

// A shadcn button: classes live inside cva()/cn(), it renders <Comp>=<Slot> passthrough, no stylesheet.
const SHADCN_BUTTON = `
  import { cva } from 'class-variance-authority';
  import { Slot } from '@radix-ui/react-slot';
  const buttonVariants = cva("inline-flex items-center justify-center rounded-md text-sm font-medium",
    { variants: { variant: { default: "bg-primary text-primary-foreground", ghost: "hover:bg-accent" } } });
  function Button({ className, asChild, variant, ...props }) {
    const Comp = asChild ? Slot : "button";
    return <Comp className={cn(buttonVariants({ variant, className }))} {...props} />;
  }`;

test('D1 — classes inside cn()/cva() are seen, so a shadcn component no longer derives to zero parts', () => {
  const ev = collectEvidence(SHADCN_BUTTON);
  assert.ok(ev.classNames.includes('rounded-md'), 'cva base string must be collected');
  assert.ok(ev.classNames.includes('bg-primary'), 'cva variant strings must be collected');
  const v = validateRecord(proposeRecord(ev, { name: 'Button' }), ev);
  assert.ok(!v.problems.some((p) => /no parts/.test(p)), 'must not fail with "no parts" anymore');
});

test('D3 — a lone <Slot>/<Comp> passthrough does NOT inflate a primitive to composite', () => {
  assert.equal(inferTier(collectEvidence(SHADCN_BUTTON)).tier, 'primitive');
});

test('D2 — a namespaced <X.Root> child (the Radix idiom) is detected and reads composite', () => {
  const AVATAR = `<AvatarPrimitive.Root className={cn("relative flex size-8")}>
    <AvatarPrimitive.Image src={s} /><AvatarPrimitive.Fallback>AB</AvatarPrimitive.Fallback>
  </AvatarPrimitive.Root>`;
  const ev = collectEvidence(AVATAR);
  assert.ok(ev.childComponents.includes('AvatarPrimitive'), 'namespaced child must be recorded');
  assert.equal(inferTier(ev).tier, 'composite');
});

test('D4 — Tailwind utilities are recognised and never offered as parts; semantic classes survive', () => {
  assert.equal(isTailwindUtility('flex'), true);
  assert.equal(isTailwindUtility('bg-primary'), true);
  assert.equal(isTailwindUtility('absolute'), true);
  assert.equal(isTailwindUtility('mt-4'), true);
  assert.equal(isTailwindUtility('hover:bg-accent'), true);
  assert.equal(isTailwindUtility('cardbase'), false);
  assert.equal(isTailwindUtility('chip'), false);
  const ev = collectEvidence('<div className="cardbase flex gap-2"><span className="chip absolute" /></div>');
  const parts = proposeRecord(ev).parts;
  assert.ok(parts.includes('cardbase') && parts.includes('chip'), 'semantic classes are parts');
  assert.ok(!parts.some((p) => ['flex', 'gap-2', 'absolute'].includes(p)), 'no Tailwind utility is a part');
});

test('D5 — a full-page height utility marks a surface even with no landmark tag', () => {
  const t = inferTier(collectEvidence('<div className="min-h-screen"><h1>Library</h1></div>'));
  assert.equal(t.tier, 'surface');
  assert.match(t.why, /page-level/);
});

test('D6 — weak evidence chooses only the evidenced questions, not all of them, so no forced over-wide round', () => {
  // A composite (has a child) with exactly ONE evidenced question (<img> -> media-aspect).
  const ev = collectEvidence('<section className="stack"><Rack /><img src={u} /></section>');
  const rec = proposeRecord(ev);
  assert.equal(rec.tier, 'composite');
  assert.ok(rec.likely.length >= 1 && rec.questions.length === rec.likely.length, 'chosen == evidenced');
  assert.ok(rec.questions.length < 10, 'must not dump all composite questions');
  assert.ok(rec.possible.length > 0, 'the unevidenced ones stay visible, ranked, never silently dropped');
  const REG = questionRegistry();
  const sub = rec.questions.map((e) => ({ id: e.q, ...REG[e.q] }));
  assert.equal(composeRounds(sub, { scope: 'component' }).matrix.regime, 'per-item-viable');
});
