---
doc_type: Reference
---

<!-- See also: ./design-rationale.md for採用理由・代替案 -->
<!-- @mspec-delta 2026-05-26-121656-p3-skill-compartments/specs/claude-integration/spec.md -->
<!-- Requirements implemented: FR-024 -->
<!-- Change: p3-skill-compartments -->

# Design: SKILL.md 3コンパートメント化

## Summary

全12個のSKILL.mdに `## Verification (C2)` と `## Learning (C3)` セクションを追加する。

## Constitution Check

| 原則 | Phase 0 | Phase 1 |
|------|---------|---------|
| I. 仕様駆動 | ✅ FR-024定義済み | ✅ |
| II. TDD | ✅ Markdownのみ | ✅ |
| III. 双方向アンカー | ✅ | ✅ |
| IV. 決定論的アーカイブ | ✅ | ✅ |
| V. リスク比例検証 | ✅ trivial | ✅ |

### Complexity Tracking

None

## Project Structure

変更対象ファイル（すべてMarkdown）:

```
.claude/skills/
  mspec-archive/SKILL.md
  mspec-checklist/SKILL.md
  mspec-delta/SKILL.md
  mspec-design/SKILL.md
  mspec-implement/SKILL.md
  mspec-new/SKILL.md
  mspec-proposal/SKILL.md
  mspec-quickstart/SKILL.md
  mspec-research/SKILL.md
  mspec-review/SKILL.md
  mspec-tasks/SKILL.md
  mspec-visual-prototype/SKILL.md
```

## Decisions

### セクションの追加位置

ファイル末尾に追加。既存の `## Procedure` や `## Observation` を変更しない。

受け入れ基準（FR-024 Scenario対応）:
- 各SKILL.mdに `## Verification (C2)` が存在する
- 各SKILL.mdに `## Learning (C3)` が存在する

### C2セクションの内容方針

スキル固有のCLI確認コマンドを記述。共通パターン:
- `mspec validate --change <change>`
- `mspec anchor check --change <change>`
- スキル固有のチェック（例: implementは `mspec test --expect-green`）

### C3セクションの内容方針

`mspec learn`（P4）が読み込む形式を想定。記録フォーマット:
```
<!-- LEARNING: <パターン説明> | source: <FR-ID> | confidence: low|medium|high -->
```

## Self-Review

P3はMarkdownのみの変更で、CLIコードへの影響はゼロ。主要なリスクは一貫性の欠如（スキルによって書き方がバラバラになる）のみ。統一テンプレートで対処する。
