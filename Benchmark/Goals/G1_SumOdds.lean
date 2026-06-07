import Mathlib.Tactic

/-! Benchmark goal — difficulty: **medium**.
The sum of the first `n` odd numbers is `n²`. Cheap automation alone won't close
it; expected to favor a *structured* strategy (induction + `Finset.sum_range_succ`
+ `ring`). A good test of decomposition over one-shot tactics. -/

theorem sum_odds (n : ℕ) : ∑ i ∈ Finset.range n, (2 * i + 1) = n ^ 2 := by
  sorry
