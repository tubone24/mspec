# Delta Spec: artifact-preview

## ADDED Requirements

### Requirement: FR-001 — Markdown プレビュー

<!-- risk_tier: critical -->
<!-- blast_radius: local -->

このシステムは SHALL チェンジ内の全 `.md` ファイルをレンダリング済み HTML としてプレビュー表示し、ダーク・ライトモードを切り替えられるトグルを提供する.

#### Scenario: Markdown ファイルのプレビュー表示
- GIVEN あるチェンジに `design.md` が存在する
- WHEN ユーザーがそのファイルをアーティファクト一覧からクリックする
- THEN design.md が HTML にレンダリングされた状態でプレビューエリアに表示される

### Requirement: FR-002 — Mermaid ダイアグラムのレンダリング

<!-- risk_tier: standard -->
<!-- blast_radius: local -->

このシステムは SHALL Markdown 内の ```` ```mermaid ```` コードブロックを SVG ダイアグラムとして描画する.

#### Scenario: Mermaid フローチャートの描画
- GIVEN プレビュー対象の MD ファイルに Mermaid のフローチャートブロックが含まれる
- WHEN プレビューが表示される
- THEN Mermaid コードブロックが SVG 図として正しく描画される

### Requirement: FR-003 — EARS / Gherkin シンタックスハイライト

<!-- risk_tier: standard -->
<!-- blast_radius: local -->

このシステムは SHALL Delta Spec（spec.md）内の EARS キーワード（SHALL / MUST / SHOULD / MAY）および Gherkin キーワード（GIVEN / WHEN / THEN / AND / BUT）を色分けハイライト表示する.

#### Scenario: spec.md のシンタックスハイライト
- GIVEN spec.md をプレビュー表示している
- WHEN EARS キーワードおよび Gherkin キーワードが含まれる行が描画される
- THEN SHALL / MUST は赤系、SHOULD / MAY は黄系、GIVEN / WHEN / THEN は緑系で色分けされる

### Requirement: FR-004 — ダーク / ライトモード切り替え

<!-- risk_tier: trivial -->
<!-- blast_radius: local -->

このシステムは SHALL ユーザーの操作によってダークモードとライトモードを即座に切り替え、選択状態をブラウザ LocalStorage に永続化する.

#### Scenario: ダークモードへの切り替え
- GIVEN ライトモードでプレビューが表示されている
- WHEN ユーザーがテーマトグルをクリックする
- THEN プレビューエリア全体がダークテーマに切り替わり、ページリロード後も設定が保持される

### Requirement: FR-005 — プロトタイプ HTML の iframe 表示

<!-- risk_tier: standard -->
<!-- blast_radius: local -->

このシステムは SHALL チェンジ内の `prototype.html` ファイルをサンドボックス化した `<iframe>` 内でレンダリング表示する.

#### Scenario: ビジュアルプロトタイプの確認
- GIVEN あるチェンジに `prototype.html` が存在する
- WHEN ユーザーがアーティファクト一覧から prototype.html を選択する
- THEN `sandbox="allow-scripts"` 属性付きの iframe でプロトタイプ HTML が表示される

## MODIFIED Requirements

<!-- 既存 Requirement を変更する場合は `### Requirement: FR-NNN — <既存タイトル>` を書く -->

## REMOVED Requirements

<!-- 削除する Requirement の FR-NNN を書く -->

## RENAMED Requirements

<!-- リネームは `### Requirement: FR-NNN — <旧> -> FR-NNN — <新>` -->
