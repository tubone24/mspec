---
doc_type: Tutorial
---

<!-- @mspec-delta 2026-05-18-044538-revise-artifact-taxonomy/specs/artifact-taxonomy/spec.md -->
<!-- Requirements implemented: FR-005 -->
<!-- Change: revise-artifact-taxonomy -->

# dynamic-security-questions

> Status: archived
> Created: 2026-05-27

## Request

MSpec ワークフローのセキュリティ質問ステップで、固定の汎用質問（ロールバック方法・ファイル共有・仮想化など）を廃止する。代わりにサブエージェントが今回の仕様・プロポーザル・コードベース全体を分析し、変更内容に固有のセキュリティリスクを特定したうえで、文脈に沿った質問を生成してユーザーに提示するよう改修する。

## Artifacts

- [x] proposal.md
- [x] specs/<capability>/spec.md (Delta Spec)
- [x] research.md
- [x] design.md / design-rationale.md / architecture-overview.md
- [ ] design-rationale.md
- [x] quickstart.md
- [x] checklist.md
- [x] tasks.md

## Skipped Steps

<!-- `mspec skip <step-id> --reason "..."` 実行時に追記される -->
<!-- 例: - research: typo 修正のみのため省略 (skipped at 2026-05-14T10:30:00Z) -->

## Summary (Lessons / Next Steps)

### Lessons

- `produces: []` の ステップ（self-review）は `mspec done <step-id>` で明示的に完了マークが必要。mspec-review スキルにこの手順が未記載だったため発見が遅れた。
- `mspec test expect-red` は fail-fast で全 runner が red 条件を満たす必要がある。常に pass する unit test runner には `expect_red_on_exit: [0, 1, 2]` を設定して中立化するパターンが有効。
- Constitution Principle VI が PRP-SEC-001〜004 を固定 ID で参照していた。checklist-auditor が BLOCKING として検出し、constitution.md 改訂を実装スコープに含めて解決。スペックと実装の連鎖依存を事前に発見できた好例。
- runtime SKILL.md を変更すると `runtime-template-sync.e2e.test.ts` が失敗する。template 版（`packages/cli/templates/claude/skills/`）も必ず同期更新する必要がある。
- 廃止した機能（PRP-SEC 固定質問）の E2E テストは「存在する」→「存在しない」に反転して retire する。旧 change の test を新 change に合わせて更新するパターンが確立された。

### Next Steps

- mspec-review スキルに `mspec done self-review` 呼び出し手順を追記する（produces:[] ステップの完了方法を明示）
- `memory/constitution.md` のバージョン番号を 1.2.0 に bump する（Principle VI 改訂後）
- `cli-e2e` runner 追加と `expect_red_on_exit: [0, 1, 2]` 設定パターンを mspec-implement スキルのガイドに記述する
