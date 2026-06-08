import VersoBlog
open Verso Genre Blog

#doc (Post) "Excluded middle, constructively" =>

%%%
authors := ["Praxis"]
date := {year := 2026, month := 6, day := 7}
%%%

This is the first Praxis page rendered with Verso. Everything below is
*machine-checked*: the proof compiled when this page was built, and you can hover
any tactic to inspect the proof state it produces — the goal evolving step by step,
which is the part you never get to see in a static code listing.

# The claim

Classically, `p ∨ ¬p` is taken for granted. Constructively we cannot assert it for an
arbitrary proposition — but we _can_ prove its double negation, `¬¬(p ∨ ¬p)`, with no
classical axioms at all. Hover the tactics below to watch the goal change:

```leanInit demo
```

```lean demo
theorem em_double_neg (p : Prop) : ¬¬(p ∨ ¬p) := by
  intro h
  apply h
  apply Or.inr
  intro hp
  apply h
  exact Or.inl hp
```

# The idea

Assume `¬(p ∨ ¬p)`. To derive a contradiction we hand this hypothesis the right
disjunct, `¬p`. But proving `¬p` means assuming `p` — and that lets us hand the _same_
hypothesis the _left_ disjunct, `p`. One assumption, used against itself twice. The
hypothesis refutes everything we can offer it, so `False` follows and the original
goal is closed.

This proof lives in the Praxis showcase as `not_not_em`; here it is rendered so the
machine's reasoning is visible, not just its verdict.
