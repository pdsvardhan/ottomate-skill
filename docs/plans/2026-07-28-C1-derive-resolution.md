# C1 — resolving an unregistered locked decision, or failing loudly · unit plan

**Written 2026-07-28**, after measuring live state, which contradicts the plan this refines
(`2026-07-27-TASK2-CLOSEOUT-PLANS.md` §C1). Step 1 of C1 (`654e18f`) is done: an unresolved locked
decision BLOCKS the emit. This unit is the resolution path.

## Live state measured today (demonstrated, not assumed)

`GET /api/projects/screenroom/design-decisions` → **13 locked** (drifted up from 9), 10 superseded.
Every one of the 13:

- is `target_kind: "page"`, `rung: 1` — a **page-scope structural** decision, not a component token;
- carries a **novel question** absent from the universal registry (`surface-strategy`, `tile-object`,
  `rack-spines`, `domain-switch`, `content-scope`, `shape`, `mark`, `range-control`, …);
- has an **enum value**, none CSS-token-shaped (`reuse-browse-surface`, `two-racks-one-page`,
  `dropped`, `nav-only`, `F2-address-slip`). Row 40's rationale: *"Owner decision, taken directly
  rather than via a variant round."*

The novel vocabulary appears **nowhere** — not in the plugin, not in screenroom's repo. And
`anatomy-derive`'s `validateRecord` **rejects any question not in the registry** by tested invariant
(its "doctrine rule 40" test). So the plan's must-pass — *"`surface-strategy` resolves through
derivation and emits a namespaced token"* — is not achievable honestly: the value is `reuse-browse-surface`;
a token would be fabricated CSS. **The miss-cause is novel _questions_ on _page_ targets, not registry
questions on unregistered archetypes.** Owner ruling 2026-07-28: *"you decide"* → structural-by-default.

## Design — three outcomes, never blurred

`buildArtifacts` resolves each locked decision to exactly one of `token` · `structural` · `unresolved`.

1. **Registry HIT** → unchanged. `q.token` present → token; else structural. `derived:false`.
2. **Registry MISS, and (`target_kind==='page'` OR the value is not CSS-shaped)** → **structural**.
   Recorded **verbatim** into `ottomate-design-spec.json` and echoed as a CSS comment, `derived:true`,
   carrying `evidence` = why it resolved outside the registry. **This invents nothing** — it is the
   owner's locked choice written down for Stage 3 exactly as chosen. All 13 screenroom rows land here.
3. **Registry MISS, value IS CSS-shaped, target is component-scope** → the only case that could tempt a
   fabricated token. Minting `--{t}-{question}` for a question the registry never defined is the
   invention rule 40 forbids. Allowed **only** if the target's real source corroborates it, via
   `collectEvidence` (the load-bearing use of `anatomy-derive` here). Corroborated → token, `derived:true`,
   evidence names the match. **Not** corroborated, or no source → **unresolved → blocks the emit.**

Supporting details:
- Token names for a derived axis are deterministic and namespaced by target: `--{targetLeaf}-{slug(question)}`.
- Derivation is **cached per target** within a run (`sourceLoader` is injectable, default absent, so
  `buildArtifacts` stays pure and testable — same pattern as `graduate.mjs`'s injected `post`).
- The durable cache is the artifact itself: `derived:true` + `evidence` are written into the spec JSON.

## Acceptance — each with a must-fail AND a must-pass

- **MUST PASS:** `library-list.surface-strategy = reuse-browse-surface` (page-scope, enum) — the exact
  row that was blocked — resolves to a **structural spec entry**, `derived:true`, and the emit goes
  green (not skipped).
- **MUST FAIL:** a novel question with a CSS-shaped value on a component target and **no** corroborating
  source → **unresolved**, emit refuses, a test asserts **nothing was written** (never a fabricated token).
- **MUST PASS:** the same novel CSS-shaped axis **with** a `sourceLoader` whose source contains it →
  token minted, deterministic namespaced name, evidence names the corroboration.
- **MUST FAIL (survives the wiring):** corroboration refuses when the source does **not** contain the
  axis — the invention guard is intact, mirroring `anatomy-derive`'s own rule-40 invariant.
- **MUST PASS:** re-emitting is a no-op, not an empty commit (existing guard, unchanged).

## Then

Run the emit **dry-run** against the 13 live locked rows (read-only: fetch, `buildArtifacts`, print the
resolution table + would-be spec/CSS; **no repo write, no DB write**) and show the owner the diff. The
owner has approved the real emit once C1 lands.
