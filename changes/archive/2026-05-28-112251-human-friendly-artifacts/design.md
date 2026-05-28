---
doc_type: Reference
---

<!-- See also: ./design-rationale.md for採用理由・代替案 -->

# Design: human-friendly-artifacts

このドキュメントは mspec の人間向け Artifact テンプレートをどのように変更するかを定義する Reference ドキュメントです。読者はこの変更を implement または review するエンジニアを想定しています。採用理由・代替案は [design-rationale.md](./design-rationale.md) を参照してください。

## Summary

mspec の checklist.md・design.md・proposal.md テンプレートおよび mspec-checklist-auditor エージェント定義を更新し、人間が合意形成するために読むドキュメントを自然語・カテゴリ構造に改善する。AI 向け指示書（tasks.md 等）は変更しない。

## Technical Context

### テンプレートシステムの構造

mspec はアーティファクト生成に 2 種類のソースを使う：

1. **静的テンプレートファイル** (`packages/cli/templates/artifacts/*.ja.md` / `*.en.md`)  
   `mspec new` などのコマンドが change ディレクトリへコピーするスケルトン。

2. **エージェント定義** (`packages/cli/templates/claude/agents/mspec-checklist-auditor.md`)  
   `mspec checklist` ステップで起動するサブエージェントの指示書。checklist.md の実体（セクション構造・チェック項目内容）はこの定義が決定する。テンプレートファイルはスケルトンのみで実質的な内容を持たない。

### 変更対象ファイル一覧

| ファイル | 変更の種類 | 担当 FR |
|----------|-----------|---------|
| `packages/cli/templates/artifacts/checklist.ja.md` | セクション見出し名変更 + 説明文追加 | FR-006, FR-007 |
| `packages/cli/templates/artifacts/checklist.en.md` | セクション見出し名変更 + 説明文追加 | FR-006, FR-007 |
| `packages/cli/templates/claude/agents/mspec-checklist-auditor.md` | セクション名ハードコード部分の更新 | FR-007 |
| `packages/cli/templates/artifacts/design.ja.md` | `## Summary` 直下にリード文プレースホルダ追加 | FR-006, FR-008 |
| `packages/cli/templates/artifacts/design.en.md` | `## Summary` 直下にリード文プレースホルダ追加 | FR-006, FR-008 |
| `packages/cli/templates/artifacts/proposal.ja.md` | 各 H2 セクション直下に一文の説明を追加 | FR-006 |
| `packages/cli/templates/artifacts/proposal.en.md` | 各 H2 セクション直下に一文の説明を追加 | FR-006 |

## Project Structure

変更はすべて `packages/cli/templates/` 配下のファイルに限定される。新規ファイルの作成はない。

```
packages/cli/templates/
├── artifacts/
│   ├── checklist.ja.md      ← 変更: 見出し名 + 説明文
│   ├── checklist.en.md      ← 変更: 見出し名 + 説明文
│   ├── design.ja.md         ← 変更: リード文プレースホルダ追加
│   ├── design.en.md         ← 変更: リード文プレースホルダ追加
│   ├── proposal.ja.md       ← 変更: 各 H2 直下に一文説明追加
│   └── proposal.en.md       ← 変更: 各 H2 直下に一文説明追加
└── claude/agents/
    └── mspec-checklist-auditor.md  ← 変更: セクション名の更新
```

## Decisions

### D-001: checklist.md セクション見出し名（FR-007 対応）

**変更前（ja）:** `Delta Spec Coverage` / `Source-of-Truth Regression` / `Constitution`  
**変更後（ja）:** `機能確認` / `リグレッションリスク` / `デプロイ前確認`

**変更前（en）:** `Delta Spec Coverage` / `Source-of-Truth Regression Risk` / `Constitution`  
**変更後（en）:** `Functional Verification` / `Regression Risk` / `Pre-deploy Checklist`

受け入れ基準（FR-007 Scenario 対応）：
- GIVEN `mspec checklist` ステップが完了する
- WHEN 生成された `checklist.md` を開く
- THEN チェック項目は少なくとも 2 つ以上のカテゴリ見出し（H2 または H3）のもとにグループ化されている
- AND 各カテゴリ内のチェック項目は 10 件以下に収まる

### D-002: 各セクション冒頭の説明文フォーマット（FR-006 対応）

各 H2 セクション直下に 1〜2 文の散文を本文として配置する。コメント（`<!-- -->`）は使用しない（コメントは生成後の成果物で不可視のため）。

テンプレートのプレースホルダ形式：
```markdown
## 機能確認

このセクションでは、実装した機能が Delta Spec の要件を満たしているか確認します。

- [ ] FR-NNN: <チェック内容>
```

### D-003: design.md リード文プレースホルダ（FR-008 対応）

`## Summary` セクション直下（見出しの次の行）にリード文プレースホルダを追加する。

```markdown
## Summary

このドキュメントは <変更名> の技術設計を記述します。読者は <対象読者> を想定しています。採用理由・代替案は design-rationale.md を参照してください。

<設計の概要 3 行以内>
```

### D-004: auditor エージェント定義の更新スコープ

`mspec-checklist-auditor.md` の Job 手順 5 に記載されたセクション名のみを変更する。auditor のロジック・手順・他のセクション名は変更しない。

**ロケール選択**: auditor は単一ファイルだが、このプロジェクトのデフォルトロケールは `ja` であるため、auditor が出力するセクション見出しは日本語（`機能確認` / `リグレッションリスク` / `デプロイ前確認`）に統一する。`checklist.en.md` テンプレートの見出しは英語（`Functional Verification` / `Regression Risk` / `Pre-deploy Checklist`）とするが、auditor は ja 見出しを出力するため、en ロケールで実行する場合はテンプレートと auditor 出力の見出しが異なる。en ロケール対応の auditor ロケール分岐は本チェンジのスコープ外とし、将来チェンジで対応する。

## Constitution Check

| Principle | Phase 0 | Phase 1 | 備考 |
|-----------|---------|---------|------|
| I. ステップ独立性 | ✅ | ✅ | テンプレート変更は各ステップが独立して動作する前提を破らない |
| II. 決定論的マージ | ✅ | ✅ | Delta Spec FR が明確で archive での機械的マージが可能 |
| III. 質問駆動の要件確定 | ✅ | ✅ | OC-1〜OC-4 をユーザー確認済み |
| IV. 双方向アンカー | ✅ | ✅ | 本 design.md は FR-006〜FR-008 の Scenario と双方向対応 |
| V. 強制ステップと拡張ステップの分離 | ✅ | ✅ | workflow.yaml・ステップ定義への変更なし |
| VI. Security by Default | ✅ | ✅ | ファイルシステムローカルの変更のみ。権限昇格なし |

### Complexity Tracking

None

## Self-Review

### [blocker] FR-008 Scenario が `## Purpose` を参照していたが `## Summary` が正しい — **解決済み**

Delta Spec FR-008 Scenario の THEN 節が `## Purpose` と記述していたが、実際のテンプレートは `## Summary` を使用している。研究フェーズで OC-1 によりユーザーが `## Summary` 維持を選択しているにもかかわらず、Scenario が更新されていなかった。spec.md の FR-008 Scenario を `## Summary` に修正した。

### [blocker] FR-006 の SHALL 文は 3 ファイルをカバーするが Scenario は checklist.md のみ — **解決済み**

Constitution IV（双方向アンカー）の観点で、FR-006 の SHALL 文が `checklist.md`・`design.md`・`proposal.md` を対象にしているのに Scenario が checklist.md だけだった。spec.md に `design.md` 用と `proposal.md` 用の 2 つの Scenario を追加した。

### [blocker] auditor のセクション名変更はこのチェンジの実装スコープ — **設計に明記済み**

D-004 に auditor の更新スコープとロケール選択方針を追記した。`mspec-checklist-auditor.md` の更新は実装フェーズ（tasks.md）で行う。

### [advisory] auditor ロケール選択 — **設計に明記済み**

D-004 にロケール決定方針（ja 優先）とスコープ外事項（en ロケール対応）を記載した。

### Summary
- Blocker count: 3 → 0（すべて解決）
- Advisory count: 5 → 1 対応済み（残り 4 は実装フェーズで対処）
- Overall assessment: ready for tasks step
