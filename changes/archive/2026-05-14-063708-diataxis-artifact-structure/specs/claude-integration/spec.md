# Delta Spec: claude-integration

## ADDED Requirements

### Requirement: FR-010 — Update mspec skill prompts to explicitly reference EARS+Scenario format and RFC 2119 keyword semantics

The system MUST update the `## Procedure` section of each mspec SKILL.md (at minimum `mspec-delta`, `mspec-proposal`, and `mspec-design`) to explicitly instruct Claude to write Requirement bodies in EARS format, applying the RFC 2119 keyword distinctions defined in the Constitution (SHALL for functional requirements, MUST for constraints and safety requirements, SHOULD for recommendations), and to nest at least one `#### Scenario:` block with GIVEN / WHEN / THEN bullets inside each Requirement.

#### Scenario: mspec-delta skill prompt references EARS format and keyword semantics
- GIVEN `.claude/skills/mspec-delta/SKILL.md` の `## Procedure` 節を開く
- WHEN 節の内容を読む
- THEN Requirement 本文を EARS 形式（SHALL / MUST / SHOULD の使い分け）で記述するよう明示した指示が含まれる
- AND Scenario（GIVEN/WHEN/THEN）を各 Requirement の直下に入れ子で必須とする旨が記述されている

#### Scenario: mspec-proposal skill prompt acknowledges EARS+Scenario convention
- GIVEN `.claude/skills/mspec-proposal/SKILL.md` の `## Procedure` 節を開く
- WHEN 節の内容を読む
- THEN Capabilities セクションへの記述を促す箇所に、後続の delta ステップで EARS+Scenario 形式が使われることを前提とした注記が含まれる

#### Scenario: mspec-design skill prompt references EARS requirement conventions
- GIVEN `.claude/skills/mspec-design/SKILL.md` の `## Procedure` 節を開く
- WHEN 節の内容を読む
- THEN design.md に記載する受け入れ基準を Delta Spec の Scenario（GIVEN/WHEN/THEN）と対応付けるよう指示する記述が含まれる

## MODIFIED Requirements

<!-- 既存 Requirement を変更する場合は `### Requirement: FR-NNN — <既存タイトル>` を書く -->

## REMOVED Requirements

<!-- 削除する Requirement の FR-NNN を書く -->

## RENAMED Requirements

<!-- リネームは `### Requirement: FR-NNN — <旧> -> FR-NNN — <新>` -->
