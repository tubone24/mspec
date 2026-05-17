# Delta Spec: claude-integration

## ADDED Requirements

### Requirement: FR-017 — Skill files SHALL reference next-step commands in colon format only

The system SHALL use only the colon-separated command format (`/mspec:<step>`) when referring to next-step slash commands inside skill prompt files (`.claude/skills/mspec-*/` and `.claude/agents/mspec-*`). Hyphen-separated references (e.g. `mspec-continue`, `mspec-proposal`) MUST NOT appear in any skill or agent file.

#### Scenario: Skill instructs user to run next step in colon format
- GIVEN `.claude/skills/mspec-proposal/SKILL.md` の手順末尾にユーザーへの指示が記載されている
- WHEN ユーザーがその指示を読む
- THEN 指示に含まれるコマンド名はすべて `/mspec:continue` 等のコロン形式である
- AND `mspec-continue` 等のハイフン形式の文字列は一切含まれない

#### Scenario: grep で残存ゼロを確認
- GIVEN 全スキル・エージェントファイルが修正済みである
- WHEN `grep -r "mspec-" .claude/` を実行する
- THEN ハイフン形式のコマンド参照がヒットしない

## MODIFIED Requirements

<!-- 既存 Requirement を変更する場合は `### Requirement: FR-NNN — <既存タイトル>` を書く -->

## REMOVED Requirements

<!-- 削除する Requirement の FR-NNN を書く -->

## RENAMED Requirements

<!-- リネームは `### Requirement: FR-NNN — <旧> -> FR-NNN — <新>` -->
