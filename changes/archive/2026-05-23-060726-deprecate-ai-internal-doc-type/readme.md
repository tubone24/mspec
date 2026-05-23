---
doc_type: Tutorial
---

<!-- @mspec-delta 2026-05-18-044538-revise-artifact-taxonomy/specs/artifact-taxonomy/spec.md -->
<!-- Requirements implemented: FR-005 -->
<!-- Change: revise-artifact-taxonomy -->

# deprecate-ai-internal-doc-type

> Status: new
> Created: 2026-05-23
> Mode: minor

## Request

以前導入した Doc Type「AI-internal」を廃止する。  
この Doc Type はダイアタクシス（Diátaxis）の思想に違反しているため、仕様・実装・ドキュメントから削除し、既存の適切な Doc Type に置き換える。

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

- **単一定義源の威力**: `artifact-validator.ts` の `VALID_DOC_TYPES` 配列から `'AI-Internal'` を1行削除するだけで、エラーメッセージ・バリデーション全体が自動連動した。設計時に「手動更新」と「自動連動」を明確に分類したことで実装コストが大幅に下がった。
- **REMOVED セクションの形式ミス**: Delta Spec の REMOVED を箇条書き (`- FR-004: ...`) で書いたため、パーサーが H3 ヘッダー形式 (`### Requirement: FR-NNN — ...`) を要求することに気づかず dry-run で REMOVED:0 になった。正しい形式を把握してから書くべきだった。
- **AI-Internal 廃止の波及**: `workflow-visual-mock.e2e.test.ts` の proposal.md モック（L32）が `doc_type: AI-Internal` を持っており、実装後に他テストが壊れた。research の codebase findings でリスクを予測していたため T201 として迅速に対処できた。
- **Diátaxis 原則の重要性**: 「消費者が AI か人間か」という属性は Diátaxis の分類軸ではない。この判断を proposal ではなく research・design で文書化したことで、future の開発者が廃止理由を容易に理解できる形になった。

### Next Steps

- `specs/artifact-taxonomy/spec.md` FR-002 のタイトルが「four permitted types」に更新されたか archive 後に目視確認すること（FR-002 MODIFIED）
- `specs/cli-spec-lint/spec.md` FR-015 の RENAMED が正しく反映されているか確認すること（FR-015 → 「4 種の Diátaxis 型のみを許容する」）
