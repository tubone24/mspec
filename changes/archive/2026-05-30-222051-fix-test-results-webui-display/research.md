# Research: fix-test-results-webui-display

## Decisions

| 論点 | 採用案 | 代替案 | 根拠 |
|------|--------|--------|------|
| 根本原因の特定 | **2 層構造**で修正する（①CLI コマンド欠落 ＋ ②WebUI エラー表示） | どちらか一方のみ修正 | ①がなければ test-results.json が生成されず②も発生するため、両方修正が必要 |
| CLI コマンド設計 | `mspec test-results convert --change <id>` を新規追加 | `mspec test` 内で自動変換 | 変換タイミングをユーザーが制御できる方が柔軟。`mspec test` は red/green の証跡記録に集中させる |
| API の change-not-found 挙動 | `404` → `200 []` に変更 | フロントエンド側の error ハンドリング修正のみ | FR-011「ページが 404 または空白にならない」を API/フロント両側で守る方が堅牢 |
| フロントエンドの error state | `error` 時に "No test results found." を表示（赤エラー文言を廃止） | 赤エラー文言を維持 | FR-011 のシナリオ2「エラーページや白画面にはならない」を満たすため |
| 汎用ランナー対応 | Playwright / Jest / Vitest の 3 形式をフォーマット自動検出で対応 | Playwright のみ維持 | ユーザー要件（「全般的に記録できるようにしたい」）に対応するため |
| フォーマット検出方式 | JSON 構造のキーでヒューリスティック判定（`testResults[].testFilePath` → Jest, `testResults[].tasks` → Vitest, `suites[]` → Playwright） | `--runner` フラグで明示指定 | 設定不要でシンプル。曖昧な場合のみエラーで明示的に失敗させる |

---

## Web References

- [Fastify — Reply.send()](https://fastify.dev/docs/latest/Reference/Reply/) — `reply.code(200).send([])` で空配列を返すことで SPA の graceful fallback が機能する
- [TanStack Query — Error Handling](https://tanstack.com/query/latest/docs/framework/react/guides/query-retries) — `useQuery` の `error` state は fetch が throw した場合に遷移する。`!res.ok` で throw する `get()` ヘルパーが 404 応答をエラーとして扱う原因
- [Jest — JSON Reporter](https://jestjs.io/docs/configuration#reporters-arraymodulename--modulename-options) — `jest --json` 出力形式のスキーマ
- [Vitest — JSON Reporter](https://vitest.dev/guide/reporters#json-reporter) — `vitest --reporter=json` 出力形式のスキーマ

---

## Codebase Findings

### 根本原因 ①: `convertTestResults()` が CLI コマンドとして未登録

- **`packages/cli/src/commands/testResults.ts:65-93`** — `convertTestResults(changeDir)` 関数が実装済み（Playwright JSON → test-results.json 変換）。`writeFile` で `changes/<id>/test-results.json` に書き出す。
- **`packages/cli/src/index.ts:148-158`** — `mspec test expect-red` / `mspec test expect-green` コマンドは登録済みだが、`mspec test-results convert` コマンドは **登録されていない**。
- **`packages/cli/src/commands/test.ts:139`** — `mspec test` は `copyTestResults()` で生の Playwright 出力を `e2e-results/` にコピーするが、`convertTestResults()` を呼ばない。
- **結論**: `mspec test` を実行しても `test-results.json` は生成されない。これが WebUI に何も表示されない一次原因。

### 根本原因 ②: API が 404 を返し WebUI がエラー表示

- **`packages/cli/src/server/routes/testResults.ts:61`** — `findChange` が `null` のとき `reply.code(404).send(...)` を返す。
- **`packages/web-ui/src/api/client.ts:74-76`** — `get<T>` ヘルパーは `!res.ok` で `throw new Error(...)` → `useTestResults` が `error` state になる。
- **`packages/web-ui/src/pages/TestResults.tsx:30`** — `if (error) return <div className="p-8 text-red-500">Error loading test results.</div>;` — 赤エラー文言が表示される。FR-011 では "No test results found." を表示すべき。

### フォールバックロジック（既存・正常動作）

- **`packages/cli/src/server/routes/testResults.ts:30-49`** (`readTestResults`) — `test-results.json` が存在しない場合は `e2e-results/results.json`（Playwright形式）をフォールバックとして読む。ファイルが両方ない場合は `[]` を返す（正常動作）。

### ランナー対応の現状

- **`packages/cli/src/commands/testResults.ts:39`** — FR 番号抽出: `/\[FR-(\d+)\]/gi` — テスト名から FR 番号を抽出する実装は既存。
- **`packages/cli/src/commands/testResults.ts:65-93`** — Playwright 専用（`suites[].specs[].tests[].results[]` 構造）。Jest / Vitest 形式には非対応。
- **`packages/web-ui/playwright.config.ts:7`** — Playwright の JSON reporter が `test-results/results.json` を出力。

### ルーティング（問題なし）

- **`packages/web-ui/src/router/index.tsx:22`** — `/changes/:id/test-results` ルートは登録済み。
- **`packages/web-ui/src/pages/ChangeDetail.tsx:57-62`** — "Test Results" ナビリンクは正しく実装済み。
- **`packages/cli/src/server/server-process.ts:50-54`** — SPA catch-all は正しく機能。

### 既存 E2E テスト

- **`packages/web-ui/tests/e2e/test-results.e2e.test.ts:17-39`** — T206 は「バッジか no-results メッセージが見える」をカバー。change not found の 404 ケースはカバーなし。

---

## Open Choices

（ユーザー確認済み）

- **汎用ランナー対応**: ユーザーは「Playwright だけでなく全般的なランナーで記録できるようにしたい」と確認。FR-013 として Delta Spec に追加済み。
- **フォーマット検出方式**: JSON 構造のキーによるヒューリスティック判定を採用。実装上の曖昧さがある場合は `--runner` フラグでの明示指定を将来の拡張として残す。

---

## Constitution Check

| 原則 | 判定 | 備考 |
|------|------|------|
| I. ステップ独立性 | PASS | research は proposal の代替インプット（readme.md）から正しく開始できた |
| II. 決定論的マージ | PASS | FR-011 / FR-012 / FR-013 の FR-ID は `mspec delta init` で自動採番済み。重複なし |
| III. 質問駆動の要件確定 | PASS | 「全般的なランナー対応」の要件はユーザーとのやりとりで確定し FR-013 に反映 |
| IV. 双方向アンカー | WARN | 修正コードに `@mspec-delta` アンカーを付与する必要がある（implement ステップで対応） |
| V. 強制ステップと拡張ステップの分離 | PASS | CLI コマンド追加（FR-012）とランナー対応（FR-013）は明確に分離された要件 |
| VI. Security by Default | PASS | スタックトレースのパスマスク（FR-010 / `maskAbsolutePaths()`）は既存実装で維持される |
| VII. 設計意図と実装の対応確認 | PASS | 2 層の根本原因が特定され、FR-011〜FR-013 で対応範囲が明示されている |

<!-- LEARNING: proposal スキップ時は readme.md の Request セクションがそのまま research の起点インプットになる。delta 前に research が走る場合は FR 番号が未確定なため、research 内での FR 参照は tentative として扱う | source: FR-011 | confidence: medium -->
