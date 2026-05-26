---
doc_type: Reference
---

<!-- See also: ./design-rationale.md for採用理由・代替案 -->

<!-- @mspec-delta 2026-05-26-084133-reduce-verify-human-in-checklist/specs/verify-routing/spec.md -->
<!-- Requirements implemented: FR-006, FR-007 -->
<!-- Change: reduce-verify-human-in-checklist -->

# Design: reduce-verify-human-in-checklist

## Summary

`mspec-checklist-auditor.md` の Constraints セクションを強化し、`verify: human` の使用を本当に人間判断が必要なケースのみに絞り込む。Constitution IV（双方向アンカー）と VI（Security by Default）については auditor がインラインで CLI コマンドを実行してチェックボックス状態を確定させる。それ以外で `verify: human` を使う場合は自動検証不可の理由を括弧書きで明記する義務を課す。

変更対象ファイルは 2 つのみ（auditor agent 定義と CLI テンプレートの同一ファイル対）。パーサー変更・新アノテーション tier 追加・新 CLI コマンド追加は一切行わない。

---

## Technical Context

### 変更対象ファイル

| ファイル | 役割 | 変更内容 |
|----------|------|----------|
| `.claude/agents/mspec-checklist-auditor.md` | プロジェクト側 auditor エージェント定義 | Constraints セクション（行 40-56）の優先順位ルール強化 + Constitution IV/VI インライン検証ルール追加 |
| `packages/cli/templates/claude/agents/mspec-checklist-auditor.md` | `mspec init` で展開される CLI テンプレート | 上記と同一内容に同期 |

### 現行 Constraints の問題

```
# 現行（変更前）
- **E2E Scenario 対応項目** → `<!-- verify: fr-NNN -->`
- **それ以外の項目** → `<!-- verify: human -->`
- アノテーションなし行が存在する場合: 該当行に `<!-- verify: human -->` を付与
```

「それ以外」のカテゴリが広すぎる。Constitution Check 全 6 項目・Source-of-Truth Regression 全項目がここに流れ込み、機械検証可能な項目までがすべて `verify: human` になってしまっている。

---

## Project Structure

### 変更後の Constraints セクション（新設計）

```markdown
## Constraints

- Items must be unchecked (`- [ ]`) by default; humans tick them after verification.
  - **例外**: Constitution IV と VI は後述のルールで事前検証し、チェックボックス状態を確定させる。
- Annotate each checklist item with exactly one `verify:` inline comment:
  **優先順位（高 → 低）:**
  1. **critical FR 項目**（risk_tier: critical） → `<!-- verify: human -->`
  2. **E2E Scenario 対応項目**（Delta Spec の特定 FR Scenario で自動検証可能） → `<!-- verify: fr-NNN -->`
  3. **Constitution IV（双方向アンカー）**:
     - `mspec anchor check` を実行する
     - ゼロエラー → `- [x] <!-- verify: human -->`
     - エラーあり → `- [ ] <!-- verify: human -->` + エラー内容を括弧注記
  4. **Constitution VI（Security by Default）**:
     - Delta Spec の `## Security Capabilities` セクション存在と PRP-SEC 回答有無を grep する
     - 存在確認 → `- [x] <!-- verify: human -->`
     - 不在 → `- [ ] <!-- verify: human -->`
  5. **それ以外すべて** → `<!-- verify: human -->`
     **義務**: 自動検証が不可能な理由を括弧書きで項目テキスト末尾に明記すること
     例: `（設計判断の妥当性は機械検証不可）`、`（視覚的許容性は機械検証不可）`
- 自己検証ステップ: 全項目書き込み後、`verify:` アノテーションなし行を再スキャンする
  - アノテーションなし行が存在する場合: まず E2E Scenario 対応かを確認し、対応なければ
    `<!-- verify: human -->` + 理由括弧注記を付与してから完了を宣言する
  - アノテーションなし行がゼロ: そのまま完了宣言する
```

---

## Decisions

### D1: 新アノテーション tier を追加しない

Constitution IV/VI の事前検証を行っても、アノテーション自体は `<!-- verify: human -->` のままとする。チェックボックス状態（`- [x]` / `- [ ]`）で事前検証結果を表現する。

**受け入れ基準（FR-006 Scenario 対応）**:
- `mspec anchor check` がゼロエラー → Constitution IV が `- [x] <!-- verify: human -->`
- `## Security Capabilities` セクション存在 → Constitution VI が `- [x] <!-- verify: human -->`

### D2: verify: human 付与時の理由明記義務

`verify: human` を付与する際は必ず理由を括弧書きで明記する。

**受け入れ基準（FR-007 Scenario 対応）**:
- verify: human 付与行には `（〜は機械検証不可）` 等の括弧書き理由が存在する
- E2E Scenario 対応 FR は `verify: fr-NNN` であり `verify: human` でない

### D3: 変更範囲を auditor agent ファイルのみに限定

mspec-checklist SKILL.md・mspec-tasks SKILL.md・CLI パーサー・workflow.yaml を変更しない。auditor の prompt 強化のみで目的を達成する。

---

## Constitution Check

| Principle | Phase 0 | Phase 1 |
|-----------|---------|---------|
| I. ステップ独立性 | auditor.md 変更は checklist ステップのみに閉じる。他ステップへの新依存なし | ✅ 2 ファイルのみ変更。他ステップのスキルは未変更 |
| II. 決定論的マージ | Constraints セクション変更は auditor テキストのみ。パーサー変更なし | ✅ `mspec validate` でスキーマ整合性維持。マージは文字列置換のみ |
| III. 質問駆動の要件確定 | AskUserQuestion で軽い解 / Constitution 自動化可否を確定済み | ✅ Open Choices なし |
| IV. 双方向アンカー | 変更後の auditor ファイルに `@mspec-delta` アンカーを付与 | ✅ `mspec anchor check` でゼロエラーを確認する |
| V. 強制ステップと拡張ステップの分離 | Constitution IV/VI 事前検証は既存 checklist ステップ内拡張。強制ステップ構造変更なし | ✅ 新ステップ追加なし |
| VI. Security by Default | `.claude/agents/` と `packages/cli/templates/` のみ変更。外部ネットワーク依存なし | ✅ blast_radius: module。新しい権限境界なし |

### Complexity Tracking

None
