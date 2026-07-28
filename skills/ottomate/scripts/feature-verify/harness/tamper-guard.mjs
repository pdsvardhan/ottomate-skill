// P2-B: the file-tamper tripwire. Flag if any of the feature's build commits touched a verifier-owned
// file (the matrix). A tampered matrix is the "edit the test to pass" hack (T3 §1) — re-derive from the
// requirement, never trust it. git call is injectable so the logic is testable with no repo.
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
const pexec = promisify(execFile);

const defaultRunGit = async (repoRoot, commits) => {
  const { stdout } = await pexec('git', ['show', '--name-only', '--pretty=format:', ...commits], { cwd: repoRoot, maxBuffer: 4e6 });
  return stdout;
};

export async function assertUntampered({ repoRoot = '.', featureCommits = [], protectedPaths = [], runGit = defaultRunGit }) {
  if (featureCommits.length === 0 || protectedPaths.length === 0)
    return { untampered: true, touched: [], action: 'none', detail: 'nothing to check' };
  const out = await runGit(repoRoot, featureCommits);
  const changed = new Set(out.split('\n').map((s) => s.trim()).filter(Boolean));
  const touched = protectedPaths.filter((p) => changed.has(p));
  return touched.length
    ? { untampered: false, touched, action: 're-derive', detail: `feature commit touched verifier file(s): ${touched.join(', ')}` }
    : { untampered: true, touched: [], action: 'none', detail: 'no verifier file touched by the feature diff' };
}
