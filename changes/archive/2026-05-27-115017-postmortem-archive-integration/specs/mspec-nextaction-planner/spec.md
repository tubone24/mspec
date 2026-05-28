# Delta Spec: mspec-nextaction-planner

## Security Capabilities

<!-- 権限境界: ファイルシステムアクセス（アーカイブ対象チェンジの readme.md の読み取りのみ） -->
<!-- アクセス増加: 増加なし（読み取り専用） -->
<!-- エージェント権限: あり（archive スキルからサブエージェントとして起動される） -->
<!-- ロールバック手段: git revert（サブエージェント自体は書き込みを行わないため実質リスクなし） -->

## ADDED Requirements

### Requirement: FR-001 — Next Steps 優先度評価

<!-- risk_tier: standard -->
<!-- blast_radius: local -->

起動されたとき、このシステムは SHALL アーカイブ対象チェンジの `readme.md` から Next Steps セクションの全エントリを読み取り、緊急度・影響範囲・実装コストを評価して優先度付きのランキングリストを返す。

#### Scenario: 複数の Next Steps がある
- GIVEN readme.md の Next Steps に "E2E テスト追加" と "パフォーマンス改善" と "ドキュメント更新" の 3 件がある
- WHEN mspec-nextaction-planner サブエージェントが起動される
- THEN 3 件それぞれに優先度（high/medium/low）と推奨 kebab-case フィーチャー名を付与したリストを返す

#### Scenario: Next Steps が 1 件のみ
- GIVEN readme.md の Next Steps に 1 件のみ記載がある
- WHEN mspec-nextaction-planner サブエージェントが起動される
- THEN その 1 件に優先度と推奨 kebab-case フィーチャー名を付与して返す

### Requirement: FR-002 — kebab-case フィーチャー名の正規化

<!-- risk_tier: standard -->
<!-- blast_radius: local -->

このシステムは SHALL Next Steps の元テキストを要約・正規化し、`mspec new` の引数として安全に使用できる kebab-case（小文字英数字とハイフンのみ）のフィーチャー名を生成する。

#### Scenario: 日本語テキストを kebab-case に変換する
- GIVEN Next Steps に "E2E テストのカバレッジ向上" という日本語テキストがある
- WHEN mspec-nextaction-planner がフィーチャー名を生成する
- THEN "e2e-coverage-improvement" のような kebab-case 名を返し、元の日本語テキストや記号をそのまま使用しない

#### Scenario: 注入リスクのある特殊文字を含むテキスト
- GIVEN Next Steps に `; rm -rf /` などの特殊文字を含むテキストがある
- WHEN mspec-nextaction-planner がフィーチャー名を生成する
- THEN 正規表現 `^[a-z0-9][a-z0-9-]*[a-z0-9]$` に適合する文字列のみを返し、特殊文字・スペース・大文字を含まない

## MODIFIED Requirements

<!-- 既存 Requirement を変更する場合は `### Requirement: FR-NNN — <既存タイトル>` を書く -->

## REMOVED Requirements

<!-- 削除する Requirement の FR-NNN を書く -->

## RENAMED Requirements

<!-- リネームは `### Requirement: FR-NNN — <旧> -> FR-NNN — <新>` -->
