<!-- See also: ./design.md -->

---
doc_type: Explanation
---

# Design Rationale: mspec-web-ui-e2e

## Context

`mspec-web-ui` チェンジで実装された React + Vite フロントエンドと Fastify API は、ユニットテスト（Vitest）のみで検証されている。しかし Mermaid SVG レンダリング・LocalStorage 永続化・テーマ切り替えなどブラウザ固有の振る舞いはユニットテストでは検証できない。Playwright E2E テストを追加することで、実際のブラウザ上での動作を証明する。

`mspec ui start` コマンドが未実装のため、Fastify サーバーの起動方法が課題となった。`launchWebUiIfNeeded()` は `mspec new` のフック内でしか呼べない設計になっており、E2E テスト環境では直接起動できない。この制約のもとで最も軽量な解決策として `tests/e2e/setup/api-server.ts` を採用した。

## Decisions

### `api-server.ts` で Fastify を直接起動する

`mspec ui start` コマンドの実装が別チェンジ（`web-ui-server-cmd`）に委ねられているため、今回は `packages/cli/src/server/` の Fastify ルート関数を直接 import してテスト用サーバーを起動するアプローチを採用した（`design.md` の Project Structure 参照）。`packages/web-ui/package.json` の `devDependencies` に `@mspec/cli: "workspace:*"` を追加することで依存を解決する。

この設計は `mspec ui start` 実装後に廃止し、`playwright.config.ts` の `webServer` 第 2 要素を `mspec ui start` に切り替えることができる。廃止コストが低い使い捨て設計になっている。

### アーカイブ済みチェンジをテストデータとして使用する

実際の `changes/archive/` ディレクトリを使用することで、fixtures ファイルのメンテナンスが不要になる。アーカイブ済みチェンジは内容が変化しないため、テストの決定性が保たれる。ただし、アーカイブが一件もない環境ではテストが失敗する可能性があるため、`test.skip` でガードする。

## Alternatives Considered

- **`page.route()` モック**: 実装が最もシンプルだが、Fastify・React Router・TanStack Query の統合を検証できない。実環境に近いテストをユーザーが要求したため却下。
- **`mspec ui start` の先行実装**: 正規の解決策だが、このチェンジのスコープを超えるため別チェンジに委ねた。
- **Playwright Component Test**: React コンポーネントを Playwright 内でマウントするアプローチだが、Mermaid.js のブラウザ依存が解決しないため却下。

## Trade-offs

| 採用した制約 | 生じるトレードオフ |
|------------|-----------------|
| `api-server.ts` による直接起動 | `packages/web-ui` が `@mspec/cli` に依存するため循環依存リスクがある（devDependencies なので実行時は影響なし） |
| アーカイブ済みデータ使用 | アーカイブがゼロの環境（CI の初期状態等）ではテストがスキップされる |
| Mermaid timeout 15s | テスト実行時間が増加する。Mermaid が重い SVG をレンダリングする場合は flaky になりうる |

## Rejected Options

- **Jest + jsdom**: Playwright を既にインストール済みで、DOM 環境の実在性が必要なため不採用
- **Storybook + Chromatic**: ビジュアルリグレッションは Non-Goal のため不採用
- **Docker での分離実行**: ローカル開発ツールにオーバーエンジニアリングのため不採用

## Constitution Check

| 原則 | Phase 0 | Phase 1 |
|------|---------|---------|
| I ステップ独立性 | ✅ design-rationale は design.md と同一ステップで生成、外部依存なし | ✅ 意思決定の根拠は構造的設計（design.md）から分離されており単独で読解可能 |
| II 決定論的マージ | ✅ 新規ファイルで既存への影響なし | ✅ Trade-offs テーブルは明確な構造を持つ |
| III 質問駆動の要件確定 | ✅ api-server.ts 起動戦略を AskUserQuestion で確定した | ✅ Rejected Options に明確な却下理由が記載されている |
| IV 双方向アンカー | ✅ design.md の Project Structure を参照するクロスリンクがある | ✅ Alternatives → Decisions → design.md のトレーサビリティが確保されている |
| V 強制ステップと拡張ステップの分離 | ✅ design-rationale は design ステップの強制成果物として管理されている | ✅ design.md（Reference）と design-rationale.md（Explanation）が doc_type で明確に区別されている |

### Complexity Tracking

None.
