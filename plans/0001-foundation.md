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
- [ ] Stand up the agent bridge: try `lean-lsp-mcp`; record whether it installs
      cleanly, else document the `lake build` fallback loop.
- [ ] A `.claude/skills/` "prove this goal" skill encoding the automation→search→
      patch→verify loop.
- [ ] A `.claude/agents/` prover agent that reads goal state, attempts a goal, and
      **verifies with a green build** before reporting success.
- [ ] Demonstrate: the agent closes a fresh goal (one not already in the showcase)
      end to end, with a green build as proof.
- **Done when:** an agent closes a previously-`sorry` goal and `lake build` is
      green, with the loop reproducible.

## Open questions

- **`lean-lsp-mcp` vs. fallback:** does it install cleanly against Lean `v4.30.0`
  and integrate with Claude Code's MCP config? Decide in M2; record the answer.
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
