import Mathlib.Tactic

/-! Benchmark goal — difficulty: **easy**.
A zero product over ℤ forces a zero factor. Expected to fall to cheap automation /
a one-lemma search (`mul_eq_zero`). Baseline that the automation tier should close
instantly. -/

theorem mul_eq_zero_cases (a b : ℤ) (h : a * b = 0) : a = 0 ∨ b = 0 := by
  sorry
