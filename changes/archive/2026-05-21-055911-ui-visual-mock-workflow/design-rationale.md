---
doc_type: Explanation
---

<!-- See also: ./design.md -->

# Design Rationale: ui-visual-mock-workflow

## Context

mspec は仕様書駆動のワークフローを提供しているが、UI 画面の仕様を文章で書くのは難しく、認識齟齬が起きやすい問題がある。特に「どんな見た目になるか」はテキストでは伝わりにくく、proposal.md や design.md に書いても開発者とユーザーの理解が乖離することが多い。

この問題を解決するために、visual mock（HTML/CSS/JS によるプロトタイプ）を先に作成してユーザーと認識合わせを行い、そのフィードバックをワークフローに組み込む `visual-mock` ステップを追加する。Mock First アプローチにより、設計ドキュメントを精緻化する前に早期に問題を発見できる。

制約として、mspec CLI はゼロ依存追加方針（`packages/cli/package.json` に外部 HTTP サーバー・プロンプトライブラリなし）を維持しており、新機能もこの方針に従う必要がある。

## Decisions

### ゼロ依存でのHTTPサーバー実装

外部ライブラリ（sirv、http-server など）を追加せず、Node.js 組み込みの `node:http` で静的ファイル配信を実装する。npm trends によると sirv は 12,600 req/s と高速だが、mock の用途（単一ユーザー、開発時のみ）ではパフォーマンスは問題にならない。`node:http` で静的サーバーは 50 行程度で実装可能で、依存を増やすコストを正当化しない。

### CSS フレームワーク自動検出

mock の目的は「実際の開発環境と同じ見た目でユーザーと認識合わせすること」であるため、プロジェクトで使用している CSS フレームワークを自動検出して mock に適用することが重要である。Material UI が導入されているプロジェクトで Tailwind CDN を使った mock を作っても、実際の画面と乖離が生じて認識合わせにならない。`package.json` の `dependencies` を検査することで、追加の設定なしにフレームワークを判定できる。

### 専用サブエージェントによる HTML 生成

HTML/CSS の生成はコンテキストを消費する大きなタスクであるため、専用の `mspec-visual-mock-runner` サブエージェントに委譲する。これによりメインセッションのコンテキストウィンドウを圧迫せず、大規模な HTML ファイル（複数画面のモック等）を生成できる。また、サブエージェントが独立して動作することで、再実行時のコスト（コンテキスト汚染）も最小化できる。

### tasks スキルへのソフト参照

`mock-feedback.md` を `workflow.default.yaml` の tasks ステップの `requires` に追加すると、`visual-mock` をスキップした場合に tasks ステップがブロックされてしまう。これを避けるため、tasks スキルの SKILL.md プロンプトで「`mock-feedback.md` が存在する場合のみ読む」というソフト参照にする。この設計により、visual-mock の有無に関係なく tasks ステップが常に実行できる。

## Alternatives Considered

- **sirv / http-server**: 高品質な静的サーバーライブラリだが、`packages/cli/package.json` にない依存を追加することはゼロ依存方針に反する
- **Tailwind CDN 固定**: LLM が生成する HTML の品質が高まるが、実際のプロジェクトとの乖離が大きく mock の意義が薄れる
- **メインコンテキストでの HTML 生成**: シンプルだが、大きな HTML を生成するとコンテキストウィンドウが圧迫される
- **`requires` への追加**: `visual-mock` skip 時にブロックが発生するため採用しない
- **連番フィードバックファイル**: 履歴は残るが tasks スキルの参照が複雑になる。上書きの方がシンプル

## Trade-offs

- `node:http` 内製サーバーは sirv より機能が少ない（ETag、Range リクエスト等が未実装）が、mock の用途では問題ない
- `package.json` ヒューリスティックは検出できないフレームワーク（CSS Modules、vanilla-extract 等）があるが、フォールバックとしてプレーン HTML+CSS で動作する
- サブエージェント委譲により HTML 生成の透明性が下がるが、コンテキスト節約のトレードオフを受け入れる
- `mock-feedback.md` の上書きにより過去フィードバックの履歴が残らないが、シンプルさを優先した（git で履歴は追える）

## Rejected Options

- **Figma MCP 連携**: Non-Goal として明示的に除外。外部ツール依存が増え、Figma アカウントが不要なユーザーが使えなくなる
- **mock ページ埋め込みフォームでのフィードバック収集**: WebSocket か polling が必要になり実装が複雑。CLI 対話入力で十分
- **`mspec mock` を continue 経由のみに制限**: 反復的な mock 修正（mock を見てすぐ再生成したい）のユースケースに対応できない。直接実行も必要

## Constitution Check

| Principle | Phase 0 | Phase 1 |
|-----------|---------|---------|
| I  ステップ独立性 | ✅ design-rationale は design.md を補足するのみで他成果物を変更しない | ✅ 実装時の選択肢を説明するのみ |
| II  決定論的マージ | ✅ changes/ 以下に配置 | ✅ SoT spec との衝突なし |
| III  質問駆動の要件確定 | ✅ research + design で全 Open Choices 解決済み | ✅ 追加の未解決判断なし |
| IV  双方向アンカー | ✅ design.md と相互参照 | ✅ Decisions が FR 番号と対応（design.md 参照） |
| V  強制ステップと拡張ステップの分離 | ✅ visual-mock は任意ステップ設計 | ✅ 必須ステップへの変更なし |
