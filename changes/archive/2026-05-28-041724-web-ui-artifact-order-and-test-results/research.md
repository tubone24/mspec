---
doc_type: Reference
---

# Research: web-ui-artifact-order-and-test-results

## Decisions

| 論点 | 採用案 | 代替案 | 根拠 |
|------|--------|--------|------|
| テストリザルトのデータソース | `changes/<change>/test-results.json`（新規ファイル） | `.agent-runs.jsonl` に追記 | agent-runner FR-003（Log Sanitization）が許可キーを7つに固定しており、JSONL は実行メタデータ専用で拡張不可 |
| アーティファクトのソート実施場所 | サーバー側（`routes/artifacts.ts`）で固定順配列によるソート | クライアント側（`ChangeDetail.tsx`）でソート | サーバー側であれば将来の API 利用者すべてに恩恵がある。クライアントは受け取った配列をそのまま render するだけになり責務が明確 |
| ワークフロー順の定義ソース | `.mspec/workflow.yaml` の `steps[].id` 順をハードコードした定数配列としてサーバー実装に持つ | `workflow.yaml` をサーバーが動的に読み込む | ソートキーはワークフロー変更に強くあるべきだが、サーバーが毎リクエスト YAML を読むコストを避けるため定数配列が現実的 |
| スタックトレースの絶対パスマスク | 新規ユーティリティ関数（`/` または `C:\` で始まるパスセグメントを `[path]` に置換）をサーバー側で適用 | フロントエンドでマスク | 現 `lib/text-mask.ts` は絶対パスマスク非対応。新規 export が必要 |
| `.agent-runs.jsonl` と `test-results.json` の使い分け | `.agent-runs.jsonl` は実行メタデータ専用。テストリザルトは別ファイル `test-results.json` に分離 | JSONL エントリにテストリザルトフィールドを追加 | agent-runner FR-003 が許可キーを固定しており、テストリザルト追加は仕様違反になる |

## Web References

現時点では本変更に直接関連するトップレベルの外部仕様は実装コードから読み取れており、追加の Web 検索は不要と判断した。

## Codebase Findings

### アーティファクト一覧の現在の実装

- `packages/cli/src/server/routes/artifacts.ts:41-61` — `collectArtifacts()` が `readdir` で再帰走査し、取得順（OS の readdir 順）そのままで配列を構築する。**ソートは一切行われていない**
- `packages/cli/src/server/routes/artifacts.ts:63-73` — `GET /api/changes/:id/artifacts` エンドポイントが `collectArtifacts()` の戻り値をそのまま返す
- `packages/web-ui/src/pages/ChangeDetail.tsx:73` — `(artifacts ?? []).map(...)` で受け取った配列順のまま `<ul>` に render。クライアント側のソートロジックは存在しない
- `packages/web-ui/src/api/client.ts:105-110` — `useArtifacts()` フックが `/api/changes/:id/artifacts` を呼ぶ。返却型は `ArtifactFile[]`（name / relativePath / type / docType のみ。ステップ情報なし）
- ワークフローステップ順は `/Users/kagadminmac/project/mspec/.mspec/workflow.yaml:21-131` に定義されており、`steps[].id` の順番は `new → proposal → delta → research → design → quickstart → checklist → self-review → tasks → implement → archive`

### テストリザルトの現在のデータソース

- `packages/cli/src/server/routes/testResults.ts:24` — 現在のデータソースは `changes/<change>/e2e-results/` ディレクトリ配下の `.json` または `.xml` ファイル（Playwright が出力する `results.json` または JUnit XML）
- `packages/cli/src/server/testResultParser.ts:49-71` — `parsePlaywrightJson()` が Playwright の内部 JSON フォーマット（`suites[].specs[].tests[].results[]`）を解析。今回の `test-results.json` スキーマとは**異なる**
- `packages/cli/src/server/testResultParser.ts:73-121` — `parseJUnitXml()` も並存。`.json` → Playwright JSON、`.xml` → JUnit XML と分岐
- 実際のe2e-resultsファイル: `changes/archive/2026-05-27-032635-multi-test-runner-support/e2e-results/results.json`（存在確認済み）
- `packages/web-ui/src/api/client.ts:48-54` — フロントエンドの `TestCase` 型は `status: 'pass' | 'fail' | 'skip'`。新仕様の `red / green / skip` と**語彙が不一致**
- **FR-005 / FR-006 のスタール化リスク**: `specs/test-result-viewer/spec.md` の FR-005・FR-006 は `e2e-results/` ディレクトリと Playwright XML を前提として記述されており、FR-001 を MODIFY すると矛盾が生じる

### エージェントJSONの実体とファイル構造

- `packages/cli/src/lib/agent-run-log.ts` — `.agent-runs.jsonl` の書き込みを担当。`AgentRunEntry` の許可キーは `step / change / started_at / context_size_bytes / context_size_tokens / required_artifacts / review_edits_count` の7つに固定（FR-003）
- **`test-results.json` は現時点で存在しない**。既存の `e2e-results/results.json` は Playwright が自動出力したもので、スキーマが全く異なる（Playwright 内部フォーマット）
- 新規 `test-results.json` の想定スキーマ（agent-runner FR-004 より）:
  ```json
  [{ "name": "<テスト名>", "status": "red"|"green"|"skip", "checklist_item_ids": ["<ID>", ...] }]
  ```
- このファイルを**誰が・いつ書き込むか**は現コードベースに実装が存在しない（Open Choice 参照）

### チェックリスト識別子の設計

- `changes/archive/2026-05-27-062657-spec-viewer-fulltext-search/checklist.md:7-9` — 各チェックリスト項目の末尾に `<!-- verify: fr-001 -->` 形式の HTML コメントが付与されている
- `<!-- verify: human -->` は自動テスト対象外の人手確認項目。FR 番号紐づきがない
- 表示上は `FR-001` だが、識別子の実体は `fr-001`（ソース内小文字）
- テスト名とチェックリスト項目の自動紐づけメカニズムは現コードベースに存在しない

### Web UIコンポーネント構造

- `packages/web-ui/src/pages/ChangeDetail.tsx` — チェンジ詳細画面（アーティファクト一覧）。`data-testid="artifact-list"` でテスト識別
- `packages/web-ui/src/pages/TestResults.tsx` — テストリザルト画面。`useTestResults()` フックで `TestSuite[]` を取得。`pass/fail/skip` の STATUS_CLASSES マッピングを使用
- `packages/web-ui/src/api/client.ts:124-129` — `useTestResults()` フックが `/api/changes/:id/test-results` を呼ぶ
- XSS 対策はフレームワーク（React）の自動エスケープに委譲されており `dangerouslySetInnerHTML` は使用なし

## Open Choices（確定済みおよび設計ステップ持ち越し）

### ユーザー確定済み

- **status 語彙の統一方法**: ✅ **サーバー側変換層で既存型を維持**。API サーバーが `red→fail / green→pass` に変換し、フロントエンド型 `pass / fail / skip` をそのまま保つ（破壊的変更を最小化）
- **`test-results.json` の書き込み担当**: ✅ **CLI サブコマンドが変換書き込み**。`mspec implement` 終了後に CLI サブコマンドが Playwright `results.json` を `test-results.json` 形式に変換して書き込む
- **テスト名とチェックリスト項目の紐づけメカニズム**: ✅ **テスト名への FR 番号埋め込み命名規約**。テストファイルのテスト名に `[FR-001] renders checklist` のように FR 番号を埋め込む。CLI サブコマンドがテスト名から FR 番号を正規表現で抽出して `checklist_item_ids` に記録する

### 設計ステップで確定（持ち越し）

- **`checklist_item_ids` の値形式**: `fr-001`（小文字）か `FR-001`（大文字）か。`<!-- verify: human -->` 項目は `null` または省略で処理
- **FR-005 / FR-006 の扱い**: Delta Spec の MODIFIED セクションで更新するか REMOVE するかを設計ステップで確定する
- **スタックトレースマスクの適用スコープ**: `testResultParser.ts`（パース時）か `routes/testResults.ts`（レスポンス組み立て時）かを設計で確定

## Constitution Check

| 原則 | Phase 0 | Phase 1 |
|------|---------|---------|
| I. ステップ独立性 | OK — research は proposal.md と specs/*/spec.md のみに依存し、後続ステップの成果物に依存しない | — |
| II. 決定論的マージ | OK — Decisions テーブルに根拠付きで設計判断を記録した | — |
| III. 質問駆動の要件確定 | OK — Open Choices として未確定事項を列挙し、ユーザー質問で確定する | — |
| IV. 双方向アンカー | OK — ファイルパス・行番号付きでコードベース Findings を記録した | — |
| V. 強制ステップと拡張ステップの分離 | OK — research は強制ステップとして正常実行中 | — |
| VI. Security by Default | OK — XSS 対策（React 自動エスケープ）・スタックトレースマスク・dangerouslySetInnerHTML 不使用を確認した | — |
