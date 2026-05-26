# Delta Spec: claude-integration

## Security Capabilities

<!-- 権限境界: SKILL.md（Markdown）のみ変更、CLIコード無変更 -->
<!-- アクセス増加: なし -->
<!-- エージェント権限: なし -->
<!-- ロールバック手段: git revert -->

## ADDED Requirements

### Requirement: FR-024 — SKILL.md 3コンパートメント構造

<!-- risk_tier: trivial -->
<!-- blast_radius: local -->

このシステムは SHALL 各SKILL.mdに `## Verification (C2)` セクションと `## Learning (C3)` セクションを提供する。

#### Scenario: Verification セクション存在確認
- GIVEN mspec-* スキルの SKILL.md が存在する
- WHEN エージェントがスキルを実行した後に後処理を確認する
- THEN `## Verification (C2)` セクションに実行すべき CLI コマンドが記述されている

#### Scenario: Learning セクション存在確認
- GIVEN mspec-* スキルの SKILL.md が存在する
- WHEN エージェントが学習候補を記録しようとする
- THEN `## Learning (C3)` セクションに記録フォーマットが定義されている

## MODIFIED Requirements

<!-- 既存 Requirement を変更する場合は `### Requirement: FR-NNN — <既存タイトル>` を書く -->

## REMOVED Requirements

<!-- 削除する Requirement の FR-NNN を書く -->

## RENAMED Requirements

<!-- リネームは `### Requirement: FR-NNN — <旧> -> FR-NNN — <新>` -->
