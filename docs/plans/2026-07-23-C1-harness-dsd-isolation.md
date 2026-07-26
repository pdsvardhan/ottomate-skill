# C1 — Variant harness isolation via declarative shadow DOM (unblocks Phase 1)

**Category:** C · Generation foundation · **Size:** M · **Where:** plugin (`ottomate`, branch `main`)
**Unblocks:** Phase 1 generation — markup-mode variants leak styles/ids into each other today
**Decision:** owner chose **DSD, static-emitted** (2026-07-23), from the trade table in this session
**Status: ✅ IMPLEMENTED + verified end-to-end 2026-07-23.** See the closing note.

---

## ✅ Outcome (2026-07-23)

Implemented as specified: `renderPanelStatic()` wraps each markup variant in its own
`<template shadowrootmode="open">`, emitted into a new `{{PANELS_HTML}}` slot; the template's client
render is gated to token mode (`if (!host.querySelector('.vs-panel'))`) and its leaky markup branch
removed. `harness-dsd.test.mjs` 6/6; isolation-gate 20/20 and design-check 29/29 unchanged.

**Verified on real harness output in the real Artifact sandbox** (`…/57e854cb-…`): panel A renders
green/flat/sharp, panel B pink/raised/rounded with a shadow — two fully isolated styles, neither
leaking, both surviving the publish pipeline.

**The verification earned its keep — it caught TWO pre-existing bugs the unit tests could not:**
1. `min-height:100%` on the template root collapses the Artifact frame to a **blank** render (the frame
   sizes to content `scrollHeight` → circular dep). Fixed to `100vh` in *both* templates. This is the
   textbook "documented ≠ demonstrated": every test was green while the artifact showed nothing.
2. `path.isAbsolute(cfg.template)` threw when `template` was omitted. Fixed.

**Follow-up now unlocked (separate owner decision):** with panels shadow-isolated, a cross-variant
id/class collision is harmless, so `block-svg-id-collision` can downgrade block→advise.

---

## Why

`template.variant-set.html:140` does `host.innerHTML = panels.map(…)`, so all N variant panels land in
**one document with no isolation**. A shared SVG `id` makes `url(#id)` resolve to the first match; a
shared class plus a variant `<style>` block lets the last panel restyle its siblings; `@keyframes` and
`:root` custom properties go document-wide. The set then **differs in source and matches on screen** —
exactly what the isolation gate exists to prevent, and a second root cause of the A≈B round.

The static half is already *blocked* (`block-svg-id-collision`, enforced), but blocking a colliding set
is not the same as being able to build a good one: a generator that keeps emitting generic class names
just keeps getting rejected. The real fix is genuine per-panel isolation.

## Verified in the real environment (2026-07-23, not assumed)

Published a self-diagnosing probe (`scratchpad/isolation-probe.html`) as a Claude Artifact and ran it
in the owner's current Chrome, **inside the real Artifact sandbox** —
`https://claude.ai/code/artifact/1d77da20-37e7-439f-b51a-1866db6939ad`:

| Approach | Result | Detail |
|---|---|---|
| Shared document (current) | ❌ **LEAKS** | both panels `.box` → `rgb(170,0,170)`; first `#grad` won on both |
| **Declarative Shadow DOM** (static `<template shadowrootmode>`) | ✅ **WORKS + ISOLATES** | `shadowRoot` attached; A green / B purple; gradients separate. **Survived the Artifact publish pipeline** — claude.ai does not strip it or inject via innerHTML |
| iframe srcdoc | 🟡 renders + isolates, but `contentDocument` is **null** under the sandbox → parent can't measure height | fixed heights or postMessage plumbing; rejected |

Also confirmed: `innerHTML` does **not** parse declarative shadow roots (so the panels must be emitted
**statically at build time**, not via runtime `innerHTML`); `setHTMLUnsafe` *is* available in the
sandbox as a backup path but is a newer API. Web sources: web.dev Declarative Shadow DOM (Baseline
Newly available; Widely available 2026-08-20), MDN `setHTMLUnsafe`.

## Verified current harness state (read this session)

```
build-variant-set.mjs  Node build. Assembles data.panels[] = {slot,label,caption,tokens,markup,...},
                       injects as {{VARIANT_DATA}} JSON. Gate + constraint check run before emit.
template.variant-set.html:140  host.innerHTML = panels.map(p => p.markup ? p.markup : renderCards(...))
                       — the client-side render. Markup mode uses p.markup; token mode uses renderCards.
scope                  ONLY markup mode leaks. Token mode varies inline custom properties on a shared
                       component → structurally immune, leave it untouched.
```

## Specification

**Markup mode → static declarative shadow DOM, pre-rendered in Node.**

1. In `build-variant-set.mjs`, when a panel has `markup`, wrap it at build time:
   ```html
   <section class="vs-panel" aria-label="Option A">
     <div class="vs-panel-head">…slot / caption…</div>
     <div class="vs-panel-body">
       <template shadowrootmode="open">
         <style>:host{display:block}</style>
         …the variant's own markup + its own <style>…
       </template>
     </div>
     <div class="vs-meta">…annotations…</div>
   </section>
   ```
   The whole panels block is emitted into a new **`{{PANELS_HTML}}`** static slot in the template.
2. **Token mode unchanged.** If no panel has `markup`, `PANELS_HTML` is empty and the existing
   client-side `renderCards` path runs exactly as today (token mode is immune, so no reason to churn it).
3. The template's client JS keeps only: theme toggle, the `vsNote` text. The `host.innerHTML = panels…`
   line runs **only** when `PANELS_HTML` is empty (token mode).
4. The manifest still records the slot→label mapping and the gate/check results.

**Known bounds, stated so nobody rediscovers them:**
- DSD content comes from a `<template>`, which is inert — **a `<script>` inside a variant will not
  execute**, same as under `innerHTML`. Style/layout axes (the overwhelming majority) are unaffected;
  a genuinely JS-driven variant is out of scope for this harness and would need iframe srcdoc.
- DSD is Baseline **Newly available** until 2026-08-20. The target is a private preview on the owner's
  current Chrome (**P1 solo**) — precisely the case doctrine rule 115 says a Newly-available feature is
  acceptable for. Not for public output without a fallback.

**Follow-on this enables (decide separately, do NOT bundle):** once panels are shadow-isolated, a
cross-variant id/class collision is **harmless** — each lives in its own shadow root. So
`block-svg-id-collision` can downgrade from `block_owner` to `advise` (or retire) *after* this lands and
is verified. Left as a deliberate follow-up, not done blindly here.

## Procedure

1. Add `renderPanelStatic(panel)` to `build-variant-set.mjs` — emits the DSD-wrapped `<section>`.
2. Emit `{{PANELS_HTML}}` (markup mode) or leave empty (token mode); add the slot to the template.
3. Gate the template's client render on `PANELS_HTML` being empty.
4. Add `scripts/preview-build/harness-dsd.test.mjs`: assert that for a 2-variant markup set the emitted
   HTML contains exactly 2 `shadowrootmode="open"` templates, each carrying its own `<style>`, and that
   the two panels' styles sit in *different* templates (so a shared class cannot leak). A must-fail
   companion: the pre-DSD shared-document string, asserted to have the collision the DSD output does not.
5. `node --test` both new and existing suites — isolation-gate 20/20 and design-check 29/29 must stay green.
6. **Cannot fully verify rendering from Node** (the cascade/shadow attach needs a browser). Re-publish
   the real variant-set output and re-run the in-sandbox probe pattern once, to confirm the harness's
   *actual* emission isolates — documented ≠ demonstrated.
7. Update `SKILL-REGISTER.md` (systems + defects) in the same commit. Commit + push; `git status` after.

## Acceptance

1. A 2-variant **markup** set emits 2 isolated shadow roots; a deliberately colliding pair (same class,
   same `#grad`) renders **isolated** in the sandbox, not leaked. Verified by re-running the probe on
   real harness output.
2. A **token** set emits byte-for-byte the same output as today (no regression to the immune path).
3. isolation-gate 20/20 and design-check 29/29 stay green.
4. The register's systems table shows the harness isolation as ✅ with the probe URL as evidence, and the
   defect moves to resolved.

## Risks

| Risk | Mitigation |
|---|---|
| Claiming it works from a Node-only test | Node test proves *structure* (N isolated templates); the *rendering* claim requires the in-sandbox probe re-run (step 6). Do not mark ✅ on the Node test alone |
| Token-mode regression | Token mode is left on its existing path; a snapshot test asserts its output is unchanged |
| A variant that needs JS | Out of scope, documented as a known bound; not silently broken — the annotation slot can flag "script not executed" if a `<script>` is present in a markup variant |
| DSD Newly-available for ~1 month | Acceptable for a P1 private preview per doctrine 115; `setHTMLUnsafe` is the runtime fallback if ever needed, and static parse is the better-supported path we're using |
