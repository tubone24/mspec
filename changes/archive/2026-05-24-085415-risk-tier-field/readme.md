---
doc_type: Tutorial
---

<!-- @mspec-delta 2026-05-18-044538-revise-artifact-taxonomy/specs/artifact-taxonomy/spec.md -->
<!-- Requirements implemented: FR-005 -->
<!-- Change: revise-artifact-taxonomy -->

# risk-tier-field

> Status: new
> Created: 2026-05-24

## Request

Delta Spec の各 FR-NNN に `risk_tier`（critical/standard/trivial）と `blast_radius`（local/module/system/external）フィールドを追加する。
これにより tasks.md・checklist.md・implement の verify 動作を risk tier に応じて自動分岐させ、critical は `verify: human` 必須、trivial は自動検証のみとする。
risk_tier 未記載の既存 FR はデフォルトで `standard` 扱いとし、後方互換性を維持する。

## Artifacts

- [x] proposal.md
- [x] specs/<capability>/spec.md (Delta Spec)
- [x] research.md
- [x] design.md / design-rationale.md / architecture-overview.md
- [x] design-rationale.md
- [x] quickstart.md
- [x] checklist.md
- [x] tasks.md

## Skipped Steps

<!-- `mspec skip <step-id> --reason "..."` 実行時に追記される -->
<!-- 例: - research: typo 修正のみのため省略 (skipped at 2026-05-14T10:30:00Z) -->

## Summary (Lessons / Next Steps)

### Lessons

- **実装の主体はエージェントプロンプト側**だった。research で「verify アノテーション生成は CLI コードではなく SKILL.md / mspec-checklist-auditor.md が担う」と判明し、設計を CLI + プロンプトの2層に修正した。これは proposal の前提を根本から変えたが、research の発見が design に正しく逆流した。
- **`mspec init` は既存ファイルを上書きしない**設計で、templates 変更後に `.claude/` 側が古いまま残った。`runtime-template-sync.e2e.test.ts` がこの問題を即座に検出した——既存テストが「設計の意図しない副作用の番兵」として機能した。
- **proposal の Goal が後の AskUserQuestion で上書きされたまま放置されていた**（trivial の定義が Goal と Delta Spec で乖離）。self-review がこれを発見し proposal.md を修正した。Q&A による要件変更は proposal に即座に逆流させる必要がある。
- **作業ディレクトリの選択ミス**（`packages/cli/` vs project root）が early に発生し advisor の指摘で修正できた。monorepo 構造では workspace root を事前に確認することが重要。
- Constitution Check 全 5 原則に対して Phase 0/1 ともに ✅ を維持した。フィールド追加のみでステップ構造を変えない設計がこれを可能にした。

### Next Steps

- Constitution に「VI. Risk-Proportionate Verification」原則を追加する専用 change が必要（proposal Non-Goals に明記済み）
- `verify: fr-NNN` アノテーションに capability スコープを含める改善（例: `verify: delta-spec/fr-001`）——両 capability が同番号 FR を持つ曖昧性への対処（checklist.md に既知制限として記録済み）
- `blast_radius: external` の FR への追加ガードレール（security capability 必須化など）——現在はメタデータのみ記録、将来の拡張として保留
- `mspec init` の上書き動作の検討——既存ファイルを更新するオプション（`--force`）を追加するか、runtime-template sync を CI に組み込むか
