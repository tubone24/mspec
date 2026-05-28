# Delta Spec: mspec-archive

## Security Capabilities

<!-- 権限境界: specs/ 配下の既存 spec.md へのローカル書き込みのみ。外部 API・秘密情報アクセスなし -->
<!-- アクセス増加: なし（読み書き対象は既存の specs/ 配下のみ） -->
<!-- エージェント権限: Claude Code が直接ファイル編集。mspec CLI への依存なし -->
<!-- ロールバック手段: git checkout で元に戻せる（コミット前）。コミット後は git revert -->

## ADDED Requirements

### Requirement: FR-006 — 既存 capability spec への Purpose 一括バックフィル

<!-- risk_tier: standard -->
<!-- blast_radius: system -->

既存の `specs/*/spec.md` のうち `## Purpose` セクションがテンプレートプレースホルダーのままのファイルが存在するとき、このシステムは SHALL 各ファイルの `## Requirements` セクション内容を基に 1〜2 文の外部観測可能な振る舞いの概要を生成し、正規表現でプレースホルダー行のみを置換して書き込む。

`## Purpose` セクションにプレースホルダー以外のテキストが記述済みのファイルの場合、このシステムは SHALL そのファイルをスキップし変更を加えない（冪等性）。

#### Scenario: プレースホルダーの Purpose を持つ spec が修正される
- GIVEN `specs/<capability>/spec.md` の `## Purpose` セクションが `<このスペックがカバーする外部から観測可能な振る舞いの概要>` と完全一致している
- WHEN Claude Code がバックフィルスクリプトを実行する
- THEN `## Purpose` セクションの内容が 1〜2 文の意味のある記述で置換され、プレースホルダーは残らない

#### Scenario: 記述済みの Purpose を持つ spec はスキップされる
- GIVEN `specs/<capability>/spec.md` の `## Purpose` にプレースホルダー以外のテキストが記述されている
- WHEN Claude Code がバックフィルスクリプトを実行する
- THEN そのファイルは変更されず、冪等に処理される

#### Scenario: 一部失敗時も処理は継続される
- GIVEN 複数の spec のうち一部で Purpose 生成が失敗した
- WHEN バックフィルスクリプトが実行中である
- THEN 失敗した capability をスキップして残りの処理を続行し、失敗件数をサマリーに記録する

## MODIFIED Requirements

<!-- 既存 Requirement を変更する場合は `### Requirement: FR-NNN — <既存タイトル>` を書く -->

## REMOVED Requirements

<!-- 削除する Requirement の FR-NNN を書く -->

## RENAMED Requirements

<!-- リネームは `### Requirement: FR-NNN — <旧> -> FR-NNN — <新>` -->
