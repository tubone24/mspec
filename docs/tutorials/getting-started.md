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

For each step below we list **what happens → what to review → where to look in the docs if you get stuck**. Running the slash command loads the matching `.claude/skills/mspec-<step>/SKILL.md`, Claude writes the artifact, you review, and `/mspec:continue` advances the workflow.

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

**What to review** — read the artifact heading-by-heading and check each one against a good/bad reference. The pitfalls below are the most common reasons a proposal looks fine on first read but causes pain in `design` or `implement` later.

1. **`## Why` — user value, not a solution.** This section justifies the change in terms a non-engineer would care about. The most common failure mode is smuggling the *how* into the *why*. For `task-add`:
   - **Good:** "Users lose their list every time they close the browser, which makes the app useless beyond a single session."
   - **Bad — solution leaked in:** "We need to use localStorage to persist tasks."
   - **Bad — too vague:** "Persistence is important."

2. **`## Goals` — outcomes, not features.** Each goal should be testable from a user's perspective. A goal that reads identically to an FR scenario is too detailed for this step.
   - **Good:** "A task added in one session is still visible after a browser reload."
   - **Bad — restates a function name:** "Add a `save()` function to the store."
   - **Bad — unverifiable:** "Make the app feel more reliable."

3. **`## Non-Goals` — explicit scope walls.** In step 4 (`research`) and step 5 (`design`), Claude *infers* scope from what the proposal says — a missing Non-Goal often shows up as research and design wandering into territory you didn't want to touch. For `task-add`, write down at minimum: "no device sync", "no priority", "no due dates", "no undo history". Anything you *might* be tempted to ship later belongs here.

4. **`## Capabilities (touched)` — a single capability is the healthy default.** If the proposal lists two, stop and split the change. Two capabilities mean two Delta Specs (`changes/<dir>/specs/<cap1>/spec.md` and `.../<cap2>/spec.md`), and the merge surface area roughly doubles. For `task-add`, the only capability should be `task-list`. If a capability you don't recognize appears on a later change, cross-check against `mspec spec list-capabilities`.

5. **`## Constitution Check (Phase 0)` — every principle marked, every waiver explained.** The table maps each principle in `memory/constitution.md` to *satisfies* / *N/A* / *waiver (with reason)*. Two failure modes to catch here:
   - A row marked *waiver* with the reason left blank — the `self-review` subagent in step 8 will flag it, but spotting it now saves a round trip.
   - Multiple waivers — usually a signal that the change is mis-shaped. Re-scope the proposal before continuing rather than collecting waivers.

**If stuck:**
- Terminology (Capability / FR / Constitution): [`../explanation/why-mspec.md`](../explanation/why-mspec.md) `## The three failure modes`.
- Why `proposal.md` is tagged `doc_type: Explanation`: [`../reference/doc-types.md`](../reference/doc-types.md) `## Current per-artifact mapping`.
- Editing the constitution itself: `mspec constitution show` ([`../reference/cli.md`](../reference/cli.md) `## Constitution`).

When it looks good, `/mspec:continue`.

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

**What to review:**
- Every requirement uses **SHALL / MUST / SHOULD** (EARS).
- Every requirement has **at least one `#### Scenario:`** with GIVEN / WHEN / THEN — this is the unit `enforce_e2e` later counts to require an E2E task.
- Requirements are **observable** (a UI shows X, a value equals Y). No implementation detail ("uses Redux") leaks in.

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

**What to review:**
- Each **Decision** is a triplet: *what you chose / alternatives considered / why this one*.
- **Open Choices** is empty by the end (anything still open needs to be closed in `design`).
- Cited URLs are real and recent.

**If stuck:**
- When the research step can legitimately be skipped: [`../how-to/lightweight-changes.md`](../how-to/lightweight-changes.md) `## When to pick which mode` (bugfix forces it, minor/typo can skip).

`block: true`, so review then `/mspec:continue`.

---

### Step 5 — `design`: technical design and Phase 1 Constitution Check

```text
/mspec:design
```

Three files are written:

| File | Role | Main headings |
| --- | --- | --- |
| `design.md` | The implementation plan | `## Technical Context` / `## Decisions` / `## Phase 1 Constitution Check` |
| `design-rationale.md` | Why this design | `## Context` / `## Alternatives Considered` / `## Trade-offs` |
| `architecture-overview.md` | Diagram-first overview | Mermaid diagrams |

For `mytodo`, `design.md` typically nails down decisions like "`src/store.ts` owns localStorage I/O, `src/ui.ts` owns the DOM" and "`window` is wrapped so tests can stub it."

**What to review:**
- Every principle in **Phase 1 Constitution Check** is marked *satisfies* or *waiver*, and every waiver explains itself.
- File names / function names / responsibilities are consistent between the diagram and the prose.
- Anything likely to bite you in `implement` is already captured in `## Trade-offs`.

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

**What to review:**
- The Golden Path is **5 steps or fewer** (more is a signal the feature is too big).
- `## Verify` has at least one step per FR — confirming reload covers FR-003.

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

Each item is tagged with a marker like `<!-- verify: fr-001 -->`. When the matching test goes green in `implement`, the CLI ticks the box automatically.

**What to review:**
- Regression risk is **directly addressed** — for a greenfield project like `mytodo`, an explicit "no regression risk (greenfield)" is fine.
- Anything a human must inspect is tagged `<!-- verify: human -->`.

**If stuck:**
- How the auto-ticking works: [`../reference/anchors.md`](../reference/anchors.md) `## Enforcement in the implement step`.

---

### Step 8 — `self-review`: contradiction sweep (subagent)

```text
/mspec:review
```

The `mspec-self-reviewer` subagent independently re-reads every artifact (proposal / delta / research / design / quickstart / checklist) and appends `## Self-Review` to `design.md` with any contradictions it finds.

**What to review:**
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

**What to review:**
- Every `#### Scenario:` in the Delta Spec has at least one E2E task (this is what `enforce_e2e` will check).
- Tasks are ordered **E2E (write the test) → implementation** (TDD demands it).
- Setup / Foundational tasks come first.

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

**What to review:**
- `mspec anchor check` reports **0 errors** — every FR-001…FR-003 in the Delta Spec has at least one anchor pointing back at it.
- You always ran `expect-red` *before* `expect-green` (`enforce_tdd` rejects the reverse).
- The `Change:` line in each anchor equals the trailing component of the change dir (`task-add`).

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

**What to review:**
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
