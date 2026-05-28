---
doc_type: Tutorial
---

<!-- @mspec-delta 2026-05-18-044538-revise-artifact-taxonomy/specs/artifact-taxonomy/spec.md -->
<!-- Requirements implemented: FR-005 -->
<!-- Change: revise-artifact-taxonomy -->

# checklist-reduce-verify-human

> Status: new
> Created: 2026-05-27
> Mode: bugfix

## Request

checklist.md の `verify human` 項目が過剰に多い問題を改善する。自動テストで確認できる項目はカテゴリに関わらず `verify auto` に変更し、自動検証を優先する。`verify human` が残る項目には、子階層に箇条書きで具体的な確認手順を記載し、チェッカーが何をすべきか明確にわかるようにする。

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

- **verify:cmd 形式の導入が有効**: Constitution IV/VI を `verify:human` → `verify:cmd:mspec anchor check` / `verify:cmd:grep` に置き換えることで、人手確認を自動コマンドに降格できた。同パターンは他の CLI 検証可能な checklist 項目にも適用可能。
- **auditor テストは vitest でテキスト検証が効果的**: `.claude/agents/mspec-checklist-auditor.md` の文言を正規表現でチェックする E2E テストにより、プロンプト変更の意図した動作を CI で保証できる。新ルール追加時は必ずテストを先行作成する。
- **FR-014 同期テストがリグレッションを防止**: `runtime === template` 同期 assert がすべての auditor テストに含まれており、ファイルコピー忘れを確実に検知できた。ランタイムファイルは `.claude/agents/` Write 保護のため手動コピーが必要（要: 設定で許可するか CI スクリプトで同期する）。
- **verify:human 子リスト必須化の影響範囲**: critical FR 項目と最後の手段 fallback の両方に子リストを義務化した。既存の checklist.md（auditor 更新前に生成済み）は子リストなしのままのため、Phase 4 再生成タスクは必須。
- **Constitution Check ⚠️ 解消**: self-review の 2 件 warning（Constitution IV/VI の `verify:human` が子リストなし）は auditor 更新後の checklist.md 再生成で解消見込み（boostrap 状態として許容）。

### Next Steps

- **checklist.md を再生成する** — auditor 更新後に `mspec checklist --change` を実行し、Constitution IV/VI の `verify:cmd` 形式と `verify:human` 項目の子リストを反映させる（Phase 4 タスク・本 Change 内）
- **verify:cmd の自動実行機能を検討** — `mspec validate` フェーズで `<!-- verify: cmd:<command> -->` アノテーション付き項目を自動実行してチェック済みにする機能（新 Change: `verify-cmd-auto-execute`）
- **publish-prep テストのバージョン期待値を更新** — `packages/cli/tests/publish-prep.test.ts` の `expect(pkg.version).toBe('0.1.3')` が現在 `0.1.6` で既存失敗中。次回リリース準備時に修正（関連: FR-014 独立）
