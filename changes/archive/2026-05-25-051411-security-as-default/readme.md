---
doc_type: Tutorial
---

<!-- @mspec-delta 2026-05-18-044538-revise-artifact-taxonomy/specs/artifact-taxonomy/spec.md -->
<!-- Requirements implemented: FR-005 -->
<!-- Change: revise-artifact-taxonomy -->

# security-as-default

> Status: archived
> Created: 2026-05-25

## Request

Question Bankにsecurityカテゴリを必須追加し、deltaテンプレートにsecurity capabilitiesセクションを追加し、Constitutionに「VII. Security by Default」原則を追加する。
エージェント駆動開発における権限境界・認証・外部API・秘密情報アクセスの質問を設計段階でデフォルト化することで、セキュリティを後付けではなく仕様の一部として扱う。

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

- **TypeScript型定義の見落とし**: Zodスキーマ（`QUESTION_CATEGORIES`）が`security`カテゴリを受け付けないため、YAMLを追加するだけでは不十分だった。テンプレート変更はコード変更も伴う場合がある点を設計フェーズで明示する必要がある。
- **runtime/template syncテストの価値**: `.claude/skills/`（runtime）と`packages/cli/templates/claude/skills/`（template）の同期チェックが既存テストとして組み込まれており、自動的に同期漏れを検出した。TDDが予期せぬ依存を発見するよい例。
- **VI vs VII命名の不整合**: self-reviewerが複数アーティファクトに渡るVI/VII表記ゆれをblockerとして検出。仕様策定段階での命名統一の重要性を改めて確認。
- **Security Capabilitiesセクションのarchive安全性**: archive mergerがADDED/MODIFIED/REMOVED/RENAMEDのみを処理する設計により、HTMLコメントのみのセクションはコード変更なしで安全にパススルーされた。
- **mspec done コマンドの発見**: `produces: []` のステップ（self-review・implement）は `mspec done <step-id>` で明示的に完了マークが必要。ワークフロー理解が深まった。

### Next Steps

- **Spec Quality Lint in Deltaの実装**: issue.mdの(B)機能。EARS違反・曖昧語・テスト不能要件の検出をdeltaステップに統合する。（関連: `question-bank` FR-001〜003）
- **Middle Loop OS再ポジショニング**: issue.mdの(D)機能。READMEへの"supervisory engineering OS"の明記と`mspec doctor`コマンド追加。
- **security質問のproposal.yaml英語版対応**: 現在のPRP-SEC質問は日本語のみ。locale=enプロジェクトへの対応を別changeで実施する。
- **VI原則のConstitution Check自動化**: design.mdのConstitution Checkで「VI. Security by Default」の評価列が将来的に必要になる。
