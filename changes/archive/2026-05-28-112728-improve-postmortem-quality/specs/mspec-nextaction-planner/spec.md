# Delta Spec: mspec-nextaction-planner

## Security Capabilities

<!-- proposalのsecurity質問（PRP-SEC-001〜004）の回答からmspec-proposalスキルが記述する -->
<!-- 権限境界: ローカルファイル読み取りのみ -->
<!-- アクセス増加: なし（mspec new の実行は archive スキルが行う。planner は read-only のまま） -->
<!-- エージェント権限: 読み取り専用サブエージェント -->
<!-- ロールバック手段: 生成されたチェンジディレクトリを git clean で削除可能 -->

## ADDED Requirements

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

## MODIFIED Requirements

<!-- 既存 Requirement を変更する場合は `### Requirement: FR-NNN — <既存タイトル>` を書く -->

## REMOVED Requirements

<!-- 削除する Requirement の FR-NNN を書く -->

## RENAMED Requirements

<!-- リネームは `### Requirement: FR-NNN — <旧> -> FR-NNN — <新>` -->
