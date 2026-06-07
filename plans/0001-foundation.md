# Foundation: first green proofs, the showcase seed, and the agent loop

- **Status:** active
- **Last updated:** 2026-06-07
- **Last touched on:** macOS (darwin arm64), initial setup session — M0 + M1 done

## Goal

Take the repo from "toolchain installed" to a working AI-assisted proving loop:
Mathlib cache pulled and `lake build` green, a handful of elegant hand-written
proofs that seed the showcase, and a first Claude Code skill + agent that close a
goal through the compiler-feedback loop and verify it with a green build. This is
the foundation every later phase builds on — once the loop is trustworthy, the
benchmark (plan 0002) and the toolkit sharpening have something to stand on.

Built as ordered milestones (M0–M2). Each is independently shippable.

## Context

Fresh `lake init Praxis math` project: Lean `v4.30.0` (`lean-toolchain`), Mathlib
pinned to `v4.30.0` in `lakefile.toml`. Library `Praxis` with a placeholder
`Praxis/Basic.lean`. Conventions live in `AGENTS.md`; direction in
`plans/ROADMAP.md`.

The single most important commitment: **`lake build` is the only judge.** No
proof counts, and no agent run "succeeds," until the build is green with no
`sorry`.

## Design

### Library shape
- `Praxis/Basic.lean` — keep minimal / sanity import.
- `Praxis/Showcase/` — one file per topic of elegant, documented proofs
  (e.g. `Naturals.lean`, `Logic.lean`, `Arithmetic.lean`). Each theorem carries a
  `/-- what + why interesting -/` docstring.
- Re-export topics from `Praxis.lean`.

### The proving loop (per `AGENTS.md`)
State goal → read goal state → cheap automation first (`exact?`, `simp?`,
`aesop?`, `omega`, `decide`, `linarith`/`nlinarith`) and **materialize** the
printed script → on failure read the exact error and search lemmas
(`exact?` / LeanSearch / Loogle) → patch incrementally → confirm with `lake build`.

### Agent loop (M2)
Two bridge options, in order of preference:
1. **`lean-lsp-mcp`** — MCP server giving the agent live goal state, diagnostics,
   hover types, and lemma search without full rebuilds. Preferred; this is the
   fast loop.
2. **`lake build` fallback** — write file, build, parse errors, patch. Slower but
   zero extra infrastructure; always available.

The agent (`.claude/agents/`) and skill (`.claude/skills/`) both end on a verified
green build, never on self-assessment. Decide MCP-vs-fallback in M2 based on how
cleanly `lean-lsp-mcp` installs against Lean `v4.30.0`.

## Milestones

### M0 — Toolchain & green build
- [x] Install elan (Homebrew `elan-init`); Lean `v4.30.0` stable as default.
- [x] `lake init Praxis math` — project, `lakefile.toml`, `lean-toolchain`.
- [x] `lake update` + `lake exe cache get` — Mathlib resolved, 8459-file cache.
- [x] `lake build` green (placeholder `Praxis/Basic.lean`).
- **Done when:** `lake build` exits 0 with Mathlib available (`import Mathlib`
  works in a scratch file). _Confirmed: build exits 0; `.lake` ~7.8 GB._

### M1 — First elegant proofs (showcase seed) ✅ DONE
- [x] `Praxis/Showcase/Classics.lean`: 10 documented theorems closed by the loop
      (`simp`, `omega`, `decide`, `norm_num`, `linarith`, `nlinarith`, lemma
      search, and a hand-written induction).
- [x] Each theorem has a docstring (what + why interesting). No `sorry`.
- [x] Re-exported from `Praxis.lean`; `lake build` green (warning-free after
      disabling Mathlib's contribution linters in `lakefile.toml`).
- **Done when:** a recognizable set of beautiful, machine-checked proofs builds,
      ready to pull into the README. _Confirmed: green build, examples in README._

### M2 — First agent loop
- [x] Stand up the agent bridge: `lean-lsp-mcp` installs and runs cleanly against
      Lean `v4.30.0`. Canonical repo `oOo0oOo/lean-lsp-mcp` (PyPI v0.26.2),
      installed as a `uv` tool pinned to **Python 3.12** (system Python is 3.14;
      the package hard-pins `mcp==1.27.0`/`leanclient==0.10.0`, so 3.12 is the
      safe interpreter) → `/Users/tt/.local/bin/lean-lsp-mcp`. `ripgrep` installed
      for `lean_local_search`.
- [x] Smoke-tested via a manual MCP handshake: server speaks MCP and exposes all
      23 tools (`lean_goal`, `lean_diagnostic_messages`, `lean_multi_attempt`,
      `lean_verify`, `lean_leansearch`, `lean_loogle`, …).
- [x] End-to-end loop validated: `lean_multi_attempt` tried 4 tactics on a warm
      file in **12 s** (~3 s/tactic), correctly reporting `simp`/`omega`/`ring`
      close `0 + n = n + 0` and `rfl` fails (with the defeq reason). vs ~27 s
      **per** attempt with cold `lake env lean` — ~9× faster and it scales.
- [x] `.claude/skills/prove-goal` + `.claude/agents/lean-prover` already encode the
      automation→search→patch→verify loop (built in the 0001 session); the
      tournament (plan 0002) already demonstrated closing fresh `sorry` goals with
      verified green checks.
- [ ] **Pending user approval:** add the project-scoped `.mcp.json` server entry
      (Claude Code startup config — requires explicit opt-in) and confirm the tools
      connect live in-session.
- **Done when:** an agent reads live goal state via the MCP loop and closes a goal,
      verified. _Server + loop proven independently; only the in-session wiring
      (`.mcp.json` approval) remains._

**Gotcha — cold-start timeout:** the *first* `lean_*` request on a freshly opened
Mathlib-importing file can hit the LSP's internal 30 s request timeout while
`Mathlib.Tactic` elaborates (~35 s observed), even with `lake build` already green.
The fix is simply to retry once warm (subsequent requests are fast). Worth a warm-up
call (e.g. `lean_goal` on the target file) before timing-sensitive work.

**Config note:** `.mcp.json` points at the absolute `uv`-tool binary for
reliability on this machine; for portability swap to
`{"command":"uvx","args":["--python","3.12","lean-lsp-mcp"]}` (any machine with uv).
`LEAN_PROJECT_PATH` is set explicitly; the server also falls back to cwd.

## Open questions

- **`lean-lsp-mcp` vs. fallback:** ✅ resolved — installs and runs cleanly against
  Lean `v4.30.0` (via `uv` on Python 3.12). It is the preferred fast loop; the
  `lake env lean` path stays as a zero-infra fallback. Only the `.mcp.json` opt-in
  remains.
- **LeanCopilot / LeanHammer:** heavy deps (model downloads, external servers).
  Deferred to Phase 3 — pull in only where cheap automation demonstrably stalls.
- **`native_decide`:** widens the trust base (invokes the compiler). Default to
  disallowed in committed proofs; revisit if a benchmark goal genuinely needs it.
- **Showcase topics:** which first? Candidate: number theory / inequalities (rich
  automation story) vs. logic (clean, dependency-light). Pick in M1.

## Done when

- `lake build` is green with Mathlib available, no `sorry` on `main`.
- A documented set of elegant proofs seeds the showcase.
- A skill + agent close a goal through the compiler-feedback loop and verify it
  with a green build — the loop the rest of the roadmap sharpens.
