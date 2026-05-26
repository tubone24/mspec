<!-- mspec: gaps in FR numbering are intentional. Removed requirements are archived under changes/archive/. -->

# agent-runner Specification

## Purpose

<このスペックがカバーする外部から観測可能な振る舞いの概要>

## Requirements

<!-- archive コマンドが Delta Spec の ADDED/MODIFIED/REMOVED/RENAMED を機械的にマージします -->

### Requirement: FR-001 — Subagent Run Logger Injection

<!-- risk_tier: standard -->
<!-- blast_radius: module -->

subagent 呼び出しが完了したとき、このシステムは SHALL `changes/<change>/.agent-runs.jsonl` に実行メタデータを JSONL 形式で 1 行追記する.

#### Scenario: 正常な subagent 実行後のログ追記
- GIVEN アクティブな change ディレクトリが存在し、subagent 呼び出しが完了している
- WHEN SKILL.md が `mspec agent-run record` コマンドを実行する
- THEN `.agent-runs.jsonl` に新しい JSONL エントリが 1 行追加される

#### Scenario: change ディレクトリが存在しない場合のフォールバック
- GIVEN change ディレクトリが特定できない
- WHEN subagent 呼び出しが完了する
- THEN ログ追記をスキップし、subagent の実行結果には影響を与えない

---

### Requirement: FR-002 — Log Entry Schema

<!-- risk_tier: standard -->
<!-- blast_radius: local -->

ログエントリを生成するとき、このシステムは SHALL 以下のフィールドを含む JSON オブジェクトを出力する: `step`（step 名）、`change`（change 識別名）、`started_at`（ISO 8601 実行開始時刻）、`context_size_bytes`（required_artifacts の合計バイト数）、`context_size_tokens`（常に `null`）、`required_artifacts`（前提 artifact パスのリスト）、`review_edits_count`（self-review で指摘された `[blocker]` 行数。self-review ステップ以外では `null`）.

#### Scenario: 通常ステップのログエントリ
- GIVEN research ステップで subagent が呼び出された
- WHEN ログエントリが生成される
- THEN エントリに `step: "research"`, `started_at`, `context_size_bytes`, `context_size_tokens: null`, `required_artifacts` が含まれ、`review_edits_count` は `null`

#### Scenario: self-review ステップのログエントリ
- GIVEN self-review ステップで subagent が呼び出された
- WHEN ログエントリが生成される
- THEN `review_edits_count` に `[blocker]` 行数（0 以上の整数値）が記録される

---

### Requirement: FR-003 — Log Sanitization

<!-- risk_tier: critical -->
<!-- blast_radius: system -->
<!-- verify: human -->

このシステムは MUST NOT プロンプト本文・secrets・環境変数・認証情報・API キーを `.agent-runs.jsonl` に書き出す. ログに含めてよいのは数値メタデータ（トークン数・修正数）、artifact パス、step 名、タイムスタンプのみである.

#### Scenario: 機密情報を含む入力の sanitize
- GIVEN subagent への入力プロンプトに環境変数の値が含まれる
- WHEN ロガーがエントリを生成する
- THEN プロンプト本文はログに含まれず、context_size_bytes（バイト数の整数値）のみが記録される

#### Scenario: 許可されたフィールドのみ出力
- GIVEN あらゆる subagent 呼び出しが完了する
- WHEN ログエントリが `.agent-runs.jsonl` に書き込まれる
- THEN エントリのキーは `step`, `change`, `started_at`, `context_size_bytes`, `context_size_tokens`, `required_artifacts`, `review_edits_count` のみに限定される

