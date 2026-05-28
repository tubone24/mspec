---
doc_type: Tutorial
---

<!-- @mspec-delta 2026-05-18-044538-revise-artifact-taxonomy/specs/artifact-taxonomy/spec.md -->
<!-- Requirements implemented: FR-005 -->
<!-- Change: revise-artifact-taxonomy -->

# markdown-search-and-quick-access

> Status: new
> Created: 2026-05-27

## Request

SpecViewおよびChangesの検索機能をMarkdownファイルの本文テキストも対象に拡張する。
また、⌘K（Windows/LinuxはCtrl+K、UserAgentで判定）を押すとVSCodeの⌘Pライクなクイックアクセスパレットを表示する機能を追加する。

## Artifacts

- [x] proposal.md
- [x] specs/<capability>/spec.md (Delta Spec)
- [x] research.md
- [x] design.md / design-rationale.md / architecture-overview.md
- [ ] design-rationale.md
- [x] quickstart.md
- [x] checklist.md
- [x] tasks.md

## Skipped Steps

<!-- `mspec skip <step-id> --reason "..."` 実行時に追記される -->
<!-- 例: - research: typo 修正のみのため省略 (skipped at 2026-05-14T10:30:00Z) -->

## Summary (Lessons / Next Steps)

### Lessons

- **react-shikiの二重pre問題**: `ShikiHighlighter` コンポーネントはコンテナ `<pre>` を追加するため `pre pre` 二重ネストが発生する。`useShikiHighlighter` フックに切り替えることで根本解決できた。この問題は previous change (`fix-pre-tag-checklist-ui`) が完全に修正できていなかった箇所であった
- **TDD enforceとランナー設計の不整合**: `cli-e2e` ランナーの `expect_red_on_exit: [1, 2]` が web-UI 専用変更では常に exit 0 となり red evidence が記録できなかった。`[0, 1, 2]` に変更して対応した。ランナー設定はCapabilityの種類（CLI/web-UI）ごとに分離する設計が望ましい
- **self-reviewの価値**: サブエージェントによる独立レビューが FR-002 の「ヒントUI表示」THEN句の欠落を発見。設計から実装に移る前に `Search.tsx` を変更ファイルに加えるべきことを指摘された
- **BrowserRouterのスコープ設計**: `QuickAccessPalette` が `useNavigate` を使用するため、`AppRouter` の外に置くと Router コンテキスト外エラーになった。BrowserRouter をルートレベル（App.tsx）に移動して解決。コンポーネントの配置レベルと Router スコープは事前設計で明確にすべき
- **contentCacheのMap分離設計**: `storeFields` に content を追加しない方針（メモリ消費抑制）は `buildIndex()` の戻り値型変更を伴い既存呼び出し元すべての型変更が必要だった。型安全性が変更漏れを自動検出してくれた点は設計の正しさを示している

### Next Steps

- **`cli-e2e` ランナーのCapability別分岐**: web-UI変更とCLI変更でTDD enforceのランナー設定を分けられるよう、per-capability runner configをサポートする (`FR-TBD`)
- **`extractSnippet` のAND条件への対応**: 現在は最初のトークンでマッチ行を特定するが、全トークンがヒットする行を優先的に選ぶスマートスニペット抽出への拡張 (`quick-access-palette` / `spec-viewer-search` 関連)
- **クイックアクセスパレットのキーボードナビゲーション**: ↑↓キーで項目を移動してEnterで選択するキーボードナビゲーション（今回のスコープ外Non-Goal）の将来対応 (`quick-access-palette` FR-TBD)
