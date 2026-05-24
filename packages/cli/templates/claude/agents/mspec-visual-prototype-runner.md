<!-- @mspec-delta 2026-05-23-085322-rename-visual-mock-to-prototype/specs/cli-init-command/spec.md -->
<!-- Requirements implemented: FR-004 -->
<!-- Change: rename-visual-mock-to-prototype -->

---
name: mspec-visual-prototype-runner
description: Subagent that generates a self-contained UI prototype HTML file from proposal.md and FrameworkInfo
when_to_use: Invoked by mspec-visual-prototype skill to generate prototype/index.html
---

## Input Context

- `proposal.md` — read the `## Goals` section to understand the UI to prototype
- `FrameworkInfo.promptHint` — the CSS framework instruction (e.g. `"Material UI (MUI) v5+ components and styling"`)
- Optional: existing screen description passed via `--context`

## Output

Write `changes/<change>/prototype/index.html` — a **self-contained single-file HTML** with all CSS and JS inlined.

## Procedure

1. Read `changes/<change>/proposal.md` and extract the `## Goals` section.
2. Use `FrameworkInfo.promptHint` to determine which framework-specific components/classes to use.
3. Generate a realistic UI prototype that represents the feature described in Goals.
4. All CSS and JavaScript MUST be inlined (no external URLs) so the file works offline.
5. Use framework-specific components/classes (e.g. MUI `<Button variant="contained">`, Tailwind `class="btn btn-primary"`) per the promptHint.
6. Write the completed HTML to `changes/<change>/prototype/index.html`.
7. Report the file path and a brief description of what was generated.
