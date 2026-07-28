# T2 — The test-oracle problem + case/matrix generation (INDEPENDENCE as the theme)

> **Task-3 research track, distilled 2026-07-28 (Track B).** Source: deep web sweep (foundational testing
> literature + 2024-2026 LLM-test-gen work; cited below). This is the reference for **the hardest problem
> in the verifier: how it knows what "correct" is, independently, without asserting the bug back.**
> Companion tracks: T1 (visual/VLM-judge), T3 (acceptance-gate architecture).

## The through-line
**The verifier's power comes from asserting *relations* and *independently-recomputed state* derived from
the requirement, layered across oracle classes, bounded by pairwise, and authored in a context blind to
the code.** That combination is what the literature says actually breaks "the same author writes the bug
and the test that blesses it" — the anti-gaslight guarantee.

## The core difficulty (Barr et al., IEEE TSE 2015, "The Oracle Problem in Software Testing")
Input generation is automated; **automating the *oracle* is the bottleneck.** For many programs no cheap
mechanism verifies the output for arbitrary input — "the final source of oracle information remains the
human." Framed by two properties: **controllability** (drive the SUT into the state to check) and
**observability** (actually see the effect). **Fail-closed maps onto observability: if the verifier
couldn't observe the state it was to judge, that's oracle-inapplicable ⇒ FAIL, never a silent pass.**

---

## §0 — DECISIONS FOR OUR VERIFIER (the actionable distillation)

1. **Make independence ARCHITECTURAL.** Empirically, LLM-generated oracles capture *actual* (buggy)
   behavior, not *expected*, when generated near the code (arXiv 2410.21136). So the verifier authors its
   matrix in a **fresh context that sees only the requirement / design decision / owner bug report —
   never the implementation diff.** Pin the spec verbatim as the oracle source *before* the build context
   can contaminate it. This is IV&V (you can't objectively test your own code).
2. **Lead with metamorphic + implicit oracles; use golden/regression sparingly.** For "silently wrong"
   bugs, *relations* (determinism, non-constancy, conservation, union, subset, inverse, permutation-
   invariance) need **no known-correct value** and can't be satisfied by echoing the implementation.
   Reserve exact/golden oracles for genuinely stable outputs. **Missing visual baseline ⇒ FAIL** (never
   auto-generate a baseline — that blesses the current, possibly-buggy UI: "assert-the-bug-back" for
   pixels).
3. **Assert system state via a SECOND channel, always.** Never trust the UI's self-report. Read the DB
   row via API, `stat` the file, poll the job — and where possible add a **differential/reference**
   recomputation (hash the bytes we sent vs bytes stored; count from the known input set; compute
   expected pagination from `total`/`pageSize`). Discrepancy = fail.
4. **Bound the matrix with the classical stack + pairwise.** EP/BVA choose values per parameter;
   decision-table/cause-effect capture rule combinations; **ACTS or PICT** (free, OSS, no SaaS, no GPU)
   produce a **2-way covering array** (3-way for high-risk). NIST fault data: 1-way≈67%, 2-way≈93%,
   3-way≈98% of real interaction faults — near-full coverage at a fraction of exhaustive cost.
5. **Use the LLM to *instantiate structured templates*, not free-form oracles.** Force Claude to fill a
   parameter table / MR template / covering-array rows **anchored to the pinned spec**, then
   **refine-and-reject against the spec** (the ARMeta pattern). "External anchoring" (OCL/SCR/cause-effect/
   RAG) is what the survey identifies as actually controlling hallucination — the LLM alone can't.
6. **Determinism is non-negotiable for a gate.** Fixed PBT seeds, shrinking to minimal counterexamples,
   explicit visual thresholds, and *unmeasured == FAIL*.
7. **Spend the human/owner oracle on the MATRIX, once** — owner reviews/signs the case matrix + its
   relations up front, not every result. That single review is where independence is *injected*.

---

## §1 — The four oracle classes (Barr) mapped to us

| Class | What it is here | Independence risk |
|---|---|---|
| **Specified** | The requirement / design decision / owner bug report → executable assertion over DB/API/DOM state | **HIGH** if the same agent paraphrases the spec into both code and assertion — pin it to the requirement, not re-derived from code |
| **Derived** | (a) regression/golden (prior DB snapshot, `toHaveScreenshot` baseline); (b) **metamorphic** ("different JD ⇒ different résumé"); (c) **reference/differential** (recompute the effect a different way) | regression blesses whatever existed first (can bless a bug); reference needs a genuinely independent 2nd computation |
| **Implicit** | Spec-free: no 4xx/5xx, no unhandled exception / console error, well-formed non-empty response, no orphaned job. **one-link-downloads-400 is an implicit-oracle catch** | very robust + cheap, but only catches "obviously broken," not "silently wrong" |
| **Human** | Owner review of the case matrix *before* the run; sign-off on subjective/taste calls | the scarce resource — spend on the matrix, not on re-judging every run |

**Layer them** so fewer claims depend on the fragile in-session "specified" oracle.

---

## §2 — Techniques

**Metamorphic testing (MT) — the most important for us** (Chen/Cheung/Yiu 1998; Segura survey TSE 2016).
An **MR** is a necessary property across *multiple executions*; you transform a source case into a
follow-up and assert a relation **without knowing either exact output** (the MR *is* the oracle).
Segura's **REST MR Output Patterns (MROPs)** are directly reusable: **Equivalence, Equality, Subset,
Disjoint, Complete (union), Difference** — found 11 real defects in Spotify/YouTube. 2026 ARMeta generates
MRs in Gherkin, treats the OpenAPI spec as "strict source of truth," and a "refiner agent" drops relations
the spec can't support (an independence template for us).
Reusable MRs (each needs no known output): **non-constancy** (different input ⇒ different output — defeats
the fixed-template bug), **determinism** (same in ⇒ same out), **conservation/count** (N files ⇒ N rows),
**union/subset** (pagination completeness; filter ⊆ unfiltered), **inverse/round-trip** (add-then-remove
⇒ identity; encode-decode ⇒ original), **permutation invariance**. Limitation: MRs are *necessary not
sufficient* (a program can satisfy all MRs and still be wrong) and finding good MRs needs domain knowledge.

**Property-based testing (PBT)** — QuickCheck (2000) → **fast-check** for TS/JS. Assert invariants over
100s–1000s of generated inputs incl. edge cases (`0`,`1`,`-1`,boundaries,`__proto__`). It's an
**implicit-oracle** technique (the property is the oracle). Gate-safe features: **shrinking** (minimal
counterexample), **fixed seeds** (fully reproducible failures). Nasty-input arbitraries map to our needs:
`fc.fullUnicodeString()` (NFC/NFD/emoji), empty/huge strings, boundary numbers. **Stateful/model-based
PBT** (commands with `check(model)` + `run`) generates and shrinks *action sequences* — a direct fit for
Playwright multi-step flows (upload → load-more → delete → refresh, asserting the model matches reality
after each step).

**Combinatorial / pairwise** — NIST interaction rule: nearly all failures are ≤6-way, most ≤3-way. A
**covering array** covers all t-way combos; test count grows ~logarithmically. Free OSS: **NIST ACTS**
(t up to 6, supports constraints) and **Microsoft PICT**. Algorithm: IPOG (horizontal+vertical growth).
Bounds the *combination* explosion; you still supply value choices (from EP/BVA).

**Classical spec→test (value-choice engine)** — Equivalence Partitioning (one rep per class), Boundary
Value Analysis (edges: min/max ±1, 0, empty), Decision Tables / Cause-Effect Graphing (rule combinations;
cause-effect parsing is also an LLM-hallucination "anchor"). Pipeline: **EP/BVA pick values → decision
tables capture rule combos → covering array bounds the cross-product.**

**LLM-assisted test generation — capability + the central danger.** LLMs generate developer-like tests
and can have higher fault-detection than EvoSuite — BUT the documented failure our project exists to
prevent: **"LLM oracles capture actual not expected behaviour"** (arXiv 2410.21136); ChatGPT tests suffer
"incorrect assertions"; requirement **hallucination** ("invent conditions not specified… 61% of discarded
cases compiled but failed because the LLM misunderstood edge cases"). **Mitigant = external anchoring**
(UMTG/NAT2TESTSCR/CiRA/RAGTAG use OCL/SCR/cause-effect/RAG): don't let the LLM free-form the oracle — force
it to instantiate a structured artifact the requirement defines.

---

## §3 — Independence: what breaks "assert-the-bug-back" (ranked)
1. **Structural independence (IV&V)** — "people can't objectively test their own code"; safety-critical
   regimes mandate independent testing. Our analogue: verifier = separate agent/session, fresh context,
   **never sees the implementation diff** — only requirement + design decision + bug report.
2. **Derive the oracle from the REQUIREMENT, not the code** (oracles drift to *actual* behavior near code).
3. **Differential / reference (pseudo-oracle)** — recompute the effect a second, independent way (hash
   bytes, count from known input, formula). Discrepancy flags the fault; no full second app needed.
4. **Metamorphic / property relations** — a relation can't be satisfied by copying the implementation's
   output (the fixed-template résumé violates "different JD ⇒ different output" regardless).
5. **Fresh-context / N-version authoring** — different context authors the matrix. **Caveat: two samples
   of the *same* model on the *same* prompt are NOT independent** — independence comes from different
   *inputs/artifacts* (spec-vs-code), not a second sample.
6. **Human/owner review of the matrix before the run** — the cheapest high-leverage independence injection.

---

## §4 — THE CASE-MATRIX RECIPE (reusable) + the 4 real bugs

**For each feature the agent claims to have built/fixed:**
1. **Pin the spec independently** (context blind to the diff) — the oracle source.
2. **Model parameters (EP+BVA):** counts {0,1,few,many,over-limit}; strings {empty,ascii,Unicode NFC/NFD,RTL,emoji,very-long,`__proto__`}; file {0-byte,normal,huge,wrong-type,dup-name}; auth {owner,other,guest}; state {empty,one,at-page-boundary}.
3. **Enumerate paths by template (always):** happy · error/invalid · edge/boundary · permission/authz · concurrency/idempotency · persistence-after-reload.
4. **Attach oracles by class, layered:** *implicit* (no 4xx/5xx, no console/server error, well-formed, non-empty) · *metamorphic/property* (from the reusable set) · *reference/differential* (recompute independently) · *state assertion* (DB via API / stat file / poll job — assert system state, not the UI's self-report) · *regression/visual* (golden snapshot / `toHaveScreenshot`; **fail-closed on missing baseline**).
5. **Bound the cross-product** with a **pairwise (2-way)** covering array (ACTS/PICT); 3-way for high-risk; constraints drop impossible combos.
6. **Prioritize by risk** = Likelihood × Impact (data-loss/permission/payment deeper; cosmetic lighter).
7. **Owner-review the matrix once** (human oracle), then run deterministically (fixed seed).
8. **LLM instantiates structured templates, not free-form**, anchored to the pinned spec; refine/reject against it (ARMeta).

**Mapped to the owner's real bugs:**
- **upload-drops-files** → *Conservation MR* (`rows_after − rows_before == N`, counted from our known input, not the app's echo) + *reference* (SHA-256 of each stored blob == hash of source bytes we sent) + *implicit* (no 5xx, job "done"). Independent because counts/hashes come from *our* generated inputs.
- **one-link-downloads-400** → *implicit* over the **whole population** (for **every** link: 200, Content-Length>0, expected Content-Type) + *Equality MROP* (equivalent rows behave equivalently). The happy path clicked one link; the verifier asserts over all N.
- **résumé-not-actually-tailored** → the textbook MT case: *non-constancy* (two different JDs ⇒ outputs differ) + *relevance* (JD names skill X ⇒ output contains X) + *determinism* (same JD ⇒ stable structural output). Needs no "correct résumé"; a golden-file test would *bless* the template.
- **load-more-broken** → *Complete/union MROP* (page1 ∪ page2 ∪ … == full set, no dups/drops) + *property* (after k clicks, item count == min(total,(k+1)·pageSize); IDs unique) + *implicit* (button disappears exactly when exhausted; no error past last page) + *model-based stateful PBT* (action sequences {load-more, refresh, filter}).

---

## §5 — Sources
Oracle: Barr et al. TSE 2015 (eecs481.org/readings/testoracles.pdf; semanticscholar 0e17ab6c…) · Wikipedia Test oracle.
Metamorphic: Chen/Cheung/Yiu 1998 (cs.hku.hk/data/techreps/document/TR-2003-06.pdf) · Segura survey TSE 2016 (eprints.whiterose.ac.uk/id/eprint/110335) · Chen et al. ACM CSUR 2018 (dl.acm.org/doi/10.1145/3143561) · Wikipedia Metamorphic testing · Segura REST MROPs (javiertroyauma.github.io/publications/TSE2017_REST_prePrint.pdf; dl.acm.org/doi/10.1145/3180155.3182528) · MR patterns query systems (personales.us.es/sergiosegura) · ARMeta 2026 (arxiv.org/html/2605.28321) · web-security 76 MRs (arxiv.org/abs/2208.09505).
PBT: QuickCheck ICFP 2000 (alastairreid.github.io) · Hypothesis (researchgate 337429879; hypothesis.readthedocs.io/en/latest/stateful.html) · fast-check (fast-check.dev/docs; github.com/dubzzz/fast-check) · TS guide (davideaversa.it) · stateful+differential+metamorphic (marktechpost 2026/04/18).
Combinatorial/classical: NIST beyond-pairwise (csrc.nist.gov/pubs/journal/2008/06) · Kuhn-Wallace-Gallo TSE 2004 (csrc.nist.gov/.../kuhn-wallace-gallo-tse-preprint.pdf) · NIST failure data (csrc.nist.rip/groups/SNS/acts/software_failures.html) · ACTS (csrc.nist.gov/.../acts.mip.v4.pdf) · IPOG (ncbi.nlm.nih.gov/pmc/articles/PMC4652878) · ISTQB EP/BVA/decision-tables (istqb.guru; testsigma.com/blog/decision-table-testing).
LLM test-gen risk: oracles actual-vs-expected (arxiv.org/abs/2410.21136) · ChatGPT unit tests FSE'24 (mingwei-liu.github.io) · empirical LLM unit tests (arxiv.org/html/2406.18181v1) · NL-req survey (arxiv.org/pdf/2606.06563) · multi-modal AC (arxiv.org/pdf/2508.06888).
Independence: IV&V (phoenixnap.com/glossary/iv-and-v; csrc.nist.gov/glossary) · Differential testing (Wikipedia; people.cs.vt.edu/~gulzar p71) · N+1-version JEST (arxiv.org/pdf/2102.07498) · Retromorphic (arxiv.org/pdf/2310.06433).
Visual/risk: Playwright visual (testquality.com; testdino.com) · Risk-based testing (Wikipedia; testrail.com).
