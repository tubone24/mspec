---
doc_type: Tutorial
---

<!-- @mspec-delta 2026-05-18-044538-revise-artifact-taxonomy/specs/artifact-taxonomy/spec.md -->
<!-- Requirements implemented: FR-005 -->
<!-- Change: revise-artifact-taxonomy -->

# improve-postmortem-quality

> Status: new
> Created: 2026-05-28
> Mode: minor

## Request

ポストモーテムの品質を2点改善する。(1) `mspec-lessons-analyzer` が生成する Lessons をより抽象度の高い・本質的な課題に切り込む提案に変更し、具体事象にとどまらず次回以降に汎用的に活かせる形にする。(2) `mspec-nextaction-planner` が `mspec:new` を提案する際、生成されるチェンジの `readme.md` に概略（何をするか）を記述するよう改善し、後続セッションで開いた際に何から始めるべきかがわかるようにする。

## Artifacts

- [ ] proposal.md
- [x] specs/<capability>/spec.md (Delta Spec)
- [x] research.md
- [x] design.md / design-rationale.md / architecture-overview.md
- [ ] quickstart.md
- [x] checklist.md
- [x] tasks.md

## Skipped Steps

<!-- `mspec skip <step-id> --reason "..."` 実行時に追記される -->
<!-- 例: - research: typo 修正のみのため省略 (skipped at 2026-05-14T10:30:00Z) -->

## Summary (Lessons / Next Steps)

### Lessons

- HTML コメント形式（`<!-- @mspec-delta -->`）のアンカーは anchor-scanner でマスクされ `enforce_anchor` に検出されない。エージェント定義など `.md` ファイルのみを変更する場合でも、E2E テストファイルに `// @mspec-delta` 形式のアンカーを追加することで enforce チェックを満たせる。
- self-review が「改行禁止だけではシェルインジェクション防止に不十分」という重要な欠陥を発見した。単一の制約では見落とされやすいセキュリティ境界は、既存の類似制約（`kebab_name` の正規表現）と同水準に揃えることが有効。
- Delta Spec と design.md の間に「1〜3行 vs 1行」という行数制限の矛盾が生じた。research フェーズで CLI の `--request` フラグが "one-line" と明記されているにも関わらず、Delta Spec に反映されなかったことが原因。設計決定は Delta Spec 本文にも反映させる必要がある。
- web-ui-e2e の Playwright テストは Vite dev server（port 5173）の起動を前提としており、サーバー未起動時は green 証拠を記録できない。これは CLI-only の変更には適用外のインフラ依存であり、設定または CI フローで明示的に対処が必要。

### Next Steps

- web-ui-e2e Playwright の webServer 起動安定性を改善し、CLI-only 変更での green 証拠記録が確実にできるようにする（関連: web-ui-e2e infra）
- `.claude/agents/` ファイルへの変更を `enforce_anchor` が直接検出できるようスキャン対象パスを拡張するか、agent-only 変更モードを追加する（関連: enforce_anchor FR-003）
