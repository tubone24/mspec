<!-- mspec: gaps in FR numbering are intentional. Removed requirements are archived under changes/archive/. -->

# mspec-nextaction-planner Specification

## Purpose

アーカイブ済みチェンジの `readme.md` から Next Steps を読み取り、緊急度・影響範囲・実装コストを評価して優先度付きの新規チェンジ登録候補リストを返す。各候補には `mspec new` の引数として安全に使用できる kebab-case フィーチャー名と、次セッションで文脈を復元するための1行概略テキスト（request_summary）を含む。

## Requirements

<!-- archive コマンドが Delta Spec の ADDED/MODIFIED/REMOVED/RENAMED を機械的にマージします -->

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

### Requirement: FR-003 — mspec:new 提案時の概略テキスト生成

<!-- risk_tier: standard -->
<!-- blast_radius: local -->

`mspec:new` の実行を提案するとき、このシステムは SHALL 提案対象の Next Steps エントリから改行を含まない1行の概略テキスト（何を・なぜ変更するか、100文字以内）を生成し、新規チェンジの `readme.md` の `## Request` セクションに書き込む。

#### Scenario: Next Steps から新規チェンジが提案される
- GIVEN mspec-nextaction-planner が "パフォーマンスボトルネックの解消" という Next Steps エントリを処理している
- WHEN archive スキルが mspec:new の実行を提案する
- THEN 生成された changes/<timestamp>-<feature>/readme.md の `## Request` セクションに「パフォーマンスボトルネックの解消を目的とする。〇〇処理の遅延が課題であり、アルゴリズムの見直しまたはキャッシュ導入を検討する。」という概略テキストが記載されている

#### Scenario: 概略テキストが空の readme.md には次セッションで文脈が失われる
- GIVEN mspec:new が実行されたが readme.md の Request セクションが未記入のまま
- WHEN 別セッションでそのチェンジを開く
- THEN 何から始めるべきかわからず作業継続に支障が出る（この状態を FR-003 は防止する）

#### Scenario: 概略が冗長にならないよう制限する
- GIVEN Next Steps エントリが詳細な技術仕様を含む長文テキストである
- WHEN mspec-nextaction-planner が概略テキストを生成する
- THEN request_summary は改行なしの1行（100文字以内）で生成し、詳細は後続の proposal ステップに委ねる


