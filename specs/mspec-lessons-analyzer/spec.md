<!-- mspec: gaps in FR numbering are intentional. Removed requirements are archived under changes/archive/. -->

# mspec-lessons-analyzer Specification

## Purpose

アーカイブ済みチェンジの `readme.md` から Lessons を読み取り、具体的な事象記述を汎用的なプロセス原則・設計上の教訓へと抽象化したうえで `memory/constitution.md` との重複を除去し、追記すべき原則・制約の候補リストを返す。

## Requirements

<!-- archive コマンドが Delta Spec の ADDED/MODIFIED/REMOVED/RENAMED を機械的にマージします -->

### Requirement: FR-001 — Lessons 全件分析と提案生成

<!-- risk_tier: standard -->
<!-- blast_radius: local -->

起動されたとき、このシステムは SHALL アーカイブ対象チェンジの `readme.md` から Lessons セクションの全エントリを読み取り、`memory/constitution.md` の既存原則・制約と照合したうえで重複を除いた追加提案リストを返す。

#### Scenario: 新規原則となりうる Lesson がある
- GIVEN readme.md の Lessons に "delta init 後に spec.md のプレースホルダーを埋め忘れるとバリデーションエラーが発生する" というエントリがある
- WHEN mspec-lessons-analyzer サブエージェントが起動される
- THEN constitution.md との重複チェックを行い、対応する抽象化提案（例：「delta スキル完了後に validate を必須化する」）を含むリストを返す

#### Scenario: 既存原則と重複する Lesson がある
- GIVEN readme.md の Lessons に "AskUserQuestion を使わず直接書き込んだ" というエントリがある
- WHEN mspec-lessons-analyzer サブエージェントが起動される
- THEN 原則 III（質問駆動の要件確定）と重複と判断し、そのエントリを提案リストに含めない

#### Scenario: 全 Lessons が既存原則と重複する
- GIVEN readme.md の全 Lessons が constitution.md の既存原則と重複している
- WHEN mspec-lessons-analyzer サブエージェントが起動される
- THEN 空の提案リストを返し、archive スキルは AskUserQuestion を表示しない

### Requirement: FR-002 — 提案エントリのフォーマット

<!-- risk_tier: trivial -->
<!-- blast_radius: local -->

このシステムは SHALL 各提案エントリを「原則/制約の本文テキスト」「追記推奨セクション名」「根拠となる元 Lesson テキスト」の 3 要素を含む構造化データとして返す。

#### Scenario: 提案エントリが正しくフォーマットされる
- GIVEN mspec-lessons-analyzer が分析を完了した
- WHEN 提案リストを archive スキル本体に返す
- THEN 各エントリは { text, target_section, source_lesson } の 3 フィールドを持つ

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


