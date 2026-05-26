---
doc_type: Explanation
---

# Proposal: agent-experience-manifest

## Why

mspec の各ステップでは複数の subagent が呼び出されるが、その実行情報（context size・入力 artifact・self-review 修正数）は現在どこにも記録されない。このため、プロンプト品質の問題（どの step で token 溢れが起きているか、どの artifact が不足しがちか）を後から調査する手段がなく、改善が経験則頼みになっている。

issue.md (E) Agent Experience Manifest が指摘するとおり、各 subagent 呼び出しのメタデータを `changes/<change>/.agent-runs.jsonl` に追記することで、プロンプト品質を定量的に計測できるようにする。これにより「どの step が最もコンテキストを消費するか」「self-review で繰り返し指摘される項目は何か」を可視化する基盤が生まれる。

実装は `subagent/runner.ts` へのロガー注入と `skills/mspec-*/SKILL.md` への観測義務追記に限定し、新ステップの追加は行わない。既存の workflow 構造を変えずに観測可能性のみを追加する。

## Goals

- `subagent/runner.ts` にロガーを注入し、各 subagent 呼び出しのメタデータを `changes/<change>/.agent-runs.jsonl` に JSONL 形式で追記する
- 記録項目：context size（入力トークン数）、必要前提 artifact 名のリスト、self-review 修正指摘数、実行開始時刻・step 名
- `skills/mspec-*/SKILL.md` に観測義務（ログ記録の実行）を明記する
- 全 step でログが生成されること（全 E2E が green）

## Non-Goals

- `.agent-runs.jsonl` のリアルタイムモニタリングや可視化 UI
- 自動アラート・通知（ログ内容に基づくアラート機能）
- 外部サービス連携（DataDog 等へのログ転送）
- ログの集計・分析コマンド（`mspec stats` 等）

## Capabilities (touched)

- `agent-runner` — `subagent/runner.ts` にロガー注入、`.agent-runs.jsonl` 書き込み実装
- `skill-observability` — `skills/mspec-*/SKILL.md` に観測義務（ログ記録手順）追記

## Decisions

| Question | Answer |
|----------|--------|
| PRP-SEC-001: 触れる権限境界 | ファイルシステムアクセス |
| PRP-SEC-002: アクセス範囲増加 | ファイル読み書き範囲の拡大（changes/ 配下への新規書き込み） |
| PRP-SEC-003: エージェントへの新規権限付与 | あり（subagent runner が changes/ 配下への書き込み権限を新規取得） |
| PRP-SEC-004: ロールバック手段 | git revert |

## Open Questions

- 【SEC-003 要検討】subagent runner が `changes/` 配下への書き込み権限を新規取得する。ログに含める情報の範囲（context size 等の数値メタデータのみ）を明確に制限し、プロンプト内容・secrets・認証情報が `.agent-runs.jsonl` に漏洩しないよう sanitize ロジックの設計を design ステップで確認すること。
- self-review 修正指摘数の「指摘」の定義を design ステップで明確化する（例：severity=error のみか、warning も含めるか）。

## Constitution Check

> Step: proposal | Constitution Version: 0.1.2

| Principle | Phase 0 | Phase 1 | Notes |
|-----------|---------|---------|-------|
| I. ステップ独立性 | ✅ | — | ロガーは各 step の subagent 呼び出し後に追記するだけ。step 間依存は増えない |
| II. 決定論的マージ | ✅ | — | `.agent-runs.jsonl` は archive 対象外。決定論的マージロジックに影響しない |
| III. 質問駆動の要件確定 | ✅ | — | AskUserQuestion で 8 問確定済み（機能スコープ 4 問 + Security 4 問） |
| IV. 双方向アンカー | ✅ | — | アンカー構造（`@mspec-delta` / `Requirements implemented` / `Change`）は変更しない |
| V. 強制ステップと拡張ステップの分離 | ✅ | — | 新ステップ追加なし。runner.ts への注入と SKILL.md 追記のみ |
| VI. Security by Default | ⚠️ | — | ファイル書き込み範囲が拡大。ログへの機密情報漏洩を防ぐ sanitize が必要（Open Questions に記録） |

### Complexity Tracking

VI. Security by Default は ⚠️（要注意）。ロガーが subagent のプロンプト内容をそのまま書き出す実装は不可。context size 等の数値メタデータのみに限定する sanitize ロジックを design ステップで設計する。
