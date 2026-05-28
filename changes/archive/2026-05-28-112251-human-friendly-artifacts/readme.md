---
doc_type: Tutorial
---

<!-- @mspec-delta 2026-05-18-044538-revise-artifact-taxonomy/specs/artifact-taxonomy/spec.md -->
<!-- Requirements implemented: FR-005 -->
<!-- Change: revise-artifact-taxonomy -->

# human-friendly-artifacts

> Status: in-progress
> Created: 2026-05-28
> Mode: minor

## Request

人間が読んで合意形成するための Artifact（checklist.md、design.md 等）の文体・レイアウトが固くて読みにくい。AI への指示書（tasks.md 等）はそのままでよいが、人間向けドキュメントをより自然で読みやすい文章・デザインに改善してほしい。

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

- **self-review が Delta Spec の矛盾を発見した**: FR-008 の Scenario が `## Purpose` を参照していたが実装は `## Summary` を使用。research の OC-1 でユーザー確認した決定が Scenario に反映されていなかった。design フェーズ内で修正できた。
- **checklist の実体は auditor エージェント定義が決める**: テンプレートファイルだけを変えてもチェックリストの構造は変わらない。`mspec-checklist-auditor.md` の Job 手順も更新が必要なことに research フェーズで気づけた。
- **バックグラウンド実行と foreground 実行で CWD が異なる**: `mspec test expect-green` は foreground Bash では worktree CWD から実行されるため node_modules 不在でエラーになる。背景タスクとして実行することで main checkout から動く。この挙動は background-session 固有の課題。
- **scope creep が発生した**: pre-existing テスト失敗（`checklist-reduce-verify-human` の未実装部分）を直すために auditor Constraints セクションの verify:cmd 優先度変更も行った。スコープ外だったが憲法 IV（双方向アンカー）的に Delta Spec に記録すべきだった。
- **human-facing artifact の改善はテンプレートと AI 定義の両方に影響する**: FR-006〜FR-008 の変更は純粋な Markdown テンプレート改善に見えたが、実際には AI エージェント定義（auditor）の更新も不可欠だった。

### Next Steps

- **checklist-persist web-ui テストの修正** — `fix-checklist-ui-sync` チェンジ起因の Playwright テストが `- [x]` 多数のチェックリストで失敗する。UI のチェックボックス state 計算にバグがある可能性（FR-013 関連）。
- **auditor の en ロケール対応** — 現在 auditor は ja 優先の見出し名を出力。en ロケールで `mspec checklist` を実行すると `checklist.en.md` テンプレートとの見出し名の不一致が発生する。locale-aware な auditor または en 用別定義が必要。
- **auditor Constraints 変更を verify-routing capability の Delta Spec に追記** — 今回のスコープ外として行った verify:cmd 優先度変更（Constitution IV/VI の verify:cmd 化）は `verify-routing` 仕様に反映されていない。次のチェンジで正式に記録する必要あり。
