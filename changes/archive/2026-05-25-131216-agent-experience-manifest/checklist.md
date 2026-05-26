# Checklist: agent-experience-manifest

## Delta Spec Coverage

### agent-runner

- [x] **agent-runner FR-001**: subagent 完了後に `changes/<change>/.agent-runs.jsonl` へ JSONL エントリが 1 行追記される (`mspec agent-run record` コマンドが正常動作する) <!-- verify: fr-001 -->
- [x] **agent-runner FR-001**: change ディレクトリが特定できない場合はログ追記をスキップし exit 0 で返る（subagent 実行結果に影響しない） <!-- verify: fr-001 -->
- [x] **agent-runner FR-002**: ログエントリに `step`, `change`, `started_at`, `context_size_bytes`, `context_size_tokens`(null), `required_artifacts`, `review_edits_count` が含まれる <!-- verify: fr-002 -->
- [x] **agent-runner FR-002**: 通常ステップのエントリで `review_edits_count` が `null` になる <!-- verify: fr-002 -->
- [x] **agent-runner FR-002**: self-review ステップのエントリで `review_edits_count` に 0 以上の整数値が記録される <!-- verify: fr-002 -->
- [ ] **agent-runner FR-003**: プロンプト本文・secrets・環境変数・認証情報・API キーが `.agent-runs.jsonl` に書き出されないこと（`sanitizeEntry()` + TypeScript 型による二重防御を確認） <!-- verify: human -->
- [ ] **agent-runner FR-003**: `.agent-runs.jsonl` の各エントリのキーが許可リスト（`step`, `started_at`, `context_size_bytes`, `context_size_tokens`, `required_artifacts`, `review_edits_count` 相当）のみに限定される <!-- verify: human -->

> **注記 (skill-observability FR-001, FR-002)**: 両 FR は `risk_tier: trivial` のため、checklist 項目を生成しない（verify-routing FR-003 に従いスキップ）。

---

## Source-of-Truth Regression

### [RISK-001] ~~agent-runner FR-002 フィールド名の不一致~~ — 解決済み
- [x] Delta Spec FR-002 のフィールド名を design.md の `AgentRunEntry` 型に合わせて修正済み（`context_size_bytes`, `context_size_tokens`, `review_edits_count`）<!-- verify: human -->

### [RISK-002] ~~skill-observability FR-001 対象スコープの不一致~~ — 解決済み
- [x] Delta Spec FR-001 のシナリオを `workflow.yaml` の `subagent: true` ステップ（3 スキル: research / checklist / self-review）に合わせて修正済み <!-- verify: human -->

### [RISK-003] cli-core FR-001 — 新コマンドのコロン形式
- [ ] 新設する `mspec agent-run record` サブコマンドを参照する文字列（CLI 出力メッセージ・テンプレート・ソースリテラル）がハイフン形式（`mspec-agent-run` 等）になっていないことを確認する（`cli-core` FR-001 違反回避） <!-- verify: human -->

### [RISK-004] claude-integration FR-002 — SKILL.md 構造の保全
- [ ] `## Observation (Agent Experience Log)` セクションを各 SKILL.md に追記した後も、YAML frontmatter (`name`, `description`, `when_to_use`) および `## Procedure` H2 見出しが失われていないことを確認する（`claude-integration` FR-002 違反回避） <!-- verify: human -->

### [RISK-005] claude-integration FR-003 — Procedure 先頭の順序
- [ ] 追記した `## Observation` セクションが `## Procedure` の番号付きリスト 1 番目（`mspec status --json` 実行）より **後** に位置しており、Procedure の実行順序を変えていないことを確認する（`claude-integration` FR-003 違反回避） <!-- verify: human -->

### [RISK-006] claude-integration FR-006 — Skill はロジックを CLI に委譲
- [ ] `## Observation` セクションに記載されたログ記録手順が `mspec agent-run record` CLI コマンド呼び出しとして記述されており、SKILL.md 内に JSONL 書き込みロジックを直接実装していないことを確認する（`claude-integration` FR-006 違反回避） <!-- verify: human -->

### [RISK-007] claude-integration FR-017 — スキルファイル内のコロン形式
- [ ] `## Observation` セクション内のコマンド例に `mspec-<step>` 等のハイフン形式が含まれていないことを確認する（`claude-integration` FR-017 違反回避） <!-- verify: human -->

---

## Constitution

- [ ] **原則 I: ステップ独立性** — `agent-run record` は各 step 完了後の独立した副作用として設計されており、既存ステップ間の依存関係を増やしていないことを `design.md` Constitution Check (Phase 1) で確認する <!-- verify: human -->
- [ ] **原則 II: 決定論的マージ** — `.agent-runs.jsonl` は `mspec archive` の SoT spec マージ対象外であり、アーカイブ移動のみに留まることを `design.md` Constitution Check (Phase 1) で確認する <!-- verify: human -->
- [ ] **原則 III: 質問駆動の要件確定** — 全 Open Choices が proposal + research + design ステップで確定済みであり、実装者が根拠を追跡できる状態になっていることを確認する <!-- verify: human -->
- [ ] **原則 IV: 双方向アンカー** — 新規ファイル (`agent-run.ts`, `agent-run-log.ts`) および E2E テストに `@mspec-delta` アンカーが付与され、`mspec anchor check` で整合性が確認できることを確認する <!-- verify: human -->
- [ ] **原則 V: 強制ステップと拡張ステップの分離** — `agent-run record` はワークフローステップ外の補助コマンドであり `workflow.yaml` に変更がないことを確認する <!-- verify: human -->
- [ ] **原則 VI: Security by Default** — `AgentRunEntry` TypeScript 型 + `sanitizeEntry()` の二重防御により、プロンプト本文・secrets が構造的に記録不可になっていることを `design.md` Constitution Check (Phase 1) および FR-003 実装レビューで確認する <!-- verify: human -->
