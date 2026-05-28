---
doc_type: Reference
---

<!-- See also: ./design-rationale.md for採用理由・代替案 -->

# Design: web-ui-artifact-order-and-test-results

## Summary

本変更は3つの独立したサブシステム改善から構成される:

1. **アーティファクトソート** — `routes/artifacts.ts` のサーバー側にワークフローステップ定数配列を追加し、`GET /api/changes/:id/artifacts` のレスポンスをワークフロー順でソートする
2. **テストリザルト データソース統一** — 新規 CLI サブコマンド `mspec test-results convert` が Playwright `results.json` → `test-results.json`（新スキーマ）に変換。`routes/testResults.ts` はこの新ファイルを正規データソースとして読む。ステータス語彙はサーバー側アダプターで `red→fail / green→pass` に変換
3. **チェックリスト紐づき表示** — テスト名の `[FR-001]` プレフィックスから `checklist_item_ids` を抽出。`TestResults.tsx` に紐づきバッジとダングリングリファレンス警告 UI を追加

## Technical Context

| コンポーネント | 現状 | 変更後 |
|-------------|------|--------|
| `routes/artifacts.ts:collectArtifacts()` | OS readdir 順のまま返却（ソートなし） | `WORKFLOW_STEP_ORDER` で sort 後返却 |
| `routes/testResults.ts` | `e2e-results/` の Playwright JSON / JUnit XML を読む | `test-results.json`（新スキーマ）を優先。存在しなければ既存フォールバック |
| `testResultParser.ts` | Playwright 内部フォーマットをパース | `test-results.json` パーサーを追加。ステータス変換・パスマスクもここで実施 |
| `TestResults.tsx` | `status: 'pass'|'fail'|'skip'` バッジのみ表示 | `checklist_item_ids` バッジと「未解決」警告バッジを追加 |
| `mspec` CLI | `test-results.json` を扱うコマンドなし | `mspec test-results convert --change <id>` コマンドを追加 |

## Project Structure

```
packages/cli/src/server/routes/
  artifacts.ts              ← MODIFY: WORKFLOW_STEP_ORDER 定数配列・sort 追加
  testResults.ts            ← MODIFY: test-results.json を優先読み込み

packages/cli/src/server/
  testResultParser.ts       ← MODIFY: test-results.json パーサー追加・ステータス変換・パスマスク追加

packages/cli/src/commands/
  testResults.ts            ← NEW: `mspec test-results convert` コマンド実装

packages/web-ui/src/pages/
  TestResults.tsx           ← MODIFY: checklist_item_ids バッジ・ダングリング警告 UI 追加

packages/web-ui/src/api/
  client.ts                 ← MODIFY: TestCase 型に checklist_item_ids フィールドを追加
```

## Decisions

### D-1: アーティファクトソート定数配列

**変更ファイル**: `packages/cli/src/server/routes/artifacts.ts`

```typescript
const WORKFLOW_STEP_ORDER = [
  'new', 'proposal', 'delta', 'research', 'design',
  'quickstart', 'checklist', 'tasks', 'implement'
] as const;

// ファイル名 → ステップ名 マッピング
function getStepForArtifact(relativePath: string): string {
  if (relativePath === 'readme.md') return 'new';
  if (relativePath === 'proposal.md') return 'proposal';
  if (relativePath.startsWith('specs/')) return 'delta';
  if (relativePath === 'research.md') return 'research';
  if (['design.md', 'design-rationale.md', 'architecture-overview.md'].includes(relativePath)) return 'design';
  if (relativePath === 'quickstart.md') return 'quickstart';
  if (relativePath === 'checklist.md') return 'checklist';
  if (relativePath === 'tasks.md') return 'tasks';
  return 'implement'; // 不明なファイルは末尾
}
```

**受け入れ基準** (→ change-dashboard FR-010 Scenario):
- GIVEN: proposal.md / design.md / tasks.md が存在
- WHEN: `GET /api/changes/:id/artifacts` を呼ぶ
- THEN: レスポンス配列の順序が `proposal.md < design.md < tasks.md`

---

### D-2: test-results.json スキーマ

**ファイル**: `changes/<change>/test-results.json`

```json
[
  {
    "name": "[FR-007] shows test results from agent JSON",
    "status": "red" | "green" | "skip",
    "checklist_item_ids": ["fr-007", "fr-008"],
    "error_message": "optional error string",
    "stack_trace": "optional sanitized stack trace"
  }
]
```

- `status` 値は `red / green / skip`（新スキーマ語彙）
- `checklist_item_ids` は `fr-NNN` 小文字形式（`<!-- verify: fr-NNN -->` と一致）
- `error_message` / `stack_trace` はオプション。スタックトレースはファイル書き込み前にパスマスク適用

**受け入れ基準** (→ agent-runner FR-004 Scenario):
- GIVEN: implement ステップでテストが実行された
- WHEN: `mspec test-results convert --change <id>` を実行
- THEN: `changes/<id>/test-results.json` が生成され、上記スキーマのエントリが含まれる

---

### D-3: CLI サブコマンド `mspec test-results convert`

**ファイル**: `packages/cli/src/commands/testResults.ts`

処理フロー:
1. `changes/<change>/e2e-results/results.json`（Playwright JSON）を読む
2. Playwright `suites[].specs[].tests[].results[]` を平坦化
3. テスト名から `\[FR-(\d+)\]` を正規表現で抽出 → `fr-NNN` 形式に変換
4. `status` を `passed→green / failed→red / skipped→skip` に変換
5. `stack_trace` フィールドのパスセグメント（`/path/to/file` 形式）を `[path]` にマスク
6. `changes/<change>/test-results.json` に書き出す（上書き）

**受け入れ基準** (→ agent-runner FR-004 Scenario 2):
- GIVEN: test-results.json が既に存在する
- WHEN: `mspec test-results convert` を再実行
- THEN: test-results.json は最新結果で上書きされる

---

### D-4: ステータス語彙アダプター

**ファイル**: `packages/cli/src/server/testResultParser.ts`

```typescript
function adaptStatus(status: 'red' | 'green' | 'skip'): 'pass' | 'fail' | 'skip' {
  if (status === 'green') return 'pass';
  if (status === 'red') return 'fail';
  return 'skip';
}
```

API レスポンスは `TestCase.status: 'pass' | 'fail' | 'skip'` を維持し、フロントエンド型を変更しない。

**受け入れ基準** (→ test-result-viewer FR-007 Scenario):
- GIVEN: test-results.json の status が `red`
- WHEN: `GET /api/changes/:id/test-results` を呼ぶ
- THEN: レスポンスの `TestCase.status` は `fail`

---

### D-5: チェックリスト紐づき検証

**ファイル**: `packages/cli/src/server/routes/testResults.ts`

API レスポンスに `isResolved: boolean` フィールドを追加:
1. `changes/<change>/checklist.md` を読む
2. `<!-- verify: fr-NNN -->` の全 ID を抽出して有効 ID セットを作成
3. 各テストケースの `checklist_item_ids` を有効 ID セットと照合
4. `isResolved: false` の場合、UI でダングリングリファレンス警告バッジを表示

**受け入れ基準** (→ test-result-viewer FR-009 Scenario):
- GIVEN: `checklist_item_ids` に checklist.md に存在しない ID が含まれる
- WHEN: Test Result Viewer を開く
- THEN: 「チェックリスト項目：未解決」警告バッジが表示される

---

### D-6: スタックトレースのサーバー側パスマスク

**ファイル**: `packages/cli/src/server/testResultParser.ts`

```typescript
function maskAbsolutePaths(text: string): string {
  // Unix 絶対パス: /path/to/file
  // Windows 絶対パス: C:\path\to\file
  return text.replace(/(\/[^\s:,)]+)|(([A-Za-z]):\\[^\s:,)]+)/g, '[path]');
}
```

パース時（`parseTestResultsJson()`）に適用し、レスポンス組み立て時に再処理しない。

**受け入れ基準** (→ test-result-viewer FR-010 Scenario):
- GIVEN: stack_trace に `/Users/xxx/project/spec.ts` が含まれる
- WHEN: `GET /api/changes/:id/test-results` を呼ぶ
- THEN: レスポンスの stack_trace は `[path]/spec.ts` に置換される

---

### D-7: フロントエンド — チェックリスト紐づきバッジ

**ファイル**: `packages/web-ui/src/pages/TestResults.tsx`

```tsx
// API 型拡張
type TestCaseWithLinkage = TestCase & {
  checklist_item_ids: string[];   // ['fr-007', 'fr-008']
  is_resolved: boolean;           // dangling reference 検出結果
};

// 紐づきバッジ（正常）
<Badge variant="outline" className="text-xs">
  {id.toUpperCase()}  {/* fr-007 → FR-007 */}
</Badge>

// ダングリングリファレンス警告バッジ
{!isResolved && (
  <Badge variant="warning">チェックリスト項目：未解決</Badge>
)}
```

XSS 対策: React 自動エスケープを使用（dangerouslySetInnerHTML 不使用）。

**受け入れ基準** (→ test-result-viewer FR-008 Scenario):
- GIVEN: テストケースに `checklist_item_ids: ['fr-007', 'fr-008']` が含まれる
- WHEN: Test Result Viewer を開く
- THEN: FR-007 と FR-008 のバッジが各テストケース行に表示される

---

### D-8: test-result-viewer FR-005 / FR-006 の更新方針

**背景**: research.md の Open Choice「FR-005 / FR-006 の扱い」を設計ステップで確定する。

FR-005（E2E バッジ表示確認）と FR-006（E2E トレース展開確認）は、FR-001 MODIFIED によりデータソースが `e2e-results/` Playwright XML から `test-results.json` に変更された後も、E2E テストで確認すべき振る舞い（DOM の testid 存在・trace-panel の展開）は変わらない。したびこれらは **REMOVED ではなく MODIFIED** として Delta Spec に記録し、GIVEN 条件のみを更新する。

**受け入れ基準** (→ test-result-viewer SoT FR-005 / FR-006):
- FR-005 Scenario GIVEN: `test-results.json` に red/green/skip エントリが存在する（旧: Playwright XML ファイルが存在する）
- FR-006 Scenario GIVEN: `test-results.json` に `status: "red"` かつ `stack_trace` フィールドを持つエントリが存在する

**FR-010 ID 衝突への対処**:
- change-dashboard FR-010（アーティファクトソート）と test-result-viewer FR-010（スタックトレースサニタイズ）が同じ FR 番号を持つ
- `checklist_item_ids` の値を capability プレフィックス付き形式（例: `change-dashboard:fr-010`、`test-result-viewer:fr-010`）に拡張することで曖昧さを解消する
- ただし、この変更はエンジニアリングコストが高いため、**実装フェーズでシンプルな識別として `capability:fr-nnn` 形式を採用するかどうか tasks.md で確認する**（今回はチェックリスト注記として残す）

## Constitution Check

| 原則 | Phase 0 | Phase 1 |
|------|---------|---------|
| I. ステップ独立性 | OK — design は research.md のみに依存 | OK — 変更ファイルは明確に分離されており、副作用なし |
| II. 決定論的マージ | OK — Decisions テーブルに具体的なコード契約を記録 | OK — API 型変更は後方互換（フィールド追加のみ） |
| III. 質問駆動の要件確定 | OK — status 語彙・書き込み担当・紐づけメカニズムを確定済み | OK — D-4 ～ D-7 で残る設計判断を確定 |
| IV. 双方向アンカー | OK — 各 Decision が Delta Spec FR に対応付けられている | OK — `getStepForArtifact` は FR-010 の Scenario に直接対応 |
| V. 強制ステップと拡張ステップの分離 | OK — design は強制ステップとして正常実行中 | OK — 強制/拡張ステップの境界を変更していない |
| VI. Security by Default | OK — XSS 対策・パスマスク・dangerouslySetInnerHTML 不使用を記録 | OK — D-6 でパスマスク実装詳細を定義。機密情報（APIキー等）は test-results.json に書かない（agent-runner FR-003 準拠） |

### Complexity Tracking

None.

## Self-Review

### Summary

7つのADDED FRすべてがDelta Specのシナリオとdesign.mdのDecisionで網羅されている。architecture-overview.mdのコンポーネント名・ファイルパスはdesign.mdと一致している。ただし、research.mdで「設計ステップで確定」と明記されたFR-005/FR-006の処理方針がdesign.mdに記載されておらず、Quickstartの誤ったPlaywrightコマンドフラグが確認された。これらを修正した。

### Findings

[blocker] FR-005 / FR-006 disposition unresolved → **修正済み** (D-8 追加、Delta Spec に MODIFIED エントリ追加)

[warning] FR-010 ID collision (change-dashboard vs test-result-viewer) → **設計注記として D-8 に記録。tasks.md で実装判断を確認**

[warning] Quickstart step 1 の `--output` フラグ誤り → **修正済み** (`PLAYWRIGHT_JSON_OUTPUT_NAME` 環境変数を使用する形に修正)

[note] `mspec test-results convert` のトリガーはオプション（opt-in）として維持 → 設計済み

### Verdict

PASS_WITH_WARNINGS（blockerを修正済み、warningはtasks.mdで対応）

---

## Self-Review (Pass 2)

### Summary

全3件の修正が正しく適用されている。FR-005・FR-006 は `specs/test-result-viewer/spec.md` に MODIFIED Requirements として追加され、GIVEN 条件が更新された。D-8 Decision に FR-005/FR-006 の処理方針と FR-010 ID 衝突の記録が追加された。Quickstart step 1 は `PLAYWRIGHT_JSON_OUTPUT_NAME` 環境変数を使う正しい形式に修正された。

### Findings

[note] `quickstart.md` Troubleshooting セクションの `playwright.config.ts` 設定例で `outputFile: 'results.json'`（ベアファイル名）が残っているが、Golden Path には影響しない pre-existing な軽微な不整合

[note] D-8 の FR-010 ID 衝突解消（`capability:fr-nnn` 形式）は tasks.md で確認する旨を明示して延期中

[note] `specs/test-result-viewer/spec.md` FR-008 のシナリオで `checklist_item_id`（単数）が使われているが、スキーマとテキストは `checklist_item_ids`（複数）— 機能上の影響なし

### Verdict

PASS_WITH_WARNINGS（blockerゼロ、notesは実装で対応）
