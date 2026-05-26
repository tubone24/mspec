---
doc_type: Explanation
---

<!-- See also: ./design.md -->

<!-- @mspec-delta 2026-05-26-084133-reduce-verify-human-in-checklist/specs/verify-routing/spec.md -->
<!-- Requirements implemented: FR-006, FR-007 -->
<!-- Change: reduce-verify-human-in-checklist -->

# Design Rationale: reduce-verify-human-in-checklist

## Context

mspec-checklist-auditor が生成する checklist.md において、`<!-- verify: human -->` アノテーションが付いた項目が Constitution Check セクションで 100%、Source-of-Truth Regression セクションでもほぼ全件を占めていた。サンプル 3 件の平均で `verify: human` = 14.3 件 vs `verify: fr-NNN` = 11.7 件という比率であった。

この問題の根本原因は auditor の Constraints セクションにある「E2E Scenario 対応以外はすべて `verify: human`」という二択ルール。Constitution 項目や Regression 項目は E2E Scenario に直接対応しないため、機械的に検証可能なものも一律 `verify: human` になっていた。

特に Constitution IV（双方向アンカー）は `mspec anchor check` コマンドで完全自動検証できるにもかかわらず、常に `verify: human` で人間に委ねられていた。これはユーザーの「もう少し努力してほしい」という要求の核心部分であった。

## Decisions

**新アノテーション tier を作らず prompt 強化のみで対応する**という方針を選んだ。理由は以下の 3 点:
1. 新 tier（`verify: auditor`）を追加すると既存の `verify:` アノテーションパーサーや tasks.md 生成ロジックへの波及が生じ、bugfix モードの変更範囲を超える。
2. checklist.md を消費する downstream（tasks スキル、self-review スキル）が新アノテーション型を認識できない状態でリリースすると動作が未定義になる。
3. ユーザー自身が「軽い解（prompt 強化のみ）」を明示的に選択した。

Constitution IV と VI の事前検証については、アノテーションは `verify: human` のままで「チェックボックス状態だけ auditor が確定させる」方式を採用した。これにより既存のアノテーションパーサーを一切変更せず、人間が最終的に目視確認する文化も維持できる。

## Alternatives Considered

- **`verify: auditor` 新 tier の追加**: 機械検証可能な項目を明示的に分類できるが、パーサー変更・downstream スキルの対応が必要でスコープが重い。ユーザーが却下。
- **Constitution Check 項目を全廃**: verify: human の件数は減るが Constitution レビュー文化が崩れる。却下。
- **mspec-checklist SKILL.md でポスト処理**: auditor の出力後に SKILL.md 側でアノテーションを書き換える方法。ステップ独立性原則（I）に抵触するため却下。

## Trade-offs

- **受け入れたトレードオフ**: Constitution IV が `mspec anchor check` pass で `- [x]` になっても、アノテーションは `<!-- verify: human -->` のまま。これにより checklist の統計（verify:human の件数）は表面上変わらないが、実際に人間がレビューすべき件数は減る。
- **Constitution IV/VI 以外の Constitution 項目（I, II, III, V）は引き続き `verify: human`**: これらは設計判断の妥当性評価が必要であり、CLI コマンドで代替できない。

## Rejected Options

- **Constitution II の自動化（`mspec validate` パス = checked）**: `mspec validate` が通過してもマージ再実行の完全一致は確認できないため誤検知リスクがあり却下。
- **`verify: human reason=""` 属性形式**: 既存アノテーションパーサーの変更が必要になるため、括弧書き日本語テキストで代替。

## Constitution Check

| Principle | Phase 0 | Phase 1 |
|-----------|---------|---------|
| I. ステップ独立性 | 検証ロジックを auditor 内に完結させることで他ステップに依存しない | ✅ mspec-checklist SKILL.md は変更なし。auditor のみ変更 |
| II. 決定論的マージ | Constraints セクションの文字列変更。マージ先（SoT spec）は FR 追加のみ | ✅ archive コマンドで機械的にマージ可能 |
| III. 質問駆動の要件確定 | アプローチの軽重・Constitution 自動化可否の 2 問を AskUserQuestion で確定済み | ✅ 未決定事項なし |
| IV. 双方向アンカー | 両 auditor ファイルに `@mspec-delta` アンカーを付与済み | ✅ `mspec anchor check` で確認 |
| V. 強制ステップと拡張ステップの分離 | 既存 checklist ステップ内の拡張のみ。ステップ構造変更なし | ✅ workflow.yaml 変更なし |
| VI. Security by Default | ファイル変更はエージェント定義のみ。外部ネットワーク依存なし | ✅ 権限境界変更なし |
