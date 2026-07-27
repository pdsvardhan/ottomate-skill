# U2b — harden `anatomy-derive` against real shadcn/Tailwind/Radix source · unit plan

**Written 2026-07-28**, from the six defects C12(2) demonstrated
(`docs/audits/2026-07-28-C12-scenario2-pairing.md`). U2 was only ever tested on a literal-className
fixture + one `PosterCard.tsx`; none of shadcn's `cn`/`cva`, Radix's `<X.Y>`, or a stylesheet-free
Tailwind project was in its corpus — and those three are the actual shape of the catalog and of every
real target.

## Fixes, each tied to a defect and a test

1. **D-C12-1 — see `cn()`/`cva()` classes.** `collectEvidence` extracts class strings from the
   arguments of known class helpers (`cn`, `cva`, `clsx`, `cx`, `twMerge`, `twJoin`, `classnames`),
   using a balanced-paren scan (not a non-greedy regex, which cuts off at the first `)`), plus the
   existing `className=` matcher. Test: shadcn `button.tsx`-shaped source yields non-empty classes and
   no longer validates to "no parts".

2. **D-C12-4 — Tailwind utilities are never parts.** `isTailwindUtility()` recognises the utility
   grammar (utilities + responsive/state prefixes). Utilities stay in *evidence* (they still rank
   questions) but are excluded from *parts*. Parts prefer, in order: `data-role` → classes the
   stylesheet styles → **semantic (non-utility) classes** → child components → raw classes. Test: a
   Tailwind-only component's parts contain no `bg-*`/`absolute`/`mt-*`; a hybrid keeps `chip`/`cardbase`.

3. **D-C12-2 — see namespaced `<X.Y>` children.** The child-component matcher captures
   `<AvatarPrimitive.Root>` (the Radix idiom), recording the namespace root. Test: a component using
   `<X.Root>` reports a child component and does not read primitive.

4. **D-C12-3 — a passthrough does not inflate the tier.** `Slot`, `Fragment`, `Comp` are excluded from
   the orchestration count, so a primitive that renders only `<Slot>` stays primitive. Test: a
   button-shaped source that renders `<Comp>`/`<Slot>` classifies primitive, not composite.

5. **D-C12-5 — surface signals beyond landmarks.** A full-page utility (`min-h-screen`, `h-screen`,
   `min-h-dvh`, `h-dvh`) or `role="main"` also marks a surface, so a landmark-poor `<div>` page is not
   forced to composite. Test: a `<div className="min-h-screen">` reads surface with a stated reason.

6. **D-C12-6 — weak evidence no longer dumps every question into one round.** `proposeRecord` chooses
   the evidenced (`likely`) set when any exist, rather than falling back to *all* tier questions; the
   unevidenced ones stay reported as `possible` (ranked, never silently filtered — the module's ethos).
   This stops the guaranteed over-wide density round while keeping every question visible. Test: a
   component with 1–2 evidenced questions composes a round no wider than the bound, and its
   unevidenced questions are still present in `possible`.

## Acceptance

- **Must-pass** for each fix as above; **must-fail** preserved: an invented part, an out-of-registry
  question, a tier contradicting the evidence, and a missing always-states floor are all still rejected
  (U2b must not weaken the fail-closed validator).
- **Demonstrated on the real corpus:** re-run `docs/demos/2026-07-28-c12-pairing.mjs` — the 6 hard
  validation failures drop, parts read semantic where the source has semantic classes, and the
  over-wide count falls. Recorded as a before/after in the audit.
- Existing derive + anatomy + generation suites stay green.
