import Mathlib.Tactic

/-! Benchmark goal — **conjecture under test** (verdict: FALSE).
Euler's famous prime-generating polynomial `n² + n + 41` is prime for `n = 0…39`,
which makes the universal claim look true under light testing. It is false: at
`n = 40`, `40² + 40 + 41 = 1681 = 41²`. The validity gate refuted the universal
claim with exactly this witness before any proof effort was spent — and we record
the refutation as a *proved negation*, so the benchmark file type-checks clean. -/

/-- The universal claim is false; the witness `n = 40` makes the value `1681 = 41²`,
which is composite. `decide` settles the primality of the concrete number. -/
theorem not_euler_prime_poly : ¬ ∀ n : ℕ, Nat.Prime (n ^ 2 + n + 41) := by
  intro h
  have h40 : Nat.Prime 1681 := by simpa using h 40
  norm_num at h40
