---
doc_type: Reference
---

<!-- See also: ./design-rationale.md for採用理由・代替案 -->

# Design: deprecate-ai-internal-doc-type

## Summary

`AI-Internal` doc_type を廃止し、mspec が許容する `doc_type:` の値を Diátaxis の 4 種（`Reference` / `Explanation` / `How-to` / `Tutorial`）のみに絞り込む。変更の起点は `packages/cli/src/lib/artifact-validator.ts` の `VALID_DOC_TYPES` 配列からの 1 エントリ削除であり、そこから波及する テンプレート・テスト・ドキュメントを一括更新する。

## Technical Context

| 層 | ファイル | 変更内容 |
|---|---|---|
| 検証ロジック（SoT） | `packages/cli/src/lib/artifact-validator.ts` | `VALID_DOC_TYPES` から `'AI-Internal'` を削除 |
| テンプレート（ja） | `packages/cli/templates/artifacts/tasks.ja.md` | frontmatter `AI-Internal` → `Reference`、アンカー `FR-004` → `FR-007` |
| テンプレート（en） | `packages/cli/templates/artifacts/tasks.en.md` | 同上 |
| E2Eテスト | `tests/e2e/artifact-taxonomy-doc-type.e2e.test.ts` | ローカル `VALID_DOC_TYPES` 配列・`EXPECTED_DOC_TYPES` マップ・describeタイトルを更新 |
| E2Eテスト | `tests/e2e/template-doc-type-invariant.e2e.test.ts` | describe参照を `FR-004` → `FR-007`、テストを `AI-Internal` → `Reference` に置換 |
| E2Eテスト | `tests/e2e/doc-type-enforcement.e2e.test.ts` | 期待文字列から `AI-Internal` を除去、受け入れテストを reject テストに反転 |
| E2Eテスト | `tests/e2e/workflow-visual-mock.e2e.test.ts` | テスト用 proposal.md モックの `doc_type: AI-Internal` → `Explanation` |
| ドキュメント | `docs/reference/doc-types.md` | Roadmap セクション（L50）を「廃止済み」に更新（out-of-band docs maintenance; not FR-gated） |

## Project Structure

### 単一定義源の連鎖

```
artifact-validator.ts
  └─ VALID_DOC_TYPES: ['Reference','Explanation','How-to','Tutorial']   ← ここを変更
       └─ VALID_DOC_TYPES_LIST = VALID_DOC_TYPES.join(', ')             ← 自動連動
            └─ エラーメッセージ内で参照                                   ← 自動連動
```

`VALID_DOC_TYPES` の変更のみで検証ロジックとエラーメッセージが連動する。テスト内のローカル定義はそれぞれ手動更新が必要。

### tasks.md テンプレートのアンカー変更

```
変更前:
<!-- @mspec-delta .../artifact-taxonomy/spec.md -->
<!-- Requirements implemented: FR-001, FR-004 -->

変更後:
<!-- @mspec-delta .../artifact-taxonomy/spec.md -->
<!-- Requirements implemented: FR-001, FR-007 -->
```

FR-004 は REMOVED、FR-007（tasks.md SHALL use Reference）が代替として ADDED される。

## Decisions

### D-1: `VALID_DOC_TYPES` を単一変更点とする

**受け入れ基準（→ artifact-taxonomy FR-002 Scenario「AI-Internal doc_type is rejected by validate」）**
- GIVEN: テンプレートの YAML frontmatter に `doc_type: AI-Internal` が設定されている
- WHEN: `mspec validate` を実行する
- THEN: validate は doc_type 値の不正をエラーとして報告し、終了コード非ゼロで終了する

実装: `VALID_DOC_TYPES` 配列から `'AI-Internal'` を削除するだけで達成される。

### D-2: tasks.md テンプレートを `Reference` に変更する

**受け入れ基準（→ artifact-taxonomy FR-007 Scenario「tasks.md テンプレートは Reference として分類される」）**
- GIVEN: mspec の artifact テンプレートディレクトリに `tasks.md` テンプレートが存在する
- WHEN: テンプレートの YAML frontmatter を確認する
- THEN: `doc_type: Reference` が宣言され、`AI-Internal` は使用されていない

実装: `tasks.ja.md`・`tasks.en.md` の frontmatter を書き換え、アンカーを FR-007 に更新する。

### D-3: E2E テストは削除せず振る舞いを反転する

**受け入れ基準（→ cli-spec-lint FR-015 Scenario「AI-Internal を宣言したテンプレートが validate でエラーになる」）**
- GIVEN: `doc_type: AI-Internal` を宣言したテンプレートが存在する
- WHEN: `mspec validate` を実行する
- THEN: 「AI-Internal は無効な doc_type です; 許容値: Reference, Explanation, How-to, Tutorial」というエラーを報告する
- AND: 終了コード非ゼロで終了する

実装: `doc-type-enforcement.e2e.test.ts` の `'accepts AI-Internal (exit 0)'` テストを `'rejects AI-Internal (exit non-zero)'` に反転。

---

## Constitution Check

| 原則 | Phase 0 | Phase 1 |
|---|---|---|
| I: ステップ独立性 | ✅ design は他ステップ成果物を変更しない | ✅ design.md・design-rationale.md・architecture-overview.md は独立した成果物 |
| II: 決定論的マージ | ✅ Delta Spec の ADDED/MODIFIED/REMOVED は互いに競合しない | ✅ D-1〜D-3 の実装箇所はファイル・行番号レベルで重複なし |
| III: 質問駆動の要件確定 | ✅ research ステップで Open Choices 3 件を解決済み | ✅ design に未解決の Open Choice なし |
| IV: 双方向アンカー | ✅ tasks.md アンカーを FR-004 → FR-007 に更新する計画を design に明記 | ✅ D-2 の受け入れ基準が FR-007 Scenario と 1:1 対応 |
| V: 強制ステップと拡張ステップの分離 | ✅ design は拡張ステップ。delta で確定した要件の実装計画のみ記述 | ✅ 新しい要件の追加なし |

### Complexity Tracking

None

---

## Self-Review

> Reviewed by: mspec-self-reviewer subagent
> Date: 2026-05-23

### Findings

| # | Severity | Location | Issue | Resolution |
|---|---|---|---|---|
| 1 | WARN | `architecture-overview.md` System Diagram | `docs/reference/doc-types.md` が design.md Technical Context に記載されているが diagram のノードに存在しなかった | diagram に `Docs["docs/reference/doc-types.md\nRoadmap セクション廃止済みに更新"]` ノードを追加して修正済み |
| 2 | INFO | `design.md` D-3 THEN 句 | 終了コード条件（AND 終了コード非ゼロで終了する）が欠落しており、FR-015 Scenario との対応が不完全だった | `- AND: 終了コード非ゼロで終了する` を追記して修正済み |
| 3 | INFO | `design.md` L78 | THEN 句の引用符が「`AI-Internal`...」（開き括弧なし）と不正だった | 「AI-Internal は無効な doc_type です...」に修正済み |
| 4 | INFO | `design.md` Technical Context（docs行） | `docs/reference/doc-types.md` 更新が FR-gated でない out-of-band 作業である旨が不明だった | "(out-of-band docs maintenance; not FR-gated)" 注記を追加して修正済み |
| 5 | INFO | `checklist.md` FR-001 coverage | FR-001 MODIFIED の carry-over Scenario（design-rationale.md のフロントマター検証）が checklist に含まれていない | 低優先度。このチェンジで design-rationale.md テンプレートを変更しないため regression リスクは極小。記録のみ |

### Constitution Re-Evaluation

| 原則 | Phase 0 独立評価 | 評価結果 |
|---|---|---|
| I: ステップ独立性 | ✅ design.md は他ステップ成果物を変更しない | 合意 |
| II: 決定論的マージ | ✅ FR-007 ADDED・FR-001/FR-002/FR-015 MODIFIED・FR-004 REMOVED は互いに重複しない | 合意 |
| III: 質問駆動の要件確定 | ✅ research.md で 7 件の Open Choice を解決済み。design に未解決事項なし | 合意 |
| IV: 双方向アンカー | ✅ docs/reference/doc-types.md 更新は FR アンカーなしだが out-of-band として明記した | 合意（Finding #4 で対処済み）|
| V: 強制ステップと拡張ステップの分離 | ✅ workflow.yaml のステップ構造を変更していない | 合意 |

### Verdict

PASS_WITH_NOTES — WARN 1 件（docs ノード欠落）と INFO 4 件を検出。いずれも修正済みまたは記録済みであり、implement ステップへの進行を妨げるブロッカーはない。
