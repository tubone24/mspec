---
doc_type: Explanation
---

# Proposal: mspec-web-ui-e2e

## Why

`mspec-web-ui` チェンジ（Phase 1/2）でバックエンド Fastify API とフロントエンド React SPA の実装が完了したが、ブラウザ上での実際の動作確認が不足している。特に Mermaid SVG レンダリング・EARS/Gherkin ハイライト・ダーク/ライトモード永続化・iframe サンドボックスなどの視覚的な機能はユニットテストでは検証できない。このチェンジでは Playwright E2E テストを追加し、全コンポーネントがブラウザ上で正しく動作することを証明する。

## Goals

1. Playwright E2E テストを `packages/web-ui/tests/e2e/` に追加し、tasks.md の T201〜T304 タスクを TDD（red→green）で完走させる。
2. テスト実行環境として `pnpm dev`（Vite dev server, port 5173）を使用し、API は `vite.config.ts` の proxy 設定で Fastify（port 3847）に転送する。
3. テストデータは実際の mspec リポジトリの `changes/` ディレクトリを使用する（fixtures なし）。
4. Mermaid SVG レンダリング・EARS/Gherkin キーワードハイライト・テーマ切り替えと LocalStorage 永続化を E2E でスクリーンショット付きで確認する。
5. 完了条件: 全 Playwright E2E が green、主要画面がブラウザで動作確認済み、Mermaid SVG が実際にレンダリングされる。

## Non-Goals

- Playwright テストの CI/CD パイプライン統合（別途設定）
- クロスブラウザテスト（Firefox / Safari）— Chromium のみで十分
- 視覚的リグレッションテスト（スクリーンショット diff）— 動作確認が目的
- モックサーバーを使った Unit レベルの分離テスト — 実環境 API を使用

## Capabilities (touched)

- `change-dashboard` — ダッシュボード画面の E2E テスト（チェンジ一覧・進捗バー・モードフィルター・詳細遷移）
- `artifact-preview` — MD プレビュー画面の E2E テスト（Mermaid SVG・EARS/Gherkin ハイライト・dark/light テーマ・prototype iframe）
- `test-result-viewer` — テスト結果画面の E2E テスト（green/red/skip バッジ・失敗トレース展開・スキップ表示）

## Open Questions

（なし — 全て質問で確定済み）

| 論点 | 決定 |
|------|------|
| E2E 実行環境 | Playwright + Vite dev server (port 5173) |
| テストデータ | 実際の mspec リポジトリの changes/ |
| 完了条件 | 全 E2E green + ブラウザ動作確認 + Mermaid SVG レンダリング確認 |

---

## Constitution Check

| 原則 | Phase 0 | Phase 1 |
|------|---------|---------|
| I ステップ独立性 | ✅ proposal ステップは readme.md のみを入力とし、proposal.md を独立して生成している | — |
| II 決定論的マージ | ✅ proposal.md は新規ファイルであり、既存ファイルへのマージ競合は発生しない | — |
| III 質問駆動の要件確定 | ✅ 3問の AskUserQuestion で E2E 実行環境・テストデータ・完了条件を確定した | — |
| IV 双方向アンカー | ✅ Capabilities 節の kebab-case 名が delta ステップでの `mspec delta init` 入力として機能する | — |
| V 強制ステップと拡張ステップの分離 | ✅ proposal は全フロー変更での強制ステップであり、skip 対象外として扱われている | — |
