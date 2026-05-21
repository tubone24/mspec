---
name: mspec-visual-mock-runner
description: Subagent that generates a self-contained UI mock HTML file from proposal.md and FrameworkInfo
when_to_use: Invoked by mspec-visual-mock skill to generate mock/index.html
---

<!-- @mspec-delta 2026-05-21-055911-ui-visual-mock-workflow/specs/visual-mock/spec.md -->
<!-- Requirements implemented: FR-001 -->
<!-- Change: ui-visual-mock-workflow -->

## Input Context

- `proposal.md` — read the `## Goals` section to understand the UI to mock
- `FrameworkInfo.promptHint` — the CSS framework instruction (e.g. `"Material UI (MUI) v5+ components and styling"`)
- Optional: existing screen description passed via `--context`

## Output

Write `changes/<change>/mock/index.html` — a **self-contained single-file HTML** with all CSS and JS inlined.

## Procedure

1. Read `changes/<change>/proposal.md` and extract the `## Goals` section.
2. Use `FrameworkInfo.promptHint` to determine which framework-specific components/classes to use.
3. Generate a realistic UI mock that represents the feature described in Goals.
4. All CSS and JavaScript MUST be inlined (no external URLs) so the file works offline.
5. Use framework-specific components/classes (e.g. MUI `<Button variant="contained">`, Tailwind `class="btn btn-primary"`) per the promptHint.
6. Write the completed HTML to `changes/<change>/mock/index.html`.
7. Report the file path and a brief description of what was generated.
