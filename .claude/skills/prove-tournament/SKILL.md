---
name: prove-tournament
description: Close a hard Lean goal with the adversarial/tournament approach — first gate it with a counterexample hunt, then fan strategy-diverse provers at it and keep whatever turns the build green, ranking survivors by objective quality. Use when a goal resists the single `prove-goal` loop, or when proving an unverified conjecture whose truth is uncertain.
---

# prove-tournament

For goals where the straight-line `prove-goal` loop stalls, or where you're not
even sure the statement is true. Exploits the domain's defining gift: a cheap,
perfect verifier (`lake build` / `lake env lean`) means you can generate many
attempts and let the compiler filter — no judge of correctness needed.

This skill is the manual counterpart of the `prove-tournament` **workflow**
(`.claude/workflows/prove-tournament.js`); run the workflow for parallel fan-out,
follow this skill when driving it by hand.

## Stage 1 — Validity gate (refute before you prove)

Don't spend effort on a false statement. Try to **break** it first:
- `plausible` (property-based testing) to surface a random counterexample.
- bounded `decide` / `#eval` over small instances.
- prove the negation, or exhibit an explicit counterexample.
If a counterexample appears, **stop** — report it. The goal is *refuted*, not open.

## Stage 2 — Tournament (diverse attack)

Attack with distinct strategies, each in its own scratch file under
`Benchmark/Scratch/` (verify with `lake env lean <file>` — reason hard, verify
sparingly; each check costs ~27 s with `import Mathlib.Tactic`):
- **automation** — one-shot cheap tactics: `simp`, `omega`, `decide`, `norm_num`,
  `nlinarith`, `linarith`, `aesop`. Materialize whatever closes it.
- **library** — search Mathlib for a closing lemma (`exact?`, naming conventions,
  LeanSearch/Loogle). Prefer a one-line application.
- **structured** — decompose with `induction`/`calc`/`obtain`/`have`, then close
  the pieces with automation.

A strategy succeeds only on a verified check: exit 0, **no `error`, no `sorry`**.

## Stage 3 — Rank

Among the correct proofs (the kernel already guaranteed they're correct — don't
re-critique them), pick the best by **objective** metrics: fewest lines, cheapest
closing tactic, smallest `#print axioms` footprint (penalize `native_decide` /
`Classical`). Use a subjective judgment only for readability ties.

Record the winner into `Benchmark/Goals/<goal>.lean` (replacing `sorry`) and update
`Benchmark/README.md`. A win that's also beautiful may graduate to
`Praxis/Showcase/`. See `plans/0002-portfolio-prover.md` and `AGENTS.md`.
