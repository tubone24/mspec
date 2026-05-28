---
doc_type: Reference
---

<!-- See also: ./design-rationale.md for採用理由・代替案 -->

<!-- @mspec-delta 2026-05-27-235634-checklist-reduce-verify-human/specs/verify-routing/spec.md -->
<!-- Requirements implemented: FR-006, FR-007, FR-008, FR-009 -->
<!-- Change: checklist-reduce-verify-human -->

<!-- @mspec-delta 2026-05-27-235634-checklist-reduce-verify-human/specs/artifact-preview/spec.md -->
<!-- Requirements implemented: FR-012 -->
<!-- Change: checklist-reduce-verify-human -->

# Design: checklist-reduce-verify-human

## Summary

`mspec-checklist-auditor` の verify アノテーション付与ロジックを拡張し、自動実行可能な CLI コマンドを表す `verify:cmd:<command>` 形式を新設する。Constitution IV/VI の `verify:human` を `verify:cmd` に置き換え、checklist.md の人手確認項目数を削減する。また、残る `verify:human` 項目には確認手順を子リストとして必須記載する。Web UI は `verify:cmd` 項目にも amber ハイライトを適用する。

---

## Technical Context

### 変更対象ファイル

| ファイル | 変更種別 | 変更内容 |
|----------|----------|----------|
| `.claude/agents/mspec-checklist-auditor.md` | 修正 | verify 優先順位ルールに `verify:cmd` を追加、Constitution IV/VI を `verify:cmd` に変更、`verify:human` 子リスト必須ルールを追加 |
| `packages/cli/templates/claude/agents/mspec-checklist-auditor.md` | 修正 | 上記と同一内容（FR-014 同期）|
| `packages/web-ui/src/` (checklist renderer) | 修正 | `verify:cmd` アノテーション検出時に amber ハイライトを適用 |
| `packages/cli/tests/e2e/` | 新規 | FR-008・FR-009 の E2E テストファイルを追加 |
| `packages/web-ui/tests/e2e/checklist-verify-human.e2e.test.ts` | 修正 | `verify:cmd` amber ハイライトの assert を追加 |

### verify アノテーション形式の定義

| 形式 | 意味 | 例 |
|------|------|-----|
| `<!-- verify: fr-NNN -->` | 対応する E2E テストが CI で自動検証する | `<!-- verify: fr-006 -->` |
| `<!-- verify: cmd:<command> -->` | 指定コマンドを実行することで自動検証できる（実行者がコマンドを手動実行する） | `<!-- verify: cmd:mspec anchor check -->` |
| `<!-- verify: human -->` | 自動検証不可。人手による目視・操作確認が必要 | `<!-- verify: human -->` |

---

## Project Structure

### `mspec-checklist-auditor.md` の Constraints 節変更

**変更前の優先順位（現行）:**
1. critical FR → `verify:human`
2. E2E Scenario 対応 → `verify:fr-NNN`
3. Constitution IV → `verify:human`（事前 check 付き）
4. Constitution VI → `verify:human`（事前 check 付き）
5. その他 → `verify:human` + 理由括弧注記

**変更後の優先順位（新設計）:**
1. critical FR → `verify:human` + 確認手順子リスト（変更なし、FR-009 の子リスト追加のみ）
2. E2E Scenario 対応 または CI テストカバー → `verify:fr-NNN`（FR-008 で SoT Regression 項目も含める）
3. CLI コマンドで検証可能 → `verify:cmd:<command>`（**新規**）
4. Constitution IV → `- [x] <!-- verify: cmd:mspec anchor check -->`（事前実行後に確定）（FR-006 変更）
5. Constitution VI → `- [x] <!-- verify: cmd:grep "## Security Capabilities" <path> -->`（事前実行後に確定）（FR-006 変更）
6. その他 → `verify:human` + 理由括弧注記 + **確認手順子リスト（最低 2 項目）**（FR-009 新規）

### `verify:human` 項目の出力フォーマット

変更後の `verify:human` 項目は以下の形式で出力する:

```markdown
- [ ] FR-XXX: <項目テキスト>（<自動検証不可の理由>） <!-- verify: human -->
  - <手順 1: 何を操作するか>
  - <手順 2: 何を目視確認するか>
  - <手順 3: 追加手順（必要な場合）>
```

### Web UI amber ハイライト拡張

現行は `verify:human` のみ amber ハイライト対象。`verify:cmd` も同じ amber ハイライトを適用する。
検出条件: 行末の HTML コメントが `verify: human` または `verify: cmd:` で始まる場合。

---

## Decisions

### Decision 1: verify:cmd 形式の新設

`verify:cmd:<command>` を新形式として導入する。`<command>` は `mspec validate`・`mspec anchor check`・`mspec spec lint` 等の CLI コマンドを文字列で指定する。

**受け入れ基準（FR-008 Scenario との対応）:**
- FR-008 Scenario「CLI コマンド検証可能な項目は verify:auto を付与」: `mspec validate` で検証できる性質の項目に `verify:cmd:mspec validate` が付与されること
- FR-008 Scenario「テストスイートカバー FR は verify:fr-NNN を付与」: CI テストカバー FR に `verify:fr-NNN` が付与されること

### Decision 2: Constitution IV/VI の verify 変更

FR-006 MODIFIED により、Constitution IV/VI のアノテーションを `verify:cmd` に変更する。
- Constitution IV: `<!-- verify: cmd:mspec anchor check -->`
- Constitution VI: `<!-- verify: cmd:grep "## Security Capabilities" changes/<change>/specs/ -->`

**受け入れ基準（FR-006 Scenario との対応）:**
- FR-006 Scenario「Constitution IV アンカーゼロエラー時の verify:cmd での自動確定」: アンカーチェックがゼロエラーなら `- [x] <!-- verify: cmd:mspec anchor check -->` が出力されること

### Decision 3: verify:human 項目への確認手順必須化

`verify:human` が付与された項目の直下に最低 2 項目のインデントされた箇条書き（`  - `）を必須記載する。

**受け入れ基準（FR-009 Scenario との対応）:**
- FR-009 Scenario「verify:human 項目に確認手順が付与される」: 子リストに最低 2 項目の手順が記載されること
- FR-009 Scenario「確認手順なしの verify:human は生成しない」: 手順なしの verify:human は生成されないこと

### Decision 4: Web UI amber ハイライト拡張

checklist.md の行末に `<!-- verify: cmd:... -->` が存在する場合、`verify:human` と同じ amber ハイライトクラスを適用する。

**受け入れ基準（FR-012 Scenario との対応）:**
- FR-012 Scenario「verify:cmd 項目の amber ハイライト表示」: `verify:cmd` 行が amber 背景色で表示されること
- FR-012 Scenario「verify:fr-NNN 項目はハイライトされない」: `verify:fr-NNN` 行に amber ハイライトが適用されないこと

---

## Constitution Check

| # | 原則 | Phase 0 | Phase 1 |
|---|------|---------|---------|
| I | ステップ独立性 | pass | pass — design.md は research.md の決定を文書化するのみ、他ステップの成果物を変更しない |
| II | 決定論的マージ | pass | pass — 変更ファイルと変更内容を明示的に記述。Delta Spec の ADDED/MODIFIED セクションと一致 |
| III | 質問駆動の要件確定 | pass | pass — research フェーズで 4 件の Open Choices をユーザーが決定済み。設計上の未決事項なし |
| IV | 双方向アンカー | pass | pass — `@mspec-delta` アンカーコメントを FR-006, FR-007, FR-008, FR-009, FR-012 に付与済み |
| V | 強制ステップと拡張ステップの分離 | pass | pass — design ステップ内に収まっている |
| VI | Security by Default | pass | pass — 権限変更なし。checklist 生成ロジックの変更のみ |

### Complexity Tracking

None — 変更はプロンプトテキストと Web UI の正規表現マッチングのみ。外部 API・DB スキーマへの影響なし。

<!-- LEARNING: design.md の Decisions セクションで受け入れ基準を Delta Spec Scenario に対応付けると tasks.md と checklist.md のトレーサビリティが向上する | source: FR-008 | confidence: high -->

---

## Self-Review

**Reviewer:** mspec-self-reviewer
**Date:** 2026-05-28

### Findings

- **[blocker]** `specs/verify-routing/spec.md` FR-007: `<!-- risk_tier: ... -->` と `<!-- blast_radius: ... -->` コメントが欠落していた → **修正済み**（`risk_tier: standard` / `blast_radius: module` を追加）

- **[warning]** `checklist.md` の Constitution Check items I, II, IV, VI: `<!-- verify: human -->` だが子リストの確認手順が未記載。FR-009 の新ルールを自身が実装する前に生成されたため想定内のブートストラップ状態。tasks ステップで「auditor 更新後に checklist.md を再生成する」タスクを追加することで解消予定。

- **[warning]** `checklist.md` の Constitution IV/VI: まだ `<!-- verify: human -->` アノテーション。FR-006 実装後の auditor 再実行で `<!-- verify: cmd:mspec anchor check -->` / `<!-- verify: cmd:grep ... -->` に自動変換される見込み。手動修正は不要。

- **[ok]** Delta Spec 完全性 — FR-008, FR-009, FR-006, FR-007, FR-012 すべてに `#### Scenario:` ブロック（GIVEN/WHEN/THEN）あり
- **[ok]** Design-Spec トレーサビリティ — design.md の Decisions 全 4 件が Delta Spec 全 FR をカバー
- **[ok]** Checklist Delta Spec Coverage — 全 5 FR が `verify: fr-NNN` でカバー
- **[ok]** Mermaid ダイアグラム — 4 種類（flowchart・sequence・classDiagram・flowchart LR）が architecture-overview.md に存在
- **[ok]** Constitution Check — design.md の Phase 0 / Phase 1 両列が全 6 原則で埋まっている
- **[ok]** Anchor integrity — design.md / checklist.md の `@mspec-delta` アンカーが Delta Spec の有効 FR-ID を参照
- **[ok]** SoT spec 整合 — FR-006/FR-007 MODIFIED の変更内容が SoT spec の現状と正確に対応

### Constitution Re-Evaluation

| # | 原則 | 再評価 | 備考 |
|---|------|--------|------|
| I | ステップ独立性 | **agree / pass** | 各アーティファクトが自己の範囲内のみを変更 |
| II | 決定論的マージ | **agree / pass** | 変更ファイルが design.md Technical Context テーブルに明示 |
| III | 質問駆動の要件確定 | **agree / pass** | research.md Open Choices テーブルの全 4 件が決定済み |
| IV | 双方向アンカー | **agree / pass** | `@mspec-delta` アンカーと FR-ID に不整合なし |
| V | 強制/拡張ステップ分離 | **agree / pass** | 変更対象が checklist-auditor.md プロンプトと Web UI renderer のみ |
| VI | Security by Default | **agree / pass** | 両 Delta Spec に `## Security Capabilities` セクションあり |
