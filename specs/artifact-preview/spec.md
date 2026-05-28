<!-- mspec: gaps in FR numbering are intentional. Removed requirements are archived under changes/archive/. -->

# artifact-preview Specification

## Purpose

Web UI のアーティファクトビューアが Markdown コンテンツを正確にレンダリングし（Mermaid 図・EARS/Gherkin ハイライト・コードシンタックス・プロトタイプ HTML 等）、ユーザーが checklist.md のチェックボックスをインタラクティブに操作してファイルに永続化できる振る舞いをカバーする。

## Requirements

<!-- archive コマンドが Delta Spec の ADDED/MODIFIED/REMOVED/RENAMED を機械的にマージします -->

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

### Requirement: FR-006 — E2E Mermaid SVG レンダリング確認

<!-- risk_tier: critical -->
<!-- blast_radius: local -->

Playwright E2E テストを実行したとき、このシステムは SHALL `architecture-overview.md` または `design.md` を含むチェンジの MD プレビューページで、Mermaid コードブロックが `data-testid="mermaid-svg"` を持つ SVG 要素としてレンダリングされること.

#### Scenario: Mermaid ダイアグラムが SVG として描画される
- GIVEN MD プレビューページに ` ```mermaid ` ブロックを含むファイルが表示されている
- WHEN Playwright がページを開いて DOM が安定するまで待機する
- THEN `[data-testid="mermaid-svg"] svg` セレクターに一致する SVG 要素が 1 件以上存在する

### Requirement: FR-007 — E2E ダーク/ライトモード永続化確認

<!-- risk_tier: standard -->
<!-- blast_radius: local -->

Playwright E2E テストを実行したとき、このシステムは SHALL テーマトグルをクリック後にページをリロードしてもダークモードが維持され、LocalStorage に `mspec-ui-store` キーが保存されていること.

#### Scenario: テーマ切り替えがリロード後も保持される
- GIVEN ダッシュボードがライトモードで表示されている
- WHEN Playwright が `[data-testid="theme-toggle"]` をクリックし、その後ページをリロードする
- THEN `document.documentElement` が `dark` クラスを持ち、LocalStorage の `mspec-ui-store` に `"theme":"dark"` が含まれる

### Requirement: FR-008 — E2E EARS / Gherkin ハイライト確認

<!-- risk_tier: standard -->
<!-- blast_radius: local -->

Playwright E2E テストを実行したとき、このシステムは SHALL spec.md をプレビュー表示したとき `data-testid="gherkin-highlight"` 要素内の `SHALL` キーワードが赤系の色付きスパンとして描画されること.

#### Scenario: SHALL キーワードが色付きスパンとして描画される
- GIVEN Delta Spec の spec.md が MD プレビューページで表示されている
- WHEN Playwright がページ内の `[data-testid="gherkin-highlight"]` 要素を取得する
- THEN その要素内に `text-red-600` クラスを持つ `<span>` 要素が 1 件以上存在する

### Requirement: FR-009 — Markdown 見出し・書式の完全レンダリング

<!-- risk_tier: standard -->
<!-- blast_radius: local -->

このシステムは SHALL アーティファクト表示時に Markdown の見出し（H1〜H6）・太字・斜体・コードブロック・テーブル・リストを含む全書式要素を視覚的に区別できる HTML としてレンダリングする.

#### Scenario: 見出しが正しくレンダリングされる
- GIVEN design.md に `# 設計` や `## 概要` などの見出しが含まれている
- WHEN ユーザーがそのアーティファクトをビューワーで表示する
- THEN 見出しテキストがフォントサイズ・ウェイト・余白によって視覚的に階層化されて表示される

#### Scenario: コードブロックが整形されて表示される
- GIVEN spec.md にコードフェンスで囲まれたコードブロックが含まれている
- WHEN ユーザーがプレビューを開く
- THEN コードブロックが等幅フォント・背景色付きの枠内に表示される

### Requirement: FR-010 — スプリットビューレイアウト

<!-- risk_tier: standard -->
<!-- blast_radius: module -->

アーティファクト一覧でアイテムをクリックしたとき、このシステムは SHALL ページ遷移なしに、左ペインにアーティファクト一覧を残したまま右ペインにそのアーティファクトの内容を表示するスプリットビューレイアウトに切り替える.

#### Scenario: アーティファクトクリックでスプリットビューが開く
- GIVEN チェンジのアーティファクト一覧が表示されている
- WHEN ユーザーが `design.md` の行をクリックする
- THEN 画面が左右に分割され、左にアーティファクト一覧、右に design.md のレンダリング済みコンテンツが表示される

#### Scenario: 別アーティファクトへの切り替え
- GIVEN スプリットビューで design.md が表示されている
- WHEN ユーザーが左ペインで `proposal.md` をクリックする
- THEN 右ペインの表示が proposal.md の内容に切り替わり、左ペインの一覧は変化しない

#### Scenario: スプリットビューを閉じる
- GIVEN スプリットビューが表示されている
- WHEN ユーザーが閉じるボタンを押すか、同じアーティファクトを再クリックする
- THEN 右ペインが折りたたまれ、左ペインのアーティファクト一覧が全幅表示に戻る

### Requirement: FR-011 — DockType 別アーティファクトカード色付け

<!-- risk_tier: trivial -->
<!-- blast_radius: local -->

このシステムは SHALL アーティファクト一覧の各カードを、そのアーティファクトの YAML frontmatter に記載された `doc_type` フィールドの値（`Reference` / `Explanation` / `How-to` / `Tutorial`）に応じた固定カラーパレットでハイライト表示し、`doc_type` が存在しない場合はニュートラルカラー（グレー）を適用する.

#### Scenario: Reference アーティファクトが青系色でハイライトされる
- GIVEN あるチェンジのアーティファクト一覧が表示されており、`tasks.md` の frontmatter に `doc_type: Reference` が設定されている
- WHEN ユーザーがそのチェンジの詳細ページを開く
- THEN `tasks.md` のアーティファクトカードが青系（例: `bg-blue-50 border-blue-300`）でハイライトされる

#### Scenario: 各 DockType に異なる色が割り当てられる
- GIVEN 4 種の doc_type（Reference / Explanation / How-to / Tutorial）を持つアーティファクトが混在している
- WHEN アーティファクト一覧を表示する
- THEN Reference は青系、Explanation は紫系、How-to は緑系、Tutorial は黄系でそれぞれ色分けされ、視覚的に区別できる

#### Scenario: doc_type 未設定アーティファクトはグレー表示
- GIVEN あるアーティファクトファイルに YAML frontmatter がない、または `doc_type` フィールドが存在しない
- WHEN アーティファクト一覧でそのカードが表示される
- THEN ニュートラルカラー（グレー系）が適用され、他の色付きカードと区別される

### Requirement: FR-012 — verify:cmd アノテーション付き項目への amber ハイライト

<!-- risk_tier: standard -->
<!-- blast_radius: local -->

checklist.md の Markdown プレビューを表示するとき、このシステムは SHALL `<!-- verify: cmd:... -->` アノテーションが付与された checklist 項目に対して `<!-- verify: human -->` と同じ amber ハイライトを適用する。

#### Scenario: verify:cmd 項目の amber ハイライト表示

- GIVEN checklist.md に `- [ ] FR-006 検証 <!-- verify: cmd:mspec anchor check -->` という行が存在する
- WHEN ユーザーが Web UI で checklist.md をプレビュー表示する
- THEN 当該行が `<!-- verify: human -->` 項目と同様の amber 背景色でハイライトされる

#### Scenario: verify:fr-NNN 項目はハイライトされない

- GIVEN checklist.md に `- [x] FR-001 検証 <!-- verify: fr-001 -->` という行が存在する
- WHEN ユーザーが Web UI で checklist.md をプレビュー表示する
- THEN 当該行には amber ハイライトが適用されない（通常表示のまま）

---

### Requirement: FR-013 — checklist.md チェックボックス操作の永続化とファイル初期状態の復元

<!-- risk_tier: standard -->
<!-- blast_radius: module -->

checklist.md が表示される間、このシステムは SHALL ファイル内容の `- [x]` パターンを解析してチェックボックスの初期状態を復元し、ユーザーがチェックボックスをトグルしたときに更新済みコンテンツを `PATCH /api/changes/:id/artifacts/checklist.md` へ送信してファイルに永続化する.

#### Scenario: ページ再表示時のチェック状態復元
- GIVEN checklist.md の一部項目が `- [x]` でチェック済みである
- WHEN Web UI が checklist.md を表示する
- THEN チェック済み項目が初期状態でチェックマーク付きで表示される（React state は `- [x]` の出現インデックスから初期化される）

#### Scenario: チェックボックストグルのファイル永続化
- GIVEN Web UI に checklist.md が表示されており、未チェックの項目がある
- WHEN ユーザーが未チェックの項目をクリックする
- THEN その項目がチェック済みに変わり、PATCH API が呼び出されてファイルに書き込まれ、次回表示時も状態が保持される






