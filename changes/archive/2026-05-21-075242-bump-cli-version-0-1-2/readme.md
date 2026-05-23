---
doc_type: Tutorial
---

<!-- @mspec-delta 2026-05-18-044538-revise-artifact-taxonomy/specs/artifact-taxonomy/spec.md -->
<!-- Requirements implemented: FR-005 -->
<!-- Change: revise-artifact-taxonomy -->

# bump-cli-version-0-1-2

> Status: archived
> Created: 2026-05-21
> Mode: minor

## Request

CLI のバージョンを現在の値から 0.1.2 に更新する。
`package.json` などのバージョン定義箇所を 0.1.2 に変更するシンプルなバージョンバンプ。

## Artifacts

- [ ] proposal.md
- [x] specs/<capability>/spec.md (Delta Spec)
- [x] research.md
- [x] design.md / design-rationale.md / architecture-overview.md
- [ ] design-rationale.md
- [x] quickstart.md
- [x] checklist.md
- [x] tasks.md

## Skipped Steps

<!-- `mspec skip <step-id> --reason "..."` 実行時に追記される -->
<!-- 例: - research: typo 修正のみのため省略 (skipped at 2026-05-14T10:30:00Z) -->

## Summary (Lessons / Next Steps)

### Lessons

- **TDD での版バンプパターンが定着**: テストの期待値を先に `0.1.2` に更新して Red にし、`package.json` 更新で Green にする手順が明確。`publish-prep.test.ts` がバージョン値のセンサーとして機能することを確認。
- **T102 の pre-existing failure が TDD 証拠収集の妨げになる**: `npm publish --dry-run` が既存バージョン衝突で常に失敗するため、全スイートでは `expect-green` が取れない。テストをスコープ絞りで記録するパターンを確立（`publish-prep.test.ts` のみ実行）。
- **`enforce_tdd` は全タスクに red + green 証拠が必要**: E2E タスク（Task 2-1）と実装タスク（Task 3-1）の両方に green-evidence が必要。E2E タスクは Red で止めがちだが green-evidence がないと `mspec done implement` が拒否される。
- **`package-lock.json` の再生成は `npm install` で簡単**: `npm install` 一発で lock ファイルのバージョンが `package.json` と同期する。手動編集は不要。

### Next Steps

- **T102 テスト（npm publish dry-run）の恒久修正**: バージョン `0.1.1` がすでに publish 済みのため常時失敗している。バージョンバンプ後に CI でも失敗しないよう別変更で修正推奨。
- **`fix-upgrade-package-json-path` のグローバル環境動作確認**: `npm install -g .` で実際にグローバルインストールして `mspec upgrade` が `Cannot find module` を出さないことを手動確認（FR-002 実証）。
