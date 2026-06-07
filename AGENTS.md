# AGENTS.md

Guidance for AI agents working on this repository.

## Project Goal

**Praxis** is a practice ground for **AI-assisted theorem proving** in Lean 4.
The end goal is to learn the craft deeply and, eventually, to prove something
novel — so the work prioritizes *machine-checked correctness*, a *measurable*
sense of what our tooling can and cannot prove, and *explainability* over a broad
pile of one-off lemmas.

This repository has one defining constraint that shapes everything: **the
distinctive artifact is the prover toolkit, not just the proofs.** We build a set
of Claude Code **skills** and **agents** that propose, run, and verify Lean proofs
inside a tight **compiler/LSP feedback loop**, and we keep a **benchmark** that
measures how much of it the toolkit can close — unaided automation first, then
agent-assisted. The proofs we collect are the showcase; the loop that produces
them is the point.

The ground truth is never an opinion: a theorem counts only when `lake build` is
green. That green build is our equivalent of a reference image — the objective
check every claim in this repo is measured against.

See `plans/ROADMAP.md` for direction and `plans/` for current, machine-portable
plans.

## Tech Stack

- **Prover:** [Lean 4](https://lean-lang.org) (currently `v4.30.0`, pinned in
  `lean-toolchain`). Installed and version-managed by **elan**.
- **Library:** [Mathlib](https://github.com/leanprover-community/mathlib4),
  pinned in `lakefile.toml` to the matching Lean release. Build artifacts come
  from the prebuilt cache (`lake exe cache get`), not local compilation.
- **Build tool:** **Lake** (ships with Lean). One library, `Praxis`.
- **Agent feedback loop:** the Lean **LSP** / compiler diagnostics, bridged by
  [`lean-lsp-mcp`](https://github.com/oOo0oOo/lean-lsp-mcp) — installed and wired
  (project `.mcp.json`; `uv`-tool on Python 3.12). It exposes live goal state
  (`lean_goal`), batched tactic trials (`lean_multi_attempt`), diagnostics, and
  lemma search (`lean_state_search`/`lean_leansearch`/`lean_loogle`). This is the
  fast loop (~3 s/tactic warm vs ~27 s cold); a plain `lake build` loop is the
  zero-infra fallback. Warm-up gotcha: the first call on a fresh Mathlib file may
  hit the LSP's 30 s timeout — retry once warm.
- **Optional ML tactics:** [LeanCopilot](https://github.com/lean-dojo/LeanCopilot)
  (local/remote LLM tactic suggestions) and
  [LeanHammer](https://github.com/JOSHCLUNE/LeanHammer) (premise selection → ATP →
  reconstruction). Added only when a plan calls for them — they are heavy deps.

## Scope: the toolkit is the product

A deliberate divergence worth stating plainly: **Praxis is not a Lean tutorial
and not a grab-bag of formalized theorems.** It is a *prover toolkit* with a
*benchmark*, and a curated *showcase* of what that toolkit produces.

- We do **not** chase coverage of a math textbook. Each theorem earns its place by
  exercising the toolkit (a new tactic, a harder search, a cleaner agent loop) or
  by being beautiful enough for the showcase.
- We do **not** trust an LLM's claim that a proof works. Only `lake build` decides.
  Every agent and skill ends its loop on a clean build, never on self-assessment.
- We **do** keep the loop measurable: the benchmark records which goals close with
  pure automation vs. agent assistance, so "the toolkit got better" is a number,
  not a vibe.

## The proving loop (how agents should work here)

The whole game is the compiler-feedback loop. Cheap, deterministic automation
before anything neural:

1. **State the goal** as a `theorem ... := by` with `sorry`, or an explicit type.
2. **Read the goal state** (via LSP/MCP, or `lake build` errors).
3. **Try cheap automation first**, and capture the *concrete* script it prints:
   `exact?`, `apply?`, `rw?`, `simp?`, `aesop?`, `omega`, `decide`,
   `linarith` / `nlinarith`, `polyrith`. Prefer the materialized tactic over the
   search tactic in committed code (faster, reproducible).
4. **On failure, read the exact error / remaining goal** and search for lemmas
   (`exact?`, LeanSearch, Loogle) — don't guess lemma names.
5. **Patch and re-check incrementally**; iterate to zero diagnostics.
6. **Confirm with a clean `lake build`** before declaring done. No `sorry`, no
   `admit`, no `native_decide` in committed proofs unless a plan explicitly allows
   it (it widens the trust base).

## Build & Run

```bash
# One-time, after clone (downloads the prebuilt Mathlib cache — multi-GB):
lake exe cache get

# Build the library (the ground-truth check):
lake build

# Type-check a single file fast (no full rebuild):
lake env lean Praxis/<File>.lean

# Update dependencies (re-pins Mathlib; follow with cache get):
lake update && lake exe cache get
```

`elan` auto-selects the toolchain from `lean-toolchain`; never invoke a global
`lean`. If `lake build` is green, the proofs are correct — that is the contract.

## Coding Style

- **Lean 4 + Mathlib conventions.** `theorem`/`lemma` names in `lowerCamelCase`
  describing the statement; `def`s and types in `UpperCamelCase`. Follow the
  [Mathlib style guide](https://leanprover-community.github.io/contribute/style.html)
  and naming conventions where they apply.
- Prefer **structured, readable proofs**: materialized tactics over search
  tactics, `calc` blocks for chains, named hypotheses over `this`. A proof in the
  showcase should be legible to a human, not just accepted by Lean.
- Document each showcase theorem with a `/-- ... -/` docstring saying *what* it
  proves and *why it's interesting* (the README and posts pull from these).
- One coherent topic per file under `Praxis/`; re-export from `Praxis.lean`.
- No `sorry`/`admit` in committed code. If a proof is in progress, it lives on a
  branch or behind a clearly-marked plan, never on `main`.

## Benchmark & Measurement

Measurement is a first-class priority, not an afterthought — it is how we know the
toolkit improved.

- The benchmark is a set of goals with known difficulty. For each we record:
  closed by **pure automation**, closed by **agent loop**, or **open**.
- A change to a skill or agent should move a benchmark number, and the plan should
  cite which one. "The agent is smarter now" must cash out as goals moved from
  *open* → *closed* (or *agent* → *automation*).
- Keep results reproducible: every benchmark goal is a real Lean file that
  `lake build` checks. The benchmark is code, not a spreadsheet.

## Skills & Agents

The toolkit lives under `.claude/`:

- `.claude/skills/` — reusable proving procedures (e.g. a "prove this goal" loop
  that drives automation → search → patch → verify).
- `.claude/agents/` — agent definitions specialized for proof attempts (read goal
  state, try tactics, never declare success without a green build).

These are the deliverables, evolved through the roadmap. When you improve one,
update its file *and* the benchmark that demonstrates the improvement.

## Git Workflow

- Solo repo: commit directly to `main` and push freely. Branch only for
  in-progress proofs that don't yet build.
- Commit plan updates alongside the code they describe; a ticked checkbox in
  `plans/` is the source of truth for "what's done."
- Use `git mv` for moves/renames to preserve history.
- End commit messages with the standard `Co-Authored-By` trailer.
- Never commit a `sorry` to `main`.
