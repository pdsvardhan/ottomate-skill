// P2-B: a baseline that does not exist is a FAIL — NEVER auto-created. Auto-blessing the current,
// possibly-buggy UI is the "assert-the-bug-back" trap for pixels (T2 §0). The future L6 pixel layer
// consults this so a missing golden image can never become a silent pass.
import { promises as fs } from 'node:fs';

export async function requireBaseline(absPath) {
  try {
    const s = await fs.stat(absPath);
    return { ok: s.size > 0, detail: s.size > 0 ? `baseline present (${s.size}B)` : 'baseline is empty', observed: s.size };
  } catch {
    return { ok: false, detail: `missing baseline: ${absPath} — refusing to auto-bless`, observed: null };
  }
}
