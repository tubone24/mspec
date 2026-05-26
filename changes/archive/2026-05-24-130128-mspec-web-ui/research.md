---
doc_type: Reference
---

# Research: mspec-web-ui

## Decisions

| 論点 | 採用案 | 代替案 | 根拠 |
|------|--------|--------|------|
| UI フレームワーク | React + Vite | Next.js, Vue, Svelte | ローカル静的 SPA として動作。Next.js は SSR 不要でオーバーキル。Vite は高速ビルドを提供 |
| スタイリング | Tailwind CSS v3 | CSS Modules, MUI | ユーティリティファーストで素早く UI を構築可能。バンドルサイズ最小化 |
| CLI と Web UI 間の通信 | ローカル HTTP サーバー (Fastify) | WebSocket, gRPC | CLI から起動できるシンプルな構成。REST API でファイルシステム操作を仲介 |
| フロントエンド配置 | `packages/web-ui`（新規 monorepo パッケージ） | `packages/cli` に統合 | 既存 monorepo 構造（cli/core）に倣い責務を分離 |
| バックエンド API 配置 | `packages/cli` に追加（軽量統合） | `packages/api-server` として独立 | 小規模ツールのため CLI への統合で十分。将来的に分離も可能 |
| 状態管理 | Zustand | Redux, Jotai | 軽量。mspec ワークフロー状態程度の規模には Zustand が最適 |
| データフェッチ | TanStack Query v5 | SWR, 素の fetch | ポーリング・キャッシュ・ローディング管理が組み込まれており、ステップ進捗監視に有用 |
| Markdown レンダリング | react-markdown + remark-gfm | marked, MDX | React ツリーに自然統合できる。GFM テーブル対応 |
| ビルド成果物の提供 | CLI が `dist/` を `serve-static` でサーブ | CDN, 別途 Web サーバー | ローカルツールなので CLI 内で完結させるのが最良 UX |
| テストフレームワーク | Vitest + Testing Library | Jest | Vite ベースプロジェクトと相性良し。設定ファイル共有可能 |
| リアルタイム更新 | ポーリング（TanStack Query `refetchInterval: 3000`） | WebSocket | 実装シンプル。ローカルツールで遅延 3 秒は許容範囲 |

## Web References

- [Vite 公式ドキュメント](https://vitejs.dev/guide/) — プロジェクト初期化・ビルド設定・`@vitejs/plugin-react`
- [React 公式ドキュメント](https://react.dev/) — React 18 フック・Concurrent Features
- [Tailwind CSS v3 ドキュメント](https://tailwindcss.com/docs) — ユーティリティクラス参照
- [Zustand GitHub](https://github.com/pmndrs/zustand) — 軽量状態管理。TypeScript サポート優秀
- [TanStack Query v5 ドキュメント](https://tanstack.com/query/latest) — `refetchInterval` でステップ進捗ポーリングが容易
- [react-markdown npm](https://www.npmjs.com/package/react-markdown) — `remark-gfm` プラグインで GFM 対応
- [Fastify 公式ドキュメント](https://fastify.dev/) — TypeScript サポート組み込み済み、mspec の TS 環境と親和性高
- [Vitest 公式ドキュメント](https://vitest.dev/) — `vite.config.ts` と設定共有可能
- [pnpm workspace ドキュメント](https://pnpm.io/workspaces) — monorepo パッケージ管理
- [Mermaid.js v10 ドキュメント](https://mermaid.js.org/) — `mermaid.initialize()` + `mermaid.render()` で SVG 変換
- [Playwright JSON Reporter](https://playwright.dev/docs/test-reporters#json-reporter) — `--reporter=json` で構造化テスト結果を出力

## Codebase Findings

### パッケージ構成

mspec は monorepo 構成を採用している:

```
packages/
  cli/     — CLI コマンド定義・エントリーポイント
  core/    — コアロジック（ステップ管理・ファイル I/O）
```

新規追加パッケージ:
- `packages/web-ui/` — React + Vite フロントエンド
- CLI 側に API サーバーロジックを追加（`packages/cli/src/server/`）

### 既存技術スタック

- 言語: TypeScript
- パッケージマネージャー: pnpm workspace
- CLI フレームワーク: Node.js ベース
- テスト: 既存の CLI コマンドテスト構造

### `mspec new` フック統合箇所

`packages/cli/src/commands/new.ts`（またはそれに相当するファイル）の終端に、バックグラウンドサーバー起動ロジックを追加する。PID ファイルは `~/.mspec/ui.pid` に配置。

### E2E テスト結果フォーマット

Playwright の `--reporter=json` 出力を想定。`changes/<id>/e2e-results/*.json` を解析してテストケース一覧・合否・スタックトレースを取得する。

## Open Choices

（全て解決済み）

| 論点 | 決定 |
|------|------|
| ルーティング方式 | React Router v7 で URL 管理（`/changes/:id/preview` 等） |
| E2E テスト結果フォーマット | Playwright JSON + JUnit XML 両対応 |

## Constitution Check

| 原則 | Phase 0 | Phase 1 |
|------|---------|---------|
| I ステップ独立性 | ✅ research ステップは proposal.md と specs/*/spec.md のみを入力とし、research.md を独立して生成している | — |
| II 決定論的マージ | ✅ research.md は新規ファイルであり、既存ファイルへのマージ競合は発生しない | — |
| III 質問駆動の要件確定 | ✅ Open Choices に未解決事項を明示し、ユーザー確認を経て意思決定を確定する | — |
| IV 双方向アンカー | ✅ Decisions テーブルの採用案が design ステップでの技術選定根拠として参照される | — |
| V 強制ステップと拡張ステップの分離 | ✅ research は全フロー変更での強制ステップであり、skip 対象外として扱われている | — |
