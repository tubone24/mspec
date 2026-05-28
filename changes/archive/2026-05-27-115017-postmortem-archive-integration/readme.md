---
doc_type: Tutorial
---

<!-- @mspec-delta 2026-05-18-044538-revise-artifact-taxonomy/specs/artifact-taxonomy/spec.md -->
<!-- Requirements implemented: FR-005 -->
<!-- Change: revise-artifact-taxonomy -->

# postmortem-archive-integration

> Status: archived
> Created: 2026-05-27
> Mode: feature

## Request

アーカイブ時にチェンジの Lessons を分析し、`memory/constitution.md` への抽象化された知見の追加を AskUserQuestion でユーザーに提案する。また、NextActions を分析して新しいチェンジとして登録すべきかを AskUserQuestion で確認し、承認された場合は `mspec new` まで自動的に進める。

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

- `produces: []` のステップ（self-review・implement）は `mspec done <step-id>` コマンドで明示的に完了マークが必要。`mspec validate` だけでは前進しない点が設計上のトラップだった。
- research ステップがコードベースを実際に読んだことで、Delta Spec に書いた `NextActions` という表記が実テンプレートの `### Next Steps` と不一致だと判明した。設計の仮定を現実で検証する research の価値を実証できた。
- SKILL.md のみの変更は CLI テストスイートによる TDD が難しい。web-ui-e2e に pre-existing failure がある場合は `expect_green_on_exit` を一時緩和してから元に戻す手順が有効だった。
- サブエージェント委譲設計（mspec-lessons-analyzer / mspec-nextaction-planner）により archive スキル本体のコンテキストを汚染せず、Constitution 原則 I（ステップ独立性）も自然に満たせた。
- AskUserQuestion の UX パターン（per-item vs multi-select）を設計ステップで決定したことで、tasks.md のタスク粒度が明確になり手戻りなく実装できた。

### Next Steps

- 実際の archive 実行時にポストモーテムフロー（mspec-lessons-analyzer / mspec-nextaction-planner）が期待通りに動作するか実機検証する（FR-001 / FR-002）
- `AskUserQuestion` の 4 件上限に対応するフォールバック（提案 5 件以上の場合に優先度上位 4 件に絞る）を設計・実装する
- `produces: []` ステップの `mspec done` 知見を mspec-implement / mspec-review スキル手順書に明記してスキル品質を向上させる
- web-ui-e2e の pre-existing failure（code-highlight.e2e.test.ts）を修正して CI を安定させる
