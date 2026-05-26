# Delta Spec: code-syntax-highlight

## Security Capabilities

<!-- proposalのsecurity質問（PRP-SEC-001〜004）の回答からmspec-proposalスキルが記述する -->
<!-- 権限境界: なし -->
<!-- アクセス増加: 増加なし -->
<!-- エージェント権限: なし -->
<!-- ロールバック手段: git revert -->

## ADDED Requirements

### Requirement: FR-004 — ガーキン／EARS キーワードのバッジスタイル表示

<!-- risk_tier: trivial -->
<!-- blast_radius: local -->

キーワード（GIVEN・WHEN・THEN・AND・BUT・SHALL・MUST・SHOULD・MAY）が表示される間、このシステムは SHALL 各キーワードに対して背景色を付与し、角丸のあるラベル（バッジ）風のスタイルで表示する.

#### Scenario: GIVEN キーワードのバッジ表示
- GIVEN スペックビューアで Requirements の Scenario セクションが表示されている
- WHEN ユーザーが GIVEN キーワードを含むシナリオを閲覧する
- THEN GIVEN キーワードが背景色付きの角丸ラベル（バッジ）として表示され、テキスト色のみより視覚的に目立つ

#### Scenario: SHALL キーワードのバッジ表示
- GIVEN スペックビューアで Requirements セクションが表示されている
- WHEN ユーザーが SHALL キーワードを含む要件テキストを閲覧する
- THEN SHALL キーワードが背景色付きの角丸ラベル（バッジ）として表示される

### Requirement: FR-005 — コードブロック枠線の細線化

<!-- risk_tier: trivial -->
<!-- blast_radius: local -->

コードブロックが表示される間、このシステムは SHALL コードブロック周囲の border を 1px の細線で表示する.

#### Scenario: コードブロック枠線の細さ確認
- GIVEN シンタックスハイライトが適用されたコードブロックが表示されている
- WHEN ユーザーがページを閲覧する
- THEN コードブロックの枠線が 1px の細線で表示され、従来の太い枠線より視覚的に軽い印象になる

## MODIFIED Requirements

<!-- 既存 Requirement を変更する場合は `### Requirement: FR-NNN — <既存タイトル>` を書く -->

## REMOVED Requirements

<!-- 削除する Requirement の FR-NNN を書く -->

## RENAMED Requirements

<!-- リネームは `### Requirement: FR-NNN — <旧> -> FR-NNN — <新>` -->
