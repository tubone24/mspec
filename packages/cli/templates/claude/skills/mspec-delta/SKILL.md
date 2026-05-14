---
name: mspec-delta
description: delta step of mspec workflow — generate Delta Spec with auto-numbered FR-NNN
when_to_use: User runs /mspec-delta, or workflow auto-continues to delta
---

## Procedure

1. Run `mspec status --change <change-dir> --json` first.
2. Read `proposal.md` → extract capability names from `## Capabilities (touched)`.
3. For each capability, run `mspec delta init --capability <name> --change <change-dir>`. The CLI auto-numbers FR-NNN by reading existing `specs/<name>/spec.md`.
4. Edit each generated `changes/<change-dir>/specs/<capability>/spec.md`:
   - Replace placeholders in `### Requirement: FR-NNN — <Short Title>` headers (H3).
   - Write MUST/SHALL/SHOULD/MAY (RFC 2119) clauses.
   - Add at least one `#### Scenario: <Name>` (must be H4) with `- GIVEN`, `- WHEN`, `- THEN` bullets.
5. Run `mspec validate --change <change-dir>` (validates FR-ID uniqueness and H4 Scenarios).
6. `block: false` — auto-continue via `/mspec-continue`.
