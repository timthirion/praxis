import Mathlib

/-!
# Classics — a first showcase

A small, curated set of fully machine-checked proofs, each closed through the
compiler-feedback loop (see `AGENTS.md`). Every theorem here builds under
`lake build` with no `sorry`. The mix is deliberate: library one-liners found by
search, a hand-structured induction, and the cheap-automation workhorses
(`omega`, `decide`, `norm_num`, `linarith`, `nlinarith`).
-/

namespace Praxis.Showcase

/-- **There are infinitely many primes.** For every `n` there is a prime at least
as large — Euclid's theorem, one lemma deep in Mathlib. Found by lemma search. -/
theorem infinitude_of_primes (n : ℕ) : ∃ p, n ≤ p ∧ p.Prime :=
  Nat.exists_infinite_primes n

/-- **√2 is irrational.** The classic incommensurability result; Mathlib carries
it as a named lemma, so the proof is the act of *finding* it. -/
theorem sqrt_two_irrational : Irrational (Real.sqrt 2) :=
  irrational_sqrt_two

/-- **Gauss's sum:** `2·(0 + 1 + ⋯ + n) = n·(n+1)`. A hand-written structured
induction — the kind of proof we want to read, not just accept. -/
theorem two_mul_sum_range (n : ℕ) :
    2 * (∑ i ∈ Finset.range (n + 1), i) = n * (n + 1) := by
  induction n with
  | zero => simp
  | succ k ih =>
    rw [Finset.sum_range_succ, Nat.mul_add, ih]
    ring

/-- **No integer is both even-plus-one and even.** `omega` dispatches the parity
contradiction in linear integer arithmetic instantly. -/
theorem no_int_parity_clash (a b : ℤ) (h : 2 * a + 1 = 2 * b) : False := by
  omega

/-- **17 is prime.** `norm_num` runs the primality decision procedure. -/
theorem seventeen_prime : Nat.Prime 17 := by
  norm_num

/-- **A decidable finite check.** Every element of `Fin 5` is `< 5` — `decide`
evaluates the decision procedure over the whole finite type. -/
theorem fin_five_lt : ∀ n : Fin 5, n.val < 5 := by
  decide

/-- **Antisymmetry of `≤`.** A two-line term proof, the shape `exact?` suggests. -/
theorem le_antisymm_real (x y : ℝ) (h₁ : x ≤ y) (h₂ : y ≤ x) : x = y :=
  le_antisymm h₁ h₂

/-- **Linear arithmetic over ℝ.** `linarith` combines the hypotheses. -/
theorem linarith_demo (x y : ℝ) (h₁ : x ≤ 2 * y) (h₂ : y ≤ 3) : x ≤ 6 := by
  linarith

/-- **A baby AM–GM:** `2ab ≤ a² + b²`, because `(a - b)² ≥ 0`. `nlinarith` closes
it once handed the square as a hint — a tiny taste of guided nonlinear search. -/
theorem two_mul_le_sq_add_sq (a b : ℝ) : 2 * a * b ≤ a ^ 2 + b ^ 2 := by
  nlinarith [sq_nonneg (a - b)]

/-- **Excluded middle is not refutable**, constructively: `¬¬(p ∨ ¬p)`. A pure
term-mode proof with no classical axioms. -/
theorem not_not_em (p : Prop) : ¬¬(p ∨ ¬p) :=
  fun h => h (Or.inr (fun hp => h (Or.inl hp)))

end Praxis.Showcase
