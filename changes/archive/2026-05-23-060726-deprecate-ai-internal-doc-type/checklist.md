---
doc_type: Reference
---

# Checklist: deprecate-ai-internal-doc-type

## Delta Spec Coverage

### artifact-taxonomy

- [x] **FR-007 ADDED — `tasks.md` テンプレートの doc_type は `Reference` である**: `tasks.ja.md` および `tasks.en.md` の YAML frontmatter が `doc_type: Reference` を宣言しており、`AI-Internal` が使用されていないことを確認する。現状は両ファイルとも `doc_type: AI-Internal` を宣言しており、変更が必要。 <!-- verify: fr-007 -->

- [x] **FR-007 ADDED — アンカー更新**: `tasks.ja.md` および `tasks.en.md` の `@mspec-delta` アンカーが `FR-004` から `FR-007` に更新されていることを確認する（`Requirements implemented: FR-001, FR-007`）。現状は `FR-001, FR-004` のまま。 <!-- verify: fr-007 -->

- [x] **FR-001 MODIFIED — 許容 doc_type の五種から四種への縮小**: `artifact-validator.ts` の `VALID_DOC_TYPES` 配列から `'AI-Internal'` が削除され、許容値が `Reference`, `Explanation`, `How-to`, `Tutorial` の四種のみになっていることを確認する。現状は五種を含んでいる。 <!-- verify: fr-001 -->

- [x] **FR-001 MODIFIED — エラーメッセージの自動連動**: `VALID_DOC_TYPES_LIST` が `'AI-Internal'` を含まない四種の文字列に自動連動することを確認する（`artifact-validator.ts` の `join` 呼び出しによる派生）。 <!-- verify: fr-001 -->

- [x] **FR-002 MODIFIED — `AI-Internal` が validate によって拒否される**: `AI-Internal` を frontmatter に持つアーティファクトに対して `mspec validate` を実行したとき、非ゼロの終了コードとエラーメッセージが返されることを確認する。 <!-- verify: fr-002 -->

- [x] **FR-002 MODIFIED — 許容値の制約が四種に収まる**: いずれの mspec アーティファクトの doc_type も `Reference`, `Explanation`, `How-to`, `Tutorial` のいずれかであり、`AI-Internal` を使用しているアーティファクトが残存しないことを確認する。 <!-- verify: fr-002 -->

- [x] **FR-004 REMOVED — 旧 FR-004 への参照が残存しない**: `tasks.ja.md`, `tasks.en.md`, `artifact-taxonomy-doc-type.e2e.test.ts`, `template-doc-type-invariant.e2e.test.ts` において `FR-004` への参照が完全に除去されていることを確認する。 <!-- verify: human -->

### cli-spec-lint

- [x] **FR-015 MODIFIED — `AI-Internal` が validate でエラーになる**: `doc-type-enforcement.e2e.test.ts` の `'accepts AI-Internal (exit 0)'` テストが `'rejects AI-Internal (exit non-zero)'` に反転されており、`AI-Internal` を宣言したアーティファクトが非ゼロ終了コードとともに拒否されることを確認する。 <!-- verify: fr-015 -->

- [x] **FR-015 MODIFIED — エラーメッセージが四種の許容値を示す**: `mspec validate` が `AI-Internal` を拒否する際のエラーメッセージが「`AI-Internal` は無効な doc_type です; 許容値: Reference, Explanation, How-to, Tutorial」（または英語同等表現）を含むことを確認する。 <!-- verify: fr-015 -->

- [x] **FR-015 MODIFIED — `Mixed` は引き続き拒否される**: 変更後も `doc_type: Mixed` を持つアーティファクトが `mspec validate` によって拒否されることを確認する（既存の回帰テストが green を維持する）。 <!-- verify: fr-015 -->

- [x] **FR-015 MODIFIED — `doc_type` フィールド欠落は引き続きエラー**: `doc_type` フィールドを持たないアーティファクトが `mspec validate` によって引き続きエラーとして報告されることを確認する（許容値集合の縮小が必須性の緩和を意図しないことの確認）。 <!-- verify: fr-015 -->

## Source-of-Truth Regression

- [ ] ⚠️ **SoT artifact-taxonomy FR-004 の残存リスク**: SoT spec (`specs/artifact-taxonomy/spec.md`) には旧 FR-004「`tasks.md` テンプレートの doc_type は `AI-Internal` である」が残っている。`mspec archive` が Delta Spec の REMOVED 宣言を正しく反映して FR-004 を削除しない限り、SoT と実装の乖離が生じる。archive ステップで FR-004 が SoT から削除されることを確認すること。 <!-- verify: human -->

- [x] ⚠️ **`artifact-taxonomy-doc-type.e2e.test.ts` のローカル `VALID_DOC_TYPES` および `EXPECTED_DOC_TYPES` の不整合リスク**: テストファイル内のローカル `VALID_DOC_TYPES` は現在 `'AI-Internal'` を含む五種を宣言しており、`EXPECTED_DOC_TYPES` は `tasks.ja.md`/`tasks.en.md` を `'AI-Internal'` として期待している。これらを四種・`'Reference'` にそれぞれ更新しないと、`artifact-validator.ts` の変更後にテストが失敗する。手動更新が必要であることを確認する。 <!-- verify: human -->

- [x] ⚠️ **`template-doc-type-invariant.e2e.test.ts` の `AI-Internal` locale-invariant テストの回帰リスク**: `'AI-Internal 識別子も ja/en テンプレート間で locale-invariant'` テストは `tasks.ja.md`・`tasks.en.md` に `doc_type: AI-Internal` が存在することを前提としている。テスト内容を `doc_type: Reference` を検証する内容に置換するか、`FR-004` 参照を `FR-007` に更新することを確認する。 <!-- verify: human -->

- [x] ⚠️ **`doc-type-enforcement.e2e.test.ts` の `'accepts AI-Internal (exit 0)'` テストの破壊リスク**: `VALID_DOC_TYPES` から `AI-Internal` を削除すると、このテストの `expect(status).toBe(0)` が失敗に転じる。テストを `'rejects AI-Internal (exit non-zero)'` に反転しないと CI が赤になる。この反転が実装済みであることを確認する。 <!-- verify: human -->

- [x] ⚠️ **`workflow-visual-mock.e2e.test.ts` の `doc_type: AI-Internal` モックの破壊リスク**: `setupProjectWithRealWorkflow` 内の `proposal.md` モックが `doc_type: AI-Internal` を宣言している（L32）。`mspec validate` がこのディレクトリに対して実行された場合、変更後は失敗する。`doc_type: Explanation` に変更する必要があることを確認する。 <!-- verify: human -->

- [ ] ⚠️ **`cli-spec-lint FR-015` の許容値リストのエラーメッセージ回帰**: 旧 FR-015 の Scenario にエラーメッセージ例として `AI-Internal` を許容値に含む文字列が SoT spec に記載されている。変更後のエラーメッセージは `AI-Internal` を除いた「allowed: Reference, Explanation, How-to, Tutorial」になる。SoT spec のエラーメッセージ例が archive 後に更新されることを確認する。 <!-- verify: human -->

- [ ] ⚠️ **`artifact-taxonomy FR-002` タイトルと本文の整合リスク**: SoT の FR-002 は現在五種を列挙している。変更後は四種に縮小されるため、archive 後に FR-002 のタイトルおよび本文が四種に合わせて更新されることを確認する。 <!-- verify: human -->

- [ ] ⚠️ **`artifact-taxonomy FR-001` の Scenario「tasks.md template declares AI-Internal」の回帰リスク**: SoT の FR-001 には `tasks.md` が `AI-Internal` を宣言することを検証する Scenario が含まれている。Delta Spec の MODIFIED FR-001 はこの Scenario を「tasks.md template declares Reference not AI-Internal」に置換するが、archive が Scenario レベルで正確に置換されることを確認する。 <!-- verify: human -->

## Constitution Check

- [x] **原則 I — ステップ独立性**: design.md は他ステップ成果物を変更しておらず、変更対象ファイル（`artifact-validator.ts`、テンプレート、E2E テスト）は implement ステップで個別に更新される独立した成果物として扱われている。 <!-- verify: human -->

- [x] **原則 II — 決定論的マージ**: Delta Spec の ADDED（FR-007）・MODIFIED（FR-001, FR-002, FR-015）・REMOVED（FR-004）はそれぞれ異なる Requirement を対象としており、競合なくマージ可能である。 <!-- verify: human -->

- [x] **原則 III — 質問駆動の要件確定**: design.md に未解決の Open Choice がなく、research ステップで解決済みであることが明記されている。設計上の決定（D-1〜D-3）がすべて対応する Scenario に 1:1 で紐付いていることを確認する。 <!-- verify: human -->

- [x] **原則 IV — 双方向アンカー**: `tasks.ja.md` および `tasks.en.md` のアンカーが `FR-004` から `FR-007` に更新される。すべての FR が最低 1 つのアンカーブロックに紐付くことを確認する。 <!-- verify: human -->

- [x] **原則 V — 強制ステップと拡張ステップの分離**: 本 change は `VALID_DOC_TYPES` 配列の縮小とテンプレート・テストの更新に限定されており、`workflow.yaml` のステップ構造を変更していない。 <!-- verify: human -->
