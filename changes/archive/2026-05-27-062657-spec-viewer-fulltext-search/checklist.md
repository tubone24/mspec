# Checklist: spec-viewer-search

## Delta Spec Coverage

<!-- FR-004, FR-005, FR-006, FR-007 は risk_tier: trivial のためスキップ -->

- [x] FR-001: Spec Viewer サイドバーへの検索ボックス追加 — `/spec-viewer` ロード時にサイドバー上部に検索ボックスが表示されることを T404 シナリオで確認する [risk: standard] <!-- verify: fr-001 -->
- [x] FR-002: specs ディレクトリのクライアントサイド全文検索インデックス構築 — 起動時に `useSpecSearchIndex.isBuilding` が `false` になり全 capability がインデックス化されることを T405 シナリオで確認する [risk: standard] <!-- verify: fr-002 -->
- [x] FR-003: インクリメンタルフィルタリング（debounce 200ms）— `full-text` 入力後 200ms 以内にサイドバーが絞り込まれることを T406 シナリオで確認する [risk: standard] <!-- verify: fr-003 -->

## Source-of-Truth Regression

- [x] artifact-preview / FR-002（Mermaid レンダリング）: `rehypeMarkText.ts:51-57` で `parentEl.tagName === 'code' || 'pre'` および `language-mermaid` クラスの subtree をスキップ実装確認済み。D-06 ルール適用済み [risk: standard] <!-- verify: human -->
- [x] artifact-preview / FR-003（EARS / Gherkin シンタックスハイライト）: `SpecViewer.tsx:119-122` で `rehypeGherkinEars` の後に `rehypeMarkText` を配置（D-09）。`rehypeGherkinEars` が text node を走査する前に mark 化されない順序が確認済み [risk: standard] <!-- verify: human -->
- [x] web-ui-search / FR-001（全文検索エンジン接続）: `Search.tsx` への `placeholder?` / `onClear?` props 追加により既存 Dashboard の呼び出し箇所がビルドエラーになるリスク。`pnpm exec tsc --noEmit` 0 エラー確認済み。全 E2E テスト（web-ui-search.e2e を含む）が 36/36 通過 [risk: standard] <!-- verify: human -->
- [x] change-dashboard / FR-001（チェンジ一覧表示）: Dashboard で `Search.tsx` を使用しており props 変更が動作に影響しないことを確認。`onClear` 未渡し時は D-08 の条件により × ボタン非表示（実装確認済み）。全 E2E テスト 36/36 通過 [risk: standard] <!-- verify: human -->
- [x] search-index / FR-001（インデックス動的構築）: `git diff --name-only` で `lib/searchIndex.ts` の変更なしを確認。`tokenize` は read-only import のみ [risk: standard] <!-- verify: human -->
- [x] full-text-search / FR-001（クライアントサイド検索エンジン）: `specSearchIndex.ts:6` で `import { tokenize } from './searchIndex.js'` を確認。同一 tokenizer を再利用しており不一致なし [risk: standard] <!-- verify: human -->

## Constitution Check

- [x] I. ステップ独立性: 実装ファイルはすべて新規または optional props 追加のみ。既存ステップ成果物を破壊的変更しない確認済み <!-- verify: human -->
- [x] II. 決定論的マージ: 新規 capability `spec-viewer-search` のみ。`mspec anchor check` で 262 アンカー 0 エラー確認済み <!-- verify: human -->
- [x] III. 質問駆動の要件確定: proposal/research/design/self-review の全ステップで要件・設計判断を文書化済み。D-07〜D-09 で曖昧だった点も解決済み <!-- verify: human -->
- [x] IV. 双方向アンカー: `mspec anchor check` を実行した結果 0 エラー（Scanned 262 anchors, 0 errors）。アンカー整合性は確認済み <!-- verify: human -->
- [x] V. 強制ステップと拡張ステップの分離: `workflow.yaml` への変更なし。新規ファイルは tasks.md に定義された強制ステップの実装のみ <!-- verify: human -->
- [x] VI. Security by Default: Delta Spec に `## Security Capabilities` セクションが存在し、proposal.md に PRP-SEC-001〜004 への回答が記載されている（権限境界: なし / アクセス増加: なし / エージェント権限: なし / ロールバック: git revert）。`escapeRegExp` による不正入力防御も design.md D-05 に明記済み <!-- verify: human -->
