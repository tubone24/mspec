# Delta Spec: artifact-preview

## ADDED Requirements

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

## MODIFIED Requirements

<!-- 既存 Requirement を変更する場合は `### Requirement: FR-NNN — <既存タイトル>` を書く -->

## REMOVED Requirements

<!-- 削除する Requirement の FR-NNN を書く -->

## RENAMED Requirements

<!-- リネームは `### Requirement: FR-NNN — <旧> -> FR-NNN — <新>` -->
