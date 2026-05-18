# Delta Spec: cli-spec-lint

## ADDED Requirements

### Requirement: FR-015 — テンプレート doc_type 検証は `AI-Internal` を許容する

このシステムは SHALL `mspec validate` および E2E 不変条件テスト（`tests/e2e/template-doc-type-invariant.e2e.test.ts`）において、artifact テンプレートおよび change 内成果物の `doc_type:` フィールドの許容値集合を `Reference`, `Explanation`, `How-to`, `Tutorial`, `AI-Internal` の **5 種** とし、`AI-Internal` を宣言したテンプレートを「欠落」「未サポート値」として fail させてはならない。許容値の単一定義源は `artifact-taxonomy` capability の FR-001 とし、validate 実装はそれを参照する。

#### Scenario: AI-Internal を宣言したテンプレートが validate を通る
- GIVEN `tasks.md` テンプレートの YAML frontmatter が `doc_type: AI-Internal` を宣言している
- WHEN `mspec validate` を実行する
- THEN doc_type 検証はエラーを報告しない
- AND `template-doc-type-invariant.e2e.test.ts` が green である

#### Scenario: 列挙外の doc_type は validate が拒否する
- GIVEN いずれかのテンプレートの YAML frontmatter が `doc_type: Mixed` を宣言している
- WHEN `mspec validate` を実行する
- THEN doc_type 検証がエラーとして「`Mixed` is not a valid doc_type; allowed: Reference, Explanation, How-to, Tutorial, AI-Internal」を報告する
- AND 終了コード非ゼロで終了する

#### Scenario: doc_type フィールド欠落は引き続きエラー
- GIVEN いずれかのテンプレートの YAML frontmatter に `doc_type:` フィールドが存在しない
- WHEN `mspec validate` を実行する
- THEN doc_type 欠落をエラーとして報告する（本 FR は許容値拡張のみで、必須性は緩めない）

## MODIFIED Requirements

<!-- 本 change では既存 FR の本文改訂は行わない。許容値拡張は ADDED FR-015 で表現する -->

## REMOVED Requirements

<!-- 本 change では削除は行わない -->

## RENAMED Requirements

<!-- 本 change では FR の改名は行わない -->
