---
doc_type: Reference
---

<!-- See also: ./design-rationale.md for採用理由・代替案 -->

<!-- @mspec-delta 2026-05-21-055911-ui-visual-mock-workflow/specs/visual-mock/spec.md -->
<!-- Requirements implemented: FR-001, FR-002, FR-003, FR-004 -->
<!-- @mspec-delta 2026-05-21-055911-ui-visual-mock-workflow/specs/cli-workflow-engine/spec.md -->
<!-- Requirements implemented: FR-023 -->
<!-- @mspec-delta 2026-05-21-055911-ui-visual-mock-workflow/specs/cli-core/spec.md -->
<!-- Requirements implemented: FR-004 -->
<!-- Change: ui-visual-mock-workflow -->

# Design: ui-visual-mock-workflow

## Summary

mspec ワークフローに `visual-mock` 任意ステップを追加する。
`mspec mock` コマンドが HTML/CSS/JS モックを `changes/<change>/mock/` に生成し、`node:http` ベースのローカルサーバーで提供する。ユーザーがブラウザで確認してフィードバックを CLI 入力後、`mock-feedback.md` に保存する。後続の tasks ステップがこのファイルをソフト参照して tasks.md に反映する。

変更対象：
1. `packages/cli/templates/workflow.default.yaml` — visual-mock ステップ追加
2. `packages/cli/src/commands/mock.ts` — 新規作成（メインコマンド）
3. `packages/cli/src/lib/mock-server.ts` — 新規作成（静的 HTTP サーバー）
4. `packages/cli/src/lib/framework-detector.ts` — 新規作成（CSS フレームワーク検出）
5. `packages/cli/src/index.ts` — `program.command('mock')` 追加
6. `packages/cli/templates/claude/commands/mspec/mock.md` — 新規作成
7. `packages/cli/templates/claude/skills/mspec-visual-mock/SKILL.md` — 新規作成
8. `packages/cli/templates/claude/skills/mspec-visual-mock-runner/SKILL.md` — 新規作成
9. `packages/cli/src/lib/prompt.ts` — 修正: `askMultiline()` 追加
10. `packages/cli/templates/claude/skills/mspec-tasks/SKILL.md` — 修正: `## Procedure` に mock-feedback.md ソフト参照ロジック追加

---

## Technical Context

| 項目 | 現状 | 変更後 |
|------|------|--------|
| ワークフローステップ数 | proposal → delta → ... | proposal → visual-mock → delta → ... |
| `mspec mock` コマンド | 未実装 | `program.command('mock')` で追加 |
| HTTP サーバー | なし | `node:http` 内製（ゼロ依存） |
| CSS フレームワーク検出 | なし | `package.json` ヒューリスティック |
| HTML 生成 | なし | `mspec-visual-mock-runner` サブエージェント委譲 |
| フィードバック保存先 | なし | `changes/<change>/mock-feedback.md` |

---

## Project Structure

```
packages/cli/
├── src/
│   ├── commands/
│   │   └── mock.ts                        # 新規: mspec mock コマンド
│   ├── lib/
│   │   ├── mock-server.ts                 # 新規: node:http 静的サーバー
│   │   ├── framework-detector.ts          # 新規: CSS フレームワーク検出
│   │   └── prompt.ts                      # 修正: askMultiline() 追加
│   └── index.ts                           # 修正: program.command('mock') 追加
└── templates/
    ├── workflow.default.yaml               # 修正: visual-mock ステップ追加
    └── claude/
        ├── commands/mspec/
        │   └── mock.md                    # 新規: /mspec:mock コマンドプロンプト
        └── skills/
            ├── mspec-visual-mock/
            │   └── SKILL.md               # 新規: visual-mock ステップスキル
            └── mspec-visual-mock-runner/
                └── SKILL.md               # 新規: HTML 生成サブエージェント
```

---

## Decisions

### D-001: workflow.default.yaml への visual-mock ステップ定義

**変更内容（proposal ステップの直後に挿入）:**
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

**受け入れ基準（cli-workflow-engine FR-023 Scenario 対応）:**
- `mspec continue --change <change> --json` が `current_step: "visual-mock"` と `block_after: true` を返すこと
- `mspec skip visual-mock --change <change> --reason "..."` が実行でき、skip 後に next step へ進めること

---

### D-002: mspec mock コマンドの二重モード設計

`mspec mock --change <change>` は直接実行とワークフローステップ経由の両方で同一動作をする。

**コマンドインタフェース:**
```
mspec mock [--change <change-dir>] [--port <port>]
```

- `--change` を省略した場合は active change を自動解決（`getActiveChange()` 既存関数を流用）
- `--port` を省略した場合はデフォルト 3737 から自動インクリメント

**受け入れ基準（cli-core FR-004 Scenario 対応）:**
- proposal.md が存在する active change 上で実行すると、HTML 生成 → サーバー起動 → フィードバック収集の順で処理が進むこと
- active change が存在しない場合は `no active change found` で非ゼロ終了すること

---

### D-003: node:http 内製静的サーバー（mock-server.ts）

**API:**
```typescript
export async function startMockServer(mockDir: string, preferredPort = 3737): Promise<{ port: number; close: () => void }>
```

**ポート自動インクリメント:**
```typescript
async function findFreePort(start: number): Promise<number> {
  // EADDRINUSE 時に +1 してリトライ（最大 10 回）
}
```

**シグナルハンドリング:** `mock.ts` は `startMockServer` 呼び出し前に `process.on('SIGINT', handler)` を登録する。handler は (1) `close()` を呼んでサーバーを終了し、(2) readline の raw mode がアクティブな場合は先に解除した上で、(3) フィードバック収集フロー (D-006) に制御を移す。

**受け入れ基準（visual-mock FR-002 Scenario 対応）:**
- `http://localhost:<port>` で `mock/index.html` が返ること
- 3737 が使用中の場合に 3738 以降の空きポートで起動すること
- Ctrl+C 後にサーバーが停止し、フィードバックプロンプトが表示されること

---

### D-004: CSS フレームワーク自動検出（framework-detector.ts）

**API:**
```typescript
export type FrameworkInfo = {
  name: string;          // 'material-ui' | 'tailwind' | 'bootstrap' | 'chakra' | 'antd' | 'none'
  cdnSnippet?: string;   // CDN 挿入用 HTML 断片（framework によっては空）
  promptHint: string;    // LLM プロンプトへ渡すフレームワーク記述
}

export async function detectFramework(projectRoot: string): Promise<FrameworkInfo>
```

**検出ロジック（優先順）:**
1. `package.json` の `dependencies` / `devDependencies` を検査
2. `tailwind.config.*` の存在確認（tailwindcss の補助）
3. 未検出時は `{ name: 'none', promptHint: 'plain HTML and CSS without any framework' }`

| パッケージキー | `name` | `promptHint` |
|---------------|--------|-------------|
| `@mui/material` | `material-ui` | `Material UI (MUI) v5+ components and styling` |
| `tailwindcss` | `tailwind` | `Tailwind CSS utility classes` |
| `bootstrap` | `bootstrap` | `Bootstrap 5 classes and components` |
| `@chakra-ui/react` | `chakra` | `Chakra UI components` |
| `antd` | `antd` | `Ant Design components` |

**受け入れ基準（visual-mock FR-001 Scenario の前提条件）:**
- `@mui/material` が `package.json` に存在する場合、`promptHint` に `Material UI` が含まれること

---

### D-005: mspec-visual-mock-runner サブエージェントによる HTML 生成

**役割:** `proposal.md` + `FrameworkInfo` を受け取り、`mock/index.html` を生成して返す。

**入力コンテキスト（SKILL.md に記述）:**
- `proposal.md` の `## Goals` セクション
- `FrameworkInfo.promptHint`（フレームワーク指示）
- 既存画面の説明（オプション: `--context <description>`）

**出力:** `mock/index.html` のファイル内容（自己完結型ワンファイル HTML）。CSS・JS はすべてインライン埋め込みとする。Delta Spec FR-001 の「HTML・CSS・JS ファイル」要件はインライン化により満たす。

**受け入れ基準（visual-mock FR-001 Scenario 対応）:**
- 生成された `index.html` がブラウザで表示可能であること
- FrameworkInfo の `promptHint` がプロンプトに含まれ、フレームワーク固有のコンポーネント/クラスが使用されること

---

### D-006: mock-feedback.md の上書きと skip 時 placeholder

**フィードバック収集（prompt.ts の `ask()` を拡張）:**
```typescript
// 空行入力で収集終了するマルチライン版
export async function askMultiline(prompt: string): Promise<string>
```

**mock-feedback.md フォーマット:**
```markdown
# Mock Feedback

> Recorded: <ISO 8601 timestamp>
> Mock: changes/<change>/mock/index.html

<ユーザーが入力したフィードバック本文>
```

**skip 時の動作:** `mspec skip visual-mock` 実行時、`skip.ts` が `mock-feedback.md` に `SKIPPED_PLACEHOLDER_MARKER` を書き込む（既存 skip ロジックで対応）。

**受け入れ基準（visual-mock FR-003 Scenario 対応）:**
- Ctrl+C でサーバー停止後にフィードバックプロンプトが表示され、入力内容が `mock-feedback.md` に保存されること
- 2 回目の `mspec mock` 実行で `mock-feedback.md` が上書きされること

---

### D-007: tasks スキルへの mock-feedback.md ソフト参照

`mspec tasks` スキル（`SKILL.md`）の `## Procedure` に以下を追加:

```
Before generating tasks.md, check if changes/<change>/mock-feedback.md exists
and is not a skipped placeholder. If it exists, read its content and incorporate
the feedback as additional context when writing tasks.md.
```

`workflow.default.yaml` の tasks ステップの `requires` には追加しない（skip 時にブロックされないよう）。

**受け入れ基準（visual-mock FR-004 Scenario 対応）:**
- `mock-feedback.md` が存在する状態で `mspec tasks` を実行すると、フィードバック由来の注記が tasks.md に含まれること
- `mock-feedback.md` が skipped placeholder の場合はスキル側で無視されること

---

## Complexity Tracking

None.

---

## Constitution Check

| Principle | Phase 0 | Phase 1 |
|-----------|---------|---------|
| I  ステップ独立性 | ✅ design は research を読むのみで他の成果物を書き換えない | ✅ visual-mock ステップは独立して動作し、他ステップの成果物を書き換えない |
| II  決定論的マージ | ✅ 変更ファイル一覧が明示されている | ✅ D-001〜D-007 が実装者が LLM に依存せず作業できるレベルで具体化されている（self-review で `prompt.ts`・`mspec-tasks/SKILL.md` を変更対象リストに追加済み） |
| III  質問駆動の要件確定 | ✅ research で 3 項目、design で 2 項目の Open Choices を解決済み | ✅ 未解決の Open Choice なし |
| IV  双方向アンカー | ✅ `@mspec-delta` アンカーを冒頭に付与 | ✅ D-001〜D-007 が FR 番号の Scenario と 1:1 対応 |
| V  強制ステップと拡張ステップの分離 | ✅ visual-mock は `skippable: true` で任意ステップ | ✅ 必須ステップ（tasks, implement, archive）は変更なし |

---

## Self-Review

### Summary of Findings

4 件のイシューを検出。うち 3 件はブロッカー（実装失敗または仕様逸脱につながる可能性）、1 件は nit。すべて本セクション追記時点で修正済み。FR カバレッジと Mermaid 図の存在にブロッキングイシューなし。

---

### Findings

**blocker — FR-001 スコープ vs D-005 ワンファイル出力の不一致（修正済み）**

`specs/visual-mock/spec.md` は「HTML・CSS・JS ファイル」（複数）の生成を要求していたが、D-005 は「ワンファイル HTML」と規定しており矛盾していた。D-005 の出力説明を「自己完結型ワンファイル HTML、CSS・JS はインライン埋め込みにより FR-001 を満たす」と明示して解決。

**blocker — 変更対象リストに `prompt.ts` と `mspec-tasks/SKILL.md` が欠落（修正済み）**

D-006 が `askMultiline()` を `prompt.ts` に追加することを規定し、D-007 が `mspec-tasks/SKILL.md` の `## Procedure` 修正を規定していたにも関わらず、変更対象リスト（9・10 番）およびプロジェクト構造図に記載がなかった。両ファイルを追記して解決。

**blocker — SIGINT ハンドリングの設計決定が欠落（修正済み）**

FR-003 および architecture-overview.md のシーケンス図は「Ctrl+C でサーバー停止 → フィードバックプロンプト」フローを前提としていたが、D-003 と D-006 に `process.on('SIGINT', handler)` の登録タイミングや readline raw mode 解除に関する決定がなかった。Node.js はデフォルトで SIGINT でプロセスを即終了するため、フィードバック収集ロジックが実行されない。D-003 にシグナルハンドリング仕様を追記して解決。

**nit — quickstart.md Verify ステップ4の依存関係が未記載（修正済み）**

「tasks.md にフィードバックが反映されている」検証はワークフロー上 `delta` ステップ完了後でないと実行不可だが、前提が記載されていなかった。ステップ説明に `（delta 完了後）` を追記して解決。

**nit — system diagram に `proposal.md` 読み込みが未記載**

`architecture-overview.md` のシステムグラフは `mock.ts` が `proposal.md` を読み取ることを示していないが、シーケンス図は正しく示している。シーケンス図が正とし、system diagram の軽微な不整合として許容（実装への影響なし）。

---

### Constitution Check Phase 2

| Principle | Phase 2 Verdict | Notes |
|-----------|-----------------|-------|
| I ステップ独立性 | ✅ Pass | visual-mock は `mock/` と `mock-feedback.md` のみに書き込む。他ステップ成果物への変更なし。 |
| II 決定論的マージ | ✅ Pass | 変更対象リストに `prompt.ts`・`mspec-tasks/SKILL.md` を追記済み。実装者がリストを参照するだけで必要な編集を特定可能。 |
| III 質問駆動の要件確定 | ✅ Pass | 未解決 Open Choice なし。フィードバック収集 UI の実装選択（multiline）は D-006 に記録済み。 |
| IV 双方向アンカー | ✅ Pass | `@mspec-delta` アンカーが冒頭に付与済み。実装ファイルへのアンカー付与は implement ステップで確認。 |
| V 強制ステップと拡張ステップの分離 | ✅ Pass | `visual-mock` は `skippable: true`。6 必須ステップは変更なし。 |
