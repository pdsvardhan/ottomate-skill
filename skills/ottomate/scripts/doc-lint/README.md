# doc-lint — free-tool leg of the documentation standard (Phase 4, D4)

Runs the two adopted free linters + small native checks over a project's
hand-written docs, ramp-aware on `projects.doc_gate`.

## Install (VAULT7A, once)
```
# Vale (MIT) + lychee (OSS) → ~/.local/bin
# vale:   https://github.com/vale-cli/vale/releases   (vale_<v>_Linux_64-bit.tar.gz)
# lychee: https://github.com/lycheeverse/lychee/releases (lychee-x86_64-unknown-linux-gnu.tar.gz)
```
Both are single binaries; no service, no cost. Installed 2026-08-04: vale 3.17.0, lychee 0.24.2.

## Run
```
node run.mjs --project <slug> [--repo /mnt/storage/websites/<slug>] [--gate off|warn|block]
```
- **Vale.Avoid** flags retired/dropped terms from `reject-seeds/<slug>.txt` (R-DOC-2), across the
  hand-written docs EXCEPT `decisions/` (ADRs must be free to name what they dropped — R-DOC-8).
- **lychee** flags broken links (R-DOC-7).
- Native: required title present (R-DOC-6); a generated doc (`FEATURES.md`) must carry a
  `generated from registry` provenance header (R-DOC-1).
- Ramp: `block` → exit 3 on any violation; `warn`/`off` → advisory (exit 0). `--gate` overrides the
  value read from `GET /api/projects/<slug>`.

## Per-project retired terms
Curate `reject-seeds/<slug>.txt` (one term/regex per line, `#` comments allowed). Seed from that
project's dropped features + superseded ADRs, but keep terms DISTINCTIVE (ban "Telegram", not "auth")
to avoid false positives. Legitimate history mentions belong in `decisions/` (auto-exempt) or are
rephrased ("formerly pushed to Telegram; dropped in adr-010").

Env: `VALE_BIN`, `LYCHEE_BIN` (default `~/.local/bin/*`), `FV_TRACKER_BASE` (default `127.0.0.1:8110`).
