# Portfolio prover & counterexample adversary

- **Status:** active
- **Last updated:** 2026-06-07
- **Last touched on:** macOS (darwin arm64), session following 0001

## Goal

Build the adversarial / tournament layer of the toolkit: a **portfolio prover**
that fans strategy-diverse agents at a goal and keeps whatever turns the build
green, fronted by a **counterexample adversary** that gates effort on whether the
statement is even true. This is the pillar that makes AI-assisted proving here
fundamentally different from a deterministic engineering task — it exploits the
one property the domain hands us for free: a *cheap, perfect, automated verifier*
(the Lean kernel / `lake build`).

## Context

Why this is worth it here (and wasn't in a renderer): proving is a hard search
with a trivial, definitive check. That asymmetry is exactly the regime where
generate-many-and-filter wins — no LLM judge needed, the compiler decides. The
adversarial value lives only where the kernel *can't* help:

1. **Is the statement true?** — the kernel can't tell you you're proving a false
   lemma. A counterexample adversary can (property testing / bounded `decide` /
   proving the negation). This is the biggest practical failure mode in
   formalization.
2. **Diversity of attack** — many valid proofs exist (automation vs. library vs.
   induction vs. decision procedure); different strategies cover more of the space.
3. **Quality ranking** — once ≥1 proof is correct, "which is best" is *not*
   kernel-checkable, so rank by objective metrics (proof length, build time,
   `#print axioms` footprint), reserving a subjective judge only for readability.

Do **not** point an adversary at an accepted proof hunting for flaws — the kernel
already guarantees there are none. That classic code-review pattern is the *least*
useful flavor here.

Relevant existing pieces: `Benchmark/` (goal files G0–G2 + the false F1), the
`prove-goal` skill and `lean-prover` agent (0001), and the verification cost we
measured — `lake env lean` with `import Mathlib.Tactic` is **~27 s/check**, full
`import Mathlib` **~2 min**. That latency is the design constraint.

## Design

### Verifier
Each attempt is a standalone scratch file under `Benchmark/Scratch/` checked with
`lake env lean <file>`. Success = exit 0 with **no `error` and no `sorry`** in the
output. Standalone files (not the `Praxis` lib) let parallel agents verify
independently without build-lock contention or breaking `lake build`.

Latency discipline (the ~27 s tax): agents **reason hard, verify rarely** — a
hard cap of ~3 verification runs per attempt. The real fix is a persistent
REPL/LSP (0001 M2's `lean-lsp-mcp`) that loads Mathlib once; this plan uses the
slow path and flags the upgrade.

### Workflow: `prove-tournament` (`.claude/workflows/prove-tournament.js`)
A `pipeline` over goals, three stages, no barrier:

1. **Validity gate** — one adversary agent tries to *refute*: property testing
   (`plausible`), bounded `decide`/`#eval` over small instances, or an explicit
   counterexample. Returns `{counterexampleFound, counterexample, method}`. If
   refuted, the goal skips the tournament (effort saved).
2. **Tournament** — `parallel` over strategy-diverse provers, each in its own
   scratch file:
   - `automation` — one-shot cheap tactics (`simp`, `omega`, `decide`, `norm_num`,
     `nlinarith`, `linarith`, `aesop`); materialize what closes it.
   - `library` — search Mathlib for a closing lemma (`exact?`, naming conventions).
   - `structured` — decompose (`induction`/`calc`/`obtain`/`have`), close pieces.
   Each returns `{strategy, success, proofScript, proofLines, closingTactic}`.
3. **Rank** — survivors (`success`) ranked by objective metrics (proof length,
   then closing-tactic cheapness). Winner recorded; status = `automation` if the
   automation strategy won one-shot, else `tournament`; `open` if none; `refuted`
   if gated.

### Recording results
The winning proof replaces the `sorry` in `Benchmark/Goals/<goal>.lean` (so the
file type-checks clean as the record), and `Benchmark/README.md`'s table is
updated with status + closed-by. Refuted goals keep their `sorry` and a noted
counterexample. Elegant winners may graduate to `Praxis/Showcase/`.

## Steps

- [ ] Benchmark slice in place: `Benchmark/Goals/{G0,G1,G2,F1}.lean` + README table.
- [ ] `.claude/skills/prove-tournament/SKILL.md` documenting the approach.
- [ ] `.claude/workflows/prove-tournament.js` — gate → tournament → rank pipeline.
- [ ] Demonstration run over the slice: confirm F1 is **refuted** (counterexample
      `n = 40`), and at least one true goal closed, with status recorded.
- [ ] Fill `Benchmark/README.md` results table from the run; record the first
      `open → closed` numbers.

## Open questions

- **`plausible` availability/shape** in this Mathlib (v4.30). The adversary should
  fall back to bounded `decide`/explicit reasoning if the tactic differs. Confirm
  in the demo run.
- **Verification latency** dominates. Accept the ~27 s slow path for now; the
  decisive fix is the 0001-M2 persistent LSP/REPL loop — cross-link when built.
- **Memory under parallelism**: each `lean` process loading `Mathlib.Tactic` is
  RAM-heavy; keep the concurrent strategy count modest until measured.
- **CI**: benchmark goals aren't in `lake build`. A separate `lake env lean`-per-file
  check script for CI is future work (don't break the green-lib invariant).

## Done when

- The `prove-tournament` workflow runs end to end on the benchmark slice.
- F1 is refuted by the validity gate (counterexample surfaced), not "proved."
- At least one true goal is closed with a verified green check, and the
  `Benchmark/README.md` table reflects real `automation` / `tournament` / `open`
  statuses — the toolkit's first measured numbers.
