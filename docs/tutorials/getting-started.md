---
doc_type: Tutorial
---

# Getting Started with mspec

This tutorial walks you from a clean machine to a fully archived change. The running example is **`mytodo`**, a tiny browser-based ToDo app, and the single change we will ship end-to-end is **add a task and persist it across reloads**. It assumes Node.js ≥ 18 and a working Claude Code installation.

> The change we will ship in this tutorial:
>
> - Project name: `mytodo` (browser-based ToDo app)
> - Feature: add a task, render the list, and survive a page reload
> - Capability: `task-list`
> - Feature kebab: `task-add`
>
> When you finish the 11 steps, `specs/task-list/spec.md` will exist, and `@mspec-delta` anchors will sit inside your code and your E2E tests.

## 1. Install the CLI globally

```bash
npm install -g @mspec/cli
```

Verify:

```bash
mspec --version     # 0.1.0
```

> **For contributors developing on mspec itself:** clone the repo and use `npm link` instead.
>
> ```bash
> git clone https://github.com/tubone24/mspec.git ~/tools/mspec
> cd ~/tools/mspec/packages/cli
> npm install
> npm run build
> npm link            # exposes `mspec` on your PATH
> ```
>
> Running `mspec init` from inside the mspec source repo will run `npm run build && npm link` for you automatically (see `packages/cli/src/commands/init.ts:133`).

## 2. Initialize the project

```bash
mkdir mytodo && cd mytodo
npm init -y
git init
mspec init
```

The `mspec init` prompt asks once for `test.command`. **For this tutorial, answer `npx vitest run --reporter=verbose --`** (you can edit `.mspec/config.yaml` later, or press Enter to skip).

`mspec init` writes:

```
.mspec/
  config.yaml
  workflow.yaml
memory/constitution.md
.claude/
  commands/mspec/*.md       (12 slash commands)
  skills/mspec-*/SKILL.md   (11 step skills)
  agents/mspec-*.md         (3 subagents — omitted by --no-subagents)
.gitignore                  (appends `.mspec/cache/`)
```

The CLI refuses to overwrite existing files unless you pass `--force`.

> **What to check:** open `.mspec/config.yaml` and confirm `test.command` is what you expect and `locale: ja` (the default — controls the language of generated artifacts, not the docs). Keys are documented at [`../reference/configuration.md`](../reference/configuration.md) under `## Keys`.

## 3. Start your first change

```bash
mspec new task-add
```

A timestamped directory appears, e.g. `changes/2026-05-19-090145-task-add/`. Open Claude Code in `mytodo/` and run:

```
/mspec:new
```

`/mspec:new` is a **slash command** that loads `.claude/skills/mspec-new/SKILL.md` and asks Claude to fill in `readme.md`. Every step is `block: true` by default — Claude pauses after each one so you can review, and you run `/mspec:continue` when ready.

> **What to check:** in `changes/<timestamp>-task-add/readme.md`, the **Request** (one or two sentences describing the intent) and the **Mode** (`full` / `typo` / `minor` / `bugfix`) match what you want. For `task-add` (a brand-new feature) the mode should be **`full`**. Mode selection is covered in [`../how-to/lightweight-changes.md`](../how-to/lightweight-changes.md) under `## When to pick which mode`.

## 4. The 11-step workflow

Overall flow:

```
new ─▶ proposal ─▶ delta ─▶ research ─▶ design ─▶ quickstart
                                                       │
        ┌──────────────────────────────────────────────┘
        ▼
   checklist ─▶ self-review ─▶ tasks ─▶ implement ─▶ archive
```

For each step below we list **what happens → what to verify → where to look in the docs if you get stuck**. Running the slash command loads the matching `.claude/skills/mspec-<step>/SKILL.md`, Claude writes the artifact, you review, and `/mspec:continue` advances the workflow.

**A note on how the "what to verify" sections are written.** mspec is built on the [Diátaxis](https://diataxis.fr/) division of documentation, and the same principle applies to *how you read the artifacts* it generates. **You are not meant to audit every line of every file.** Each step's "what to verify" deliberately lists only the items that **you** are the right reviewer for — the parts where your intent, judgment, or eyes are irreplaceable. Items that downstream automation will catch (the `self-review` subagent's constitution sweep, the CLI's anchor/FR enforcement, the implement step's auto-tick) are *called out as such* so you know to skim them, not stare. The whole point of mspec is to spend your attention budget where it matters and trust the machinery for the rest.

The full step table (`block` / `subagent` / enforcement flags) lives at [`../reference/workflow.md`](../reference/workflow.md) under `## The 11 standard steps`.

---

### Step 1 — `new` (recap)

You already ran `/mspec:new`, so `readme.md` should contain **Request / Mode / Capabilities**. For our example:

```markdown
- Request: Add tasks to a list and keep them across browser reloads.
- Mode: full
- Capabilities: task-list
```

If that looks right, run `/mspec:continue`.

---

### Step 2 — `proposal`: lock down the *why*

```text
/mspec:proposal
```

Claude asks 3–5 questions via `AskUserQuestion` (e.g. "should tasks sync across devices?", "do tasks have priority or due dates?"). Your answers shape `proposal.md`.

**File Claude writes:** `proposal.md`
**Main headings:** `## Why` / `## Goals` / `## Non-Goals` / `## Capabilities (touched)` / `## Constitution Check (Phase 0)`

#### How to instruct Claude (and what to verify in the same breath)

The pitfalls below cut both ways: they are **good templates for the answers you type into `AskUserQuestion`**, and they are **the same shapes you re-check after Claude writes `proposal.md`**. Keep them in mind *before* you respond, then re-skim the file with the same lens.

1. **`## Why` — user value, not a solution.** This section justifies the change in terms a non-engineer would care about. The most common failure mode is smuggling the *how* into the *why*. For `task-add`:
   - **Good:** "Users lose their list every time they close the browser, which makes the app useless beyond a single session."
   - **Bad — solution leaked in:** "We need to use localStorage to persist tasks."
   - **Bad — too vague:** "Persistence is important."

2. **`## Goals` — outcomes, not features.** Each goal should be testable from a user's perspective. A goal that reads identically to an FR scenario is too detailed for this step.
   - **Good:** "A task added in one session is still visible after a browser reload."
   - **Bad — restates a function name:** "Add a `save()` function to the store."
   - **Bad — unverifiable:** "Make the app feel more reliable."

3. **`## Non-Goals` — explicit scope walls.** In step 4 (`research`) and step 5 (`design`), Claude *infers* scope from what the proposal says — a missing Non-Goal often shows up as research and design wandering into territory you didn't want to touch. For `task-add`, write down at minimum: "no device sync", "no priority", "no due dates", "no undo history". Anything you *might* be tempted to ship later belongs here.

4. **`## Capabilities (touched)` — a single capability is the healthy default.** If the proposal lists two, stop and split the change. Two capabilities mean two Delta Specs (`changes/<dir>/specs/<cap1>/spec.md` and `.../<cap2>/spec.md`), and the merge surface area roughly doubles. For `task-add`, the only capability should be `task-list`.

#### What only **you** can verify (and why the rest is automated)

Most rows in `proposal.md` are already double-checked downstream: the `## Constitution Check (Phase 0)` table is re-validated by the `mspec-self-reviewer` subagent in Step 8, and unknown capabilities can be cross-checked any time with `mspec spec list-capabilities`. **mspec exists so you don't have to read every line by hand.** What no automation can replace is whether the artifact actually matches your intent. So when you open `proposal.md`, focus on:

- **Does `## Why` express what _you_ would have said offline?** A subtly reframed motivation here causes drift in design and tests that's painful to unwind.
- **Are `## Goals` and `## Non-Goals` the scope you actually want?** This is the single most important alignment moment in the whole workflow — every later step assumes these are settled.
- **Constitution Check:** skim only. If a row is marked *waiver* with no reason, fix it now; otherwise trust the Step 8 contradiction sweep to flag violations.

**If stuck:**
- Terminology (Capability / FR / Constitution): [`../explanation/why-mspec.md`](../explanation/why-mspec.md) `## The three failure modes`.
- Why `proposal.md` is tagged `doc_type: Explanation`: [`../reference/doc-types.md`](../reference/doc-types.md) `## Current per-artifact mapping`.
- Editing the constitution itself: `mspec constitution show` ([`../reference/cli.md`](../reference/cli.md) `## Constitution`).

When the `## Why` / `## Goals` / `## Non-Goals` match your intent, `/mspec:continue`.

---

### Step 3 — `delta`: lock down the *what* as **FR-NNN**

```text
/mspec:delta
```

`changes/<dir>/specs/task-list/spec.md` (the **Delta Spec**) is generated with three sections: `ADDED` / `MODIFIED` / `REMOVED`. Each requirement gets an auto-numbered ID (**FR-001, FR-002, …**), and `enforce_fr_ids: true` makes the CLI reject duplicate IDs or `#### Scenario:` blocks that go missing.

**File Claude writes:** `changes/<dir>/specs/task-list/spec.md`
**Expected FRs for this change:**

```markdown
## ADDED

### Requirement: FR-001 — A user can add a task by text
The system SHALL accept a non-empty string as a new task and SHALL append it to the in-memory list.

#### Scenario: Add a non-empty string
- GIVEN the user has typed "Buy milk" into the input field
- WHEN they click the "Add" button
- THEN "Buy milk" appears in the task list

### Requirement: FR-002 — Tasks render in insertion order
The system SHALL render tasks in insertion order.

#### Scenario: Two tasks render in order
- GIVEN no existing tasks
- WHEN the user adds "A" then "B"
- THEN the list shows "A" above "B"

### Requirement: FR-003 — Tasks survive a page reload
The system SHALL persist tasks to the browser's localStorage and SHALL restore them on page load.

#### Scenario: Tasks restore after reload
- GIVEN "Buy milk" has been added
- WHEN the user reloads the page
- THEN "Buy milk" is still in the list
```

**What to verify — and why this is the single most concentrated review of the whole workflow:**

The Delta Spec is **the substrate every later step is built on**. The `#### Scenario:` blocks here will become E2E tests in Step 9, and the `@mspec-delta` anchors you embed in Step 10 will point back at these exact FR-IDs forever. If a requirement is wrong here, the wrongness propagates into the test names, the anchor blocks, and ultimately the Source of Truth — and is expensive to unwind. So read this file **slowly**.

- **EARS phrasing (the requirement line itself).** Every `### Requirement:` uses **SHALL / MUST / SHOULD** and describes an *observable* fact — a UI shows X, a stored value equals Y, an event is emitted. No implementation detail ("uses Redux", "calls `localStorage.setItem`") leaks in.
- **Gherkin scenarios (the `#### Scenario:` blocks).** Each requirement has at least one GIVEN / WHEN / THEN that you could hand to a tester without further context. Read each scenario as a sentence: *"Given this state, when the user does this, then this observable thing happens."* If you can't read it as one sentence, rewrite it.

**Why this matters downstream — the integration points to keep in mind while reviewing:**
- **E2E integration (`enforce_e2e`).** Each `#### Scenario:` is counted in Step 9 to require a matching E2E task. A vague or missing scenario means a missing test.
- **Anchor integration (`@mspec-delta`).** Each FR-NNN is the address that source files will reference. A confused requirement here means a confused anchor target later — and `mspec anchor check` will keep reminding you of it.

**If stuck:**
- Skeleton generation by hand: [`../reference/cli.md`](../reference/cli.md) `### mspec delta init`.
- Why the FR-NNN IDs are machine-generated even though they look fragile: [`../explanation/why-mspec.md`](../explanation/why-mspec.md) `### Anchors (spec ↔ code)`.

This step is `block: false` by default — Claude auto-advances to `research`.

---

### Step 4 — `research`: investigate design decisions (subagent)

```text
/mspec:research
```

The `mspec-researcher` subagent kicks off, searches the web and the codebase, and produces `research.md`. For `mytodo`, expect topics like "localStorage vs IndexedDB vs OPFS", "vanilla vs React vs Vue", "Vite + Vitest combination".

**File Claude writes:** `research.md`
**Main headings:** `## Decisions` / `## Web References` / `## Codebase Findings` / `## Open Choices` / `## Constitution Check`

#### How to use `research.md` — it's a *reference*, not a deliverable

`research.md` is tagged as a **Reference** in Diátaxis terms: you don't read it cover-to-cover. You consult it. Most of the time, the right amount of review at *this* step is "skim Decisions, confirm Open Choices is empty, move on."

The real value of `research.md` shows up **one step later**. When you read `design.md` in Step 5 and think *"wait, why didn't we just use IndexedDB?"* or *"is there a reason this isn't a service worker?"* — that's when you come back here. Each Decision should be a triplet (*what was chosen / alternatives considered / why this one*), and the "alternatives + why rejected" half is what reconciles you with the design. Treat `research.md` as the bookshelf you flip back to when the implementation plan surprises you.

**What's worth a quick sanity check now:**
- **Open Choices is empty.** Anything still open here will block `design`.
- **Decisions have the rejection rationale**, not just the winning choice. A Decision that lists alternatives but doesn't say *why each was rejected* will fail you later when design questions arise.

**If stuck:**
- When the research step can legitimately be skipped: [`../how-to/lightweight-changes.md`](../how-to/lightweight-changes.md) `## When to pick which mode` (bugfix forces it, minor/typo can skip).

`block: true`, so review then `/mspec:continue`.

---

### Step 5 — `design`: technical design and Phase 1 Constitution Check

```text
/mspec:design
```

Three files are written, **and they are written for three different readers**:

| File | Diátaxis type | Who reads it | How to read it |
| --- | --- | --- | --- |
| `design.md` | Reference | The implementer (often Claude in Step 10 — possibly future-you debugging) | Skim for file/function boundaries, data flow, anything fragile. This is the *blueprint*. |
| `design-rationale.md` | Explanation | The reviewer, or future-you in 6 months wondering "why didn't we just do X?" | Read it like a memo. It explains the alternatives considered and **why each was rejected**. |
| `architecture-overview.md` | Reference | Anyone who needs the shape of the system in 30 seconds | Look at the Mermaid diagram first. If the diagram answered your question, you may not need the prose. |

For `mytodo`, `design.md` typically nails down decisions like "`src/store.ts` owns localStorage I/O, `src/ui.ts` owns the DOM" and "`window` is wrapped so tests can stub it." `design-rationale.md` is where you'll find out *why we didn't go SPA framework* and *why we wrapped `window` instead of using `vi.stubGlobal`*.

#### What to verify — focus on the design, not the rationale

Almost all of the friction in `implement` traces back to ambiguity in `design.md`. So spend the bulk of your review here:

- **File / function boundaries are unambiguous.** A reader handed `design.md` cold should be able to say "OK, `task X` goes in this file and touches this function."
- **The diagram in `architecture-overview.md` agrees with the prose in `design.md`** — same module names, same arrows. Disagreement here is a real bug.
- **`design-rationale.md` — skim only**, unless you disagree with a decision in `design.md`. In that case, find the matching entry in `## Alternatives Considered` and decide whether the rejection reason still holds.
- **Phase 1 Constitution Check — skim only.** The `self-review` subagent in Step 8 re-checks this; you only need to intervene if a row is marked *waiver* with no reason, or if you see multiple waivers (re-scoping signal).

**If stuck:**
- Why `design.md` is `Reference` and the other two are `Explanation`: [`../reference/doc-types.md`](../reference/doc-types.md) `## Current per-artifact mapping`.
- Editing the constitution: `mspec constitution show` ([`../reference/cli.md`](../reference/cli.md) `## Constitution`).

When happy, `/mspec:continue`.

---

### Step 6 — `quickstart`: how a user tries the feature

```text
/mspec:quickstart
```

`quickstart.md` is a **How-to** for an end user (or future you) trying the feature.

**Main headings:** `## Prerequisites` / `## Setup` / `## Try it (Golden Path)` / `## Verify` / `## Troubleshooting`

For `mytodo`:

```markdown
## Try it (Golden Path)
1. `npm run dev` to start the local server
2. Open `http://localhost:5173`
3. Type "Buy milk" → click "Add"
4. Reload the page and confirm "Buy milk" is still there
```

**What to verify — and why this is where _you_ go hands-on:**

`quickstart.md` is the script you'll personally follow when the change is implemented. Most steps in mspec ask AI to do the work and you to inspect the artifact, but this one is the opposite: **you run it, with your own hands, in your own browser.** Automated tests verify behavior; the Golden Path verifies that behavior *feels right to a human*.

- **The Golden Path is short — 5 steps or fewer.** A longer Golden Path means the feature is too big, or the quickstart is mixing edge cases into the happy path.
- **`## Verify` has at least one observable check per FR.** Confirming "Buy milk is still there after reload" maps to FR-003.
- **Plan to actually walk this path** in Step 11, before `archive`. Even with all tests green, the Golden Path is the cheapest sanity check against the kind of regression that only a human would notice (the button label is wrong, the strikethrough is too faint, the focus jumps weirdly after add).

**If stuck:**
- When *not* to skip this step even though it's `skippable: true`: [`../how-to/lightweight-changes.md`](../how-to/lightweight-changes.md) `## When NOT to use a mode`.

`block: false`, Claude auto-advances.

---

### Step 7 — `checklist`: coverage and regression audit (subagent)

```text
/mspec:checklist
```

The `mspec-checklist-auditor` subagent generates `checklist.md` with three perspectives:

| Section | What it checks |
| --- | --- |
| `## Delta Spec Coverage` | Every FR has a planned test. |
| `## Source-of-Truth Regression` | Existing `specs/**` requirements aren't likely to break. |
| `## Constitution` | Phase 1 principles still hold. |

Each item is tagged with a marker like `<!-- verify: fr-001 -->` (an automated test will tick it) or `<!-- verify: human -->` (only a human can confirm — accessibility, copy quality, perceived performance, "does this look broken in dark mode"). When the matching test goes green in `implement`, the CLI ticks `verify: fr-*` boxes automatically.

#### What to verify — this is the quality gate

`checklist.md` reads as implementation-flavored prose. Don't get bogged down skimming every `verify: fr-*` line — those have machine-checkable owners. **Focus on the items only a human can resolve.**

- **Every `<!-- verify: human -->` item is one you can imagine checking with your eyes / hands.** If an item is tagged human-verify but is so vague you couldn't tell pass from fail, rewrite it now. This list will be **forced back in your face at the end of `implement`** (see Step 10), and a vague checkbox is one you'll either rubber-stamp or get stuck on then.
- **Regression coverage is directly addressed.** For greenfield `mytodo`, an explicit "no regression risk (greenfield)" is fine; for a project with an existing SoT, every potentially affected FR should be named.
- **The other items — `verify: fr-*` and the Constitution rows — skim only.** They are owned by tests and by the Step 8 subagent respectively.

Why this division of labor matters: mspec's whole point is that you trust automation for what automation does well (FR coverage, anchor resolution, constitution sweeps) and you spend your attention on what only a human can judge. `<!-- verify: human -->` is that attention budget — keep the list short, sharp, and honest.

**If stuck:**
- How the auto-ticking works: [`../reference/anchors.md`](../reference/anchors.md) `## Enforcement in the implement step`.

---

### Step 8 — `self-review`: contradiction sweep (subagent)

```text
/mspec:review
```

The `mspec-self-reviewer` subagent independently re-reads every artifact (proposal / delta / research / design / quickstart / checklist) and appends `## Self-Review` to `design.md` with any contradictions it finds.

**What to verify — this is mostly a subagent's job, you just react to its findings:**
- The subagent didn't catch any **cross-step inconsistencies** (e.g. design quietly implementing a `Non-Goal`).
- If it did, fix the offending artifact and re-gate that step with `mspec done <step>`.

`block: true`, so `/mspec:continue` when clean.

---

### Step 9 — `tasks`: split into anchored tasks

```text
/mspec:tasks
```

`tasks.md` is split into four phases (Setup / Foundational / User Story / Polish). User Story tasks come pre-stamped with an **anchor block** that ties them to FR-IDs.

```markdown
## Phase 3 — User Story

- [ ] T-003: Write the E2E test for task addition
  <!-- mspec-anchor
  spec: changes/2026-05-19-090145-task-add/specs/task-list/spec.md
  requirements: FR-001, FR-002
  change: task-add
  -->

- [ ] T-004: Write the localStorage restore E2E test
  <!-- mspec-anchor
  spec: changes/2026-05-19-090145-task-add/specs/task-list/spec.md
  requirements: FR-003
  change: task-add
  -->
```

#### How to read `tasks.md` — it's the AI's work queue, not your reading material

`tasks.md` exists primarily so **Claude knows what to implement next** in Step 10. If the upstream artifacts (`proposal` / `delta` / `design`) were sound, the tasks here will look almost mechanical — they're a translation of FR-IDs and design boundaries into actionable items. **Skim this file; don't audit it line by line.**

The time to actually read `tasks.md` carefully is later: if implementation goes off the rails in Step 10, the diagnosis usually starts here ("did we miss an E2E task?", "is this task scoped too broadly?"). For now, three quick checks are enough:

- **Each `#### Scenario:` in the Delta Spec has at least one E2E task** (this is what `enforce_e2e` will check at implement-time — easier to fix now).
- **Tasks are ordered E2E-first, then implementation.** TDD demands the failing test exist before the code that satisfies it. The CLI also enforces this via `enforce_tdd` in Step 10.
- **Setup / Foundational tasks come first.** A typo in this order means Claude tries to write code in a file that doesn't exist yet.

**If stuck:**
- Anchor block format: [`../reference/anchors.md`](../reference/anchors.md) `## Format`.

---

### Step 10 — `implement`: TDD red→green plus anchor embedding

```text
/mspec:implement
```

**This is the core of mspec.** For every task, the CLI enforces three rules:

| Enforcement | What it requires |
| --- | --- |
| `enforce_tdd` | `mspec test expect-red <task-id>` runs first, and the test fails (exit 1/2). |
| `enforce_anchor` | The implementation or E2E file has an `@mspec-delta` 3-line block within its first 30 lines. |
| `enforce_e2e` | Every `#### Scenario:` has a corresponding E2E task in progress. |

#### Why mspec won't let you hand the *tests* to the AI

In Kent Beck's original framing (*Test-Driven Development: By Example*, 2002), test-first is **a design feedback loop**, not a file-ordering convention. Writing the test forces you to commit to an interface and an observable outcome *before* you've written a line of implementation — and that commitment is where most of the design value of TDD comes from.

If an AI both writes the test *and* writes the code, that feedback loop quietly collapses. The model has every incentive to produce a test the implementation will obviously pass, because it sees both halves at once. What looks like TDD ("test was written first, then code") is reduced to **two acts of code generation in a particular file order** — the discipline becomes ceremony, and the design feedback evaporates.

mspec takes the position that **scenario design is your job**. The `#### Scenario:` blocks you locked in during Step 3 are the test contract, and you reviewed them with your full attention — that review is what TDD was actually trying to buy you. The AI is then free to write the *test code* that realizes those scenarios, and the *implementation* that satisfies the test, because the meaningful design judgment already happened upstream and is on the record.

#### Why the red/green evidence is a feature, not bureaucracy

`mspec test expect-red` and `expect-green` aren't paperwork — they're the audit log that **makes TDD enforceable**. Each command runs the task's test, captures the exit code, and persists an evidence file under `.mspec/cache/red-evidence/<change>__<task-id>.json`. The CLI then refuses to mark the task complete unless the sequence reads *red, then green*. There is no path to a green checkbox that doesn't go through a witnessed failure first.

Why this matters in practice:

- **You can't accidentally test the implementation against itself.** A test that was authored after the code might still pass — but it can't have been *red* against an earlier state of the code, and the evidence file proves which order things happened in.
- **The cache files are reviewable.** When a colleague (or future-you) asks "did this really get TDD'd?", the answer is a directory listing, not a vibe.
- **Bypassing it is loud, not silent.** Skipping `expect-red` triggers a CLI error, not a quiet warning. The only way to fake the audit log is to deliberately game it — which is a much higher bar than just forgetting to do TDD.

This is the part of mspec people end up missing when they go back to plain agentic coding. Once you've shipped a few changes with the red→green evidence in place, "the test was definitely failing before I wrote the code" stops being a claim you have to remember to make — it's a file on disk.

**Walking through T-003:**

1. Write the E2E test (`e2e/task-add.e2e.ts`) with an anchor at the top:

   ```ts
   /**
    * @mspec-delta 2026-05-19-090145-task-add/specs/task-list/spec.md
    * Requirements implemented: FR-001, FR-002
    * Change: task-add
    */
   import { test, expect } from "@playwright/test";

   test("adding a non-empty string shows it in the list (FR-001 + FR-002)", async ({ page }) => {
     await page.goto("/");
     await page.getByPlaceholder("Add a task").fill("Buy milk");
     await page.getByRole("button", { name: "Add" }).click();
     await expect(page.getByText("Buy milk")).toBeVisible();
   });
   ```

2. Record the red:
   ```bash
   mspec test expect-red T-003
   ```
   → writes `.mspec/cache/red-evidence/2026-05-19-090145-task-add__T-003.json`.

3. Implement `src/store.ts` and `src/ui.ts`. The implementation also gets an anchor:
   ```ts
   /**
    * @mspec-delta 2026-05-19-090145-task-add/specs/task-list/spec.md
    * Requirements implemented: FR-001, FR-002, FR-003
    * Change: task-add
    */
   export class TaskStore { /* ... */ }
   ```

4. Record the green:
   ```bash
   mspec test expect-green T-003
   ```
   → the matching `- [ ]` in `tasks.md` flips to `- [x]`, and any `<!-- verify: fr-001 -->` lines in `checklist.md` are ticked automatically.

**What to verify — and the human-check that mspec automatically forces on you:**

When the last task goes green, the `mspec-implement` skill does **not** just declare done. It re-opens `checklist.md`, scans for any unticked `<!-- verify: human -->` items, prints the list back to you, and **blocks until you've personally signed each one off**. This is the moment where mspec drags the soft quality concerns — accessibility, copy, perceived feel — back into the loop. Don't skim it.

- **The human-verify list is non-empty for most real changes.** If it's empty, ask whether your checklist was honest. If it's long, walk through each item with the running app (the `quickstart.md` Golden Path is the natural script for this).
- **`mspec anchor check` reports 0 errors** — every FR in the Delta Spec has at least one anchor pointing back at it.
- **The red→green sequence ran in order for every task.** `enforce_tdd` rejects the reverse, so if your tasks went green, this is already guaranteed.
- **The `Change:` line in each anchor** equals the trailing component of the change dir (`task-add`).

**If stuck:**
- Anchor format and placement: [`../reference/anchors.md`](../reference/anchors.md) `## Format` / `## Placement rules`.
- Reading `mspec anchor check` errors: [`../how-to/fix-anchor-errors.md`](../how-to/fix-anchor-errors.md) `## Error catalog` (Cases 1–7).
- Test runner exit-code configuration: [`../reference/configuration.md`](../reference/configuration.md) `### test.expect_red_on_exit / test.expect_green_on_exit`.

When all tasks are green, `/mspec:continue`.

---

### Step 11 — `archive`: deterministic merge into the SoT

```text
/mspec:archive
```

The CLI runs `mspec archive <change> --dry-run` first and shows you the **deterministic merge** into `specs/task-list/spec.md` (the Source of Truth). **No LLM is involved in the merge** — only the parser.

On approval:

1. `specs/task-list/spec.md` gains FR-001 through FR-003.
2. `changes/2026-05-19-090145-task-add/` moves to `changes/archive/`.
3. `readme.md` grows a `## Summary` section (Lessons / Next Steps).

**What to verify — by the time you're here, the heavy human checks are already done:**

The `verify: human` items in `checklist.md` were signed off at the end of Step 10 (the `mspec-implement` skill won't release the workflow otherwise). Archive is therefore mostly a confirmation that the deterministic merge does what you expect:

- The `dry-run` output reads **ADDED 3 / MODIFIED 0 / REMOVED 0** — what you expect for a brand-new feature.
- Existing anchors keep working as-is — `findChange()` resolves a change-dir name against both `changes/` and `changes/archive/`, so you do **not** need to rewrite anchor paths after archive (see `packages/cli/src/lib/change-discovery.ts:11`). Run `mspec anchor check` once to confirm zero errors.

**If stuck:**
- Archive command details: [`../reference/cli.md`](../reference/cli.md) `### mspec archive <change-name>`.
- Why merge is parser-only: [`../explanation/why-mspec.md`](../explanation/why-mspec.md) `## What mspec deliberately does *not* do`.

---

## 5. What you have after the lap

```text
mytodo/
├── .mspec/
│   ├── config.yaml
│   └── workflow.yaml
├── memory/constitution.md
├── specs/
│   └── task-list/
│       └── spec.md           ← FR-001…FR-003 live here now
├── src/
│   ├── store.ts              ← @mspec-delta anchored
│   └── ui.ts                 ← @mspec-delta anchored
├── e2e/
│   └── task-add.e2e.ts       ← @mspec-delta anchored
└── changes/
    └── archive/
        └── 2026-05-19-090145-task-add/   ← all intermediate artifacts
            ├── readme.md
            ├── proposal.md
            ├── research.md
            ├── design.md
            ├── design-rationale.md
            ├── architecture-overview.md
            ├── quickstart.md
            ├── checklist.md
            ├── tasks.md
            └── specs/task-list/spec.md
```

When you start the next change ("mark a task as completed"), you'll repeat the same 11 steps from `mspec new task-complete`. That's when you first see `MODIFIED` (and possibly `REMOVED`) sections in the Delta Spec — covered in [`./second-change.md`](./second-change.md).

## What's next

- **Add a second change and see `MODIFIED` for the first time** — [`./second-change.md`](./second-change.md)
- **Customize the pipeline** — [`../how-to/customize-workflow.md`](../how-to/customize-workflow.md)
- **Skip the heavy steps for tiny changes** — [`../how-to/lightweight-changes.md`](../how-to/lightweight-changes.md)
- **Understand why anchors and `doc_type` exist** — [`../explanation/why-mspec.md`](../explanation/why-mspec.md)
- **Full CLI reference** — [`../reference/cli.md`](../reference/cli.md)
- **All `workflow.yaml` keys** — [`../reference/workflow.md`](../reference/workflow.md)
