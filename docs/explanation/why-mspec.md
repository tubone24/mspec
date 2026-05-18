---
doc_type: Explanation
---

# Why mspec exists

mspec was built to keep **LLM-authored specs and LLM-authored code from drifting apart**. Every design choice in the framework traces back to one of three failure modes that show up reliably when you do spec-driven development with a coding agent.

## The three failure modes

### 1. Spec drift
The most common failure. You ask the agent to "just ship the fix"; the spec ages by one commit; nobody notices for a week. A month later, no one can answer "is the spec correct, or is the code correct?" — they are simply different, and you have to re-derive the truth from production behavior.

**mspec's response**: the `@mspec-delta` anchor. Code physically points at the Delta Spec FR-ID it implements; the CLI walks both directions and rejects mismatches before merge.

### 2. Implementation detail leaking into the spec
LLMs love to write `Use bash to run xxx` or `Install via pnpm` inside a requirement. Once that happens, the spec is no longer a contract — it's a tutorial bound to a specific stack. Future migrations get blocked by spec text that should never have constrained them.

**mspec's response**: `mspec spec lint` runs a regex bank against every SoT spec and fails CI if shell commands, library names, or implementation verbs appear. The check is deterministic, not LLM-graded.

### 3. The LLM-graded LLM
If the same kind of model that writes the spec also reviews the spec, you get a closed loop with no signal: failures are reframed as successes by the next pass. Quality plateaus quickly.

**mspec's response**: the CLI is the only thing allowed to gate progression. Every check (`validate`, `anchor check`, `spec lint`, `test expect-red/green`, deterministic `archive` merge) is a parser or a regex — no LLM in the validation path.

## The three axes that follow from those choices

These are the things mspec deliberately invests in. If you don't recognize the names, the linked references explain them.

### Anchors (spec ↔ code)
See [`../reference/anchors.md`](../reference/anchors.md). A three-line comment block, machine-checkable, language-agnostic. The simplest possible mechanism that survives rebases, branches, and AI editing.

### `doc_type` (Diátaxis)
See [`../reference/doc-types.md`](../reference/doc-types.md). Every artifact declares which Diátaxis quadrant it belongs to (`Reference`, `Explanation`, `How-to`, `Tutorial`). The point is not classification — it's that the reader of `design.md` arrives knowing "this is Reference, I'm looking up a decision" instead of "this is mixed, I need to skim it all". Forces the writer to commit to a purpose per artifact.

### Test-against-anchor checks
See [`../reference/workflow.md`](../reference/workflow.md) under `enforce_anchor` / `enforce_e2e` / `enforce_tdd`. The `implement` step refuses to mark itself done unless:
1. Every `FR-NNN` in the Delta Spec has at least one code anchor.
2. Every `#### Scenario:` has a matching E2E task.
3. Each task went through `mspec test expect-red` before `mspec test expect-green`.

That's the round-trip that closes the loop: requirements have tests, tests prove the requirement, code carries the back-link.

## What mspec deliberately does *not* do

- **No IDE coverage beyond Claude Code in v0.1.** Other coding agents are doable but not in scope; the slash-command + skill + subagent integration is what makes the gates feel native.
- **No proprietary spec format.** Delta Specs use the same OpenSpec-style ADDED/MODIFIED/REMOVED/RENAMED Markdown sections so the contents are portable.
- **No LLM in the merge path.** `mspec archive` is a parser; the same input always produces byte-identical output.

## Where to read next

- [`../reference/anchors.md`](../reference/anchors.md) — the anchor format and enforcement.
- [`../reference/doc-types.md`](../reference/doc-types.md) — Diátaxis adoption, with the current classification debates surfaced rather than hidden.
- [`../reference/workflow.md`](../reference/workflow.md) — the 11 steps and what each one enforces.
