# Delta Spec: mspec-lessons-analyzer

## Security Capabilities

<!-- proposalのsecurity質問（PRP-SEC-001〜004）の回答からmspec-proposalスキルが記述する -->
<!-- 権限境界: ローカルファイル読み取りのみ。外部アクセスなし -->
<!-- アクセス増加: なし -->
<!-- エージェント権限: 読み取り専用サブエージェント -->
<!-- ロールバック手段: archive ステップ前に constitution.md を git で復元可能 -->

## ADDED Requirements

### Requirement: FR-003 — Lessons の抽象化と本質課題への昇華

<!-- risk_tier: standard -->
<!-- blast_radius: local -->

Lessons を処理するとき、このシステムは SHALL 具体的な事象記述（「◯◯ファイルのプレースホルダーを埋め忘れた」等）を、背景にある本質的なプロセス課題・設計上の盲点・再発防止原則へと抽象化し、次の変更でも汎用的に適用できるレベルに昇華した提案テキストを返す。

#### Scenario: 具体的な実装ミスが Lesson として記録されている
- GIVEN readme.md の Lessons に "delta init 後に spec.md のプレースホルダーを埋め忘れてバリデーションが失敗した" という具体事象が記載されている
- WHEN mspec-lessons-analyzer サブエージェントが Lessons を処理する
- THEN 提案テキストは「delta スキル実行後に validate を必須化する」ではなく「スキル完了条件を事前に明示することで成果物の品質ゲートを担保する」等の抽象原則として返す

#### Scenario: ツール固有のミスが Lesson として記録されている
- GIVEN readme.md の Lessons に "mspec continue を確認せずに手動で次ステップを実行してワークフローが壊れた" という記述がある
- WHEN mspec-lessons-analyzer サブエージェントが起動される
- THEN ツール名や操作手順を除去し、「状態管理を担うコンポーネントの出力を必ず参照してから次アクションを決定する」という再利用可能な原則を返す

#### Scenario: 既に抽象的な Lesson は変換不要
- GIVEN readme.md の Lessons に「ユーザーへの確認なしに不可逆な操作を行ってはならない」という抽象原則が既に記述されている
- WHEN mspec-lessons-analyzer サブエージェントが起動される
- THEN そのエントリはそのまま提案リストに含め、過剰な再抽象化を行わない

## MODIFIED Requirements

<!-- 既存 Requirement を変更する場合は `### Requirement: FR-NNN — <既存タイトル>` を書く -->

## REMOVED Requirements

<!-- 削除する Requirement の FR-NNN を書く -->

## RENAMED Requirements

<!-- リネームは `### Requirement: FR-NNN — <旧> -> FR-NNN — <新>` -->
