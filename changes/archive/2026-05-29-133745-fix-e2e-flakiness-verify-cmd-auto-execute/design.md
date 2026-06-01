---
doc_type: Reference
---

<!-- See also: ./design-rationale.md for採用理由・代替案 -->

<!-- @mspec-delta 2026-05-29-133745-fix-e2e-flakiness-verify-cmd-auto-execute/specs/e2e-stability/spec.md -->
<!-- Requirements implemented: FR-001, FR-002, FR-003 -->
<!-- Change: fix-e2e-flakiness-verify-cmd-auto-execute -->

<!-- @mspec-delta 2026-05-29-133745-fix-e2e-flakiness-verify-cmd-auto-execute/specs/artifact-preview/spec.md -->
<!-- Requirements implemented: FR-014 -->
<!-- Change: fix-e2e-flakiness-verify-cmd-auto-execute -->

# Design: fix-e2e-flakiness-verify-cmd-auto-execute

## Summary

このチェンジは2つの独立した capability を扱う。

1. **e2e-stability（FR-001/002/003）**: Playwright e2e テストの `waitForTimeout()` 固定待機を条件ベース待機に置換し、vitest CLI e2e テストの `vi.spyOn(process, 'cwd')` スパイ漏れを `afterEach` で確実にクリーンアップする。これらはテストコードのみを変更し、プロダクションコードに影響しない。

2. **artifact-preview（FR-014）**: `verify: cmd:<command>` アノテーション付き checklist 項目に実行ボタンを追加し、クリック時に `POST /api/run-cmd` で指定コマンドを実行してインライン表示する。コマンド実行は `mspec` プレフィックス限定で許可（Security by Default）。

---

## Technical Context

### e2e-stability: 影響ファイルと置換パターン

| ファイル | waitForTimeout 件数 | 置換後パターン |
|---------|---------------------|----------------|
| `packages/web-ui/tests/e2e/spec-viewer.e2e.test.ts` | 10件（3000ms×2含む） | `expect(locator).toBeVisible({ timeout: 8000 })` / `toHaveCount(n)` |
| `packages/web-ui/tests/e2e/checklist-verify-human.e2e.test.ts` | 4件 | `expect(locator).toBeVisible()` |
| `packages/web-ui/tests/e2e/code-highlight.e2e.test.ts` | 5件 | `expect(locator).toBeVisible()` |
| `packages/web-ui/tests/e2e/checklist-interactive.e2e.test.ts` | 3件 | `expect(locator).toBeVisible()` |
| `packages/web-ui/tests/e2e/full-text-search.e2e.test.ts` | 3件 | `expect(locator).toBeVisible()` |
| `packages/web-ui/tests/e2e/artifact-preview.e2e.test.ts` | 1件 | `expect(locator).toBeVisible()` |

| ファイル | spyOn 箇所 | 修正内容 |
|---------|-----------|---------|
| `packages/cli/tests/e2e/verify-llm.e2e.test.ts` | `it()` 内部に `spy.mockRestore()` なし | `afterEach` に `vi.restoreAllMocks()` を追加 |
| `packages/cli/tests/e2e/learn.e2e.test.ts` | `it()` 内追加スパイが不完全 | 各 `it()` 末尾に `spy.mockRestore()` を追加 |

### artifact-preview: 現状と追加内容

| レイヤー | 現状 | 追加 |
|---------|------|------|
| `ArtifactViewer.tsx` の `li` | `verify: cmd:` を amber ハイライト（FR-012済み） | Run ボタン表示・クリック時 POST・結果インライン表示 |
| `packages/cli/src/server/routes/` | `artifacts.ts`, `changes.ts`, `specs.ts`, `testResults.ts` | `runCmd.ts`（新規）|
| `server-process.ts` | 4ルート登録済み | `registerRunCmdRoute` 追加 |
| `tests/e2e/setup/api-server.ts` | 4ルート登録済み | `registerRunCmdRoute` 追加 |

---

## API Contract

### POST /api/run-cmd

| 項目 | 値 |
|-----|----|
| メソッド | `POST` |
| URL | `/api/run-cmd` |
| Request Content-Type | `application/json` |
| Request Body | `{ "cmd": "mspec validate --change foo" }` |
| Success Response | `200 OK`, `{ exitCode: number, stdout: string, stderr: string }` |
| 不正コマンド（mspec 以外） | `403 Forbidden`, `{ error: "forbidden: only mspec commands are allowed" }` |
| コマンド実行失敗 | `200 OK`（非ゼロ exitCode を返す。spawn 自体の失敗は 500） |

**セキュリティ制約（サーバー側で強制）**:
- `cmd` の最初のトークン（スペース区切り）が `mspec` であることをサーバー側で検証
- `spawn` は `shell: false` + argv 配列渡し（シェルインジェクション防止）
- localhost（127.0.0.1）のみバインド（外部からの直接呼び出し不可）

```typescript
// コマンド分割・実行の核心ロジック
const tokens = body.cmd.trim().split(/\s+/);
if (tokens[0] !== 'mspec') {
  return reply.code(403).send({ error: 'forbidden: only mspec commands are allowed' });
}
const child = spawn(tokens[0], tokens.slice(1), { shell: false, cwd: root });
```

---

## Frontend Design

### ArtifactViewer.tsx の変更点

**Run ボタン表示条件**（`li` コンポーネント内）:

```typescript
// verify: cmd:<command> を抽出
const extractVerifyCmd = (node: Element): string | null => {
  for (const child of node.children ?? []) {
    if (child.type !== 'element') continue;
    const el = child as Element;
    const classes = Array.isArray(el.properties?.className) ? el.properties.className : [];
    if (!classes.includes('md-comment')) continue;
    for (const c of el.children ?? []) {
      if (c.type !== 'text' || !('value' in c)) continue;
      const m = String(c.value).match(/verify:\s*cmd:(.+)/);
      if (m) return m[1].trim();
    }
  }
  return null;
};
```

**実行状態の管理**（`useState` を `li` スコープで管理）:

```typescript
const [cmdResult, setCmdResult] = useState<{ exitCode: number; stdout: string; stderr: string } | null>(null);
const [running, setRunning] = useState(false);
```

**Run ボタンと結果表示**:

```tsx
{verifyCmd && (
  <>
    <button disabled={running} onClick={async () => {
      setRunning(true);
      const res = await fetch('/api/run-cmd', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cmd: verifyCmd }),
      });
      setCmdResult(await res.json());
      setRunning(false);
    }}>
      {running ? '実行中…' : '実行'}
    </button>
    {cmdResult && (
      <pre className="text-xs mt-1 bg-gray-100 p-1 rounded">
        exit: {cmdResult.exitCode}{'\n'}{cmdResult.stdout}{cmdResult.stderr}
      </pre>
    )}
  </>
)}
```

---

## Decisions

| 決定 | 詳細 | 対応 Scenario |
|-----|------|--------------|
| `waitForTimeout` → `expect(locator).toBeVisible()` | Playwright の自動リトライ（デフォルト 5000ms）を活用。大部分の固定待機を置換可能 | e2e-stability FR-001: waitForTimeout が条件ベース待機に置き換えられる |
| 3000ms（検索インデックス）→ `toBeVisible({ timeout: 8000 })` | タイムアウト値を引き上げて条件ベースに移行。魔法の数字を排除 | e2e-stability FR-001: 条件ベース待機への移行後もテストが通過する |
| `it()` 内 spyOn → `afterEach` で `vi.restoreAllMocks()` | グローバル状態（`process.cwd`）の並列テスト干渉を防止 | e2e-stability FR-002: vi.restoreAllMocks が各テスト後に呼ばれる |
| FR-003 は FR-001+FR-002 の合成で達成 | 単体の実装成果物なし。3回連続実行の検証は CI で確認 | e2e-stability FR-003: 3回連続実行で結果が安定している |
| `POST /api/run-cmd` を新規ルートモジュールとして追加 | `runCmd.ts` を独立ファイルとして作成し両サーバーに登録 | artifact-preview FR-014: verify:cmd 項目に実行ボタンが表示される |
| `mspec` プレフィックス限定・`shell: false` | サーバー側でトークン検証。クライアント側制御は補助的 | artifact-preview FR-014: 実行ボタンクリックでコマンド結果がインラインに表示される |
| 実行中は `disabled` + ローディング表示 | リクエスト完了まで二重送信防止 | artifact-preview FR-014: コマンド実行中はボタンが無効化される |
| `verify: fr-*` のみ項目には Run ボタン非表示 | `extractVerifyCmd` が `null` を返す場合はボタンを描画しない | artifact-preview FR-014: verify:fr アノテーションのみの項目には実行ボタンが表示されない |

---

## Constitution Check

| 原則 | Phase 0 | Phase 1 |
|------|---------|---------|
| I — ステップ独立性 | ✅ design は research のみ参照 | ✅ 実装ファイルと設計が独立 |
| II — 決定論的マージ | ✅ e2e-stability は新規 capability、artifact-preview は FR-014 追加のみ | ✅ delta spec との整合性あり |
| III — 質問駆動の要件確定 | ✅ OC-1 は選択肢 A（mspec プレフィックス限定）で確定済み | ✅ 未解決の設計疑問なし |
| IV — 双方向アンカー | ✅ Delta Spec アンカーは init で生成済み | ✅ 実装ファイルへのアンカー追加を tasks でカバー |
| V — 強制/拡張ステップの分離 | ✅ design は強制ステップとして独立 | ✅ |
| VI — Security by Default | ✅ `mspec` プレフィックス限定・`shell: false`・localhost のみバインドを明示設計 | ✅ サーバー側強制であることを API Contract に明記 |
| VII — 設計意図と実装の対応確認 | ✅ FR-012（amber ハイライト）が既実装、FR-014 はその自然な拡張 | ✅ Decisions テーブルで各 Scenario と対応付け |

### Complexity Tracking

None

---

## Self-Review

### Summary

全アーティファクトは内部整合性が取れており、FR カバレッジ・設計完全性・セキュリティ設計・アーキテクチャ図は適切。警告1件あり（実装前に対処推奨）。

### Findings

- [ok] **FR Coverage — 全4FR にアノテーション付き**: checklist.md に `<!-- verify: fr-001 -->`, `<!-- verify: fr-002 -->`, `<!-- verify: fr-003 -->`, `<!-- verify: fr-014 -->` が存在。Delta Spec の全 FR-ID を網羅。
- [ok] **API Contract 完全性**: method, URL, request/response schema, error codes (403/500), セキュリティ制約（`shell: false`, mspec-prefix 限定, localhost バインド）, TypeScript スニペットをすべて明記。
- [ok] **Frontend Design 完全性**: `extractVerifyCmd()` ロジック・`useState` スコープ・ボタン描画条件・disabled 状態・結果インライン表示を全て設計。FR-014 の4シナリオが Decisions テーブルで対応付け済み。
- [ok] **Security — spawn shell:false と mspec-prefix 強制**: design.md・architecture-overview.md・design-rationale.md の3ファイルで一貫して明記。
- [ok] **アーキテクチャ図が両 capability をカバー**: System Diagram, FR-014 Sequence Diagram, FR-001 Playwright 待機置換 Sequence Diagram の3種を収録。
- [ok] **Constitution Check — Phase 0/1 両列が記入済み**: design.md・design-rationale.md・architecture-overview.md の全3ファイルで 7原則×2フェーズを網羅。
- [ok] **内部整合性**: architecture-overview.md の変更ファイル一覧と design.md の Technical Context が一致。checklist の FR-ID と Delta Spec の FR-ID が対応。
- [warning] **FR-002 の並列実行シナリオが独立した checklist 項目として未明示**: e2e-stability spec.md の FR-002 第2シナリオ「並列実行でも他のテストに干渉しない」が checklist で静的検査項目のみに集約されており、並列実行の動的確認が明示されていない。FR-003 の3回連続実行チェックでカバーされるため blocker ではない。
- [ok] **FR-012 amber ハイライトのリグレッションリスク**: checklist.md に具体的な手動確認手順付きで明示済み。

### Verdict

**PASS** — 全4FR が annotated、API Contract と Frontend Design が完全仕様化、セキュリティ制約が3ファイルで明記、Constitution Check が全フェーズ記入済み。警告1件（FR-002 並列シナリオ）は FR-003 の安定性チェックで担保済み。
