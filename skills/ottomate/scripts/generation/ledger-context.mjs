// Phase 2 — persistence. The ledger becomes the memory across sessions.
//
// Three mechanisms over the design_decisions API (which already exists — no DB change):
//   1. rejected[] wiring     — a fresh round is TOLD what was turned down, and never re-offers it.
//   2. reload-on-resume      — a resumed session re-reads the ledger instead of re-deriving it.
//   3. snapshot differ       — a rebuild cannot silently regress a LOCKED decision.
//
// The pure functions below are unit-tested with no DB. The fetch wrappers are the one-door API access
// used at runtime (backup-first for any write).

import { createHash } from 'node:crypto';

const sha256 = (s) => createHash('sha256').update(String(s)).digest('hex');

// ── 1. rejected[] + frozen controls ─────────────────────────────────────────────────────────────

/**
 * Every value turned down for a target, grouped by sub-decision axis. The generation method's input #6:
 * a fresh round is fed this and NEVER re-offers a rejected value.
 * @param {Array<object>} decisions  design_decisions rows for one target
 * @returns {Record<string, Array<{value:*, why:string, round?:number}>>}
 */
export function rejectedByAxis(decisions) {
  const out = {};
  for (const d of decisions) {
    const rej = Array.isArray(d.rejected) ? d.rejected : [];
    for (const r of rej) {
      (out[d.axis] ??= []).push({ value: r.value, why: r.why_rejected ?? r.why ?? 'rejected', round: d.round });
    }
  }
  // de-dupe by value within an axis
  for (const axis of Object.keys(out)) {
    const seen = new Set();
    out[axis] = out[axis].filter((r) => { const k = JSON.stringify(r.value); if (seen.has(k)) return false; seen.add(k); return true; });
  }
  return out;
}

/**
 * The chosen value of every LOCKED decision — a frozen control (doctrine 39: harvest-before-ask). A
 * locked sub-decision is NOT re-offered as a variant axis; it is fixed. The generation method excludes
 * these from the round's contested axes.
 * @returns {Record<string, *>}  axis -> chosen_value
 */
export function frozenByAxis(decisions) {
  const out = {};
  for (const d of decisions) if (d.status === 'locked') out[d.axis] = d.chosen_value;
  return out;
}

// ── 2. reload-on-resume ──────────────────────────────────────────────────────────────────────────

/**
 * The one-call picture a resumed session loads, so the ledger is read automatically, not re-derived.
 * @returns {{ open:Array, locked:Array, rejectedByAxis:object, frozenByAxis:object, counts:object }}
 */
export function resumeSummary(decisions) {
  const open = decisions.filter((d) => d.status === 'proposed' || d.status === 'in-review');
  const locked = decisions.filter((d) => d.status === 'locked');
  return {
    open,
    locked,
    rejectedByAxis: rejectedByAxis(decisions),
    frozenByAxis: frozenByAxis(decisions),
    counts: {
      total: decisions.length,
      open: open.length,
      locked: locked.length,
      rejected: decisions.filter((d) => d.status === 'rejected').length,
      superseded: decisions.filter((d) => d.status === 'superseded').length,
    },
  };
}

// ── 3. snapshot differ (the regression gate) ─────────────────────────────────────────────────────

/**
 * The compact deterministic snapshot stored (via PATCH) when a decision LOCKS. Captures enough to
 * detect a later regression: the value, and a hash of the chosen variant's source region when available
 * (so source drift is caught even when the value label is unchanged).
 * @returns {string}  JSON string for the design_decisions.snapshot column
 */
export function snapshotForLock(decision, source = null) {
  return JSON.stringify({
    axis: decision.axis,
    chosen_value: String(decision.chosen_value),
    source_sha256: source == null ? null : sha256(source),
    at: decision.at ?? new Date().toISOString(),
  });
}

/**
 * Diff the CURRENT build against the snapshots of LOCKED decisions. A changed value or source hash with
 * no intervening unlock is a REGRESSION.
 * @param {Array<object>} lockedDecisions  locked rows, each with a `snapshot` string
 * @param {Record<string,*>} currentByAxis  the values the current build ships, keyed by axis
 * @param {Record<string,string>} [currentSourceByAxis]  the current source region per axis
 * @returns {Array<{axis:string, was:*, now:*, kind:'value'|'source'}>}
 */
export function diffAgainstSnapshots(lockedDecisions, currentByAxis, currentSourceByAxis = {}) {
  const regressions = [];
  for (const d of lockedDecisions) {
    if (!d.snapshot) continue;
    let snap;
    try { snap = JSON.parse(d.snapshot); } catch { continue; }
    const axis = snap.axis ?? d.axis;
    if (Object.prototype.hasOwnProperty.call(currentByAxis, axis)) {
      const now = currentByAxis[axis];
      if (String(now) !== String(snap.chosen_value)) {
        regressions.push({ axis, was: snap.chosen_value, now: String(now), kind: 'value' });
        continue;
      }
    }
    if (snap.source_sha256 && Object.prototype.hasOwnProperty.call(currentSourceByAxis, axis)) {
      const nowHash = sha256(currentSourceByAxis[axis]);
      if (nowHash !== snap.source_sha256) {
        regressions.push({ axis, was: snap.source_sha256.slice(0, 8), now: nowHash.slice(0, 8), kind: 'source' });
      }
    }
  }
  return regressions;
}

export function formatRegressions(regressions) {
  if (!regressions.length) return 'no regressions — every locked decision still holds';
  return `REGRESSION on ${regressions.length} locked decision(s):\n`
    + regressions.map((r) => `  ${r.axis}: locked ${r.kind} was "${r.was}", rebuild has "${r.now}" — unlock it or restore it`).join('\n');
}

// ── thin one-door API wrappers (runtime; backup-first for writes) ─────────────────────────────────

export async function fetchDecisions(baseUrl, token, slug, params = {}) {
  const qs = new URLSearchParams(params).toString();
  const res = await fetch(`${baseUrl}/api/projects/${slug}/design-decisions${qs ? `?${qs}` : ''}`, {
    headers: { authorization: `Bearer ${token}` },
  });
  const body = await res.json().catch(() => null);
  const rows = Array.isArray(body) ? body : (body?.decisions ?? body?.rows ?? []);
  return { status: res.status, rows };
}

export async function lockDecision(baseUrl, token, id, snapshot) {
  const res = await fetch(`${baseUrl}/api/design-decisions/${id}`, {
    method: 'PATCH',
    headers: { 'content-type': 'application/json', authorization: `Bearer ${token}` },
    body: JSON.stringify({ status: 'locked', confirmed: true, snapshot }),
  });
  return { status: res.status, body: await res.json().catch(() => null) };
}
