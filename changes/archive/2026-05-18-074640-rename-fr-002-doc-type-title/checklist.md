---
doc_type: Reference
---

# Checklist: rename-fr-002-doc-type-title

## Delta Spec Coverage

- [ ] `## RENAMED Requirements` セクションに `FR-002 — doc_type value is constrained to the four Diátaxis types -> FR-002 — doc_type value is constrained to the five permitted types` が正確に記載されている <!-- verify: human -->
- [ ] Delta Spec の旧タイトル文字列が SoT spec 28行目の `### Requirement: FR-002 — doc_type value is constrained to the four Diátaxis types` とバイト一致（先頭・末尾の空白なし）する <!-- verify: human -->
- [ ] `## ADDED Requirements`、`## MODIFIED Requirements`、`## REMOVED Requirements` の各セクションが意図的に空（コメントプレースホルダのみ）である <!-- verify: human -->
- [ ] 新タイトル「five permitted types」は FR-002 本文が定義する 5 種（`Reference`, `Explanation`, `How-to`, `Tutorial`, `AI-Internal`）を正確に要約している <!-- verify: human -->
- [ ] RENAMED セクションの書式が `cli-archive` FR-001 のパーサー仕様（`FR-NNN — <旧> -> FR-NNN — <新>` 形式）に適合している <!-- verify: human -->

## Source-of-Truth Regression

- [ ] `mspec archive` 後、SoT spec の FR-002 本文に残る自己参照注記（「タイトル文字列は歴史的に『four Diátaxis types』と命名されている…タイトル改名は後続の change で扱う」）が新タイトルと矛盾する状態になる。この注記を削除するか歴史的記録として保持するかを人手で判断し、必要なら follow-up change を切ること <!-- verify: human -->
- [ ] `mspec archive` の RENAMED マージが FR-002 の Scenarios・本文を一切変更せず、タイトル行のみを置換することを確認する <!-- verify: human -->
- [ ] 他 capability の SoT spec（`cli-archive`、`cli-anchor`、`claude-integration` など）は同番の自 capability FR-002 を参照しているだけであり、`artifact-taxonomy/spec.md` の FR-002 タイトルへのクロス参照は存在しないことを確認する <!-- verify: human -->
- [ ] `mspec archive` 後に `mspec validate` を実行し、SoT spec の整合性エラーがゼロであることを確認する <!-- verify: human -->
- [ ] `mspec anchor check` 後にアンカー解決エラーがゼロであることを確認する（本 change はコード変更を含まないため既存アンカーへの影響は想定しないが念のため） <!-- verify: human -->

## Constitution

- [ ] **Principle I — ステップ独立性**: 本 change は SoT spec の FR-002 タイトル行のみを変更し、他ステップ・他 capability への副作用がないことを確認する <!-- verify: human -->
- [ ] **Principle II — 決定論的マージ**: RENAMED マージは `mspec archive` CLI パーサーが純粋関数として処理し、LLM を使用しないことを確認する <!-- verify: human -->
- [ ] **Principle III — 質問駆動の要件確定**: タイトル変更は自明であり追加質問不要と判断された根拠が `design.md` の Decisions セクションに記録されていることを確認する <!-- verify: human -->
- [ ] **Principle IV — 双方向アンカー**: 本 change はコード実装・E2E テストを含まないためアンカー付与対象外であることを確認し、既存アンカーへの影響もないことを確認する <!-- verify: human -->
- [ ] **Principle V — 強制ステップと拡張ステップの分離**: `workflow.yaml` の強制ステップ定義・`removable` フラグに変更がないことを確認する <!-- verify: human -->
