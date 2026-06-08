# Educational artifact: an aesthetic, machine-checked Praxis site (Verso)

- **Status:** active
- **Last updated:** 2026-06-07
- **Last touched on:** macOS (darwin arm64) — Verso POC built & rendered

## Goal

Turn Praxis into something people can *read and learn from*: a blog/book-style site
where prose and Lean proofs are interleaved, every snippet is machine-checked, and
the reader can hover any tactic to watch the goal state evolve — the machine's
reasoning made visible, not just its verdict. The differentiator is the
AI-prover narrative: not only *the* proof, but *how the loop found it* (strategy
diversity, the validity gate, goal-state evolution).

## Context

Decisions (this session): tool = **Verso** (Lean's official authoring system);
interactivity ceiling = **inspect** (precomputed proof states + hovers), not live
editing. Grounded in the 2026 reality:

- **Lean + Mathlib cannot run in a browser (WASM)** — the old experiment was
  abandoned; "live" execution needs a server. So "semi-runnable" here means
  *precomputed-interactive* static HTML. (Live edit-and-run, if ever wanted, =
  iframe to the server-backed `live.lean-lang.org`; out of scope.)
- **Alectryon/LeanInk is archived (2024)** — don't use it. Verso absorbed its
  hover/proof-state UX and is the maintained, official path.

## Design

- **Separate Lake project at `docs/`** (Verso `basic-blog` template), on toolchain
  `leanprover/lean4:v4.30.0` — same as the main repo, but isolated so Verso's
  pins never collide with the Mathlib project. `.lake`/`_site` gitignored.
- **Markup gotcha:** Verso *inverts* Markdown emphasis — bold is `*single*`,
  italic is `_underscore_`. `#` headings, `` `inline code` ``, `%%% ... %%%`
  post metadata. Checked code: ` ```leanInit <ctx> ` opens an elaboration context,
  ` ```lean <ctx> ` is a checked block whose proof states render (hover/tippy).
- **Build:** `lake build` then `lake exe generate-blog` → static HTML in `_site/`.
  First build compiles Verso + subverso from source (slow, no cache); incremental
  after. Preview with a *non-caching* server (Python's default cache headers break
  hovers).
- **Content = our existing assets.** The showcase (`Praxis/Showcase/`) and the
  tournament/benchmark results become posts.

## Steps

- [x] Stand up `docs/` Verso project (v4.30.0), build Verso from source.
- [x] POC post rendering a proof with live goal-state hovers — `em_double_neg`
      (`¬¬(p ∨ ¬p)`, Mathlib-free, rewritten as a 6-step tactic proof so the hovers
      are meaningful). Verified: HTML has `tactic-state`/`tippy`/`hover` markers and
      `-verso-docs.json` carries the goals (`⊢`, `p ∨ ¬p`, `False`).
- [ ] **Mathlib integration** — render the real showcase proofs (which need
      Mathlib). Add Mathlib as a `docs/` dep at a rev compatible with Verso v4.30.0;
      resolve any shared-dep version conflicts (see open questions).
- [ ] **The AI-prover narrative post** — "Three ways to prove `6 ∣ n³ − n`":
      hover through each strategy, show the tournament scoreboard, the gate
      refuting Euler's `n²+n+41` at n=40.
- [ ] **Aesthetics** — a custom theme/CSS pass so it looks polished, not template.
- [ ] **Deploy** — publish `_site/` (GitHub Pages via Actions is the natural fit;
      the repo already has a `.github/` from the Lake template).

## Open questions

- **Verso + Mathlib coexistence (key risk):** both are at v4.30.0, but Verso pulls
  its own `plausible`/`batteries`/`subverso`/`MD4Lean` revs and Mathlib pins its
  dep set; a project requiring *both* may hit a version-resolution conflict. Test
  in the Mathlib-integration step; if it fights, options are (a) pin compatible
  revs by hand, or (b) keep Mathlib proofs as pre-rendered SubVerso examples
  imported into the doc rather than a full Mathlib dep.
- **Deploy target:** GitHub Pages (static, free, repo already on GitHub) vs other.
  Pages is the default unless there's a reason not to.
- **How much narrative tooling:** rendering "how the tournament found it" may want
  custom Verso components; start with prose + static scoreboard, enrich later.

## Done when

- A deployed, aesthetic site with at least one polished post that renders real
  (Mathlib-backed) Praxis proofs with hoverable goal states, plus the AI-prover
  narrative — readable by someone learning AI-assisted theorem proving.
