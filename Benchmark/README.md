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
| [`G0_MulEqZero`](Goals/G0_MulEqZero.lean) | easy | **automation** | `mul_eq_zero.mp` (1 line) | `a·b = 0 → a = 0 ∨ b = 0`; library/`exact?` one-liner |
| [`G1_SumOdds`](Goals/G1_SumOdds.lean) | medium | **tournament** | induction + `Finset.sum_range_succ` + `ring` (3 lines) | `∑_{i<n}(2i+1) = n²`; structured strategy won |
| [`G2_SixDvdCube`](Goals/G2_SixDvdCube.lean) | hard | **tournament** | reduce to `ZMod 6` + `decide` (3 lines) | `6 ∣ n³ − n`; finite-quotient insight no one-shot tactic finds |
| [`F1_EulerPrime`](Goals/F1_EulerPrime.lean) | — (false) | **refuted** | gate counterexample `n = 40` | `n²+n+41 = 1681 = 41²`; recorded as the proved negation `not_euler_prime_poly` |

### First run — 2026-06-07 (`prove-tournament` workflow, 13 agents)

- **3/3 true goals closed**, **1/1 false conjecture refuted** — and every proof was
  re-verified independently with `lake env lean` (no error, no `sorry`).
- The spread is the point: G0 fell to a one-shot library lemma (**automation**
  floor), but G1 and G2 needed strategy diversity (**tournament**) — one-shot
  `simp`/`omega`/`nlinarith` can't see an induction or a reduction to `ZMod 6`.
  That's the open→closed lift the portfolio buys over single-shot automation.
- The validity gate refuted F1 *before* the tournament ran, spending zero proof
  effort on a false statement — exactly its job.

**Scoreboard:** automation 1 · tournament 2 · open 0 · refuted 1.

## The two numbers that matter

The toolkit improving means goals moving **open → closed** (and, secondarily,
**tournament → automation** as cheap tactics learn to cover more). Every benchmark
entry is a real Lean file, so the claim is reproducible: a solved goal type-checks
with no `sorry`.
