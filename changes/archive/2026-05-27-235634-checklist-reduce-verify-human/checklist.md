---
doc_type: Reference
---

<!-- @mspec-delta 2026-05-27-235634-checklist-reduce-verify-human/specs/verify-routing/spec.md -->
<!-- Requirements implemented: FR-006, FR-007, FR-008, FR-009 -->
<!-- Change: checklist-reduce-verify-human -->

<!-- @mspec-delta 2026-05-27-235634-checklist-reduce-verify-human/specs/artifact-preview/spec.md -->
<!-- Requirements implemented: FR-012 -->
<!-- Change: checklist-reduce-verify-human -->

# Checklist: checklist-reduce-verify-human

## Delta Spec Coverage

- [ ] FR-008: カテゴリ横断的 verify:auto 優先適用 — checklist 生成時に CLI コマンドで検証可能な項目・CI テストカバー FR・SoT Regression「影響なし」項目に対して `verify: human` が付与されないこと <!-- verify: fr-008 -->
- [ ] FR-009: verify:human 項目への確認手順必須記載 — `verify: human` アノテーション付き項目の直下に最低 2 項目の子箇条書き確認手順が記載されること <!-- verify: fr-009 -->
- [ ] FR-006 (MODIFIED): Constitution IV/VI を verify:cmd に変更 — `mspec anchor check` 実行後の Constitution IV 行と Security Capabilities grep 後の Constitution VI 行のアノテーション形式が変更後の仕様に一致すること <!-- verify: fr-006 -->
- [ ] FR-007 (MODIFIED): verify:human フォールバック最小化と優先順位拡張 — CLI コマンドで検証可能な項目に `verify: human` が使われないこと、E2E Scenario 対応 FR が `verify: fr-NNN` を受けること、`verify: human` 付与時に自動検証不可の理由括弧書きと確認手順子リストが存在すること <!-- verify: fr-007 -->
- [ ] FR-012: verify:cmd アノテーション付き項目への amber ハイライト — Web UI で `verify: cmd:...` 行が `verify: human` 項目と同様の amber 背景色でハイライトされ、`verify: fr-NNN` 行はハイライトされないこと <!-- verify: fr-012 -->

## Source-of-Truth Regression

- [ ] verify-routing SoT FR-003 (checklist verify 分岐): `risk_tier: critical` 項目が `verify: human` を受け、`standard` 項目が `verify: fr-NNN` を受け、`trivial` 項目がスキップされる従来の分岐動作が、FR-008/FR-007 の優先順位拡張後も維持されること（設計判断の妥当性は機械検証不可） <!-- verify: human -->
  - checklist.md を新規生成して `risk_tier: critical` の FR が `verify: human`、`standard` の FR が `verify: fr-NNN` を受けることを確認する
  - `trivial` の FR が checklist に出力されないことを確認する
- [ ] verify-routing SoT FR-005 (risk_tier デフォルト標準動作の継続): `risk_tier` 未記載または `standard` の FR に対して従来の `verify: fr-NNN` 付与動作が変化しないこと（FR-008 の優先順位変更が後方互換性を損なうリスクあり）（既存動作との差異は実行比較が必要で機械検証不可） <!-- verify: human -->
  - `risk_tier` フィールドのない既存 FR を含む checklist を生成し、`verify: fr-NNN` が付与されることを確認する
  - 新旧の checklist.md を比較し、`standard` 項目への verify 付与に変化がないことを確認する
- [ ] verify-routing SoT FR-006 (現行 Constitution IV/VI 動作の継続性): MODIFIED により `verify: human` から `verify: cmd` への変更が施されるが、チェックボックス事前確定ロジック（ゼロエラー→`- [x]`）は維持されること（動作継続の妥当性は実行比較が必要で機械検証不可） <!-- verify: human -->
  - `mspec anchor check` がゼロエラーの状態で checklist を生成し、Constitution IV 行が `- [x] <!-- verify: cmd:mspec anchor check -->` 形式で出力されることを確認する
  - エラーありの場合に `- [ ]` になることを確認する
- [ ] verify-routing SoT FR-007 (現行 verify:human フォールバックの継続性): MODIFIED により `verify: cmd` ルートが追加されるが、`verify: human` が最後の手段として機能し続け、理由括弧書き義務が後退していないこと（動作の後退有無は設計判断に依存し機械検証不可） <!-- verify: human -->
  - 自動化不可能な項目に `verify: human` + 理由括弧書き + 子リスト手順が付与されることを確認する
  - CLI コマンドで確認可能な項目が誤って `verify: human` になっていないことを確認する
- [ ] claude-integration SoT FR-011 (checklist-auditor の全項目アノテーション義務): 新設 `verify: cmd` 形式の項目を含む全チェックリスト行に対して「全項目に exactly 1 つの verify: アノテーション」の不変条件が維持されること（`verify: cmd` 項目が自己検証ステップの対象として認識されるかは実行検証が必要で機械検証不可） <!-- verify: human -->
  - 生成された checklist.md を grep して `verify:` アノテーションのない行がゼロであることを確認する
  - `verify: cmd` 行が重複アノテーションを持たないことを確認する
- [ ] claude-integration SoT FR-012 (implement ステップの verify:fr-NNN 自動チェック): `verify: cmd` 形式の項目が implement ステップの自動チェック対象に誤って含まれないこと（スコープ外への影響は実行検証が必要で機械検証不可） <!-- verify: human -->
  - implement ステップを実行し `verify: cmd` 項目が自動チェックされないことを確認する
  - `verify: fr-NNN` 項目のみが自動チェック対象になっていることを確認する
- [ ] artifact-preview SoT FR-001 (Markdown プレビュー基本動作): amber ハイライト拡張（FR-012 追加）後も既存の `verify: human` 項目のハイライトが正常に機能すること（視覚的 UX の許容性は機械検証不可） <!-- verify: human -->
  - Web UI で `verify: human` 行が引き続き amber ハイライトされることを目視確認する
  - `verify: cmd:...` 行も同様に amber ハイライトされることを目視確認する

## Constitution Check

- [x] Constitution I — ステップ独立性: design.md は他ステップ成果物を変更しない（pass 確認済み） <!-- verify: human -->
- [x] Constitution II — 決定論的マージ: 変更ファイルと変更内容が Delta Spec の ADDED/MODIFIED セクションと一致（pass 確認済み） <!-- verify: human -->
- [ ] Constitution III — 質問駆動の要件確定: research フェーズで Open Choices がすべてユーザー決定済みか、設計上の未決事項がないかを確認（設計判断の妥当性は機械検証不可） <!-- verify: human -->
  - research.md の Open Choices テーブルを確認し、すべての論点に「決定」が記載されていることを確認する
  - design.md に未決事項が残っていないことを確認する
- [x] Constitution IV — 双方向アンカー: `mspec anchor check` 実行結果 288 アンカー・0 エラー <!-- verify: human -->
- [ ] Constitution V — 強制ステップと拡張ステップの分離: 今回の変更が design ステップ内に収まり、他の強制ステップに副作用を持たないこと（ステップ境界の妥当性は機械検証不可） <!-- verify: human -->
  - 変更対象ファイル（checklist-auditor.md・web-ui renderer）が design ステップの産物のみに影響することを確認する
  - 他の mspec ステップスキルへの意図しない影響がないことを確認する
- [x] Constitution VI — Security by Default: 両 Delta Spec（verify-routing・artifact-preview）に `## Security Capabilities` セクション存在を確認済み <!-- verify: human -->
