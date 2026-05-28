# Delta Spec: mspec-lessons-analyzer

## Security Capabilities

<!-- 権限境界: ファイルシステムアクセス（アーカイブ対象チェンジの readme.md と memory/constitution.md の読み取りのみ） -->
<!-- アクセス増加: 読み取り範囲の拡大（アーカイブ時に constitution.md を新たに読み込む） -->
<!-- エージェント権限: あり（archive スキルからサブエージェントとして起動される） -->
<!-- ロールバック手段: git revert（サブエージェント自体は書き込みを行わないため実質リスクなし） -->

## ADDED Requirements

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

## MODIFIED Requirements

<!-- 既存 Requirement を変更する場合は `### Requirement: FR-NNN — <既存タイトル>` を書く -->

## REMOVED Requirements

<!-- 削除する Requirement の FR-NNN を書く -->

## RENAMED Requirements

<!-- リネームは `### Requirement: FR-NNN — <旧> -> FR-NNN — <新>` -->
