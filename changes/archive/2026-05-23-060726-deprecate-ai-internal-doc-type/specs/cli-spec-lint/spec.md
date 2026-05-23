# Delta Spec: cli-spec-lint

## ADDED Requirements

<!-- 新規 Requirement なし -->

## MODIFIED Requirements

### Requirement: FR-015 — テンプレート doc_type 検証は 4 種の Diátaxis 型のみを許容する

このシステムは SHALL `mspec validate` および E2E 不変条件テスト（`tests/e2e/template-doc-type-invariant.e2e.test.ts`）において、artifact テンプレートおよび change 内成果物の `doc_type:` フィールドの許容値集合を `Reference`, `Explanation`, `How-to`, `Tutorial` の **4 種** とし、`AI-Internal` を宣言したテンプレートを「未サポート値」としてエラー扱いしなければならない。許容値の単一定義源は `artifact-taxonomy` capability の FR-001 とし、validate 実装はそれを参照する。

#### Scenario: AI-Internal を宣言したテンプレートが validate でエラーになる
- GIVEN `tasks.md` テンプレートの YAML frontmatter が `doc_type: AI-Internal` を宣言している
- WHEN `mspec validate` を実行する
- THEN validate は「`AI-Internal` は無効な doc_type です; 許容値: Reference, Explanation, How-to, Tutorial」というエラーを報告する
- AND 終了コード非ゼロで終了する

#### Scenario: Mixed という無効値も validate でエラーになる
- GIVEN テンプレートまたは change 内成果物の YAML frontmatter に `doc_type: Mixed` が設定されている
- WHEN `mspec validate` を実行する
- THEN doc_type 検証がエラーとして「`Mixed` は無効な doc_type です; 許容値: Reference, Explanation, How-to, Tutorial」を報告する
- AND 終了コード非ゼロで終了する

## REMOVED Requirements

<!-- 削除する Requirement なし -->

## RENAMED Requirements

### Requirement: FR-015 — テンプレート doc_type 検証は `AI-Internal` を許容する -> FR-015 — テンプレート doc_type 検証は 4 種の Diátaxis 型のみを許容する
