# Delta Spec: cli-core

## Security Capabilities

<!-- 権限境界: ファイルシステム読み取り（specs/*, design.md）のみ。書き込みなし -->
<!-- アクセス増加: なし（読み取り専用の新コマンド） -->
<!-- エージェント権限: なし -->
<!-- ロールバック手段: git revert -->

## ADDED Requirements

### Requirement: FR-005 — mspec verify --llm コマンド

<!-- risk_tier: standard -->
<!-- blast_radius: module -->

このシステムは SHALL `mspec verify --llm` コマンドを提供し、FR-IDごとの評価プロンプトと検証チェック項目をJSON形式で stdout に出力する。

#### Scenario: LLM評価プロンプトのJSON出力
- GIVEN change ディレクトリに specs/*/spec.md と design.md が存在する
- WHEN `mspec verify --llm --change <change>` を実行する
- THEN `{ "fr_checks": [{ "fr_id": "FR-NNN", "title": "...", "prompt": "...", "acceptance_criteria": [...] }] }` 形式のJSONが stdout に出力される

#### Scenario: --json フラグによる machine-readable 出力
- GIVEN `mspec verify --llm --json --change <change>` が実行される
- WHEN コマンドが実行される
- THEN JSON形式で同一の内容が出力される（--llm と --json を組み合わせ可能）

#### Scenario: specs/*/spec.md が存在しない場合
- GIVEN change ディレクトリに specs/*/spec.md が存在しない
- WHEN `mspec verify --llm --change <change>` を実行する
- THEN エラーメッセージを stderr に出力して exit code 1 で終了する

## MODIFIED Requirements

<!-- 既存 Requirement を変更する場合は `### Requirement: FR-NNN — <既存タイトル>` を書く -->

## REMOVED Requirements

<!-- 削除する Requirement の FR-NNN を書く -->

## RENAMED Requirements

<!-- リネームは `### Requirement: FR-NNN — <旧> -> FR-NNN — <新>` -->
