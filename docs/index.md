---
doc_type: Reference
---

# mspec Documentation

This directory is organized using the [Diátaxis](https://diataxis.fr/) framework — the same documentation taxonomy that mspec adopts for the artifacts of every change. Pick the entry point that matches what you are trying to do right now.

| If you want to... | Go to | Diátaxis category |
|---|---|---|
| Learn mspec by walking through a first change end-to-end | [`tutorials/getting-started.md`](tutorials/getting-started.md) | Tutorial |
| Solve a concrete task (`typo` mode, add a locale, customize the workflow) | [`how-to/`](how-to/) | How-to |
| Look up a CLI flag, the YAML schema, or an anchor format | [`reference/`](reference/) | Reference |
| Understand the *why* behind anchors, doc_type, and the constitution | [`explanation/`](explanation/) | Explanation |

## Map of pages

### Tutorials
- [`tutorials/getting-started.md`](tutorials/getting-started.md) — install mspec, run `mspec init`, walk one change from `new` to `archive`.

### How-to
- [`how-to/lightweight-changes.md`](how-to/lightweight-changes.md) — use `typo` / `minor` / `bugfix` modes to skip steps safely.
- [`how-to/customize-workflow.md`](how-to/customize-workflow.md) — toggle blocking gates, subagents, enforcement flags in `workflow.yaml`.

### Reference
- [`reference/cli.md`](reference/cli.md) — every `mspec` subcommand, flag, and exit code.
- [`reference/anchors.md`](reference/anchors.md) — the `@mspec-delta` 3-line block, validation rules, and CLI checks.
- [`reference/configuration.md`](reference/configuration.md) — `.mspec/config.yaml` keys with defaults.
- [`reference/workflow.md`](reference/workflow.md) — `.mspec/workflow.yaml` steps and enforcement flags.
- [`reference/doc-types.md`](reference/doc-types.md) — Diátaxis `doc_type:` values, per-artifact mapping, and current gaps.

### Explanation
- [`explanation/why-mspec.md`](explanation/why-mspec.md) — what problems mspec is trying to fix and the three axes that make it different.
