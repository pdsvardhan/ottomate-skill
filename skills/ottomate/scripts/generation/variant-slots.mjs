// T5 — slot letters are presentation, labels are identity.
//
// G3 §3.6 randomises slot order every round, so "A" in round 1 is a DIFFERENT bundle from "A" in
// round 2. The ledger used to store `variants_shown: { A: '4px' }` and `mixed_from: { variant: 'A' }`,
// which made cross-round provenance recoverable only by hand, from the harness manifest, if it still
// existed. The label — the non-evaluative axis-level descriptor the isolation gate already blind-sorts
// on — is the stable identity. It travels with the value from here on.
//
// WRITE side: a label is REQUIRED. A slot with no label is rejected, because a row written without one
// is unresolvable the moment the next round reshuffles, and there is no later opportunity to add it.
// READ side: the legacy bare shape is tolerated forever. Rows 18-27 predate this and are NOT rewritten
// — rewriting live ledger rows to make a format look consistent is exactly the kind of quiet history
// edit the anti-gaslight rules exist to prevent.

/** The two shapes a stored `variants_shown` can have. */
export const SHAPE_LEGACY = 'legacy-bare-value';
export const SHAPE_LABELLED = 'labelled';

/**
 * Resolve the slot→label map from a manifest, accepting either key.
 * `slot_mapping` is what `build-variant-set.mjs` already writes into
 * `variant-set.manifest.json`; `variant_labels` is the hand-authored form. Accepting both removes a
 * transcription step between the harness and the publisher — the seam where a label would get lost.
 * @param {object} manifest
 * @returns {Record<string,string>}
 */
export function resolveLabels(manifest = {}) {
  return manifest.variant_labels ?? manifest.slot_mapping ?? {};
}

/**
 * Build one `variants_shown` entry. THROWS when the label is missing or blank — the must-fail case.
 * @param {string} slot
 * @param {*} value
 * @param {Record<string,string>} labels  slot → label
 * @param {string} [ctx]  what is being written, for the error message
 * @returns {{value:string,label:string}}
 */
export function shownEntry(slot, value, labels, ctx = 'this round') {
  const label = labels?.[slot];
  if (typeof label !== 'string' || label.trim() === '') {
    throw new Error(
      `slot "${slot}" has no label (${ctx}). T5: slot letters are re-shuffled every round, so a row `
      + `storing a bare letter cannot be traced back to its bundle later. Pass \`variant_labels\` `
      + `(or the harness's \`slot_mapping\`) — { "${slot}": "<axis-level descriptor>" }.`,
    );
  }
  return { value: String(value), label };
}

/**
 * Build a whole `variants_shown` object for one sub-decision. Slots that offered no value are omitted;
 * every slot that DID offer one must have a label.
 * @param {string[]} slots
 * @param {(slot:string)=>*} valueOf  returns undefined when that slot offered nothing
 * @param {Record<string,string>} labels
 * @param {string} [ctx]
 */
export function buildShown(slots, valueOf, labels, ctx = 'this round') {
  const shown = {};
  for (const slot of slots) {
    const v = valueOf(slot);
    if (v !== undefined) shown[slot] = shownEntry(slot, v, labels, ctx);
  }
  return shown;
}

/**
 * Read a stored `variants_shown` back, tolerating BOTH shapes. This is the half that must never get
 * stricter: a pre-T5 row is not a broken row, it is a row from before the rule.
 * @param {object|null} shown
 * @returns {Array<{slot:string,value:string,label:string|null,shape:string}>}
 */
export function readShown(shown) {
  if (!shown || typeof shown !== 'object') return [];
  return Object.entries(shown)
    .filter(([, v]) => v !== undefined && v !== null)
    .map(([slot, v]) => (typeof v === 'object' && !Array.isArray(v)
      ? { slot, value: String(v.value ?? ''), label: v.label ?? null, shape: SHAPE_LABELLED }
      : { slot, value: String(v), label: null, shape: SHAPE_LEGACY }));
}

/**
 * How a variant should be named to a human: the label when there is one, else the bare slot with a
 * marker so a legacy row never masquerades as an identified one.
 */
export function describeSlot(slot, label) {
  return label ? `${label} (slot ${slot})` : `slot ${slot} (unlabelled — pre-T5 row)`;
}

/**
 * Can two rows from DIFFERENT rounds be told apart from the ledger alone? True only when both carry
 * labels. This is T5's acceptance criterion, expressed as code so a test can assert it directly
 * rather than a human eyeballing two JSON blobs.
 */
export function isTraceableAcrossRounds(shownA, shownB) {
  const a = readShown(shownA);
  const b = readShown(shownB);
  if (a.length === 0 || b.length === 0) return false;
  return a.every((e) => e.shape === SHAPE_LABELLED) && b.every((e) => e.shape === SHAPE_LABELLED);
}
