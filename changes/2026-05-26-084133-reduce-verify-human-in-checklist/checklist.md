---
doc_type: Reference
---

<!-- @mspec-delta 2026-05-26-084133-reduce-verify-human-in-checklist/specs/verify-routing/spec.md -->
<!-- Requirements implemented: FR-006, FR-007 -->
<!-- Change: reduce-verify-human-in-checklist -->

# Checklist: reduce-verify-human-in-checklist

## Delta Spec Coverage

### verify-routing

- [ ] **FR-006** — Constitution IV / VI のインライン事前検証: `mspec anchor check` の実行結果に応じたチェックボックス確定ロジックが auditor Constraints セクションに明記されている <!-- verify: fr-006 -->
- [ ] **FR-006** — Constitution IV / VI のインライン事前検証: `## Security Capabilities` セクションの grep 確認ロジックが auditor Constraints セクションに明記されている <!-- verify: fr-006 -->
- [ ] **FR-007** — verify: human フォールバック最小化と理由明記義務: E2E Scenario 対応 FR が `<!-- verify: fr-NNN -->` を使用し `<!-- verify: human -->` が使用されないことが tasks.md 実行で確認できる <!-- verify: fr-007 -->
- [ ] **FR-007** — verify: human フォールバック最小化と理由明記義務: `<!-- verify: human -->` を付与する全項目に自動検証不可の理由括弧書きが記載されている <!-- verify: fr-007 -->

---

## Source-of-Truth Regression

### verify-routing SoT (specs/verify-routing/spec.md)

- [ ] **FR-003 後方互換** — checklist.md の verify 分岐（critical / standard / trivial）: 今回の Constraints 強化後も FR-003 の risk_tier 分岐ルール（critical → `verify: human`、standard → `verify: fr-NNN`、trivial → スキップ）が維持されているか確認する（auditor テキスト変更が既存の risk_tier 分岐優先順位を上書きしないか）（設計判断の維持確認は変更後ファイルの目視検証が必要） <!-- verify: human -->
- [ ] **FR-005 後方互換** — risk_tier 未記載 FR の標準動作: Constraints 変更後も risk_tier 未記載 FR が `<!-- verify: fr-NNN -->` を受け取る既存動作が壊れていないか（当チェンジの tasks.md スコープ外の可能性があり、既存 E2E の手動確認が必要） <!-- verify: human -->

### claude-integration SoT (specs/claude-integration/spec.md)

- [ ] **FR-011 後方互換** — checklist-auditor が全項目に verify メタデータを付与する義務: 新 Constraints の「verify: human 付与時の理由括弧書き義務」が FR-011 の「全項目に exactly one verify: アノテーション」要件を破らないか確認する（括弧書きの形式が future パーサーに干渉するリスクがある点は外部仕様との整合性のため機械検証不可） <!-- verify: human -->
- [ ] **FR-014 同期義務** — ランタイムと CLI テンプレートのファイル同期: `.claude/agents/mspec-checklist-auditor.md` と `packages/cli/templates/claude/agents/mspec-checklist-auditor.md` が同一内容に更新されているか（ファイル比較は `diff` で確認可能だが tasks.md のタスクとして明示的に含める必要がある） <!-- verify: human -->
- [ ] **FR-013 後方互換** — implement ステップの未チェック項目報告: `<!-- verify: human -->` 付与項目に括弧書き理由が追加されても、FR-013 の「verify: human 未チェック項目をグループ報告する」ロジックが括弧書き付き行を正しく認識するか確認する（行フォーマット変更の影響範囲は目視確認が必要） <!-- verify: human -->

---

## Constitution

- [x] **Constitution I — ステップ独立性**: auditor.md 変更は checklist ステップのみに閉じており、他ステップへの新依存がない（design.md 確認済み） <!-- verify: human -->
- [x] **Constitution II — 決定論的マージ**: Constraints セクション変更は auditor テキストのみ。パーサー変更なし（design.md 確認済み） <!-- verify: human -->
- [x] **Constitution III — 質問駆動の要件確定**: AskUserQuestion で「軽い解」選択・Constitution 自動化可否確定済み。Open Choices なし（design.md 確認済み） <!-- verify: human -->
- [x] **Constitution IV — 双方向アンカー**: `mspec anchor check` 実行結果 → 0 errors（auditor インライン検証済み） <!-- verify: human -->
- [x] **Constitution V — 強制ステップと拡張ステップの分離**: Constitution IV/VI 事前検証は既存 checklist ステップ内拡張。新ステップ追加なし（design.md 確認済み） <!-- verify: human -->
- [x] **Constitution VI — Security by Default**: Delta Spec に `## Security Capabilities` セクションと PRP-SEC 回答が存在することを grep で確認済み（auditor インライン検証済み） <!-- verify: human -->
