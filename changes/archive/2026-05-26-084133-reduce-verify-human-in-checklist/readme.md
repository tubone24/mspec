---
doc_type: Tutorial
---

<!-- @mspec-delta 2026-05-18-044538-revise-artifact-taxonomy/specs/artifact-taxonomy/spec.md -->
<!-- Requirements implemented: FR-005 -->
<!-- Change: revise-artifact-taxonomy -->

# reduce-verify-human-in-checklist

> Status: new
> Created: 2026-05-26
> Mode: bugfix

## Request

checklist.md の生成結果において「verify human」タグが多すぎる問題を解消する。
mspec-checklist-auditor サブエージェントが自動検証できる項目をより多くカバーし、人間による手動確認を本当に必要なケースのみに絞り込む。

## Artifacts

- [ ] proposal.md
- [x] specs/<capability>/spec.md (Delta Spec)
- [x] research.md
- [x] design.md / design-rationale.md / architecture-overview.md
- [ ] design-rationale.md
- [ ] quickstart.md
- [x] checklist.md
- [x] tasks.md

## Skipped Steps

<!-- `mspec skip <step-id> --reason "..."` 実行時に追記される -->
<!-- 例: - research: typo 修正のみのため省略 (skipped at 2026-05-14T10:30:00Z) -->

## Summary (Lessons / Next Steps)

### Lessons

- **「軽い解」の選択が正しかった**: 新 tier（`verify: auditor`）を追加するより auditor prompt を強化するだけで目的を達成でき、パーサーや downstream スキルへの波及を完全に回避できた。
- **Constitution IV は `mspec anchor check` で完全自動化できる**: サンプル checklist を見ると常に `verify: human` だったが、今回の実装で `- [x]` に自動確定できるようになった。インライン実行の有効性が確認された。
- **advisor の早期介入が仕様の過剰設計を防いだ**: design フェーズ前に advisor に相談したことで、既存 Constraint との矛盾（"Items must be unchecked"）と Constitution self-review 文化の破壊リスクを事前に排除できた。
- **E2E テストはファイル内容の文字列パターンマッチで十分機能した**: エージェント prompt 変更の「テスト」としてシンプルに `readFile` + `toMatch` を使い、red → green サイクルを明示できた。
- **research.md の旧アプローチ記述が残存**: `verify: auditor` tier を前提とした記述が research.md に残り、self-reviewer から warning を受けた。次回からは方針変更時に research.md に打ち消し注記を追加するとよい。

### Next Steps

- **Constitution I〜III, V の部分自動化検討**: 今回は IV と VI のみ対象。I（ステップ独立性）の grep チェックや III（Open Choices 解消確認）の自動化は別 change で検討できる（verify-routing の追加 FR 候補）。
- **Source-of-Truth Regression の verify: human 削減**: 今回は SoT Regression 項目の分類改善は対象外。機械的に diff チェック可能な項目を `verify: auditor` 相当に昇格させる change を今後検討する。
- **FR-013 後方互換確認**: 括弧書き理由付き `verify: human` 行が implement スキルのレポートロジックで正しく認識されることを手動確認する（checklist.md: FR-013 未チェック）。
