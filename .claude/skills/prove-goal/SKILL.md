---
name: prove-goal
description: Close a Lean 4 goal in this repo through the compiler-feedback loop — cheap automation first, then lemma search, patch, and verify with a green `lake build`. Use when asked to prove a theorem, fill a `sorry`, or formalize a statement in Praxis.
---

# prove-goal

Drive a Lean 4 proof to a **machine-checked** close. The only success condition is
a green `lake build` with no `sorry` — never your own judgment that "this looks
right." Cheap, deterministic automation comes before anything neural.

## The loop

1. **State the goal.** Write `theorem <name> : <stmt> := by sorry` (or an explicit
   term type) in the right `Praxis/` file. Give it a docstring if it's showcase-bound.

2. **Read the goal state.** Preferred: the `lean-lsp` MCP server — `lean_goal`
   (live state at a line, no rebuild). **Warm-up gotcha:** the *first* call on a
   freshly-opened Mathlib file can hit the LSP's 30 s timeout while it compiles;
   just call it again — the warm retry is instant. Fallback (no MCP):
   `lake env lean Praxis/<File>.lean` and read the `unsolved goals` output.

3. **Try cheap automation, and materialize what it finds.** Fastest path: batch
   candidates through `lean_multi_attempt` (try N tactics at the goal position in
   one warm call, no file edits — ~3 s/tactic vs ~27 s for a cold `lake env lean`).
   In rough order:
   - `exact?` / `apply?` — find a closing lemma. Replace with the printed `exact …`.
   - `simp?` — simplification; commit the printed `simp only [...]`.
   - `omega` — linear arithmetic over `Nat`/`Int`.
   - `decide` — decidable, concrete/finite goals.
   - `linarith` / `nlinarith` — (non)linear arithmetic over ordered fields.
   - `aesop?` — general search; commit the printed script.
   - `rw?` / `polyrith` — targeted rewrites / polynomial identities.
   Prefer the **materialized** tactic over the search tactic in committed code:
   faster builds, reproducible, and legible.

4. **On failure, read the exact error and search — don't guess lemma names.**
   With the `lean-lsp` MCP: `lean_state_search` (goal → closing lemmas),
   `lean_leansearch` (natural language → Mathlib), `lean_loogle` (type pattern),
   `lean_local_search` (project-local), then `lean_hover_info` to confirm a
   signature. (These are rate-limited.) Without MCP, `exact?`. Break the goal with
   `have`/`calc`/`obtain` and attack the pieces.

5. **Patch incrementally** and re-check. Iterate to zero diagnostics.

6. **Verify.** Fast in-loop check: `lean_diagnostic_messages` (zero errors, no
   `sorry`) and `lean_verify` (axiom check — flags `sorryAx`/`native_decide`). The
   canonical ground truth for committed library code remains a green **`lake
   build`**. Only report success on a clean, `sorry`-free check. If it isn't green,
   you are not done.

## Rules

- No `sorry` / `admit` committed to `main`. In-progress proofs stay on a branch.
- No `native_decide` unless a plan explicitly allows it (it widens the trust base).
- Showcase theorems get a `/-- what + why interesting -/` docstring and a
  readable, structured proof (materialized tactics, `calc` chains, named hyps).
- See `AGENTS.md` (“The proving loop”) for the canonical statement of this loop.
