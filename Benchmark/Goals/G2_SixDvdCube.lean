import Mathlib.Tactic

/-! Benchmark goal — difficulty: **hard**.
`6 ∣ n³ − n` for every integer `n` (the product of three consecutive integers).
Nonlinear, so `omega`/`linarith` don't apply and `decide` can't range over ℤ. The
interesting territory: one strategy may factor `n³ − n = (n−1)·n·(n+1)` and argue
divisibility by 2 and 3; another may reduce mod 6 via `ZMod`/`Decidable`. A genuine
test of strategy diversity. -/

theorem six_dvd_cube_sub_self (n : ℤ) : (6 : ℤ) ∣ n ^ 3 - n := by
  sorry
