---
doc_type: Reference
---

# Checklist: Full-Text Search 拡張

## Delta Spec Coverage

<!-- verify アノテーション凡例:
  fr-NNN = E2E Scenario によって自動検証可能
  human  = 手動確認が必要
  trivial FR (risk_tier: trivial) はルールに従いスキップ
  capability prefix 付き FR 番号を使用（同番号が複数 capability に存在するため）
-->

| FR | タイトル | 確認項目 | リスク |
|----|---------|---------|-------|
| full-text-search/FR-001 | クライアントサイド全文検索エンジンの採用 | - [x] npm パッケージのみで全文検索が動作し、サーバーサイドへの検索リクエストが発生しないこと <!-- verify: fr-001 --> | サーバーサイド通信が混入していた場合にパフォーマンス劣化・依存増加 |
| full-text-search/FR-002 | ドキュメント本文コンテンツの検索対象化 | - [x] タイトルに含まれないが仕様書本文にのみ存在するキーワードで検索したとき、該当変更が結果に表示されること <!-- verify: fr-002 --> | 本文フィールドのインデックス登録漏れにより検索ヒットしない可能性 |
| ~~full-text-search/FR-003~~ | ~~検索結果ゼロ時の空状態表示~~ | risk_tier: trivial — スキップ | — |
| search-index/FR-001 | ブラウザ起動時の動的インデックス構築 | - [x] Web UI 起動後にインデックスが自動構築され、検索が有効化されること <!-- verify: fr-001 --> | Promise.all 並行取得（最大5）のスロットリング不備によりブラウザ初期表示が遅延するリスク |
| search-index/FR-002 | インデックス対象フィールドの定義 | - [x] name / title / summary / tags / content の各フィールドが検索対象に含まれること（タグマッチが結果に反映されること） <!-- verify: fr-002 --> | フィールド定義漏れにより weight 設定が機能しない可能性 |
| search-index/FR-003 | インデックス構築失敗時の劣化動作 | - [x] API アーティファクト取得失敗時にもメタデータ部分一致検索で結果が返ること <!-- verify: fr-003 --> | エラー時のフォールバック分岐が欠落するとクエリ入力中に空リストが表示され続ける |
| web-ui-search/FR-001 | 既存検索 UI の全文検索エンジンへの接続 | - [x] 検索ボックス入力時に MiniSearch がクエリを処理し、スコアリングされた結果が返ること（String.includes() が廃止されていること） <!-- verify: fr-001 --> | includes() 廃止漏れにより全文検索と部分一致が混在するリスク |
| web-ui-search/FR-002 | 検索対象の全ドキュメントへの拡張 | - [x] proposal.md / spec.md / design.md 等のアーティファクト本文を横断してキーワード検索できること <!-- verify: fr-002 --> | アーティファクトフェッチが特定の doc_type に限定されており横断検索が不完全になるリスク |
| ~~web-ui-search/FR-003~~ | ~~検索結果のスコアベースソート~~ | risk_tier: trivial — スキップ | — |

## Source-of-Truth Regression Risk

| 影響範囲 | リスクレベル | 確認項目 |
|---------|------------|---------|
| Dashboard.tsx — クエリ空時ソート順 | Medium | - [ ] 検索クエリが空のとき、従来通り `updatedAt` 降順でソートされること（D-04 フォールバックパスが既存ロジックを正確に再現していること）（設計判断の保持確認は機械検証不可） <!-- verify: human --> |
| useChanges — 2 秒リフェッチとインデックス再構築 | High | - [ ] `useChanges` の `refetchInterval: 2000` により `changes` 配列が毎回新しい参照で返るとき、`useSearchIndex` がインデックス全体を 2 秒ごとに再構築しないこと（メモ化・依存比較の設計確認は機械検証不可） <!-- verify: human --> |
| useSearchIndex — N×M 並行フェッチによる初期表示遅延 | Medium | - [ ] 変更数 × Markdown アーティファクト数の並行取得が最大 5 同時リクエストに絞られており、ブラウザ初期表示（First Paint）が著しく遅延しないこと（視覚的パフォーマンス許容性は機械検証不可） <!-- verify: human --> |
| Search.tsx — プレースホルダーテキスト | Low | - [ ] プレースホルダー「Search changes, tags…」が本文検索に対応した文言（例: "Search docs, tags…"）に更新されているか、または現状維持の意図的決定が記録されていること（UI 文言の許容性は機械検証不可） <!-- verify: human --> |
| dashboard.e2e.test.ts — 既存テストの非破壊 | Medium | - [ ] 既存 E2E テスト（T201 change-row 表示、T202 mode filter）が全文検索導入後も引き続き PASS すること（既存テストの CI 実行結果で確認） <!-- verify: human --> |
| client.ts — useArtifactContent との使い分け | Low | - [ ] `useSearchIndex` が `useArtifactContent` フック（React Query キャッシュ付き）を使用しているか、または素の `fetch` を使用している場合に重複取得が発生していないこと（実装コードレビューで確認） <!-- verify: human --> |
| Intl.Segmenter — ブラウザ互換性 | Medium | - [ ] 対応ブラウザ（Chrome 87+, Firefox 125+, Safari 16.4+）の要件が明示されており、サポート外ブラウザでのグレースフルデグラデーションが考慮されていること（ブラウザ互換マトリクスの確認は機械検証不可） <!-- verify: human --> |

## Constitution Check

| 原則 | 確認項目 | Pass/Fail |
|------|---------|----------|
| I. ステップ独立性 | - [ ] design はコードを変更しない。新規ファイル追加のみで既存 API・コンポーネントを破壊しないこと（実装完了後に人手で確認） <!-- verify: human --> | — |
| II. 決定論的マージ | - [ ] capability 名 kebab-case (`full-text-search`, `search-index`, `web-ui-search`) が既存 SoT spec と衝突しないこと。新規ファイル名が既存ファイルと衝突しないこと（設計判断の妥当性は機械検証不可） <!-- verify: human --> | — |
| III. 質問駆動の要件確定 | - [ ] proposal.md に AI が AskUserQuestion で確定した要件の根拠が記録されており、すべての技術決定が research.md に追跡可能な形で記録されていること（成果物の存在と内容確認は機械検証不可） <!-- verify: human --> | — |
| IV. 双方向アンカー | - [x] `mspec anchor check` 実行結果: 242 アンカースキャン・エラー 0 件（2026-05-27 時点）<!-- verify: human --> | Pass |
| V. 強制ステップと拡張ステップの分離 | - [ ] design は強制ステップ。design-rationale が別ファイルに分離されていること。workflow.yaml の強制ステップ定義を変更していないこと（設計構造の妥当性確認は機械検証不可） <!-- verify: human --> | — |
| VI. Security by Default | - [x] proposal.md に PRP-SEC-001〜004 の回答あり（確認済み）。全 Delta Spec に `## Security Capabilities` セクション存在（確認済み）。クライアントサイドのみで FS アクセスは Markdown 読み取りに限定 <!-- verify: human --> | Pass |
