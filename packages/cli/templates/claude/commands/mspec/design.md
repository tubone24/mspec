<!-- @mspec-delta 2026-05-15-063805-fix-command-name-consistency/specs/cli-core/spec.md -->
<!-- Requirements implemented: FR-001 -->
<!-- Change: fix-command-name-consistency -->
---
description: Run the design step (design.md + architecture-overview.md, Phase 0/1 Constitution Check)
---

You are in the **design** step of the mspec workflow.

## Procedure

1. Run `mspec status --change <change-dir> --json` and read `research.md`.
2. Write `design.md` using the template. Fill Technical Context, Phase 0 Constitution Check, Project Structure, and Decisions.
3. Write `architecture-overview.md` with **at least one Mermaid System Diagram** (required). Add Sequence / Data Model diagrams if applicable.
4. Re-evaluate Constitution Check (Phase 1) at the bottom of `design.md`. Both Phase 0 and Phase 1 columns must be filled.
5. If any Principle is ❌, fill `### Complexity Tracking` with justification.
6. Run `mspec validate --change <change-dir>`.
7. Since `block: true`, stop and instruct the user to run `/mspec:continue`.
