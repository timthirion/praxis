import Mathlib.Tactic

/-! Benchmark goal — **conjecture under test** (expected: FALSE).
Euler's famous prime-generating polynomial `n² + n + 41` is prime for `n = 0…39`,
which makes the universal claim look true under light testing. It is false: at
`n = 40`, `40² + 40 + 41 = 1681 = 41²`. This goal exists to exercise the
*validity gate* — the counterexample adversary should refute it before any effort
is spent trying to prove it. Do not "prove" this; the correct outcome is a
counterexample. -/

theorem euler_prime_poly (n : ℕ) : Nat.Prime (n ^ 2 + n + 41) := by
  sorry
