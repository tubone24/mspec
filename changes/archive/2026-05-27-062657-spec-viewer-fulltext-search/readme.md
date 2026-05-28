---
doc_type: Tutorial
---

<!-- @mspec-delta 2026-05-18-044538-revise-artifact-taxonomy/specs/artifact-taxonomy/spec.md -->
<!-- Requirements implemented: FR-005 -->
<!-- Change: revise-artifact-taxonomy -->

# spec-viewer-fulltext-search

> Status: new
> Created: 2026-05-27

## Request

spec viewer に全文検索機能を追加したい。現在の spec viewer では spec ファイルを閲覧できるが、キーワードで横断的に検索する手段がない。ユーザーが任意のキーワードを入力すると、すべての spec ファイルのタイトル・本文を横断検索し、マッチした箇所をハイライト表示できるようにする。

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

- **rehype プラグイン適用順が設計で必須**：`rehypeGherkinEars` は text node を前提とするため、`rehypeMarkText` を先に実行すると EARS ハイライトが無音で失われる。self-review で [blocker] として検出・修正した。
- **`mspec test expect-red` は全ランナー失敗を要求**：E2E のみの変更では cli-unit が常に exit 0 のため、自動化された赤フェーズ記録が不可能。赤エビデンスの手動作成というワークアラウンドが必要だった。
- **`useSearchIndex` の再利用不可**：Change Dashboard 用の `useSearchIndex` は `ChangeInfo[]` 専用設計のため、spec 検索用に `useSpecSearchIndex` を分離する判断は正しかった。`tokenize` のみを import 再利用することで一貫性を確保。
- **design.md の Anchors FR 列は tasks.md との橋渡しに重要**：`useDebounce.ts` のような汎用 hook の `@mspec-delta` アンカー先が曖昧だった。Project Structure テーブルに Anchors FR 列を追加することで実装ステップの曖昧さをゼロにできる。
- **debounce 後の E2E テストタイミング**：クリアボタン後の wait を 100ms → 300ms に修正（debounce 200ms を超える必要がある）。テストの待機時間は debounce 遅延より長くする原則を確認。

### Next Steps

- **右ペイン本文ハイライトの視覚確認**：Mermaid/EARS との競合は実装確認済みだが、実際のブラウザで複数キーワードを含む spec を開いて視覚確認することを推奨（`artifact-preview / FR-002, FR-003`）。
- **`expect-red` の E2E 専用ランナー対応**：cli-unit と web-ui-e2e が混在する場合、`expect-red` が E2E 失敗のみで赤証拠を記録できるよう mspec CLI の拡張を検討（関連: `cli-test-tdd` capability）。
- **Search.tsx の `⌘K` ショートカット実装**：現在は表示のみで機能しない。将来の機能強化として `/spec-viewer` での `⌘K` フォーカス動作の実装が候補（`spec-viewer-search / FR-001`）。
