# Praxis Roadmap

## Mission

Build a toolkit for **AI-assisted theorem proving** in Lean 4 that we understand
deeply enough to eventually prove something novel. Every piece is chosen to be
**machine-checked**, **measurable**, and **explainable**.

This repository has one defining constraint that shapes everything: **the
distinctive artifact is the prover toolkit, not just the proofs.** Skills and
agents drive Lean's compiler/LSP feedback loop; a benchmark tells us how much of
it they can close. The proofs we collect are the showcase — beautiful, fully
machine-checked — but the loop that produces them is the product.

Design bias:
- **Correctness is non-negotiable and objective** — a theorem counts only when
  `lake build` is green. That is the reference, the analog of an MSE-vs-truth.
- **Measurability** — the benchmark records *automation-closed* vs.
  *agent-closed* vs. *open*. "The toolkit improved" must be a number.
- **Automation before neural** — `exact?`, `simp?`, `aesop?`, `omega`,
  `linarith` close most of what we need. ML tactics (LeanCopilot, Hammer) earn
  their weight only where cheap automation stalls.

## Pillar: adversarial / tournament proving

The cheap, perfect, automated verifier (the Lean kernel) is the property that
makes *generate-many-and-filter* the right paradigm here — and it's the reason
this repo leans on a structure a deterministic engineering project wouldn't. Two
mechanisms run throughout the roadmap:

- **Portfolio / tournament prover** — fan strategy-diverse agents (automation-,
  library-, structure-first; later LeanCopilot/Hammer) at a goal; keep whatever
  turns the build green; rank survivors by objective quality metrics (proof
  length, build time, `#print axioms` footprint). No LLM judge for correctness —
  the compiler decides.
- **Counterexample adversary** — before/while proving, an adversary tries to
  *refute* the statement (property testing, bounded `decide`, proving the
  negation). It guards against the biggest formalization failure mode: spending
  effort on a false conjecture. Essential as we push toward unproven (novel)
  statements.

Note what we deliberately *don't* do: point an adversary at an accepted proof to
hunt flaws — the kernel already guarantees there are none. The adversarial value
is in *statement validity* and *attack diversity*, not proof critique.

## Where we are today

A fresh Lean 4 + Mathlib project (`Praxis` library, Lean `v4.30.0`). The roadmap
below builds from "first green proof" up to an agent that closes nontrivial goals
through the compiler-feedback loop, with a benchmark and an aesthetic showcase.

## Phases

Phases are roughly ordered; boundaries are soft. Each becomes one or more
`plans/NNNN-*.md` as work starts.

### Phase 0 — Foundation: a green proof and the loop, by hand
Toolchain installed, Mathlib cache pulled, `lake build` green. A handful of
hand-written elegant proofs in `Praxis/` (using `exact?`, `simp`, `omega`,
`linarith`, `decide`) to learn the loop and seed the showcase. Proves the
ground-truth pipeline before any automation tooling.

### Phase 1 — The agent feedback loop
Wire an agent to Lean's diagnostics. Stand up `lean-lsp-mcp` (live goal state,
diagnostics, lemma search) — or, as a fallback, a disciplined `lake build` loop.
A first Claude Code **skill** ("prove this goal") and **agent** that read the
goal, try automation, search for lemmas, patch, and *verify with a green build* —
never declaring success on self-assessment.

### Phase 2 — The benchmark
A curated set of goals of graded difficulty (drawn from Mathlib exercises,
miniF2F-style competition problems, and our own). A runner that records, per goal,
whether it closes by **pure automation**, by the **agent loop**, or stays
**open** — emitting a results table. This is the backbone for every "the toolkit
got better" claim.

### Phase 3 — Sharpening the toolkit
Iterate skills/agents against the benchmark: better lemma search, automation
laddering (`omega`/`linarith`/`nlinarith`/`polyrith`), proof-state-aware
retrying, optional LeanCopilot / LeanHammer where automation stalls. Each change
must move a benchmark number.

### Phase 4 — The aesthetic showcase
Curate the most beautiful machine-checked proofs into a polished README and
write-ups — each with its docstring, the loop that found it, and what made it
interesting. The first publishable artifact.

### Phase 5+ — Toward something novel
With a trustworthy loop and benchmark, attempt a small but genuinely new result
(or a slick new proof of a known one), formalized and machine-checked end to end.

## Active plans

- [`0001-foundation.md`](0001-foundation.md) — Toolchain up, first green proofs,
  the showcase seed, and the first agent loop (Phases 0–1, staged as milestones).
  **active** (M0 + M1 done)
- [`0002-portfolio-prover.md`](0002-portfolio-prover.md) — The adversarial /
  tournament pillar: a portfolio prover + counterexample adversary, measured on a
  benchmark slice. **active**
