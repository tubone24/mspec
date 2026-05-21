---
doc_type: AI-Internal
---

<!-- @mspec-delta 2026-05-21-055911-ui-visual-mock-workflow/specs/visual-mock/spec.md -->
<!-- Requirements implemented: FR-001, FR-002, FR-003, FR-004 -->
<!-- @mspec-delta 2026-05-21-055911-ui-visual-mock-workflow/specs/cli-workflow-engine/spec.md -->
<!-- Requirements implemented: FR-023 -->
<!-- @mspec-delta 2026-05-21-055911-ui-visual-mock-workflow/specs/cli-core/spec.md -->
<!-- Requirements implemented: FR-004 -->
<!-- Change: ui-visual-mock-workflow -->

# Tasks: ui-visual-mock-workflow

---

## Phase 1: Setup

### TASK-001: FrameworkInfo 型定義を追加する

`packages/cli/src/lib/framework-detector.ts` を新規作成し、`FrameworkInfo` 型と `detectFramework()` のシグネチャを定義する。実装はまだ行わない（スタブで良い）。

```
- [ ] packages/cli/src/lib/framework-detector.ts を新規作成
- [ ] FrameworkInfo 型を export する（name / cdnSnippet? / promptHint フィールド）
- [ ] detectFramework(projectRoot: string): Promise<FrameworkInfo> のスタブを export する
```

---

### TASK-002: mock-server.ts スタブを追加する

`packages/cli/src/lib/mock-server.ts` を新規作成し、`startMockServer()` と `findFreePort()` のシグネチャを定義する。実装はまだ行わない。

```
- [ ] packages/cli/src/lib/mock-server.ts を新規作成
- [ ] startMockServer(mockDir: string, preferredPort?: number): Promise<{port: number; close: () => void}> のスタブを export する
- [ ] findFreePort(start: number): Promise<number> のスタブを定義する
```

---

### TASK-003: prompt.ts に askMultiline() スタブを追加する

`packages/cli/src/lib/prompt.ts`（既存）に `askMultiline(prompt: string): Promise<string>` を追加する。空行入力で収集終了するマルチライン版。

```
- [ ] packages/cli/src/lib/prompt.ts を読む
- [ ] askMultiline() 関数のスタブを追加する（空行で終了ロジックは Phase 2 で実装）
```

---

## Phase 2: Foundational

### TASK-004: workflow.default.yaml に visual-mock ステップを追加する

`packages/cli/templates/workflow.default.yaml` を修正し、proposal ステップの直後に visual-mock を挿入する。

```yaml
- id: visual-mock
  skippable: true
  block: true
  produces:
    - mock-feedback.md
  requires:
    - proposal.md
  skill: mspec-visual-mock
  subagent: mspec-visual-mock-runner
```

```
- [x] workflow.default.yaml の proposal ステップを特定する
- [x] visual-mock ステップを proposal の直後に挿入する
- [x] skippable: true / block: true が正しく設定されていることを確認する
```

anchor:
@mspec-delta 2026-05-21-055911-ui-visual-mock-workflow/specs/cli-workflow-engine/spec.md
Requirements implemented: FR-023
Change: ui-visual-mock-workflow

---

### TASK-005: framework-detector.ts の検出ロジックを実装する

D-004 に従い、`package.json` の `dependencies` / `devDependencies` を検査して CSS フレームワークを判定するロジックを実装する。

対応フレームワーク: `@mui/material` → material-ui / `tailwindcss` → tailwind / `bootstrap` → bootstrap / `@chakra-ui/react` → chakra / `antd` → antd / 未検出 → none

```
- [x] TASK-001 のスタブに検出ロジックを実装する
- [x] tailwind.config.* の存在確認（tailwindcss の補助）を追加する
- [x] 未検出時のフォールバック（name: 'none'）を実装する
- [x] 各フレームワークの promptHint を D-004 テーブルに従い設定する
```

anchor:
@mspec-delta 2026-05-21-055911-ui-visual-mock-workflow/specs/visual-mock/spec.md
Requirements implemented: FR-001
Change: ui-visual-mock-workflow

---

### TASK-006: mock-server.ts の静的 HTTP サーバーを実装する

D-003 に従い、`node:http` を使用したゼロ依存の静的ファイルサーバーを実装する。`EADDRINUSE` 時に +1 してリトライ（最大 10 回）するポート自動インクリメントも含む。

```
- [x] TASK-002 のスタブに node:http 静的サーバーを実装する
- [x] findFreePort() で EADDRINUSE 時 +1 リトライ（最大 10 回）を実装する
- [x] startMockServer() が { port, close } を返す
- [x] SIGINT ハンドラ登録のエントリポイントを mock.ts に委譲するため、close() のみ提供する
```

anchor:
@mspec-delta 2026-05-21-055911-ui-visual-mock-workflow/specs/visual-mock/spec.md
Requirements implemented: FR-002
Change: ui-visual-mock-workflow

---

### TASK-007: prompt.ts の askMultiline() を実装する

D-006 に従い、空行入力で収集終了するマルチライン入力を実装する。

```
- [x] TASK-003 のスタブに readline ベースの実装を追加する
- [x] 空行入力（Enter のみ）で収集終了
- [x] 収集した行を改行で結合した文字列を返す
```

anchor:
@mspec-delta 2026-05-21-055911-ui-visual-mock-workflow/specs/visual-mock/spec.md
Requirements implemented: FR-003
Change: ui-visual-mock-workflow

---

## Phase 3: User Story

### TASK-008: [E2E] visual-mock FR-023 — ワークフローへのステップ出現を検証する

cli-workflow-engine FR-023 Scenario「visual-mock ステップがワークフローに出現する」の E2E テストを作成する。

```
- [ ] テストファイルを作成する（例: packages/cli/src/__tests__/e2e/workflow-visual-mock.test.ts）
- [ ] proposal 完了済みの change fixture を用意する
- [ ] mspec continue --json を実行して current_step: "visual-mock" / block_after: true を assert する
- [ ] テストが red になることを確認する（TASK-004 実装前なので）
```

anchor:
@mspec-delta 2026-05-21-055911-ui-visual-mock-workflow/specs/cli-workflow-engine/spec.md
Requirements implemented: FR-023
Change: ui-visual-mock-workflow

---

### TASK-009: [E2E] visual-mock FR-023 — skip フローを検証する

cli-workflow-engine FR-023 Scenario「visual-mock を skip する」の E2E テストを作成する。

```
- [ ] TASK-008 のテストファイルに skip シナリオを追加する
- [ ] mspec skip visual-mock --reason "test" を実行する
- [ ] skip 後に mspec continue が次ステップ（delta）を返すことを assert する
- [ ] mspec status で visual-mock が skipped と返ることを assert する
- [ ] テストが red になることを確認する
```

anchor:
@mspec-delta 2026-05-21-055911-ui-visual-mock-workflow/specs/cli-workflow-engine/spec.md
Requirements implemented: FR-023
Change: ui-visual-mock-workflow

---

### TASK-010: [E2E] cli-core FR-004 — mspec mock 正常実行フローを検証する

cli-core FR-004 Scenario「mspec mock の正常実行」の E2E テストを作成する。

```
- [ ] テストファイルを作成する（例: packages/cli/src/__tests__/e2e/mock-command.test.ts）
- [ ] active change + proposal.md ありの fixture を用意する
- [ ] mspec mock --change <fixture> をモック stdin/stdout で実行する
- [ ] HTML 生成 → サーバー起動 → URL 表示 → フィードバック収集 の順を assert する
- [ ] テストが red になることを確認する
```

anchor:
@mspec-delta 2026-05-21-055911-ui-visual-mock-workflow/specs/cli-core/spec.md
Requirements implemented: FR-004
Change: ui-visual-mock-workflow

---

### TASK-011: [E2E] cli-core FR-004 — no active change エラーを検証する

cli-core FR-004 Scenario「active change が存在しない場合のエラー」の E2E テストを作成する。

```
- [ ] TASK-010 のテストファイルにエラーシナリオを追加する
- [ ] changes/ が空の状態で mspec mock を実行する
- [ ] stderr に "no active change found" が含まれることを assert する
- [ ] プロセスが非ゼロ終了コードで終了することを assert する
- [ ] テストが red になることを確認する
```

anchor:
@mspec-delta 2026-05-21-055911-ui-visual-mock-workflow/specs/cli-core/spec.md
Requirements implemented: FR-004
Change: ui-visual-mock-workflow

---

### TASK-012: [E2E] visual-mock FR-001 — mock/index.html 生成を検証する

visual-mock FR-001 Scenario「mock ディレクトリへの生成」の E2E テストを作成する。

```
- [ ] テストファイルを作成する（例: packages/cli/src/__tests__/e2e/mock-generation.test.ts）
- [ ] @mui/material を含む package.json と proposal.md を持つ fixture を用意する
- [ ] mspec mock 実行後に changes/<change>/mock/index.html が存在することを assert する
- [ ] index.html が HTML として parse 可能なことを assert する
- [ ] テストが red になることを確認する
```

anchor:
@mspec-delta 2026-05-21-055911-ui-visual-mock-workflow/specs/visual-mock/spec.md
Requirements implemented: FR-001
Change: ui-visual-mock-workflow

---

### TASK-013: [E2E] visual-mock FR-002 — HTTP サーバー起動と URL 表示を検証する

visual-mock FR-002 Scenario「サーバー起動と URL 表示」の E2E テストを作成する。

```
- [ ] TASK-012 のテストファイルにサーバーシナリオを追加する
- [ ] startMockServer() を直接呼び出して port が 3737 以上であることを assert する
- [ ] http://localhost:<port> にリクエストして index.html のコンテンツが返ることを assert する
- [ ] 3737 使用中の場合に 3738+ で起動することを assert する
- [ ] テストが red になることを確認する
```

anchor:
@mspec-delta 2026-05-21-055911-ui-visual-mock-workflow/specs/visual-mock/spec.md
Requirements implemented: FR-002
Change: ui-visual-mock-workflow

---

### TASK-014: [E2E] visual-mock FR-003 — フィードバック保存を検証する

visual-mock FR-003 Scenario「フィードバックの保存」の E2E テストを作成する。

```
- [ ] TASK-012 のテストファイルにフィードバックシナリオを追加する
- [ ] stdin にフィードバックテキスト + 空行をモック入力する
- [ ] mspec mock 実行後に mock-feedback.md が生成されることを assert する
- [ ] mock-feedback.md に「# Mock Feedback」ヘッダと入力テキストが含まれることを assert する
- [ ] 2 回目の実行で上書きされることを assert する
- [ ] テストが red になることを確認する
```

anchor:
@mspec-delta 2026-05-21-055911-ui-visual-mock-workflow/specs/visual-mock/spec.md
Requirements implemented: FR-003
Change: ui-visual-mock-workflow

---

### TASK-015: [E2E] visual-mock FR-004 — tasks 生成へのフィードバック反映を検証する

visual-mock FR-004 Scenario「フィードバックがある状態での tasks 生成」の E2E テストを作成する。

```
- [ ] テストファイルを作成する（例: packages/cli/src/__tests__/e2e/tasks-feedback.test.ts）
- [ ] mock-feedback.md が存在する change fixture を用意する
- [ ] mspec tasks ステップ実行後に tasks.md にフィードバック由来の注記が含まれることを assert する
- [ ] mock-feedback.md が SKIPPED_PLACEHOLDER_MARKER の場合に注記が含まれないことを assert する
- [ ] テストが red になることを確認する
```

anchor:
@mspec-delta 2026-05-21-055911-ui-visual-mock-workflow/specs/visual-mock/spec.md
Requirements implemented: FR-004
Change: ui-visual-mock-workflow

---

### TASK-016: mock.ts コマンド本体を実装する（SIGINT ハンドラ込み）

D-002・D-003・D-006 に従い、`packages/cli/src/commands/mock.ts` を新規作成する。SIGINT ハンドラを `startMockServer` 呼び出し前に登録し、Ctrl+C 後にフィードバック収集へ移行する。

```
- [ ] packages/cli/src/commands/mock.ts を新規作成する
- [ ] --change / --port オプションを commander で定義する
- [ ] --change 省略時は getActiveChange() で解決し、なければ "no active change found" で process.exit(1)
- [ ] detectFramework() を呼び出してフレームワーク情報を取得する
- [ ] mspec-visual-mock-runner サブエージェントを起動して mock/index.html を生成させる
- [ ] process.on('SIGINT', handler) を startMockServer 呼び出し前に登録する
- [ ] handler: close() でサーバー停止 → readline raw mode 解除 → askMultiline() でフィードバック収集
- [ ] フィードバックを mock-feedback.md に D-006 フォーマットで保存する
- [ ] TASK-010 / TASK-011 の E2E テストが green になることを確認する
```

anchor:
@mspec-delta 2026-05-21-055911-ui-visual-mock-workflow/specs/cli-core/spec.md
Requirements implemented: FR-004
Change: ui-visual-mock-workflow

---

### TASK-017: src/index.ts に program.command('mock') を追加する

`packages/cli/src/index.ts` を修正し、TASK-016 で作成した mock コマンドを登録する。

```
- [ ] packages/cli/src/index.ts に mock コマンドの import を追加する
- [ ] program.command('mock') で TASK-016 のコマンドを登録する
- [ ] mspec mock --help が期待するオプションを表示することを確認する
```

anchor:
@mspec-delta 2026-05-21-055911-ui-visual-mock-workflow/specs/cli-core/spec.md
Requirements implemented: FR-004
Change: ui-visual-mock-workflow

---

### TASK-018: TASK-008 / TASK-009 の E2E テストを green にする（workflow.default.yaml 検証）

TASK-004 の workflow.default.yaml 変更と TASK-008 / TASK-009 E2E テストを組み合わせて green 状態にする。

```
- [x] TASK-004 の visual-mock ステップ定義を確認する
- [x] TASK-008 の E2E テストが green になることを確認する
- [x] TASK-009 の E2E テストが green になることを確認する
```

anchor:
@mspec-delta 2026-05-21-055911-ui-visual-mock-workflow/specs/cli-workflow-engine/spec.md
Requirements implemented: FR-023
Change: ui-visual-mock-workflow

---

### TASK-019: TASK-012 〜 TASK-014 の E2E テストを green にする（mock 生成・サーバー・フィードバック）

framework-detector / mock-server / mock.ts の実装完了後に FR-001 〜 FR-003 E2E テストを green 状態にする。

```
- [ ] TASK-012 (FR-001 生成) が green になることを確認する
- [ ] TASK-013 (FR-002 サーバー) が green になることを確認する
- [ ] TASK-014 (FR-003 フィードバック) が green になることを確認する
```

anchor:
@mspec-delta 2026-05-21-055911-ui-visual-mock-workflow/specs/visual-mock/spec.md
Requirements implemented: FR-001, FR-002, FR-003
Change: ui-visual-mock-workflow

---

## Phase 4: Polish

### TASK-020: mspec-tasks/SKILL.md に mock-feedback.md ソフト参照を追加する

D-007 に従い、既存の `packages/cli/templates/claude/skills/mspec-tasks/SKILL.md` の `## Procedure` 冒頭に `mock-feedback.md` ソフト参照ロジックを追加する。

```
- [ ] mspec-tasks/SKILL.md を読む
- [ ] ## Procedure の冒頭に以下を追加する:
      "Before generating tasks.md, check if changes/<change>/mock-feedback.md exists
       and is not a skipped placeholder. If it exists, read its content and incorporate
       the feedback as additional context when writing tasks.md."
- [ ] TASK-015 の E2E テストが green になることを確認する
```

anchor:
@mspec-delta 2026-05-21-055911-ui-visual-mock-workflow/specs/visual-mock/spec.md
Requirements implemented: FR-004
Change: ui-visual-mock-workflow

---

### TASK-021: /mspec:mock コマンドプロンプトを作成する

`packages/cli/templates/claude/commands/mspec/mock.md` を新規作成する。

```
- [ ] mock.md を新規作成する
- [ ] mspec mock コマンドを呼び出す手順を記述する
- [ ] コマンド参照はコロン形式（/mspec:mock）を使用する（ハイフン形式禁止）
```

---

### TASK-022: mspec-visual-mock スキル SKILL.md を作成する

`packages/cli/templates/claude/skills/mspec-visual-mock/SKILL.md` を新規作成する。

ワークフローエンジンから呼ばれる visual-mock ステップの制御ロジックを記述する。

```
- [ ] mspec-visual-mock/SKILL.md を新規作成する
- [ ] ## Procedure に mspec mock コマンド呼び出し → block: true での停止 → ユーザー確認後の続行を記述する
- [ ] skip フロー（mspec skip visual-mock）の案内を含める
```

---

### TASK-023: mspec-visual-mock-runner サブエージェント SKILL.md を作成する

`packages/cli/templates/claude/skills/mspec-visual-mock-runner/SKILL.md` を新規作成する。

proposal.md + FrameworkInfo を受け取り、mock/index.html を生成するサブエージェントの指示を記述する。

```
- [ ] mspec-visual-mock-runner/SKILL.md を新規作成する
- [ ] 入力コンテキスト: proposal.md の ## Goals セクション + FrameworkInfo.promptHint を記述する
- [ ] 出力: 自己完結型ワンファイル HTML（CSS・JS インライン埋め込み）を記述する
- [ ] フレームワーク固有コンポーネント/クラスを使用することを明記する
```

anchor:
@mspec-delta 2026-05-21-055911-ui-visual-mock-workflow/specs/visual-mock/spec.md
Requirements implemented: FR-001
Change: ui-visual-mock-workflow

---

### TASK-024: 全テストスイートを実行してリグレッションがないことを確認する

```
- [ ] npm test（または相当コマンド）を実行する
- [ ] 既存テストがすべて pass していることを確認する
- [ ] TASK-008〜015 の E2E テストがすべて green であることを確認する
- [ ] mspec anchor check でゼロエラーを確認する
```

---

## Constitution Check

| Principle | Phase 0 |
|-----------|---------|
| I  ステップ独立性 | ✅ tasks.md は design.md・checklist.md を読むのみで他の成果物を書き換えない |
| II  決定論的マージ | ✅ 各タスクに対象ファイル・関数レベルの実装指示が記載されている |
| III  質問駆動の要件確定 | ✅ 未解決の Open Choice なし（design.md self-review で全解決済み） |
| IV  双方向アンカー | ✅ E2E タスク・実装タスクに `anchor:` ブロックを付与済み |
| V  強制ステップと拡張ステップの分離 | ✅ visual-mock は skippable: true で任意ステップ。必須ステップは変更なし |
