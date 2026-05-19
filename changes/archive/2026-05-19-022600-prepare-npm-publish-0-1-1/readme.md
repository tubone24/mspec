---
doc_type: Tutorial
---

<!-- @mspec-delta 2026-05-18-044538-revise-artifact-taxonomy/specs/artifact-taxonomy/spec.md -->
<!-- Requirements implemented: FR-005 -->
<!-- Change: revise-artifact-taxonomy -->

# prepare-npm-publish-0-1-1

> Status: new
> Created: 2026-05-19
> Mode: minor

## Request

package.json のバージョンを 0.1.1 に更新し、npm publish が実行可能な状態に整える。公開に必要なメタデータ（`files`, `bin`, `repository` など）と前提条件（ビルド成果物、READMEなど）を確認・整備する。

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

- `npm publish --tag beta` の明示指定忘れはプリリリースでも `latest` を汚染するリスクがある（npm/cli #7553）。`publish.yml` での強制タグ指定が回帰を防ぐ唯一の防壁。
- `files` whitelist（`["dist", "templates"]`）に `README.md`/`LICENSE` を追加しなくても npm 慣例で自動同梱される——`packages/cli/` 直下に物理ファイルを置くだけで OK。
- `prepublishOnly` が publish 前のみ動く一方、`prepare` は `npm install` / git-dep 時にも実行される。CLI パッケージのビルドトリガには `prepublishOnly` が最適。
- research 段階で 5 件の Open Choices を全て確定したことで、implement フェーズでブロッキング質問ゼロを達成——research-first ワークフローの有効性を確認。
- メタデータのみの変更（実装コード変更なし）のため、アンカー必須対象が存在せず `mspec anchor check` が軽量に通過した（Constitution Principle IV の運用例）。

### Next Steps

- `git tag v0.1.1 && git push --tags` で CI 経由の `npm publish --tag beta` を実行し FR-003 を実運用で完結させる。
- publish 後に `npm view @mspec/cli dist-tags` で `beta: 0.1.1` / `latest` 未更新を目視確認する（checklist `verify: human` 項目の完了）。
- `latest` タグ昇格（`1.0.0` stable リリース時）は version-check FR-001/FR-003 との整合確認が別チェンジとして必要。
