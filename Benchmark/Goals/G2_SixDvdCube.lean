import Mathlib.Tactic

/-! Benchmark goal — difficulty: **hard**.
`6 ∣ n³ − n` for every integer `n` (the product of three consecutive integers).
Nonlinear, so `omega`/`linarith` don't apply and `decide` can't range over ℤ. The
interesting territory: one strategy may factor `n³ − n = (n−1)·n·(n+1)` and argue
divisibility by 2 and 3; another may reduce mod 6 via `ZMod`/`Decidable`. A genuine
test of strategy diversity. -/

theorem six_dvd_cube_sub_self (n : ℤ) : (6 : ℤ) ∣ n ^ 3 - n := by
  -- reduce the cubic divisibility over infinite ℤ to a finite check in ZMod 6
  have h : ∀ x : ZMod 6, x ^ 3 - x = 0 := by decide
  have key : ((n ^ 3 - n : ℤ) : ZMod 6) = 0 := by push_cast; exact h _
  exact_mod_cast (ZMod.intCast_zmod_eq_zero_iff_dvd (n ^ 3 - n) 6).mp key
