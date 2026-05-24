---
doc_type: Reference
---

<!-- See also: ./design-rationale.md for採用理由・代替案 -->

# Design: rename-visual-mock-to-prototype

## Summary

`/mspec:mock` コマンド・スキル・関連ファイル群を `prototype` / `visual-prototype` に統一改名し、`mspec init` 実行時に `mspec-visual-prototype-runner` サブエージェントを `.claude/agents/` へ自動インストールする。内部 step id `visual-mock` は変更せず、外向き API（コマンド名・スキル名）のみを変更して後方互換を維持する。

## Technical Context

| 層 | 現状 | 変更後 |
|----|------|--------|
| CLI コマンド | `mspec mock` | `mspec prototype` |
| コマンド登録ファイル | `src/index.ts` の `program.command('mock')` | `program.command('prototype')` |
| コマンド実装 | `src/commands/mock.ts` / `mockCommand()` | `src/commands/prototype.ts` / `prototypeCommand()` |
| サーバー実装 | `src/lib/mock-server.ts` / `startMockServer()` | `src/lib/prototype-server.ts` / `startPrototypeServer()` |
| 出力ディレクトリ | `changes/<change>/mock/` | `changes/<change>/prototype/` |
| フィードバックファイル | `mock-feedback.md` | `prototype-feedback.md` |
| スキルディレクトリ | `.claude/skills/mspec-visual-mock/` | `.claude/skills/mspec-visual-prototype/` |
| スキルコマンド | `.claude/commands/mspec/mock.md` | `.claude/commands/mspec/prototype.md` |
| サブエージェント | `mspec-visual-mock-runner`（skills 配置） | `mspec-visual-prototype-runner`（agents 配置） |
| step id（内部） | `visual-mock` | `visual-mock`（変更なし） |

## Project Structure

### 変更対象ファイル一覧

```
packages/cli/src/
  index.ts                          # command('mock') → command('prototype')
  commands/
    mock.ts                         # → prototype.ts にリネーム
  lib/
    mock-server.ts                  # → prototype-server.ts にリネーム
  commands/continue.ts              # mapSubagentName() に case 追加

packages/cli/templates/
  claude/
    commands/mspec/
      mock.md                       # → prototype.md にリネーム
    skills/
      mspec-visual-mock/SKILL.md    # → mspec-visual-prototype/ にリネーム
      mspec-visual-mock-runner/     # 削除（agents へ昇格）
    agents/
      mspec-visual-prototype-runner.md  # 新規追加

.claude/
  skills/
    mspec-visual-mock/SKILL.md     # → mspec-visual-prototype/ にリネーム
    mspec-visual-mock-runner/      # 削除
  agents/
    mspec-visual-prototype-runner.md  # 新規追加

packages/cli/templates/
  workflow.default.yaml             # command:/mspec:mock → /mspec:prototype, skill:mspec-visual-mock → mspec-visual-prototype, produces:[mock-feedback.md] → [prototype-feedback.md]

packages/cli/tests/e2e/
  mock-command.e2e.test.ts         # 参照を prototype に更新（ファイル名はリネームしない）
  mock-generation.e2e.test.ts      # 参照を prototype に更新（ファイル名はリネームしない）
  tasks-feedback.e2e.test.ts       # mock-feedback.md → prototype-feedback.md
  workflow-visual-mock.e2e.test.ts # skill 名参照のみ更新（ファイル名はリネームしない）
```

### D-005: E2E テストファイルはリネームしない

**受け入れ基準**：  
`mock-command.e2e.test.ts` / `mock-generation.e2e.test.ts` / `workflow-visual-mock.e2e.test.ts` はファイル名を変更せず、内部の文字列参照のみ `prototype` に更新する。テストファイルのリネームは git 履歴の断絶やCIレポートの混乱を招くため行わない。

### `mapSubagentName()` 修正（`continue.ts:208`）

```typescript
function mapSubagentName(stepId: string): string {
  switch (stepId) {
    case 'research':    return 'mspec-researcher';
    case 'self-review': return 'mspec-self-reviewer';
    case 'checklist':   return 'mspec-checklist-auditor';
    case 'visual-mock': return 'mspec-visual-prototype-runner'; // ← 追加
    default:            return `mspec-${stepId}-runner`;
  }
}
```

### `mspec-visual-prototype-runner.md` の配置先

`packages/cli/templates/claude/agents/` に追加する。`init.ts` の 228–238 行にある agents コピーロジックがそのままインストールを行う（追加実装不要）。

## Decisions

### D-001: step id `visual-mock` を変更しない

**受け入れ基準**（FR-005 Scenario に対応）：  
`/mspec:prototype` を実行したとき `mspec-visual-prototype` スキルが起動し Visual Prototype ステップが開始される。step id `visual-mock` のまま状態管理が正常に機能し、既存 change の done/skip ログが壊れない。

### D-002: `mock-server.ts` → `prototype-server.ts` にリネーム

**受け入れ基準**（FR-002 Scenario に対応）：  
`mspec prototype` 実行後、`Serving prototype at http://localhost:3737` のメッセージが表示され、ブラウザでアクセスできる。

### D-003: `mspec-visual-mock-runner` を skills から agents に昇格

**受け入れ基準**（cli-init-command FR-004 Scenario に対応）：  
`mspec init` 実行後、`.claude/agents/mspec-visual-prototype-runner.md` が生成され、`mspec prototype` コマンドからサブエージェントが呼び出し可能になる。既存ファイルがある場合は上書きされる。

### D-004: 旧コマンド `mspec mock` / `/mspec:mock` を削除（エイリアスなし）

**受け入れ基準**：  
`mspec mock` を実行すると "unknown command" エラーが表示される。後方互換コードが残らない。

## Constitution Check

| Principle | Phase 0 | Phase 1 |
|-----------|---------|---------|
| I  ステップ独立性 | ✅ design は research.md のみを読み、他ステップ成果物を変更しない | ✅ design.md と関連ファイルは `changes/` 以下にのみ配置される |
| II  決定論的マージ | ✅ archive コマンドによる SoT spec マージに衝突なし | ✅ FR-NNN 番号は unique（FR-005 / FR-004 とも既存と重複なし） |
| III  質問駆動の要件確定 | ✅ エイリアス有無・関数名リネームをユーザー確認済み | ✅ 残未解決事項なし |
| IV  双方向アンカー | ✅ Delta Spec に `@mspec-delta` アンカーを持つ | ✅ 実装タスクは Delta Spec FR-NNN に対応付けられる予定 |
| V  強制ステップと拡張ステップの分離 | ✅ visual-mock は任意ステップ (`skippable: true`) | ✅ 必須ステップ（new/delta/checklist/tasks/implement/archive）に影響しない |

### Complexity Tracking

None

## Self-Review

### Review Summary

設計はチェックリスト・design.md・architecture-overview.md 間で概ね一貫している。全 ADDED 要件にシナリオが付き、Constitution Check テーブルは Phase 0/1 で完備。FR-004（cli-init-command）番号は既存 SoT と衝突しない。Self-Review により `workflow.default.yaml` の記載漏れを検出し、design.md と checklist.md に追記済み。

### Findings

- **[blocker → 解決済み] `workflow.default.yaml` が変更対象ファイル一覧から漏れていた** — `command: /mspec:prototype`, `skill: mspec-visual-prototype`, `produces: [prototype-feedback.md]` への更新が必要。design.md の Project Structure と checklist.md の回帰リスク欄に追記した。
- **[nit → 解決済み] E2E テストファイルのリネーム方針が未明示** — D-005 を追加してファイル名はリネームしない（内容のみ更新）と明記した。
- **[nit] `.claude/commands/mspec/mock.md`（ライブインストール済み）の扱い** — design.md の Project Structure はテンプレートパスのみ記載しているが、現在稼働中の `.claude/commands/mspec/mock.md` も削除対象。tasks ステップで対象ファイルとして明示すること。

### Constitution Check Assessment

| Principle | Phase 0 Verdict | Phase 1 Verdict | Assessment |
|-----------|-----------------|-----------------|------------|
| I  ステップ独立性 | ✅ | ✅ | `step id: visual-mock` を保持、`mapSubagentName()` 1か所の追加のみで既存ステップに副作用なし |
| II  決定論的マージ | ✅ | ✅ | FR-005 (visual-mock) / FR-004 (cli-init-command) とも既存 SoT の FR 番号と衝突なし |
| III  質問駆動の要件確定 | ✅ | ✅ | エイリアス削除・関数名リネーム・step id 保持はユーザー確認済み（D-001〜D-005）|
| IV  双方向アンカー | ✅ | ✅ | Delta Spec アンカー確認済み。実装ファイルへの `@mspec-delta` アンカーは tasks/implement ステップで検証 |
| V  強制ステップと拡張ステップの分離 | ✅ | ✅ | `visual-mock` は `skippable: true` の任意ステップ。必須ステップ定義に影響なし |

### Verdict

**PASS-WITH-NOTES** — ブロッカー（`workflow.default.yaml` 漏れ）は self-review 内で解決済み。残 nit（ライブ `.claude/commands/mspec/mock.md`）は tasks ステップで対象ファイルとして明記すること。設計は tasks/implement ステップに進行可能。
