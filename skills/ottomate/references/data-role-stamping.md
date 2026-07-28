# data-role / data-oid stamping convention (R2.1)

Decomposition (`decompose.mjs`, WS1.3) and anatomy-derive (R2.2) read a component's parts from **stamps**,
not from name-guessing. A stamped component decomposes STRONGLY (high confidence, the real parts); an
unstamped one falls back to a generic, honest **low-confidence** derivation (F-4). Stamp the components you
want to redesign well.

## The two attributes
- **`data-role="<role>"`** — the part's role in THIS component's anatomy. Use a DISTINCT role per part you
  want to decompose separately. Three sibling panels are three parts, so give them three roles
  (`transaction-history`, `top-merchants`, `category-breakdown`), not one shared `panel` — decompose
  enumerates by role, so a shared role collapses them into one.
- **`data-oid="<project>.<id>"`** — the globally-unique id of the part (`cointrail.category-breakdown`).
  This is what a design round targets and what the ledger records.

## Where to stamp
- The **section wrapper** gets the cluster oid: `data-oid="cointrail.spending-analysis" data-role="section"`.
- Each **redesignable part** gets its own role + oid.
- Stamp the outermost element of the part (the one whose styling/layout the round would change).

## Example (cointrail spending-analysis, applied 2026-07-29)
```tsx
<div data-oid="cointrail.spending-analysis" data-role="section">
  <motion.div data-role="transaction-history" data-oid="cointrail.transaction-history"> … </motion.div>
  <div data-role="top-merchants"       data-oid="cointrail.top-merchants"> … </div>
  <div data-role="category-breakdown"  data-oid="cointrail.category-breakdown"> … </div>
</div>
```
`decompose({src})` then returns oid `cointrail.spending-analysis` + parts
`[section, transaction-history, top-merchants, category-breakdown]`, and the scope menu offers each panel.

## Notes
- Stamps live in the **source**; `decompose`/`anatomy-derive` read the source file, so no rebuild is needed
  for decomposition (a rebuild only matters if the live app itself needs the attributes).
- Without stamps, derivation is honest-but-weak: **low** confidence, no invented parts, no false axes (R2.2).
  Markers (`group`/`peer`) and leaked JS identifiers (`isCredit`) are never treated as parts.
