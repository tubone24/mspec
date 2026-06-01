---
doc_type: Reference
---

<!-- @mspec-delta 2026-05-29-133745-fix-e2e-flakiness-verify-cmd-auto-execute/specs/e2e-stability/spec.md -->
<!-- Requirements implemented: FR-001, FR-002, FR-003 -->
<!-- Change: fix-e2e-flakiness-verify-cmd-auto-execute -->

<!-- @mspec-delta 2026-05-29-133745-fix-e2e-flakiness-verify-cmd-auto-execute/specs/artifact-preview/spec.md -->
<!-- Requirements implemented: FR-014 -->
<!-- Change: fix-e2e-flakiness-verify-cmd-auto-execute -->

# Architecture Overview: fix-e2e-flakiness-verify-cmd-auto-execute

## System Diagram

```mermaid
graph TD
    subgraph "Web UI (React)"
        AV["ArtifactViewer.tsx<br/>li: extractVerifyCmd()<br/>Run ボタン + cmdResult state"]
        FC["fetch POST /api/run-cmd"]
    end

    subgraph "CLI Server (Fastify)"
        RC["runCmd.ts<br/>POST /api/run-cmd<br/>tokens[0] === 'mspec' 検証<br/>spawn(shell: false)"]
        SP["child_process.spawn<br/>argv 配列渡し"]
    end

    subgraph "E2E Tests"
        PW["Playwright tests<br/>waitForTimeout → expect(locator).toBeVisible()"]
        VT["vitest CLI tests<br/>afterEach: vi.restoreAllMocks()"]
    end

    AV -->|"1. ユーザーが Run ボタンをクリック<br/>button disabled=true"| FC
    FC -->|"2. POST { cmd: 'mspec validate --change foo' }"| RC
    RC -->|"3. mspec プレフィックス検証"| RC
    RC -->|"4. spawn(['mspec', 'validate', '--change', 'foo'], shell: false)"| SP
    SP -->|"5. stdout + stderr 収集"| RC
    RC -->|"6. { exitCode, stdout, stderr }"| FC
    FC -->|"7. setCmdResult → インライン表示<br/>button disabled=false"| AV

    PW -->|"条件ベース待機でフレーキー解消"| PW
    VT -->|"spy リーク解消"| VT
```

---

## Sequence Diagram: FR-014 verify:cmd 実行フロー

```mermaid
sequenceDiagram
    actor User
    participant AV as ArtifactViewer.tsx
    participant API as POST /api/run-cmd
    participant SP as spawn (shell: false)

    Note over AV: checklist.md をレンダリング中
    AV->>AV: extractVerifyCmd(liNode) → "mspec validate --change foo"
    AV->>User: li + [実行] ボタンを表示

    User->>AV: [実行] ボタンをクリック
    AV->>AV: setRunning(true) → button disabled
    AV->>API: POST /api/run-cmd { cmd: "mspec validate --change foo" }

    API->>API: tokens = ["mspec", "validate", "--change", "foo"]
    API->>API: tokens[0] === "mspec" → OK
    API->>SP: spawn("mspec", ["validate", "--change", "foo"], {shell: false})
    SP-->>API: stdout, stderr, exitCode
    API-->>AV: 200 OK { exitCode: 0, stdout: "...", stderr: "" }

    AV->>AV: setCmdResult(...), setRunning(false)
    AV->>User: 結果を pre タグでインライン表示

    Note over API: 不正コマンドの場合
    API->>API: tokens[0] !== "mspec" → 403 Forbidden
```

---

## Sequence Diagram: FR-001 Playwright 待機置換

```mermaid
sequenceDiagram
    participant T as Playwright Test
    participant P as Page (DOM)

    Note over T: Before (フレーキー)
    T->>T: await page.waitForTimeout(3000)
    T->>P: 固定時間後に assert（CI 負荷で失敗し得る）

    Note over T: After (安定)
    T->>P: await expect(locator).toBeVisible({ timeout: 8000 })
    P-->>T: 要素が visible になった時点で即座に続行
```

---

## 変更ファイル一覧

### e2e-stability（FR-001/002/003）

| ファイル | 変更内容 |
|---------|---------|
| `packages/web-ui/tests/e2e/spec-viewer.e2e.test.ts` | `waitForTimeout` 10件 → 条件ベース待機 |
| `packages/web-ui/tests/e2e/checklist-verify-human.e2e.test.ts` | `waitForTimeout` 4件 → 条件ベース待機 |
| `packages/web-ui/tests/e2e/code-highlight.e2e.test.ts` | `waitForTimeout` 5件 → 条件ベース待機 |
| `packages/web-ui/tests/e2e/checklist-interactive.e2e.test.ts` | `waitForTimeout` 3件 → 条件ベース待機 |
| `packages/web-ui/tests/e2e/full-text-search.e2e.test.ts` | `waitForTimeout` 3件 → 条件ベース待機 |
| `packages/web-ui/tests/e2e/artifact-preview.e2e.test.ts` | `waitForTimeout` 1件 → 条件ベース待機 |
| `packages/cli/tests/e2e/verify-llm.e2e.test.ts` | `afterEach: vi.restoreAllMocks()` 追加 |
| `packages/cli/tests/e2e/learn.e2e.test.ts` | 各 `it()` 内 `spy.mockRestore()` 追加 |

### artifact-preview（FR-014）

| ファイル | 変更内容 |
|---------|---------|
| `packages/cli/src/server/routes/runCmd.ts` | 新規: `POST /api/run-cmd` ルート実装 |
| `packages/cli/src/server/server-process.ts` | `registerRunCmdRoute` を import・登録 |
| `packages/web-ui/tests/e2e/setup/api-server.ts` | `registerRunCmdRoute` を import・登録 |
| `packages/web-ui/src/components/ArtifactViewer.tsx` | `li` に `extractVerifyCmd`・Run ボタン・結果表示を追加 |
| `packages/web-ui/tests/e2e/artifact-preview.e2e.test.ts` | FR-014 の E2E テストシナリオを追加 |

---

## Constitution Check

| 原則 | Phase 0 | Phase 1 |
|------|---------|---------|
| I — ステップ独立性 | ✅ overview は design を参照するのみ | ✅ 実装詳細に依存しない |
| II — 決定論的マージ | ✅ | ✅ |
| III — 質問駆動の要件確定 | ✅ | ✅ |
| IV — 双方向アンカー | ✅ | ✅ |
| V — 強制/拡張ステップの分離 | ✅ | ✅ |
| VI — Security by Default | ✅ spawn shell:false と mspec プレフィックス検証を図中で明示 | ✅ |
| VII — 設計意図と実装の対応確認 | ✅ 変更ファイル一覧で FR → ファイルの対応を明記 | ✅ |

### Complexity Tracking

None
