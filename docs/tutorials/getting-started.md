---
doc_type: Tutorial
---

# Getting Started with mspec

This tutorial walks you from a clean machine to a fully archived change. It assumes Node.js ≥ 18 and a working Claude Code installation.

## 1. Install the CLI globally

```bash
git clone https://github.com/tubone24/mspec.git ~/tools/mspec
cd ~/tools/mspec/packages/cli
npm install
npm run build
npm link            # exposes `mspec` on your PATH
```

> `mspec init` will run `npm run build && npm link` for you automatically when invoked from inside this repo (see `packages/cli/src/commands/init.ts:133`), so for *first-party* development you can skip the explicit `npm link` step.

Verify:

```bash
mspec --version     # 0.1.0-alpha.1
```

## 2. Initialize a project

```bash
cd /path/to/your-project
mspec init
```

You will be prompted once for `test.command` (e.g. `npm test --`). Press Enter to skip; you can edit `.mspec/config.yaml` later.

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

## 3. Start your first change

```bash
mspec new add-search
```

A timestamped directory appears under `changes/`, e.g. `changes/2026-05-18-090145-add-search/`. Open Claude Code in that project and run:

```
/mspec:new
```

…then follow the prompts. Every step pauses (`block: true`) so you can review before running `/mspec:continue` to advance.

## 4. Run the 11-step workflow

```
new ─▶ proposal ─▶ delta ─▶ research ─▶ design ─▶ quickstart
                                                       │
        ┌──────────────────────────────────────────────┘
        ▼
   checklist ─▶ self-review ─▶ tasks ─▶ implement ─▶ archive
```

For each step:

1. Run the slash command (`/mspec:proposal`, `/mspec:delta`, …) or rely on auto-continue for non-blocking steps.
2. Claude writes the artifact; you review.
3. Run `/mspec:continue` to move on.

At the `implement` step, the CLI enforces TDD red→green via `mspec test expect-red <task>` and `mspec test expect-green <task>`, and it rejects code without a valid `@mspec-delta` anchor.

## 5. Archive

```
/mspec:archive
```

The CLI runs `mspec archive <change> --dry-run` first, shows you the deterministic merge into `specs/<capability>/spec.md`, and then moves the change directory to `changes/archive/`.

## What's next

- **Customize the pipeline** — see [`../how-to/customize-workflow.md`](../how-to/customize-workflow.md).
- **Skip the heavy steps for tiny changes** — see [`../how-to/lightweight-changes.md`](../how-to/lightweight-changes.md).
- **Understand why anchors and `doc_type` exist** — see [`../explanation/why-mspec.md`](../explanation/why-mspec.md).
