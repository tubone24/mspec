---
doc_type: Reference
---

# revise-artifact-taxonomy

> Status: new
> Created: 2026-05-18

## Request

artifact taxonomy（FR-002）の doc_type 体系を見直す。AI 専用の運用成果物向けに `AI-Internal` doc_type を追加し、`design.md` を Reference（`design.md`）と Explanation（`design-rationale.md`）の2系統に分割する。`readme.md` の doc_type を `Tutorial` に変更し、末尾にチュートリアル的なまとめを置く構成へ移行する。

## Artifacts

- [x] proposal.md
- [x] specs/<capability>/spec.md (Delta Spec)
- [x] research.md
- [x] design.md / architecture-overview.md
- [x] quickstart.md
- [x] checklist.md
- [x] tasks.md

## Skipped Steps

<!-- `mspec skip <step-id> --reason "..."` 実行時に追記される -->
<!-- 例: - research: typo 修正のみのため省略 (skipped at 2026-05-14T10:30:00Z) -->

## Summary (Lessons / Next Steps)

### Lessons

- Bootstrap paradox の実例として本 change 自身が旧体系で進行した。新体系（Tutorial readme / AI-Internal tasks / design + design-rationale 2 ファイル）は archive 完了後の最初の change から有効化され、「自己言及的変更」の安全な進め方が確立された。
- Self-Review Important #1 が「テスト変更のみでは FR-015 Scenario 2 を満たせない」と指摘し、design Decision 5 を覆した。Scenario 文言が CLI error message を要求する場合は CLI 実装の追加が必須であり、design 段階の責務判断が tasks スコープを決定する。
- capability 間で同一番号 FR-022 が重複するケースが初めて発生した。checklist の `<!-- verify: -->` アノテーションに capability prefix（例: `claude-integration/fr-022`）が必要と判明し、T200 で解消した。将来の Delta Spec 採番では横断ツールへの影響を事前確認することが推奨される。
- `AI-Internal` の適用基準 "primary consumer が AI のみ" が定着した。`checklist.md` は `<!-- verify: human -->` 存在により人間も読者であるため AI-Internal 不適切と判断し、`tasks.md` 1 件のみに限定した（Decision 4）。
- `archive` ステップが同一 change ディレクトリ内の `readme.md` を編集する初の事例となった。「同一 change 内・冪等位置のみ」という制約のもと Constitution 原則 I を満たすことが Phase 1 で確認でき、ステップ副作用の許容基準が具体化された。

### Next Steps

- `artifact-taxonomy` FR-002 タイトル "four Diátaxis types" を "five doc types (Diátaxis + AI-Internal)" に RENAMED で改名する後続 change を起票する — [artifact-taxonomy/FR-002](specs/artifact-taxonomy/spec.md)
- cli-workflow-engine FR-022 の intentional-RED 2 件（T121/T122: state-engine 制限で `design.md` 単独時の `validate_failed` が未達）のフォローアップ change を検討する — [cli-workflow-engine/FR-022](specs/cli-workflow-engine/spec.md)
- 新体系適用後の最初の `mspec new` でスモークテスト（Tutorial readme / AI-Internal tasks / design + design-rationale 両生成）を実施して新テンプレが正しく展開されることを確認する
