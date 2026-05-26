---
doc_type: Explanation
---

<!-- See also: ./design.md -->

# Design Rationale: agent-experience-manifest

## Context

mspec の各 subagent ステップ（research / checklist / self-review）は Claude Code の Task tool を通じて呼び出される。この呼び出し自体は Claude Code が管理するため、CLI プロセスからは subagent の起動・完了・入力サイズを直接観測できない。research ステップで確認した通り `subagent/runner.ts` が存在しないことが、ロガー設計の最大の制約となっている。

ThoughtWorks Retreat 2026 の「エージェント体験への投資は人間体験への投資とほぼ一致する」という指摘に応答するには、プロンプト品質の改善を経験則でなく定量データに基づいて行えるようにする必要がある。「どの step が最もコンテキストを消費しているか」「self-review で繰り返し指摘される修正の数」は、ログなしには把握できない。

セキュリティ観点では、ロガー実装時に最も危険なのは「便利さのためにプロンプト本文もログに残す」という誘惑。OWASP LLM07（System Prompt Leakage）が明示するように、ログへのプロンプト保存は秘密情報漏洩の主要経路の一つ。設計段階から許可フィールドを TypeScript 型として固定し、実装者の善意に頼らない防衛的設計を採用した。

## Decisions

### ログ書き込み実行主体を CLI サブコマンドにした理由

subagent は CLI プロセスの外側（Claude Code の Task tool）で動作するため、CLI が subagent の完了を検知してログを書くことは構造的に不可能。SKILL.md の手順から CLI コマンドを呼び出す設計（案 a）を選んだ理由は二つある。

一つは **テスト可能性**。JSONL 書き込みロジックが TypeScript の `agent-run-log.ts` に集約されるため、vitest で単体テストを書ける。`done-log.ts` / `skip-log.ts` が採用した同じパターンを踏襲することで、codebase の一貫性も維持される。

もう一つは **コマンドとロジックの分離**。SKILL.md がロギングの「いつ・何を」を制御し、CLI がロギングの「どうやって」を実装する。この分離により、将来のスキーマ変更時は `agent-run-log.ts` だけを修正すれば良く、SKILL.md 側の変更は最小化できる。

### context_size_bytes を context_size_tokens の代替にした理由

Claude Code の Task tool 呼び出しは入力トークン数をコールバックとして返さない。SKILL.md のコンテキストでトークン数を正確に取得する手段が存在しないため、required_artifacts の合計バイト数を代替指標とした。

バイト数はトークン数の厳密な代理指標ではないが、「どの step がどれほどのコンテキストを消費しているか」を相対比較する目的には十分機能する。`context_size_tokens: null` を型に含めることで、将来 Claude Code が API レスポンスにトークン数を追加した際にフィールドを有効化するパスを開いておく。

### review_edits_count を `[blocker]` 行数に統一した理由

self-review の出力形式は `mspec-self-reviewer` が生成する Markdown であり、`[blocker]` / `[warning]` のプレフィックスで severity が明示される。`[blocker]` のみをカウントすることで「このステップで実装が止まった修正の数」という意味論的に明確な指標になる。`[warning]` を含めると「情報提供的な指摘」との混在が生じ、改善効果の計測が難しくなる。

## Alternatives Considered

- **(b) SKILL.md インライン Write 指示案**: SKILL.md に「Task tool 完了後に `Write` ツールで JSONL 追記」と書く案。新 CLI コマンド不要で最小実装だが、TypeScript でテストできず、SKILL.md の指示が守られなかった場合のフォールバックがない
- **(c) continue.ts フック案**: CLI の `continue.ts` が開始タイムスタンプを返し、SKILL.md が完了後に `mspec agent-run complete` を呼ぶ案。開始・完了を分離管理できるが対応が崩れるリスクがあり実装複雑度が高い
- **全フィールドを null で初期化**: tokens / edits を常に null にする案。シンプルだが計測価値が下がる

## Trade-offs

- `context_size_bytes` はトークン数の正確な代替ではない。絶対値より相対比較用の指標として位置づける
- SKILL.md への手順追記は「指示に従わない場合のフォールバックなし」。CLI コマンドが呼ばれなければログは記録されない。信頼性は SKILL.md の記述品質に依存する
- `--bytes` の計算（artifact ファイルサイズの合計）を SKILL.md が手動で行う必要がある。自動化より実装コストを優先した

## Rejected Options

- **プロンプト本文のログ保存**: OWASP LLM07 / SEC-003 対応で即却下。機密情報漏洩リスクが許容できない
- **`.mspec/cache/` への格納（change 横断集計用）**: change の履歴とログを一体で管理したいため `changes/<change>/` 配下を優先
- **`write-file-atomic` / stream-queue**: 1 change につき同時書き込みは発生しないため過剰設計と判断

## Constitution Check

| Principle | Phase 0 | Phase 1 | Notes |
|-----------|---------|---------|-------|
| I. ステップ独立性 | ✅ | ✅ | ログ追記は各 step の副作用。step 間依存は増えない |
| II. 決定論的マージ | ✅ | ✅ | `.agent-runs.jsonl` は SoT spec マージ対象外 |
| III. 質問駆動の要件確定 | ✅ | ✅ | proposal + research + design で全 Open Choices を確定 |
| IV. 双方向アンカー | ✅ | ✅ | アンカー構造は変更しない |
| V. 強制ステップと拡張ステップの分離 | ✅ | ✅ | workflow ステップ構造は変更しない |
| VI. Security by Default | ✅ | ✅ | `AgentRunEntry` 型 + `sanitizeEntry()` の二重防御でプロンプト漏洩を型レベルで封じる |

### Complexity Tracking

None
