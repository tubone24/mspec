---
doc_type: Tutorial
---

<!-- @mspec-delta 2026-05-18-044538-revise-artifact-taxonomy/specs/artifact-taxonomy/spec.md -->
<!-- Requirements implemented: FR-005 -->
<!-- Change: revise-artifact-taxonomy -->

# init-gitignore-ui-pid

> Status: new
> Created: 2026-05-28
> Mode: minor

## Request

`mspec init` 実行時に `.mspec` ディレクトリへ `.gitignore` を自動生成し、`ui.pid` をignoreするようにする。
これにより、UIサーバーのPIDファイルが誤ってgitにコミットされることを防ぐ。

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

- **PlannedFile[] パターンの再利用価値**: `plan.push({ from, to })` に1エントリ追加するだけで `--force` 衝突制御・冪等性・ログ出力がすべて無償で得られた。新規ファイル生成には常にこのパターンを検討すべき。
- **self-review がフィールド名の誤記を発見**: design.md に `{ dest, templateName }` と誤記していたが、self-review サブエージェントが `{ from, to }` が正しいことを実コードから確認して修正。設計文書は実装前に独立レビューすると誤りを早期発見できる。
- **`.gitignore` 階層の活用**: `.mspec/.gitignore` に `ui.pid` と書くだけで `.mspec/ui.pid` が除外される。パスプレフィックスは不要。Git の階層型 gitignore の仕様を活用した最小実装。
- **FR-004 の HIGH 回帰リスクは実際には無害**: `ensureGitignoreEntry`（ルート `.gitignore` への追記）と新規 PlannedFile（`.mspec/.gitignore` 生成）はパスが完全に異なり干渉なし。命名の類似性から HIGH 判定したが、コード確認で問題なしを確認。
- **E2E テストのコード検査型アプローチ**: 一時ディレクトリ実行ではなく `readFile(INIT_TS)` でソースコードを検査する軽量な E2E テストで FR-012 の3シナリオを網羅できた。

### Next Steps

- `.mspec/.gitignore` テンプレートファイルに拡張子を付けるか否かの命名規約を統一する（現状: 拡張子なし、他テンプレートは `.yaml`/`.md`）
- `mspec init` の実動作を確認する統合テスト（実際の一時ディレクトリ上でのファイル生成検証）を追加することを検討 — FR-012
- `.mspec/.gitignore` に将来追加すべきランタイムファイルパターンが生じた場合は別チェンジで対応（OC-001 の継続）
