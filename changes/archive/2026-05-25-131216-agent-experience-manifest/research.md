---
doc_type: Reference
---

# Research: agent-experience-manifest

## Decisions

| 論点 | 採用案 | 代替案 | 根拠 |
|------|--------|--------|------|
| ログ書き込み実行主体 | **(a) CLI サブコマンド `mspec agent-run record`** | (b) SKILL.md インライン Write 指示 / (c) `continue.ts` フック | `subagent/runner.ts` は存在しない。subagent は SKILL.md の Task tool 経由で Claude Code が実行。CLI プロセスからはサブエージェントの起動・完了を観測できない。CLI サブコマンド案は TypeScript でテスト可能かつ SKILL.md 手順との分離が明確 |
| ログ出力形式 | JSONL (1 行 1 エントリ) | 単一 JSON ファイル / CSV | JSONL は追記専用 (`fs.appendFile`) でパース簡単・行単位ストリーミング可能。既存 `done-log.ts` / `skip-log.ts` と整合しつつ完了時の全体上書き不要 |
| ログ配置場所 | `changes/<change>/.agent-runs.jsonl` | `.mspec/cache/agent-runs.jsonl`（プロジェクト横断） | per-change スコープで archive 時の locality が確保される。change 単位の計測なので `changes/` 内が適切 |
| archive 時の `.agent-runs.jsonl` 移動 | **archive と一緒に `changes/archive/<change>/` へ移動** | `.mspec/cache/` に別管理 | change の履歴とログを一体で保存。`git` 管理下に収まる |
| ログ対象ステップ | subagent フラグ付きステップのみ（research / self-review / checklist） | 全ステップ | `workflow.yaml` で `subagent: true` が設定されているステップのみ実際の subagent 呼び出しが発生。`continue.ts:212-223` の `mapSubagentName` 参照 |
| 記録フィールド（許可） | `step`, `change`, `started_at`, `ended_at`, `input_artifacts[]`, `context_size_tokens`, `review_edits_count`, `severity_counts` | — | 数値メタデータのみ。プロンプト本文・ファイル内容・ユーザーメッセージは禁止 |
| 記録フィールド（禁止） | `prompt_body`, `file_contents`, `user_messages`, `secrets`, `env_vars` | — | OWASP LLM07 (System Prompt Leakage) / SEC-003 対応。sanitize は設計ステップで明確化 |
| JSONL 書き込み原子性 | `fs.appendFile` （single-process, sequential per change） | `write-file-atomic` / stream-queue | 1 change につき同時書き込みは発生しない（SKILL.md は逐次実行）。過剰設計不要 |

## Web References

- [LLM Observability: Best Practices for 2025 — Maxim AI](https://www.getmaxim.ai/articles/llm-observability-best-practices-for-2025/) — 分散トレーシング・トークン計測・自動 eval がエージェント観測性の 2025 年ベースライン。メタデータにモデルバージョン・デプロイパラメータを付与する設計を推奨
- [A Practical Guide to Observability for LLM Applications — Medium](https://medium.com/@zakariabenhadi/a-practical-guide-to-observability-for-llm-applications-logs-traces-and-quality-metrics-c29568ef52eb) — Trace/Span 構造でのエージェント呼び出し記録。input/output・中間状態・ツール呼び出し引数すべてをログ対象にする指針
- [Advanced LLM Security: Preventing secret leakage across agents and prompts — Doppler Blog](https://www.doppler.com/blog/advanced-llm-security) — 秘密情報がログ・プロンプト・学習データに流出する経路の整理。最小権限コンテキスト送信と事前・事後マスキングを推奨
- [OWASP LLM07: System Prompt Leakage Risks & Mitigation — Indusface](https://www.indusface.com/learning/owasp-llm-system-prompt-leakage/) — LLM Top10 2025 更新で System Prompt Leakage が独立脆弱性として登録。ログ出力時のプロンプト内容除外が必須
- [JSONL for Log Processing — jsonl.help](https://jsonl.help/use-cases/log-processing/) — JSONL は 1 行 1 イベントで追記・ストリーミング・行単位処理に最適。構造化ログの業界標準形式
- [Node.js fs.appendFile 公式 — GeeksforGeeks](https://www.geeksforgeeks.org/node-js/node-js-fs-appendfile-function/) — `fs.appendFile` は非同期・追記専用。単一プロセス単一ファイルへの逐次書き込みなら追加ロック機構不要
- [Design Patterns for Securing LLM Agents against Prompt Injections — arXiv](https://arxiv.org/pdf/2506.08837) — エージェント間通信のサニタイズ・隔離パターン。retrieved content のログ出力時に instruction leakage を防ぐアーキテクチャ論

## Codebase Findings

- `packages/cli/src/lib/done-log.ts:1-47` — 既存ログの参照実装。`loadDoneLog` / `recordDone` パターン、`mkdir recursive` + `writeFile` で `.mspec/cache/done-log.json` に書き込む。`agent-runs.jsonl` ライターの実装参考
- `packages/cli/src/lib/skip-log.ts:1-45` — `done-log.ts` と対になる skip ログ実装。ファイル不在時 `{}` を返す安全なロードパターン
- `packages/cli/src/commands/continue.ts:200-224` — `buildSubagentPrompt` と `mapSubagentName` の実装。subagent を呼び出す 3 ステップ（research / self-review / checklist）がここで確定。CLI 自体はサブエージェントを起動せず `subagent_prompt` 文字列を返すだけ — **`subagent/runner.ts` は存在しない**
- `packages/cli/src/types/workflow.ts:13-31` — `StepSchema` に `subagent: boolean` フラグが存在。ログ記録トリガー条件の型根拠
- `packages/cli/src/workflow/paths.ts:1-32` — `ProjectPaths` に `changesDir` がある。`changes/<change>/.agent-runs.jsonl` パス計算の起点
- `.mspec/workflow.yaml:88-100` — `subagent: true` が設定されているステップは research / checklist / self-review の 3 つ
- `.claude/skills/mspec-research/SKILL.md:16-27` — Procedure step 4 が「Invoke the `mspec-researcher` subagent via the Task tool」と明記。ロガー注入場所は SKILL.md の手順レベルになる
- `.claude/skills/mspec-review/SKILL.md:14-20` — self-review ステップの subagent 呼び出し手順。step 4 で Task tool を使用
- `memory/constitution.md:1-44` — 現行 Constitution は **Version 1.1.0**（proposal.md 記載の "0.1.2" は旧表記。design ステップで修正すること）

## Open Choices（design ステップへ引き継ぎ）

- **`review_edits_count` の計測方法** — self-review が指摘した修正数をどのように数えるか未定義。design ステップで (1) `### Findings` セクションの blocker 行数 / (2) `### Suggested Edits` 件数 / (3) severity=blocker のみカウント のいずれかを確定すること
- **`context_size_tokens` の取得手法** — Claude Code の Task tool 呼び出し時のトークン数を SKILL.md レベルで取得できるかは未確認。proposal では「入力トークン数」としているが、Task tool が入力トークンを返さない場合は artifact ファイルサイズ (bytes) の代替指標を検討すること

## Constitution Check

> Step: research | Constitution Version: 1.1.0

| 原則 | Phase 0 | Phase 1 | Notes |
|------|---------|---------|-------|
| I. ステップ独立性 | ✅ | — | ログ追記は各 step の subagent 呼び出し後に独立して行う。step 間依存は増えない |
| II. 決定論的マージ | ✅ | — | `.agent-runs.jsonl` は SoT spec へのマージ対象外。archive と一緒に移動するが決定論的マージロジックに影響しない |
| III. 質問駆動の要件確定 | ✅ | — | proposal で 8 問、research Open Choices で 2 問を確定。残る技術的詳細は design ステップへ引き継ぎ |
| IV. 双方向アンカー | ✅ | — | 新規 FR は delta spec で付番済み。実装ファイルへのアンカー構造は変更しない |
| V. 強制ステップと拡張ステップの分離 | ✅ | — | 新ステップ追加なし。CLI サブコマンド新設は補助コマンドであり workflow ステップではない |
| VI. Security by Default | ⚠️ | — | ロガーが subagent プロンプト本文を書き出す実装は禁止。許可フィールド（数値メタデータのみ）の sanitize 設計が design ステップまで未解決。SEC-003 Open Question 引き継ぎ |

### Complexity Tracking

VI (Security by Default) は ⚠️（要注意）。sanitize ロジック（プロンプト本文・ファイル内容・secrets の記録禁止）を design.md の Decisions に明示し、実装時に enforce すること。
