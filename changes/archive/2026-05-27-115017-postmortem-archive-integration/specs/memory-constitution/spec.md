# Delta Spec: memory-constitution

## Security Capabilities

<!-- 権限境界: ファイルシステムアクセス（memory/constitution.md への書き込み） -->
<!-- アクセス増加: ファイル書き込み範囲の拡大（constitution.md への自動追記が新規追加） -->
<!-- エージェント権限: なし（constitution.md への書き込みはメイン archive スキルが直接実施） -->
<!-- ロールバック手段: git revert -->

## ADDED Requirements

### Requirement: FR-001 — Lessons 抽象化提案の追記

<!-- risk_tier: standard -->
<!-- blast_radius: system -->

ユーザーが AskUserQuestion で承認したとき、このシステムは SHALL mspec-lessons-analyzer の提案した原則・制約テキストを `memory/constitution.md` の指定セクションに追記する。

#### Scenario: 新規原則として constitution.md に追加する
- GIVEN mspec-lessons-analyzer が "delta spec の省略時に Capability を空にした場合の検証不足" という Lesson から "仕様書の各 Capability は最低 1 つの Requirement を持つことを MUST とする" という提案を生成した
- WHEN ユーザーが AskUserQuestion で承認する
- THEN `memory/constitution.md` の `## Additional Constraints` セクションに該当テキストが追記される

### Requirement: FR-002 — ユーザー未承認時の書き込み禁止

<!-- risk_tier: critical -->
<!-- blast_radius: system -->

ユーザーが承認していない提案に対して、このシステムは MUST NOT `memory/constitution.md` に書き込みを行わない。

#### Scenario: ユーザーが提案を却下する場合
- GIVEN mspec-lessons-analyzer が constitution.md への追記提案を返した
- WHEN ユーザーが AskUserQuestion で「追加しない」を選択する
- THEN constitution.md は変更されず、元のファイル内容が保持される

## MODIFIED Requirements

<!-- 既存 Requirement を変更する場合は `### Requirement: FR-NNN — <既存タイトル>` を書く -->

## REMOVED Requirements

<!-- 削除する Requirement の FR-NNN を書く -->

## RENAMED Requirements

<!-- リネームは `### Requirement: FR-NNN — <旧> -> FR-NNN — <新>` -->
