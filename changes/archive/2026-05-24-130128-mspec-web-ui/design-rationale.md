<!-- See also: ./design.md -->

---
doc_type: Explanation
---

# Design Rationale: mspec-web-ui

## Context

mspec は CLI ファースト設計のワークフロー管理ツールであり、これまでの成果物はすべてターミナルとテキストエディタで確認することを前提としていた。しかし並行チェンジが増えるにつれ、複数の `changes/<id>/` ディレクトリを行き来してテキストを目で追うことが認知的な負荷になってきた。特に Mermaid ダイアグラム・EARS/Gherkin 記法・プロトタイプ HTML という「テキストのままでは本来の意図が伝わりにくいアーティファクト」の存在が問題を顕在化させた。

Web UI の設計では「CLI 体験を壊さない」ことを最優先制約とした。mspec は CLI ツールであり、Web UI はあくまでオプショナルな可視化レイヤーである。そのため `@mspec/web-ui` は独立した optional パッケージとし、未インストール時も CLI が正常動作することを保証する設計を採用した。この方針は「必要な人だけインストールする、でも入れることを推奨する」というユーザーの意図と一致している。

## Decisions

### `@mspec/web-ui` を独立 optional パッケージとして配布

Web UI をインストールしたくないユーザー（CI 環境・軽量インストールを好むユーザー）に対して、CLI パッケージのサイズや依存関係を汚染しないよう `@mspec/web-ui` を optional dependency として分離した。これにより `npm install @mspec/web-ui` を実行したユーザーのみが Web UI 機能を利用でき、そうでないユーザーには `MODULE_NOT_FOUND` を安全に検出して案内メッセージを表示するグレースフルデグレードを実装する（`design.md` の `## Optional Dependency Contract` 参照）。

### Fastify を CLI パッケージに統合（`packages/cli/src/server/`）

バックエンド API サーバーを独立パッケージ（`packages/api-server`）として分離する案も検討したが、API の規模が小さく（6エンドポイント）CLI のコアロジックと密結合であるため、CLI 内に統合することとした。これにより `packages/core` の型・関数を直接 import でき、インターフェース変換レイヤーが不要になる。将来的にサーバーロジックが肥大化した場合は別パッケージへの移行が可能な構造を保つ。

### TanStack Query ポーリング（`refetchInterval: 3000ms`）を採用

WebSocket によるリアルタイムプッシュ通知は実装コストが高く、mspec のステップ進捗は数分単位で変化するため 3 秒のポーリング遅延は許容範囲である。TanStack Query を採用することでキャッシュ・バックグラウンド再フェッチ・エラーリトライが自動的に得られ、カスタム WebSocket 実装と比較して大幅に実装が簡単になる。

## Alternatives Considered

- **Next.js**: SSR と API Routes を同一パッケージで管理できるが、ローカルビューアーに SSR は不要でオーバーキル。ビルド複雑度が上がる
- **Vue / Svelte**: いずれも優れた選択肢だが、React の既存エコシステム（Testing Library、React Router 等）との統一性を優先した
- **WebSocket でのリアルタイム更新**: 実装コストが高い割に、3 秒ポーリングと体験差が小さいため却下
- **CLI への UI ビルド成果物の内包**: 単一パッケージで配布できるが、不要なユーザーにも大きなバンドルを押し付けることになるため分離を選択

## Trade-offs

| 採用した制約 | 生じるトレードオフ |
|------------|-----------------|
| optional dependency | ユーザーが明示的に `@mspec/web-ui` をインストールする必要がある（ゼロコンフィグではない） |
| ポーリング方式 | ファイル変更後、最大 3 秒の表示遅延が生じる |
| CLI 内 Fastify 統合 | CLI のバンドルサイズが増加する（web-ui 非インストール時でも Fastify は含まれる） |
| React Router v7 URL 管理 | Hash ルーティング（`/#/changes/:id`）よりも設定が複雑（Fastify で catch-all を設定する必要） |

## Rejected Options

- **認証・認可**: ローカル専用ツールのため `localhost` バインドのみで十分。ネットワーク公開を想定した設計は Non-Goal
- **モバイル対応**: デスクトップ開発者ツールに特化し、レスポンシブ対応は行わない
- **クラウドデプロイ**: ローカルファイルシステムへの直接アクセスが前提のため、クラウド環境への対応は設計上不可能

## Constitution Check

| 原則 | Phase 0 | Phase 1 |
|------|---------|---------|
| I ステップ独立性 | ✅ design-rationale は design.md と同一ステップで生成され、外部依存なし | ✅ 意思決定の根拠は構造的設計（design.md）から分離され、単独で読解可能 |
| II 決定論的マージ | ✅ 新規ファイルであり既存ファイルへの影響なし | ✅ Trade-offs テーブルは明確な構造を持ち将来の更新が確定的 |
| III 質問駆動の要件確定 | ✅ optional dependency の設計はユーザーの追記コメント「CLI がエラーにならないことが望ましい」を受けて確定した | ✅ 全 Rejected Options に明確な却下理由が記載されている |
| IV 双方向アンカー | ✅ design.md の `## Optional Dependency Contract` を参照するクロスリンクがある | ✅ Alternatives → Decisions → design.md のトレーサビリティが確保されている |
| V 強制ステップと拡張ステップの分離 | ✅ design-rationale は design ステップの強制成果物として管理されている | ✅ design.md（Reference）と design-rationale.md（Explanation）が doc_type で明確に区別されている |

### Complexity Tracking

None.
