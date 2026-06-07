export const meta = {
  name: 'prove-tournament',
  description: 'Portfolio/tournament prover for Lean goals: a counterexample validity gate, then strategy-diverse proof attempts filtered by a green Lean check, ranked by objective proof-quality metrics.',
  phases: [
    { title: 'Validity gate', detail: 'hunt a counterexample before spending effort proving' },
    { title: 'Tournament', detail: 'automation / library / structured provers, in parallel' },
    { title: 'Rank', detail: 'rank correct proofs by objective metrics' },
  ],
}

// The benchmark slice this workflow runs over. Self-contained so it runs with no
// args; override by passing `args.goals` (same shape) or `args` as a JSON string.
// kind: 'prove' (expected true) | 'conjecture' (truth unknown / suspected false)
const REPO = '/Users/tt/src/lean'
const IMPORTS = 'import Mathlib.Tactic'
const DEFAULT_GOALS = [
  { name: 'G0_MulEqZero', file: 'Benchmark/Goals/G0_MulEqZero.lean', imports: IMPORTS, difficulty: 'easy', kind: 'prove',
    statement: 'theorem mul_eq_zero_cases (a b : ℤ) (h : a * b = 0) : a = 0 ∨ b = 0' },
  { name: 'G1_SumOdds', file: 'Benchmark/Goals/G1_SumOdds.lean', imports: IMPORTS, difficulty: 'medium', kind: 'prove',
    statement: 'theorem sum_odds (n : ℕ) : ∑ i ∈ Finset.range n, (2 * i + 1) = n ^ 2' },
  { name: 'G2_SixDvdCube', file: 'Benchmark/Goals/G2_SixDvdCube.lean', imports: IMPORTS, difficulty: 'hard', kind: 'prove',
    statement: 'theorem six_dvd_cube_sub_self (n : ℤ) : (6 : ℤ) ∣ n ^ 3 - n' },
  { name: 'F1_EulerPrime', file: 'Benchmark/Goals/F1_EulerPrime.lean', imports: IMPORTS, difficulty: 'false-conjecture', kind: 'conjecture',
    statement: 'theorem euler_prime_poly (n : ℕ) : Nat.Prime (n ^ 2 + n + 41)' },
]

let parsedArgs = args
if (typeof parsedArgs === 'string') { try { parsedArgs = JSON.parse(parsedArgs) } catch (e) { parsedArgs = null } }
const goals = (parsedArgs && parsedArgs.goals) || DEFAULT_GOALS

const STRATEGIES = [
  {
    key: 'automation',
    hint: 'One-shot cheap automation. Try, individually: `simp`, `omega`, `decide`, `norm_num`, `nlinarith` (with `sq_nonneg`/`mul_self_nonneg` hints), `linarith`, `aesop`. Materialize the single tactic (or short combo) that closes it. Do NOT decompose by hand — if no cheap tactic closes it, report failure.',
  },
  {
    key: 'library',
    hint: 'Find an existing Mathlib lemma that closes the goal. Use `exact?`/`apply?` in a scratch attempt, and Mathlib naming conventions (e.g. `mul_eq_zero`, `Int.dvd_*`, `Finset.sum_*`). Prefer a one-line term/lemma application. Do not reprove from scratch what the library already has.',
  },
  {
    key: 'structured',
    hint: 'Decompose the goal: `induction` (with `Finset.sum_range_succ` for sums), `calc` chains, `obtain`/`rcases`, intermediate `have`s — then close each piece with automation (`ring`, `omega`, `simp`, `nlinarith`). This strategy wins where one-shot automation cannot see the structure.',
  },
]

const GATE_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['refuted', 'counterexample', 'method', 'reasoning'],
  properties: {
    refuted: { type: 'boolean', description: 'true ONLY if a concrete, checked counterexample was found' },
    counterexample: { type: 'string', description: 'the counterexample with its witness (e.g. "n=40: 40^2+40+41=1681=41^2, composite"), or "" if none' },
    method: { type: 'string', description: 'how you searched: plausible / bounded decide / #eval over range / explicit reasoning' },
    reasoning: { type: 'string', description: 'brief: what you tried and what you concluded' },
  },
}

const ATTEMPT_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['strategy', 'success', 'proofScript', 'proofLines', 'closingTactic', 'notes'],
  properties: {
    strategy: { type: 'string' },
    success: { type: 'boolean', description: 'true ONLY if `lake env lean` on the scratch file exited 0 with NO error and NO sorry' },
    proofScript: { type: 'string', description: 'the full `theorem ... := by ...` (or term-mode proof) that verified, or the best partial if failed' },
    proofLines: { type: 'integer', description: 'number of lines in the proof body (the part after `:=`)' },
    closingTactic: { type: 'string', description: 'the main tactic/lemma that closed it (e.g. "omega", "mul_eq_zero", "induction+ring"), or "" if failed' },
    notes: { type: 'string', description: 'one line: what worked or why it stalled' },
  },
}

function gatePrompt(goal) {
  return `You are the VALIDITY GATE (counterexample adversary) in a Lean 4 proving tournament.

Repo: ${REPO}. Toolchain on PATH (lake/lean). Verify single files with:
  cd ${REPO} && lake env lean <relative-path.lean>   (empty output = OK; ~27s per run)

GOAL under test (kind: ${goal.kind}):
  file: ${goal.file}
  imports: ${goal.imports}
  statement: ${goal.statement}

Your job: try to REFUTE this statement — find a concrete counterexample. Methods, in order:
  1. Reason about likely failure points; test specific witnesses with #eval / decide.
  2. Write a scratch file ${'Benchmark/Scratch/' + goal.name + '__gate.lean'} with the imports, and use
     #eval to evaluate the predicate at candidate values, and/or the \`plausible\` tactic
     (property-based testing) on the statement to auto-search for a counterexample.
  3. If a witness makes the statement FALSE and you have checked it concretely, that is a refutation.

CRITICAL: set refuted=true ONLY with a concrete, checked counterexample. If you cannot find one
after a bounded search, set refuted=false (do NOT claim refutation without a witness — most goals
here are true). Keep verification runs to ~3 max. Return the GATE schema.`
}

function provePrompt(goal, strat) {
  const scratch = `Benchmark/Scratch/${goal.name}__${strat.key}.lean`
  return `You are the "${strat.key}" prover in a Lean 4 proving tournament. Close this goal.

Repo: ${REPO}. Toolchain on PATH. Your private scratch file: ${scratch}

GOAL:
  imports: ${goal.imports}
  statement: ${goal.statement}
  difficulty: ${goal.difficulty}

YOUR STRATEGY — ${strat.hint}

Procedure:
  1. Write ${scratch} containing exactly the import line(s) then the theorem with your proof
     (no \`sorry\`). Keep the same statement signature.
  2. Verify: cd ${REPO} && lake env lean ${scratch}
     SUCCESS = exit 0 with NO line containing "error" and NO line containing "sorry".
     A "warning: declaration uses 'sorry'" means you still have a hole — not done.
  3. Each verification run costs ~27s, so REASON HARD before each run; at most 3 runs total.
  4. If it verifies, report success with the exact proof script and a line count of the proof body.
     If it does not verify within your budget, report success=false with your closest attempt and
     why it stalled. NEVER report success without an actual green check — the compiler is the judge.

Return the ATTEMPT schema.`
}

const TACTIC_RANK = { 'exact': 0, 'simp': 1, 'omega': 1, 'decide': 1, 'norm_num': 1, 'mul_eq_zero': 1, 'linarith': 2, 'nlinarith': 2, 'aesop': 3 }
function tacticCost(t) {
  const k = (t || '').toLowerCase()
  for (const key of Object.keys(TACTIC_RANK)) if (k.includes(key)) return TACTIC_RANK[key]
  return 5 // structured / unknown = most expensive
}

const results = []
for (const goal of goals) {
  log(`▶ ${goal.name} (${goal.difficulty || goal.kind})`)

  // Stage 1 — validity gate
  const gate = await agent(gatePrompt(goal), { label: `gate:${goal.name}`, phase: 'Validity gate', schema: GATE_SCHEMA })
  if (gate && gate.refuted) {
    log(`  ✗ refuted: ${gate.counterexample}`)
    results.push({ goal: goal.name, difficulty: goal.difficulty, status: 'refuted', counterexample: gate.counterexample, gateMethod: gate.method })
    continue
  }

  // Stage 2 — tournament (strategies in parallel; goals stay sequential to bound memory)
  const attempts = (await parallel(STRATEGIES.map((s) => () =>
    agent(provePrompt(goal, s), { label: `prove:${goal.name}:${s.key}`, phase: 'Tournament', schema: ATTEMPT_SCHEMA })
  ))).filter(Boolean)

  // Stage 3 — rank survivors by objective metrics
  const winners = attempts.filter((a) => a.success)
  if (!winners.length) {
    log(`  · open (tried: ${attempts.map((a) => a.strategy).join(', ')})`)
    results.push({ goal: goal.name, difficulty: goal.difficulty, status: 'open', tried: attempts.map((a) => ({ strategy: a.strategy, notes: a.notes })) })
    continue
  }
  winners.sort((a, b) => (a.proofLines - b.proofLines) || (tacticCost(a.closingTactic) - tacticCost(b.closingTactic)))
  const winner = winners[0]
  const status = winner.strategy === 'automation' ? 'automation' : 'tournament'
  log(`  ✓ ${status}: ${winner.strategy} via ${winner.closingTactic} (${winner.proofLines} lines)`)
  results.push({
    goal: goal.name, difficulty: goal.difficulty, status,
    winner: { strategy: winner.strategy, closingTactic: winner.closingTactic, proofLines: winner.proofLines, proofScript: winner.proofScript },
    runnersUp: winners.slice(1).map((w) => ({ strategy: w.strategy, lines: w.proofLines })),
  })
}

return results
