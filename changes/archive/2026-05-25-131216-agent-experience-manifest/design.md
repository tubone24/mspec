---
doc_type: Reference
---

<!-- See also: ./design-rationale.md for 採用理由・代替案 -->

# Design: agent-experience-manifest

## Summary

`mspec agent-run record` CLI サブコマンドを新設し、subagent 呼び出しのメタデータ（context_size_bytes・required_artifacts・review_edits_count・started_at）を `changes/<change>/.agent-runs.jsonl` に JSONL 形式で追記する。research / checklist / self-review の 3 SKILL.md にサブコマンド呼び出し手順を追記することで、全 subagent ステップのログを観測可能にする。

## Goals

- `mspec agent-run record` コマンドで `changes/<change>/.agent-runs.jsonl` に JSONL エントリを追記する
- `AgentRunEntry` スキーマを TypeScript で型定義し、許可フィールドのみ記録する（数値メタデータ・artifact パス・step 名・タイムスタンプ）
- research / checklist / self-review の 3 SKILL.md にログ記録手順を追記する
- `review_edits_count` は self-review の `[blocker]` 行数でカウントする
- `context_size_bytes` は required_artifacts の合計バイト数で代用する（`context_size_tokens` は常に `null`）

## Non-Goals

- リアルタイムモニタリングや可視化 UI
- 自動アラート・通知
- 外部サービス連携（DataDog 等）
- `mspec stats` 等のログ集計コマンド

## Technical Context

- Language / Runtime: TypeScript / Node.js 18+
- Dependencies (new): なし（`node:fs/promises` のみ使用）
- Storage: `changes/<change>/.agent-runs.jsonl`（追記専用 JSONL）
- Testing framework: vitest
- Target platform: Node.js CLI（mspec パッケージ）
- Performance / Constraints: single-process append-only、ロック機構不要

## Constitution Check (Phase 0)

| Principle | Compliant? | Notes |
|-----------|-----------|-------|
| I. ステップ独立性 | ✅ | ログ追記は各 step の subagent 完了後に独立して行う |
| II. 決定論的マージ | ✅ | `.agent-runs.jsonl` は SoT spec へのマージ対象外 |
| III. 質問駆動の要件確定 | ✅ | proposal + research + design で全 Open Choices を確定 |
| IV. 双方向アンカー | ✅ | アンカー構造は変更しない |
| V. 強制ステップと拡張ステップの分離 | ✅ | 新ステップ追加なし。補助 CLI コマンドのみ |
| VI. Security by Default | ✅ | `AgentRunEntry` 型が 7 許可フィールドのみを定義（`change` を含む閉じたリスト）。プロンプト本文・secrets は構造的に記録不可。proposal の ⚠️ から ✅ に昇格：TypeScript 型固定 + `sanitizeEntry()` の二重防御を設計に明示したため |

## Project Structure (changes)

- 新規: `packages/cli/src/commands/agent-run.ts` — `mspec agent-run record` コマンド実装
- 新規: `packages/cli/src/lib/agent-run-log.ts` — JSONL 書き込みライブラリ（`done-log.ts` と同パターン）
- 修正: `packages/cli/src/index.ts` — `agent-run record` サブコマンドを登録
- 修正: `.claude/skills/mspec-research/SKILL.md` — Procedure 末尾にログ記録手順を追記
- 修正: `.claude/skills/mspec-checklist/SKILL.md` — 同上
- 修正: `.claude/skills/mspec-review/SKILL.md` — 同上（`--edits <blocker_count>` オプション追加）

## Decisions

### AgentRunEntry スキーマ

```typescript
export interface AgentRunEntry {
  step: string;                      // mspec step id (e.g., "research")
  change: string;                    // change name (e.g., "2026-05-25-...") — FR-003 許可フィールド
  started_at: string;                // ISO 8601（コマンド呼び出し時点）
  context_size_bytes: number | null; // required_artifacts の合計バイト数（--bytes 引数から取得）
  context_size_tokens: null;         // 常に null（Task tool では取得不可）
  required_artifacts: string[];      // 入力 artifact の相対パスリスト
  review_edits_count: number | null; // [blocker] 行数（self-review のみ、他は null）
}
```

受け入れ基準：
- `agent-runner/FR-002 Scenario: 通常ステップのログエントリ` — `context_size_tokens` は `null`、`review_edits_count` は `null`
- `agent-runner/FR-002 Scenario: self-review ステップのログエントリ` — `review_edits_count` に整数値が記録される

### `mspec agent-run record` CLI インターフェース

```
mspec agent-run record
  --step <step-id>           # 必須: research / checklist / self-review
  [--change <name>]          # 省略時: アクティブな唯一の change を自動検出
  [--bytes <N>]              # 任意: required_artifacts の合計バイト数 → context_size_bytes フィールドに記録
  [--artifacts <p1> ...]     # 任意: artifact パスリスト（スペース区切り）
  [--edits <N>]              # 任意: self-review の [blocker] 行数
```

受け入れ基準：
- `agent-runner/FR-001 Scenario: 正常な subagent 実行後のログ追記` — コマンド実行後 `.agent-runs.jsonl` に 1 行追加
- `agent-runner/FR-001 Scenario: change ディレクトリが存在しない場合のフォールバック` — ログをスキップし exit 0 で返る

### SKILL.md 観測義務の追記形式

各 subagent SKILL.md の Procedure 末尾に `## Observation (Agent Experience Log)` セクションを追記する：

```markdown
## Observation (Agent Experience Log)

After the subagent completes, record the run:

\`\`\`bash
mspec agent-run record \
  --step <this-step-id> \
  --change <change-name> \
  --bytes <sum-of-input-artifact-bytes> \
  --artifacts <space-separated-artifact-paths>
\`\`\`

self-review の場合は `--edits <count-of-[blocker]-lines>` を追加する。
```

受け入れ基準：
- `skill-observability/FR-001 Scenario: SKILL.md への観測義務記述` — 観測義務セクションが存在する
- `skill-observability/FR-002 Scenario: 観測手順の最小構成` — 記録先パスと記録項目が明示されている

### sanitize ロジック（`agent-run-log.ts`）

`AgentRunEntry` の TypeScript 型によってコンパイル時に許可フィールドのみ記録可能。追加実行時 sanitize として `sanitizeEntry()` 関数でフィールド名の許可リストチェックを行う。

受け入れ基準：
- `agent-runner/FR-003 Scenario: 機密情報を含む入力の sanitize` — プロンプト本文はログに含まれない
- `agent-runner/FR-003 Scenario: 許可されたフィールドのみ出力` — エントリのキーは定義済み 7 フィールドのみ

## Constitution Check (Phase 1, 計画詳細後)

| Principle | Phase 0 | Phase 1 | Notes |
|-----------|---------|---------|-------|
| I. ステップ独立性 | ✅ | ✅ | `agent-run record` は各 step 完了後の独立した副作用。既存 step の依存関係に変更なし |
| II. 決定論的マージ | ✅ | ✅ | `.agent-runs.jsonl` は `mspec archive` で一緒に移動するが SoT spec マージ対象外 |
| III. 質問駆動の要件確定 | ✅ | ✅ | 全 Open Choices をdesign ステップで確定。引き継ぎ事項なし |
| IV. 双方向アンカー | ✅ | ✅ | 新規ファイルに `@mspec-delta` アンカーを付与。既存アンカー構造は変更しない |
| V. 強制ステップと拡張ステップの分離 | ✅ | ✅ | `agent-run record` はワークフローステップ外の補助コマンド。workflow.yaml 変更なし |
| VI. Security by Default | ✅ | ✅ | `AgentRunEntry` 型 + `sanitizeEntry()` の二重防御。FR-003 の `MUST NOT` 要件を実装レベルで強制 |

### Complexity Tracking

None

## Migration Plan / Rollout

1. `agent-run-log.ts` を実装・単体テスト（`done-log.ts` パターンを踏襲）
2. `agent-run.ts` CLI コマンドを実装
3. `index.ts` に `agent-run record` サブコマンドを登録
4. 3 つの SKILL.md に `## Observation` セクションを追記
5. E2E: 全 subagent ステップ完了後に `.agent-runs.jsonl` が生成されることを確認

## Self-Review

### Findings

**[blocker] `change` フィールドが Delta Spec FR-002 の許可リストと不整合** → **解決済み**

`AgentRunEntry` に `change: string` フィールドが存在したが、Delta Spec `agent-runner/FR-003` の許可リストに含まれていなかった。FR-003（risk_tier: critical / MUST NOT）の許可フィールドリストは閉じたセットである必要があるため、FR-002・FR-003 両方に `change` を追加して解消した。

---

**[warning] checklist の FR-002 項目に旧フィールド名の括弧書きが残存** → **解決済み**

RISK-001 解消後も `context_size_bytes`(`context_size`)・`review_edits_count`(`self_review_fix_count`) の括弧付き表記が checklist に残っていた。削除済み。

---

**[warning] `--bytes` パラメータ名と `context_size_bytes` フィールド名の対応が不明確** → **解決済み**

CLI インターフェースの `--bytes <N>` コメントに `→ context_size_bytes フィールドに記録` の対応付けを追記済み。

---

**[warning] `context_size_bytes` の計算方法にテストシナリオが欠落**

checklist・Delta Spec に「`context_size_bytes` が required_artifacts の実際のファイルサイズの合計バイト数と等しい」ことを検証するシナリオが存在しない。tasks.md のE2Eタスクで検証手順を明記すること。

---

**[warning] ER ダイアグラムが非標準の Mermaid 型を使用**

`architecture-overview.md` の ER 図で `int_or_null`・`string_array` という Mermaid 標準外の型名を使用している。機能上の問題はないが、`int`・`string` 等の標準型への置き換えを tasks.md の任意タスクとして検討すること。

---

**[info] mspec-review SKILL.md への観測義務追記は循環依存ではない**

`mspec agent-run record` は CLI サイドエフェクトであり、self-review サブエージェントを再帰的に起動しない。循環依存は発生しない（確認済み）。

### Constitution Re-Evaluation

| 原則 | Phase 0 | Phase 1 | 判定 |
|------|---------|---------|------|
| I. ステップ独立性 | ✅ | ✅ | 一致 |
| II. 決定論的マージ | ✅ | ✅ | 一致 |
| III. 質問駆動の要件確定 | ✅ | ✅ | 一致 |
| IV. 双方向アンカー | ✅ | ✅ | 一致 |
| V. 強制ステップと拡張ステップの分離 | ✅ | ✅ | 一致 |
| VI. Security by Default | ✅ | ✅ | 修正後一致（`change` フィールドを FR-003 許可リストに追加） |

### Verdict

**PASS WITH NOTES** — [blocker] を解消済み。残る [warning] は tasks.md の E2E 検証タスクで対処すること。
