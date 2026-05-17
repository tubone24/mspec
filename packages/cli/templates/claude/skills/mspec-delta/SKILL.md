---
name: mspec-delta
description: delta step of mspec workflow — generate Delta Spec with auto-numbered FR-NNN
when_to_use: User runs /mspec:delta, or workflow auto-continues to delta
---<!-- @mspec-delta 2026-05-15-063805-fix-command-name-consistency/specs/claude-integration/spec.md -->
<!-- Requirements implemented: FR-017 -->
<!-- Change: fix-command-name-consistency -->

<!-- @mspec-delta 2026-05-15-040857-step-checkbox-update/specs/claude-integration/spec.md -->
<!-- Requirements implemented: FR-015 -->
<!-- Change: step-checkbox-update -->

## Procedure

1. Run `mspec status --change <change-dir> --json` first.
2. Read `proposal.md` → extract capability names from `## Capabilities (touched)`.
3. For each capability, run `mspec delta init --capability <name> --change <change-dir>`. The CLI auto-numbers FR-NNN by reading existing `specs/<name>/spec.md`.
4. Edit each generated `changes/<change-dir>/specs/<capability>/spec.md`:
   - Replace placeholders in `### Requirement: FR-NNN — <Short Title>` headers (H3).
   - Write the Requirement body in **EARS format** using RFC 2119 keywords with the following semantics (per Constitution):
     - `SHALL` — 機能要件（system の振る舞いを規定するデフォルト）
     - `MUST` — 制約・安全要件（絶対的強制または禁止）
     - `SHOULD` — 推奨（逸脱可能だが理由が必要）
     - `MAY` — 任意（オプション機能）
   - EARS pattern guidance (use the most applicable):
     - Ubiquitous: `The system SHALL <response>.`
     - Event-Driven: `When <trigger>, the system SHALL <response>.`
     - State-Driven: `While <state>, the system SHALL <response>.`
     - Unwanted Behavior: `If <condition>, then the system SHALL <response>.`
     - Optional Feature: `Where <feature>, the system SHALL <response>.`
   - Add at least one `#### Scenario: <Name>` (must be H4) with `- GIVEN`, `- WHEN`, `- THEN` bullets nested inside each Requirement.
5. `readme.md` の `## Artifacts` 節の `- [ ] specs/*/spec.md (Delta Spec)` を `- [x] specs/*/spec.md (Delta Spec)` に更新する。
6. Run `mspec validate --change <change-dir>` (validates FR-ID uniqueness and H4 Scenarios). validate が失敗した場合は `- [x] specs/*/spec.md (Delta Spec)` を `- [ ] specs/*/spec.md (Delta Spec)` にロールバックする。
7. `block: false` — auto-continue via `/mspec:continue`.
