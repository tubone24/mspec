# Delta Spec: code-syntax-highlight

## Security Capabilities

<!-- proposalのsecurity質問（PRP-SEC-001〜004）の回答からmspec-proposalスキルが記述する -->
<!-- 権限境界: Web UI レンダリング層（DOM 生成）のみ。ファイルシステムやネットワークへのアクセスなし -->
<!-- アクセス増加: なし -->
<!-- エージェント権限: なし -->
<!-- ロールバック手段: 該当コンポーネントの前バージョンへの差し戻し -->

## ADDED Requirements

### Requirement: FR-006 — コードブロックの `<pre>` タグ二重ラップ禁止

<!-- risk_tier: standard -->
<!-- blast_radius: module -->

コードブロックが描画されるとき、このシステムは SHALL Shiki が生成した `<pre>` タグを追加の `<pre>` タグで二重にラップしない.

#### Scenario: AskUserQuestion コードブロックの正常描画
- GIVEN `AskUserQuestion` コンポーネントがコードブロックを含む Markdown を出力する
- WHEN Web UI がそのコードブロックを描画する
- THEN 外側の `<pre>` タグが 1 つだけ存在し、`<pre><pre ...>` のように入れ子にならない

#### Scenario: 通常の Markdown コードフェンスの正常描画
- GIVEN ドキュメント内に ` ``` ` で囲まれたコードブロックがある
- WHEN ページが描画される
- THEN DOM 上に `<pre>` タグは 1 層のみ存在し、Shiki のハイライトが正しく適用される

## MODIFIED Requirements

<!-- 既存 Requirement を変更する場合は `### Requirement: FR-NNN — <既存タイトル>` を書く -->

## REMOVED Requirements

<!-- 削除する Requirement の FR-NNN を書く -->

## RENAMED Requirements

<!-- リネームは `### Requirement: FR-NNN — <旧> -> FR-NNN — <新>` -->
