---
doc_type: Reference
---

<!-- @mspec-delta 2026-05-28-112251-human-friendly-artifacts/specs/artifact-templates-i18n/spec.md -->
<!-- Requirements implemented: FR-006, FR-007 -->
<!-- Change: human-friendly-artifacts -->

# Checklist: <タイトル>

## 機能確認

このセクションでは、実装した機能が Delta Spec の要件を満たしているか確認します。

- [ ] ADDED Requirement <Name> が design.md でカバーされている
- [ ] ADDED Requirement <Name> の Scenario が tasks.md の E2E に展開されている
- [ ] MODIFIED Requirement <Name> の旧挙動が壊れていない (回帰テスト)

## リグレッションリスク

このセクションでは、変更が既存機能へ意図せず影響していないか確認します。

- [ ] `specs/<capability>/spec.md` の他 Requirement にデグレが無いか
- [ ] 関連 capability `specs/<other>/spec.md` の Scenario が壊れない確認をした

## デプロイ前確認

このセクションでは、リリースに向けた最終確認をします。

- [ ] 全 Principle に対する Constitution Check が design.md にある
