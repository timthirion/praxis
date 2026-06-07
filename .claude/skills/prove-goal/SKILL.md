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

2. **Read the goal state.** Use the Lean LSP / `lean-lsp-mcp` if available (live
   goal state, no rebuild). Otherwise `lake env lean Praxis/<File>.lean` and read
   the `unsolved goals` / error output.

3. **Try cheap automation, and materialize what it finds.** In rough order:
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
   Use `exact?`, LeanSearch, or Loogle to find the right Mathlib lemma. Break the
   goal with `have`/`calc`/`obtain` and attack the pieces.

5. **Patch incrementally** and re-check. Iterate to zero diagnostics.

6. **Verify.** Run `lake build` (or build the single file). Only report success on
   a clean, `sorry`-free build. If it isn't green, you are not done.

## Rules

- No `sorry` / `admit` committed to `main`. In-progress proofs stay on a branch.
- No `native_decide` unless a plan explicitly allows it (it widens the trust base).
- Showcase theorems get a `/-- what + why interesting -/` docstring and a
  readable, structured proof (materialized tactics, `calc` chains, named hyps).
- See `AGENTS.md` (“The proving loop”) for the canonical statement of this loop.
