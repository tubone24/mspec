---
doc_type: Reference
---

# Design: 目的別チェンジモード（typo / minor / bugfix）

## Summary

`readme.md` に `> Mode:` フィールドを追加し、`mspec-new` スキルが説明文から AI 推定したモードを書き込む。`state-engine.ts` が起動時にモードを読んで lazy スキップを実施し、`commands/skip.ts` が force リストで bugfix 時の research スキップを拒否する。

## Goals

- typo / minor モードで proposal・quickstart を自動スキップ
- bugfix モードで proposal・quickstart をスキップし research を強制（スキップ不可）
- mspec-new スキルが説明文からモードを AI 推定・確認して readme.md に記録
- `--mode` 明示指定でも上書き可能（エスケープハッチ）
- モード未指定チェンジは既存のフルフローを維持（後方互換）

## Non-Goals

- CLI `mspec new` コマンドへの `--mode` フラグ追加
- hotfix モード
- モード変更コマンド（readme.md を直接編集することで対応）

## Technical Context

- Language / Runtime: TypeScript / Node.js 22+
- Dependencies (new): なし（gray-matter・zod・既存依存のみ）
- Storage: `readme.md`（モード記録）、`workflow.yaml`（モードルール定義）
- Testing framework: Vitest
- Target platform: Claude Code CLI（mspec-new SKILL.md）
- Performance / Constraints: `readme.md` の読み取りは O(1)。`parseMode()` は regex 1回のみ

## Constitution Check (Phase 0)

| Principle | Compliant? | Notes |
|-----------|-----------|-------|
| I. ステップ独立性 | ✅ | state-engine が毎回 readme.md を読んでモードを取得（lazy）。前段コンテキスト不要 |
| II. 決定論的マージ | ✅ | `modes:` はメタデータのみ。マージロジック（CLI パーサー）への影響なし |
| III. 質問駆動の要件確定 | ✅ | mspec-new スキルが AskUserQuestion で推定モードを確認 |
| IV. 双方向アンカー | ✅ | 実装ファイル全てに `@mspec-delta` アンカーを付与する |
| V. 強制ステップと拡張ステップの分離 | ✅ | proposal の論理スキップは `removable: false` を変更せず lazy engine スキップ（evaluateStep 内の isModeDrivenSkip() 判定）で実現。skip-log への書き込みは行わない |

## Project Structure (changes)

- 新規: `packages/cli/src/lib/readme-parser.ts` — `parseMode()` ヘルパー
- 修正: `packages/cli/src/types/workflow.ts` — `ModeRuleSchema` と `modes` フィールドを `WorkflowSchema` に追加
- 修正: `packages/cli/src/lib/state-engine.ts` — `ComputeStatusInput` に `mode?` 追加、`evaluateStep()` にモード由来 lazy スキップを追加
- 修正: `packages/cli/src/commands/continue.ts` — readme.md をパースして mode を取得し `computeStatus()` へ渡す
- 修正: `packages/cli/src/commands/skip.ts` — force チェックを追加（bugfix 時に research スキップを拒否）
- 修正: `packages/cli/templates/workflow.default.yaml` — トップレベルに `modes:` セクションを追加
- 修正: `packages/cli/templates/artifacts/readme.md` — `> Mode: <mode>` フィールドのドキュメント追加
- 修正: `packages/cli/templates/claude/skills/mspec-new/SKILL.md` — モード AI 推定・確認・記録の手順を追加

## Decisions

### readme-parser.ts を新設して parseMode() を共有

- 採用: `src/lib/readme-parser.ts` に `parseMode(content: string): string | null` を新設。`state-engine.ts`・`skip.ts`・`continue.ts` が import して使う
- 代替: 各コマンド内でインライン regex
- トレードオフ: ファイルが1つ増えるが regex ロジックの単一真実源を確保。変更箇所が1か所になり将来の拡張（`parseStatus()` 等）も容易

### モード由来スキップを lazy で evaluateStep() に差し込む

- 採用: `computeStatus()` 呼び出し前に `parseMode()` でモードを取得し、`evaluateStep()` 内で `isModeDrivenSkip(mode, step.id, modes)` を `isSkipped()` の前に評価
- 代替: `mspec new` 時に skip-log へ eager 書き込み
- トレードオフ: Lazy 方式は skip-log を汚染しない。ただし `mspec status` の出力でスキップ予定が「スキップ済み」と区別されない。将来的に `mode-skipped` 状態を追加する余地は残す

### force チェックを skip.ts の !step.skippable チェック直後に追加

- 採用: `skipCommand()` 内で `parseMode(readmeContent)` を呼び、mode が `bugfix` かつ step が `modes.bugfix.force` に含まれる場合にエラーを throw
- 代替: mspec-research SKILL.md 内でスキップを拒否
- トレードオフ: CLI 側に集約することで `mspec skip research` の直接呼び出しでも迂回不可。スキル経由と CLI 経由の両方で force が機能する

### workflow.yaml に optional な modes セクションを追加

- 採用: `WorkflowSchema` に `modes: z.record(ModeRuleSchema).optional()` を追加。既存の `workflow.yaml` が `modes:` を持たなくてもバリデーション通過
- 代替: modes を別ファイル（`.mspec/modes.yaml`）で管理
- トレードオフ: 単一ファイルで全ワークフロー設定を管理できる。`modes:` がオプションなので後方互換を維持

### lazy スキップと mspec status / upstream_skipped の整合

- 採用: `state-engine.ts` の `computeStatus()` は `isModeDrivenSkip()` で `skipped` を返すため `mspec status` はモード由来スキップを正しく `skipped` と報告する（skip-log を経由しなくても state-engine の出力がそのまま status の表示に使われるため）。`upstream_skipped[]` は `skip-log.ts` の `skippedSteps()` を参照するが、モード由来スキップは skip-log に書かれないため `upstream_skipped[]` に現れない — これは checklist の FR-015 回帰リスクとして明記済みであり、将来的に `continue.ts` が mode-driven skip を skip-log に記録する拡張で解消できる
- 代替: モード由来スキップを skip-log にも書き込む（eager + lazy の併用）
- トレードオフ: 採用案は実装が最小。ただし `upstream_skipped[]` にモード由来スキップが現れない副作用があり、downstream エージェントがスキップを認識できない可能性がある。初期バージョンでは許容しリスクを明示する

## Constitution Check (Phase 1, 計画詳細後)

| Principle | Phase 0 | Phase 1 | Notes |
|-----------|---------|---------|-------|
| I. ステップ独立性 | ✅ | ✅ | `parseMode()` は毎回 readme.md を読む。前段セッションのコンテキスト不依存 |
| II. 決定論的マージ | ✅ | ✅ | `modes:` はスキップルールのみ。`mspec archive` のマージロジックに触れない |
| III. 質問駆動の要件確定 | ✅ | ✅ | SKILL.md に AskUserQuestion による 1問確認を明記。決定根拠は readme.md に永続化 |
| IV. 双方向アンカー | ✅ | ✅ | `readme-parser.ts`・`state-engine.ts`・`skip.ts` の各実装に `@mspec-delta` アンカーを付与 |
| V. 強制ステップと拡張ステップの分離 | ✅ | ✅ | `REQUIRED_STEP_IDS` を変更しない。proposal は `removable: false` のまま、lazy engine スキップ（skip-log 非使用）で論理スキップを実現 |

### Complexity Tracking

None

## Migration Plan / Rollout

- 既存チェンジ（`> Mode:` なし）: `parseMode()` が `null` を返し、`isModeDrivenSkip()` は常に `false`。既存の動作に変化なし
- `workflow.default.yaml` に `modes:` を追加しても、既存プロジェクトが `mspec init` 済みの場合は手動での `workflow.yaml` 更新が必要（または `mspec schema upgrade` が将来的な対応先）

## Self-Review

### Findings

- **[blocker 修正済み]** FR-019 の書き込み主体の矛盾: lazy engine skip ではスキルが起動しないため、スキルが readme.md の `## Skipped Steps` を書けない設計上の矛盾があった。FR-019 を「ワークフローエンジンが書き込む」に修正し、スキルのシナリオ文言も「エンジンは…スキルは起動されない」に更新した。
- **[blocker 修正済み]** Constitution Principle V の根拠誤り: Phase 0/1 ともに「skip-log 経由で実現」と書いていたが、採用実装は lazy engine skip（skip-log 非使用）。Design の Principle V Notes と Phase 1 テーブルを修正した。
- **[blocker 修正済み]** FR-008/FR-015 との整合方針が未回答: Decisions に「lazy スキップと mspec status / upstream_skipped の整合」を追加し、`upstream_skipped[]` への非反映を既知の副作用として明示した。
- **[blocker 修正済み]** quickstart.md の Golden Path 誤り: typo モードで proposal スキップ後は「delta に直行」ではなく「research へ進む」が正しい。修正済み。
- **[nit 修正済み]** FR-018 の "front-matter ブロック" → "ブロッククォート行" に修正済み。
- **[nit 修正済み]** FR-021 の "skippable: false として扱う" → "skip コマンドをランタイムに拒否する" に修正済み。
- **[nit 修正済み]** quickstart.md に `modes:` 手動追加 YAML スニペットを追記済み。
- **[未解決 nit]** unknown モード時の警告の実装責務（`parseMode()` の呼び出し元か `evaluateStep()` 内か）は design.md では未定義。tasks.md の T011/T013 実装時に設計する。

### Constitution Re-Evaluation

| Principle | Phase 0 | Phase 1 | 再評価 |
|-----------|---------|---------|--------|
| I. ステップ独立性 | ✅ | ✅ | ✅（engine が書き込み主体に統一されたことで、前段スキル実行への依存がなくなった） |
| II. 決定論的マージ | ✅ | ✅ | ✅（変更なし） |
| III. 質問駆動の要件確定 | ✅ | ✅ | ✅（変更なし） |
| IV. 双方向アンカー | ✅ | ✅ | ✅（tasks.md 全タスクにアンカー付与済み） |
| V. 強制ステップと拡張ステップの分離 | ✅ | ✅ | ✅（根拠を lazy engine skip に修正。REQUIRED_STEP_IDS 不変を確認） |
