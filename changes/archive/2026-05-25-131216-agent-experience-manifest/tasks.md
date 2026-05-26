---
doc_type: Reference
---

# Tasks: agent-experience-manifest

## Phase 1: Setup

- [x] T001 [P] `agent-run-log.ts` / `agent-run.ts` 用ディレクトリ確認 — 既存の `src/lib/` と `src/commands/` に追加するだけのため新規ディレクトリ不要。vitest の設定と `index.ts` のインポート構造を確認する — files: `packages/cli/src/index.ts`

## Phase 2: Foundational

- [x] T010 `packages/cli/src/lib/agent-run-log.ts` を実装する — `AgentRunEntry` インターフェース定義・`appendAgentRun()` 関数・`sanitizeEntry()` 許可リスト関数を実装。`done-log.ts` の `mkdir recursive + appendFile` パターンを踏襲する — files: `packages/cli/src/lib/agent-run-log.ts`
      anchor:
        @mspec-delta 2026-05-25-131216-agent-experience-manifest/specs/agent-runner/spec.md
        Requirements implemented: FR-001, FR-002, FR-003
        Change: agent-experience-manifest

## Phase 3: User Story 1 — ロガーコア（agent-runner FR-001, FR-002）

### Tests-first (E2E)

- [x] T101 E2E: FR-001 "正常な subagent 実行後のログ追記" — `mspec agent-run record --step research --change <name> --bytes 100 --artifacts proposal.md` を実行後、`.agent-runs.jsonl` に 1 行追記されることを検証 — files: `packages/cli/src/__tests__/agent-run.test.ts` <!-- verify: fr-001 -->
      anchor:
        @mspec-delta 2026-05-25-131216-agent-experience-manifest/specs/agent-runner/spec.md
        Requirements implemented: FR-001
        Change: agent-experience-manifest

- [x] T102 E2E: FR-001 "change ディレクトリが存在しない場合のフォールバック" — 存在しない change 名を指定した場合に exit 0 で終了し、JSONL ファイルが生成されないことを検証 — files: `packages/cli/src/__tests__/agent-run.test.ts` <!-- verify: fr-001 -->
      anchor:
        @mspec-delta 2026-05-25-131216-agent-experience-manifest/specs/agent-runner/spec.md
        Requirements implemented: FR-001
        Change: agent-experience-manifest

- [x] T103 E2E: FR-002 "通常ステップのログエントリ（スキーマ検証）" — 生成された JSONL エントリに `step`, `change`, `started_at`, `context_size_bytes`, `context_size_tokens: null`, `required_artifacts`, `review_edits_count: null` の 7 フィールドが存在することを検証 — files: `packages/cli/src/__tests__/agent-run.test.ts` <!-- verify: fr-002 -->
      anchor:
        @mspec-delta 2026-05-25-131216-agent-experience-manifest/specs/agent-runner/spec.md
        Requirements implemented: FR-002
        Change: agent-experience-manifest

- [x] T104 E2E: FR-002 "self-review ステップのログエントリ（review_edits_count）" — `--step self-review --edits 3` で実行後、`review_edits_count: 3` が記録されることを検証 — files: `packages/cli/src/__tests__/agent-run.test.ts` <!-- verify: fr-002 -->
      anchor:
        @mspec-delta 2026-05-25-131216-agent-experience-manifest/specs/agent-runner/spec.md
        Requirements implemented: FR-002
        Change: agent-experience-manifest

### Implementation

- [x] T105 `packages/cli/src/commands/agent-run.ts` を実装する — `mspec agent-run record` コマンド本体。`--step`, `--change`, `--bytes`, `--artifacts`, `--edits` オプションを受け取り `agent-run-log.ts` の `appendAgentRun()` を呼び出す。change ディレクトリが不明の場合は graceful skip — files: `packages/cli/src/commands/agent-run.ts` <!-- verify: fr-001 -->
      anchor:
        @mspec-delta 2026-05-25-131216-agent-experience-manifest/specs/agent-runner/spec.md
        Requirements implemented: FR-001, FR-002
        Change: agent-experience-manifest

- [x] T106 `packages/cli/src/index.ts` に `agent-run record` サブコマンドを登録する — `skipCommand` / `doneCommand` と同パターンでインポートし `.command('agent-run record')` として登録 — files: `packages/cli/src/index.ts` <!-- verify: fr-001 -->
      anchor:
        @mspec-delta 2026-05-25-131216-agent-experience-manifest/specs/agent-runner/spec.md
        Requirements implemented: FR-001
        Change: agent-experience-manifest

## Phase 3: User Story 2 — ログ sanitization（agent-runner FR-003, critical）

### Tests-first (E2E)

- [x] T201 E2E: FR-003 "機密情報を含む入力の sanitize" — `appendAgentRun()` にプロンプト本文・環境変数・secrets を含む任意フィールドを渡した場合、`.agent-runs.jsonl` には含まれないことを単体テストで検証。**human review 必須：FR-003 は MUST NOT（risk_tier: critical）** — files: `packages/cli/src/__tests__/agent-run-log.test.ts` <!-- verify: human -->
      anchor:
        @mspec-delta 2026-05-25-131216-agent-experience-manifest/specs/agent-runner/spec.md
        Requirements implemented: FR-003
        Change: agent-experience-manifest

- [x] T202 E2E: FR-003 "許可されたフィールドのみ出力" — `sanitizeEntry()` に許可外フィールドを含むオブジェクトを渡した場合、出力が 7 フィールド（`step`, `change`, `started_at`, `context_size_bytes`, `context_size_tokens`, `required_artifacts`, `review_edits_count`）のみになることを検証。**human review 必須** — files: `packages/cli/src/__tests__/agent-run-log.test.ts` <!-- verify: human -->
      anchor:
        @mspec-delta 2026-05-25-131216-agent-experience-manifest/specs/agent-runner/spec.md
        Requirements implemented: FR-003
        Change: agent-experience-manifest

### Implementation

- [x] T203 `agent-run-log.ts` の `sanitizeEntry()` 関数を確認・強化する — TypeScript 型 + 許可リスト配列チェックの二重防御を確認。許可リスト: `['step', 'change', 'started_at', 'context_size_bytes', 'context_size_tokens', 'required_artifacts', 'review_edits_count']` — files: `packages/cli/src/lib/agent-run-log.ts` <!-- verify: human -->
      anchor:
        @mspec-delta 2026-05-25-131216-agent-experience-manifest/specs/agent-runner/spec.md
        Requirements implemented: FR-003
        Change: agent-experience-manifest

## Phase 4: Polish — SKILL.md 観測義務追記（skill-observability FR-001, FR-002）

- [x] T301 `.claude/skills/mspec-research/SKILL.md` に `## Observation (Agent Experience Log)` セクションを追記する — 記録タイミング（subagent 完了後）・記録先パス・`mspec agent-run record` コマンド例を明記 — files: `.claude/skills/mspec-research/SKILL.md`
      anchor:
        @mspec-delta 2026-05-25-131216-agent-experience-manifest/specs/skill-observability/spec.md
        Requirements implemented: FR-001, FR-002
        Change: agent-experience-manifest

- [x] T302 `.claude/skills/mspec-checklist/SKILL.md` に `## Observation (Agent Experience Log)` セクションを追記する — T301 と同形式 — files: `.claude/skills/mspec-checklist/SKILL.md`
      anchor:
        @mspec-delta 2026-05-25-131216-agent-experience-manifest/specs/skill-observability/spec.md
        Requirements implemented: FR-001, FR-002
        Change: agent-experience-manifest

- [x] T303 `.claude/skills/mspec-review/SKILL.md` に `## Observation (Agent Experience Log)` セクションを追記する — T301 と同形式 + `--edits <count-of-[blocker]-lines>` オプションの説明を追加 — files: `.claude/skills/mspec-review/SKILL.md`
      anchor:
        @mspec-delta 2026-05-25-131216-agent-experience-manifest/specs/skill-observability/spec.md
        Requirements implemented: FR-001, FR-002
        Change: agent-experience-manifest

- [x] T304 `context_size_bytes` の計算検証タスク（self-review warning 対応） — `mspec agent-run record --bytes` に渡す値が required_artifacts の実際のファイルサイズの合計バイト数と等しいことを確認する integration test または E2E 検証手順を追加する — files: `packages/cli/src/__tests__/agent-run.test.ts` <!-- verify: fr-002 -->
      anchor:
        @mspec-delta 2026-05-25-131216-agent-experience-manifest/specs/agent-runner/spec.md
        Requirements implemented: FR-002
        Change: agent-experience-manifest

## Dependencies

- T010 blocks T105, T203
- T101 blocks T105
- T102 blocks T105
- T103 blocks T105
- T104 blocks T105
- T105 blocks T106
- T201 blocks T203
- T202 blocks T203
- T106 blocks T301, T302, T303

## Constitution Check

> Step: tasks | Constitution Version: 1.1.0

| Principle | Phase 0 | Phase 1 | Notes |
|-----------|---------|---------|-------|
| I. ステップ独立性 | ✅ | — | 各タスクは独立して完了可能。T010→T105→T106 の順序は Dependencies で明示 |
| II. 決定論的マージ | ✅ | — | `.agent-runs.jsonl` は SoT spec マージ対象外。archive 移動のみ |
| III. 質問駆動の要件確定 | ✅ | — | 全 Open Choices が design ステップで確定済み。未解決事項なし |
| IV. 双方向アンカー | ✅ | — | 全実装・E2E タスクに `@mspec-delta` アンカーブロックを付与 |
| V. 強制ステップと拡張ステップの分離 | ✅ | — | workflow ステップ追加なし。補助 CLI コマンドのみ |
| VI. Security by Default | ✅ | — | FR-003（critical）タスク T201/T202/T203 に `<!-- verify: human -->` を付与。人間レビューを強制 |

### Complexity Tracking

None
