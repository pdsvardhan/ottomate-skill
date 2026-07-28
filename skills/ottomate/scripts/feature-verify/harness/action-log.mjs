// P3-C2: the ActionLog — a per-case step recorder so CaseResult.action_log is POPULATED (today the
// registry leaves it empty). A spec makes one per case, records each drive step, and hands the array to
// matrix.record({ action_log: log.toJSON() }). The clock is injectable so it's deterministically tested.
// See docs/plans/2026-07-28-task3-P3C-*.

export class ActionLog {
  constructor(opts = {}) {
    this._now = opts.now ?? (() => new Date().toISOString());
    this.steps = [];
  }

  /** Record one drive step: an action and an optional structured detail. Chainable. */
  step(action, detail) {
    this.steps.push({ seq: this.steps.length, at: this._now(), action, ...(detail !== undefined ? { detail } : {}) });
    return this;
  }

  toJSON() { return this.steps; }
}
