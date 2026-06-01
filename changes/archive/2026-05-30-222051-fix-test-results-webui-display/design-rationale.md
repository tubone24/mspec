---
doc_type: Explanation
---

<!-- See also: ./design.md -->

# Design Rationale: fix-test-results-webui-display

## Context

mspec の WebUI には `/changes/:id/test-results` ページが存在し、テスト結果を green / red / skip バッジで表示する機能が設計・実装済みだった。しかし実際にはこのページが正しく表示されず、ユーザーはテスト結果を確認するためにコマンドラインに戻る必要があった。

調査の結果、問題は 2 層構造だった。①`mspec test` コマンドが実行後に `test-results.json` を生成しない（変換関数は実装済みだが CLI コマンドとして登録されていない）、②WebUI の API が change not found 時に 404 を返し、フロントエンドが赤エラー文言を表示してしまう。さらにユーザーから「Playwright 以外のランナーにも対応したい」という要件が追加された。

これら 3 つの問題（FR-011 / FR-012 / FR-013）を最小変更で解決する設計を採用した。

---

## Decisions

### 1. CLI コマンド追加（FR-012）

`convertTestResults()` は既に実装・テスト済みであり、`packages/cli/src/commands/testResults.ts` に存在する。不足しているのは `index.ts` への登録のみだった。`mspec test-results convert --change <id>` というサブコマンドとして登録することで、既存の `mspec test` コマンドの責務（red/green 証跡記録）を変えずに変換機能を独立して提供できる。

`mspec test` 実行後に自動変換する案も検討したが、変換タイミングをユーザーが制御できる方が柔軟であり、CI パイプラインでの利用にも対応しやすい。

### 2. API の 404 → 200 [] 変更（FR-011）

`packages/web-ui/src/api/client.ts` の `get<T>` ヘルパーは `!res.ok` で `throw new Error()` する設計になっており、404 を含む全 4xx/5xx がエラーとして扱われる。SPA ではこの挙動が `useTestResults` の `error` state への遷移を引き起こし、赤エラー文言を表示させていた。

この問題の解決アプローチは 2 つある。①API 側で 404 → 200 [] に変更、②フロントエンドの `get<T>` ヘルパーで 404 を特別扱いする。①を採用した理由は「change が見つからない」と「テスト結果がない」の意味論的区別が WebUI のユーザーには不要だからだ。どちらのケースも「表示するテスト結果がない」という同じ UX が適切。

### 3. フロントエンドの error state 修正（FR-011）

API を 200 [] に変更しても、フロントエンドの error state に対する赤エラー文言は残る（他の理由でエラーが発生した場合に備えて）。FR-011 の要件「エラーページや白画面にはならない」を確実に満たすため、error state でも "No test results found." を表示するよう変更する。これはアプリが初期化できない深刻なエラーではなく「結果が取得できない」状態であり、ユーザーへの表示は同じで問題ない。

### 4. ランナー形式のヒューリスティック検出（FR-013）

Jest / Vitest / Playwright はそれぞれ JSON 出力のトップレベル構造が異なる。`suites[]` は Playwright 固有、`testResults[].tasks` は Vitest 固有、`testResults[].testFilePath` は Jest 固有だ。この差異を利用した構造ヒューリスティックにより、`--runner` フラグなしで自動検出できる。

不明フォーマットの場合は即座に `exit(1)` でエラーを通知する。誤った test-results.json を生成するよりも、明示的に失敗する方が安全。

---

## Alternatives Considered

- **`mspec test` 実行後に自動変換**: `mspec test` コマンドが `convertTestResults()` を自動呼び出す案。変換タイミングの制御ができなくなるため却下。CI では変換を別ステップにしたいケースがある。
- **`get<T>` ヘルパーで 404 を特別扱い**: `if (res.status === 404) return [] as T` のようにクライアント側で対応する案。他の 404 ケースにも影響するため変更範囲が広い。サーバー側の修正の方が局所的。
- **`--runner` フラグで明示指定**: `mspec test-results convert --change <id> --runner jest` のように明示する案。ユーザーの設定負担が増えるため却下。ヒューリスティックで十分判別可能。

---

## Trade-offs

- `200 []` を返すことで「change が存在しない」と「テスト結果がない」の区別が API レベルで失われる。これは UI 上では問題ないが、将来的に API を外部から使うケースでは 404 の意味論が必要になるかもしれない。
- ヒューリスティック検出は 3 ランナー以外の形式に対応できない。新しいランナーへの対応は別途 Delta Spec で追加する必要がある。

---

## Rejected Options

- **Playwright カスタムレポーター**: テスト実行中に直接 test-results.json を生成する方式。`design-rationale.md` (archive/2026-05-28-041724) で既に却下済み。test コマンドへの密結合が問題。
- **フロントエンドでの直接ファイル読み込み**: WebSocket や SSE でファイル変更を監視する案。実装コストが高く、FR-011 の修正範囲を超える。

<!-- LEARNING: SPA + TanStack Query の組み合わせでは、API が 404 を返すと useQuery が error state に入る。SPA 向け API は「データなし」を 404 ではなく 200+空データで返す設計が安全 | source: FR-011 | confidence: high -->
