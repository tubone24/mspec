---
doc_type: Tutorial
---

<!-- @mspec-delta 2026-05-18-044538-revise-artifact-taxonomy/specs/artifact-taxonomy/spec.md -->
<!-- Requirements implemented: FR-005 -->
<!-- Change: revise-artifact-taxonomy -->

# web-ui-artifact-order-and-test-results

> Status: new
> Created: 2026-05-28

## Request

Web UIのアーティファクト一覧画面で、アーティファクトをワークフローの実行順（上から下）に並べるよう修正する。
テストリザルトをエージェントJSONの `red` / `green` フィールドとして出力し、Web UIはそのデータを参照してテストリザルト画面を構成する（チェンジごとに独立して管理）。
テストリザルト画面では、各テストがどのチェックリスト項目に紐づくかも同じ画面で確認できるようにする。

## Artifacts

- [x] proposal.md
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

- **サーバー側ソートで責務が明確になった**: アーティファクトのソートをサーバー側（routes/artifacts.ts）で実施したことで、クライアント（ChangeDetail.tsx）は受け取った配列をそのまま render するだけになり責務が明確に分離された。将来の API 利用者もソート済みリストを受け取れる。
- **Self-Review が FR-005/FR-006 の stale を発見した**: FR-001 MODIFIED によりデータソースが変わった後も FR-005・FR-006 が旧データソース前提で記述されていた。Self-Review ステップが Constitution 原則 III 違反として検出し、Delta Spec への MODIFIED エントリ追加で解決。
- **TDD の RED→GREEN は E2E テストタスクにも個別の green evidence が必要**: `mspec done implement` 実行時に、E2E テスト記録タスク（2.1、2.3 等）も独立した green evidence を要求された。実装タスクの evidence は E2E タスクとは別に記録が必要。
- **CLI API サーバーは dist/ ビルドを参照するため変更後は再ビルド＋再起動が必須**: アーティファクトソートの E2E テストが最初に失敗したのは、サーバーが古い dist/ から実行されていたため。ソース変更後は `pnpm run build` + サーバー再起動のセットが必要。
- **別チェンジの未実装が pre-existing failure を生んだ**: `checklist-reduce-verify-human` チェンジが `GherkinHighlight` を未配線のまま残しており、`gherkin-highlight` E2E テストが失敗していた。`rehypeGherkinEars` に `data-testid` を追加する形で修正し、依存関係の解消を先行実施した。

### Next Steps

- `mspec test-results convert --change <id>` の CLI コマンド登録が未完: `convertTestResults` 関数は実装済みだが、mspec CLI への配線（コマンド登録）が残っている (agent-runner FR-004)
- FR-010 ID 衝突の解消: `change-dashboard` と `test-result-viewer` が同じ FR-010 番号を持つ。`capability:fr-nnn` 形式への移行で checklist 紐づきの曖昧さを解消する (design.md D-8)
- テスト名命名規約 `[FR-NNN]` のドキュメント化: 既存テストへの一括リネームと、命名規則を CONTRIBUTING.md 等に追記する必要がある
