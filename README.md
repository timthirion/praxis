<div align="center">

# Praxis

**A practice ground for AI-assisted theorem proving in [Lean 4](https://lean-lang.org).**

*Build the toolkit. Measure what it can prove. Collect the beautiful proofs it finds.*

</div>

---

Praxis is an experiment in **AI-assisted theorem proving**. The aim is to learn the
craft deeply — and eventually prove something novel — by building a small toolkit of
agents and skills that drive Lean's compiler feedback loop, and a benchmark that
measures how much of it they can actually close.

The repo has one defining idea: **the prover toolkit is the artifact, not just the
proofs.** A theorem only counts when `lake build` is green — that machine check is
the ground truth every claim here is measured against. The proofs below are the
showcase; the loop that produces them is the point.

> 📐 Direction lives in [`plans/ROADMAP.md`](plans/ROADMAP.md). Conventions and the
> proving loop live in [`AGENTS.md`](AGENTS.md). The toolkit lives in
> [`.claude/`](.claude) — a `prove-goal` skill and a `lean-prover` agent.

## A taste

Every snippet below is checked by `lake build` — no `sorry`, no hand-waving. From
[`Praxis/Showcase/Classics.lean`](Praxis/Showcase/Classics.lean):

```lean
/-- There are infinitely many primes. -/
theorem infinitude_of_primes (n : ℕ) : ∃ p, n ≤ p ∧ p.Prime :=
  Nat.exists_infinite_primes n

/-- √2 is irrational. -/
theorem sqrt_two_irrational : Irrational (Real.sqrt 2) :=
  irrational_sqrt_two

/-- Gauss's sum: 2·(0 + 1 + ⋯ + n) = n·(n+1), by structured induction. -/
theorem two_mul_sum_range (n : ℕ) :
    2 * (∑ i ∈ Finset.range (n + 1), i) = n * (n + 1) := by
  induction n with
  | zero => simp
  | succ k ih => rw [Finset.sum_range_succ, Nat.mul_add, ih]; ring

/-- A baby AM–GM: 2ab ≤ a² + b², because (a − b)² ≥ 0. -/
theorem two_mul_le_sq_add_sq (a b : ℝ) : 2 * a * b ≤ a ^ 2 + b ^ 2 := by
  nlinarith [sq_nonneg (a - b)]
```

Each was closed through the loop in [`AGENTS.md`](AGENTS.md): try cheap automation
(`exact?`, `simp`, `omega`, `decide`, `linarith`, `nlinarith`) first, search for
lemmas when it stalls, materialize the proof, and verify with a green build.

## Setup

The toolchain is managed by [`elan`](https://github.com/leanprover/elan); the Lean
version is pinned in [`lean-toolchain`](lean-toolchain) and Mathlib in
[`lakefile.toml`](lakefile.toml).

```bash
# Install elan (macOS): brew install elan-init
# Then, from the repo root — download Mathlib's prebuilt cache (multi-GB) and build:
lake exe cache get
lake build              # the ground-truth check — green means the proofs are correct
```

```bash
lake env lean Praxis/Showcase/Classics.lean   # type-check one file, fast
```

**Agent loop (optional but recommended).** The repo ships a project
[`.mcp.json`](.mcp.json) wiring in [`lean-lsp-mcp`](https://github.com/oOo0oOo/lean-lsp-mcp),
which gives an agent live goal state (`lean_goal`), batched tactic trials
(`lean_multi_attempt`), and Mathlib lemma search — the fast feedback loop
(~3 s/tactic warm vs ~27 s cold). It launches via [`uv`](https://docs.astral.sh/uv/)
(`brew install uv`); your client will ask to trust the server on first connect.

## Status

Foundation complete (plan [`0001`](plans/0001-foundation.md)): toolchain up, Mathlib
cached, `lake build` green, a showcase of ten machine-checked proofs, and the live
agent feedback loop (`lean-lsp-mcp`). The adversarial **tournament prover + validity
gate** ([`0002`](plans/0002-portfolio-prover.md)) closes graded benchmark goals and
refutes false conjectures. Next: sharpen the toolkit against a larger benchmark. See
the [roadmap](plans/ROADMAP.md).
