# Delta Spec: verify-routing

## Security Capabilities

<!-- proposalのsecurity質問（PRP-SEC-001〜004）の回答からmspec-proposalスキルが記述する -->
<!-- 権限境界: ファイル読み取り専用（agent が新たな権限境界を持たない） -->
<!-- アクセス増加: なし -->
<!-- エージェント権限: mspec-checklist-auditor が既存権限（Bash/Read/Grep）の範囲内で追加コマンドを実行するのみ -->
<!-- ロールバック手段: checklist.md を削除して checklist ステップを再実行 -->

## ADDED Requirements

### Requirement: FR-006 — Constitution IV / VI のインライン事前検証

<!-- risk_tier: standard -->
<!-- blast_radius: module -->

mspec-checklist-auditor が Constitution Check 項目を生成するとき、このシステムは SHALL 以下のルールに従って Constitution IV と VI を事前に静的検証し、チェックボックス状態を確定させる:
- **Constitution IV（双方向アンカー）**: `mspec anchor check` を実行し、ゼロエラーなら `- [x]`、エラーありなら `- [ ]` でチェックボックスを確定する。アノテーションは `<!-- verify: human -->` を維持する。
- **Constitution VI（Security by Default）**: Delta Spec の `## Security Capabilities` セクション存在と PRP-SEC 回答の有無を grep で確認し、存在すれば `- [x]`、不在なら `- [ ]` でチェックボックスを確定する。アノテーションは `<!-- verify: human -->` を維持する。
- コマンド実行が失敗した場合は `- [ ]` のまま、エラー内容を項目テキストに括弧書きで注記する。

#### Scenario: Constitution IV アンカーゼロエラー時の自動 checked

- GIVEN `mspec anchor check` を実行した結果がゼロエラーである
- WHEN mspec-checklist-auditor が Constitution Check の IV（双方向アンカー）項目を生成する
- THEN checklist.md の Constitution IV 行が `- [x] <!-- verify: human -->` として出力される

#### Scenario: Constitution VI Security Capabilities セクション存在時の自動 checked

- GIVEN Delta Spec（`changes/<change>/specs/*/spec.md`）の `## Security Capabilities` セクションに PRP-SEC-001〜004 の回答が記載されている
- WHEN mspec-checklist-auditor が Constitution Check の VI（Security by Default）項目を生成する
- THEN checklist.md の Constitution VI 行が `- [x] <!-- verify: human -->` として出力される

---

### Requirement: FR-007 — verify: human フォールバック最小化と理由明記義務

<!-- risk_tier: standard -->
<!-- blast_radius: module -->

mspec-checklist-auditor が checklist.md の各項目に `<!-- verify: human -->` アノテーションを付与するとき、このシステムは SHALL 以下の優先順位で verify 種別を決定し、`verify: human` は最後の手段として使用する:
(1) Delta Spec に E2E Scenario が存在する FR → `<!-- verify: fr-NNN -->` を使用する、
(2) FR-006 の Constitution IV / VI 条件に合致する → インライン検証後に `<!-- verify: human -->` でチェックボックスを確定する、
(3) 上記以外で `<!-- verify: human -->` を付与する場合 → 自動検証が不可能な理由を括弧書きで項目テキスト末尾に明記すること（例: `（設計判断の妥当性は機械検証不可）`）。

#### Scenario: verify: human 付与時の理由明記

- GIVEN Source-of-Truth Regression 項目が視覚的 UX 判断を要する内容である
- WHEN mspec-checklist-auditor が当該項目に `<!-- verify: human -->` を付与する
- THEN 項目テキスト末尾に自動検証不可の理由が括弧書きで記載されている

#### Scenario: E2E Scenario 対応 FR は verify: fr-NNN を優先

- GIVEN Delta Spec の FR-001 に E2E Scenario が存在する
- WHEN mspec-checklist-auditor が FR-001 の Delta Spec Coverage 項目を生成する
- THEN アノテーションは `<!-- verify: fr-001 -->` であり、`<!-- verify: human -->` は使用されない

---

## MODIFIED Requirements

<!-- 既存 Requirement を変更する場合は `### Requirement: FR-NNN — <既存タイトル>` を書く -->

## REMOVED Requirements

<!-- 削除する Requirement の FR-NNN を書く -->

## RENAMED Requirements

<!-- リネームは `### Requirement: FR-NNN — <旧> -> FR-NNN — <新>` -->
