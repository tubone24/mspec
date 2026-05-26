---
doc_type: Tutorial
---

<!-- @mspec-delta 2026-05-18-044538-revise-artifact-taxonomy/specs/artifact-taxonomy/spec.md -->
<!-- Requirements implemented: FR-005 -->
<!-- Change: revise-artifact-taxonomy -->

# agent-experience-manifest

> Status: new
> Created: 2026-05-25

## Request

各subagent呼び出しについて、context size・必要な前提artifact・self-reviewが指摘した修正数を `changes/<change>/.agent-runs.jsonl` に記録し、プロンプト品質をメタ計測可能にする（issue.md (E) Agent Experience Manifest）。
`subagent/runner.ts` にロガーを注入し、`skills/mspec-*/SKILL.md` に観測義務を追記する。

## Artifacts

- [x] proposal.md
- [x] specs/<capability>/spec.md (Delta Spec)
- [x] research.md
- [x] design.md / design-rationale.md / architecture-overview.md
- [x] quickstart.md
- [x] checklist.md
- [x] tasks.md

## Skipped Steps

<!-- `mspec skip <step-id> --reason "..."` 実行時に追記される -->
<!-- 例: - research: typo 修正のみのため省略 (skipped at 2026-05-14T10:30:00Z) -->

## Summary (Lessons / Next Steps)

### Lessons

- **`subagent/runner.ts` は存在しない**：research で判明。subagent は CLI でなく Claude Code の Task tool 経由で呼ばれるため、ログ書き込み主体を CLI サブコマンド（`mspec agent-run record`）に委ねる設計が唯一の選択肢だった。
- **self-reviewer が `change` フィールドの許可リスト漏れを検出**：FR-003（MUST NOT, critical）の許可リストに `AgentRunEntry.change` が含まれていない blocker を発見。security-critical 要件はレビューステップで必ず再確認が必要。
- **template 同期テストが SKILL.md 編集を保護している**：`runtime-template-sync.e2e.test.ts` が runtime と template の完全一致を強制するため、一方だけ編集すると即座に失敗。両方更新する手順が必須。
- **`enforce_e2e` は `tests/e2e/` 配下のアンカーを要求**：`src/commands/*.test.ts` のみでは不十分。`tests/e2e/agent-run.e2e.test.ts` を別途作成して初めて `mspec done implement` が通った。
- **Constitution VI (Security by Default) が proposal の ⚠️ から ✅ に昇格**：TypeScript 型 + `sanitizeEntry()` 許可リストの二重防御を design で明示することで解消。設計段階の ⚠️ は実装の具体化で解決できる。

### Next Steps

- `<!-- verify: human -->` 未チェック項目（FR-003 sanitization + RISK-003〜007 + Constitution 全 6 原則）を人間がレビューしてチェックを付ける前に archive を確定させること（`agent-runner/FR-003`）
- `context_size_tokens: null` フィールド：Claude Code が Task tool API レスポンスにトークン数を追加した際に `null` から実値へ有効化するフォローアップ change を検討（`agent-runner/FR-002`）
- `mspec stats` 等の `.agent-runs.jsonl` 集計・可視化コマンドは Non-Goal として除外済み。将来 change として検討（`agent-runner` capability）
