---
name: mspec-design
description: design step of mspec workflow — write design.md + architecture-overview.md, full Constitution Check
when_to_use: User runs /mspec-design, or workflow auto-continues to design
---

## Procedure

1. Run `mspec status --change <change-dir> --json` first.
2. Read `research.md`.
3. Write `design.md` from the artifact template. Fill: Summary, Technical Context, Phase 0 Constitution Check, Project Structure, Decisions.
4. Write `architecture-overview.md` with at minimum a Mermaid System Diagram (required). Add Sequence / Data Model diagrams when applicable. Inline SVG only if Mermaid can't express it.
5. Re-evaluate the Constitution Check at the bottom of `design.md` (Phase 1) — both Phase 0 and Phase 1 columns must be filled.
6. If any ❌, fill `### Complexity Tracking` with justification (otherwise write "None").
7. Use AskUserQuestion when material design trade-offs need user input.
8. Run `mspec validate --change <change-dir>`.
9. `block: true` — stop and ask the user to run `/mspec-continue`.
