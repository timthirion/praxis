# Portfolio prover & counterexample adversary

- **Status:** done
- **Last updated:** 2026-06-07
- **Last touched on:** macOS (darwin arm64), session following 0001 — first run done

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

- [x] Benchmark slice in place: `Benchmark/Goals/{G0,G1,G2,F1}.lean` + README table.
- [x] `.claude/skills/prove-tournament/SKILL.md` documenting the approach.
- [x] `.claude/workflows/prove-tournament.js` — gate → tournament → rank pipeline.
- [x] Demonstration run over the slice: F1 **refuted** (`n = 40`); all three true
      goals closed; statuses recorded. _13 agents, ~5.75 min._
- [x] Fill `Benchmark/README.md` results table; first numbers: automation 1 ·
      tournament 2 · open 0 · refuted 1.

## Outcome (first run, 2026-06-07)

Worked end to end. Findings worth keeping:
- **The portfolio earned its keep.** G0 fell to a one-shot library lemma, but G1
  (induction) and G2 (reduce to `ZMod 6` + `decide`) needed the *structured*
  strategy — one-shot automation found neither. That's the concrete open→closed
  lift the tournament buys.
- **The gate works and pays for itself**, refuting F1 before any proof effort.
- **Bug fixed:** agents returned the `strategy` field as free-form prose, so the
  automation-vs-tournament label collapsed to "tournament" for everything. Fixed
  by tagging each attempt with its strategy *key* from the loop (+ requiring a
  genuinely cheap closing tactic for the `automation` label).
- **`args` did not reach the script** on the first launch (arrived empty/stringy).
  Made the workflow self-contained with `DEFAULT_GOALS`, overridable by `args`.
- **`plausible` not needed:** the gate refuted F1 via `#eval` over the witness;
  `import Mathlib.Tactic` resolved everything (no extra imports per goal).
- Every winning proof was **re-verified independently** with `lake env lean`
  (no error, no `sorry`) — not trusted from the agents' self-report.

Follow-ups (not blockers): the ~27 s/check latency is the main drag — the decisive
fix is 0001-M2's persistent LSP/REPL loop. G2's `ZMod 6` proof is elegant enough
to graduate to `Praxis/Showcase/`. A CI script that runs `lake env lean` per
benchmark goal would guard these against Mathlib bumps.

## Second run (2026-06-07) — MCP fast loop, a measured negative result

After 0001-M2 landed, the prover/gate prompts were rewired to prefer the lean-lsp
MCP loop (`lean_multi_attempt`, `lean_diagnostic_messages`, `lean_run_code`) with a
`lake env lean` fallback. Re-ran the same slice.

- **It works; subagents reached MCP.** The gate reported
  `gateMethod: "#eval over candidate (lean_run_code MCP)"`. Same verdicts
  (automation 1 · tournament 2 · refuted 1); statuses now label correctly
  (G0 = `automation`); G2 came back tighter (a 2-line `library` proof).
- **But it was slower, not faster, on this workload:** ~7.35 min / 176k tok / 72
  tool calls, vs the cold-`lake` run's ~5.75 min / 125k / 36. The reason is the
  real lesson: the ~9× per-tactic MCP speedup is the *marginal* cost of extra
  attempts on an **already-warm** file. Here each parallel strategy agent opens its
  **own** scratch file and pays an un-amortized ~35 s cold-start (+ the timeout
  retry), and these goals close in 1–3 attempts — nothing to amortize against. The
  extra exploration cost more than it saved.
- **Design fix (Phase 3):** `lean_multi_attempt` is read-only, so all strategies can
  trial tactics against **one pre-warmed shared goal file** — pay the cold-start
  once, not per agent. Structured multi-line proofs still need a private file +
  `lean_diagnostic_messages`. Expect the MCP loop to win clearly only on
  attempt-heavy *hard* goals (or with this shared-warm-file design); for trivial
  goals, cold `lake` is competitive. Kept the MCP path (correct, fallback-safe,
  right for where the roadmap is going) — the speed win is deferred to that
  refinement, recorded honestly rather than claimed.

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
