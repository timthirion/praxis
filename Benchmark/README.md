# Benchmark

A small, growing set of Lean goals of graded difficulty, used to **measure the
prover toolkit**. The question each goal answers is: can we close it, and *how* —
by cheap automation, by the agent tournament, or not at all?

This directory lives **outside** the `Praxis` library on purpose: unproven goals
carry a `sorry`, which would break `lake build`. Each goal is checked individually
with `lake env lean Benchmark/Goals/<file>.lean` instead.

## Status legend

- **automation** — closed by a single cheap tactic (`simp`/`omega`/`decide`/
  `nlinarith`/`exact?`-found lemma). The toolkit's floor.
- **tournament** — closed only by the strategy-diverse portfolio (a structured or
  library strategy that one-shot automation missed).
- **open** — not yet closed by either.
- **refuted** — the conjecture is false; the validity gate found a counterexample.

## Goals & results

| Goal | Difficulty | Status | Closed by | Notes |
|------|-----------|--------|-----------|-------|
| [`G0_MulEqZero`](Goals/G0_MulEqZero.lean) | easy | _pending_ | — | `a·b = 0 → a = 0 ∨ b = 0` |
| [`G1_SumOdds`](Goals/G1_SumOdds.lean) | medium | _pending_ | — | `∑_{i<n}(2i+1) = n²` |
| [`G2_SixDvdCube`](Goals/G2_SixDvdCube.lean) | hard | _pending_ | — | `6 ∣ n³ − n` over ℤ |
| [`F1_EulerPrime`](Goals/F1_EulerPrime.lean) | — (false) | _pending_ | — | `n²+n+41` prime — false at n=40 |

_Results filled in by the `prove-tournament` workflow (see
`plans/0002-portfolio-prover.md`)._

## The two numbers that matter

The toolkit improving means goals moving **open → closed** (and, secondarily,
**tournament → automation** as cheap tactics learn to cover more). Every benchmark
entry is a real Lean file, so the claim is reproducible: a solved goal type-checks
with no `sorry`.
