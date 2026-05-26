---
doc_type: Reference
---

# Proposal: SKILL.md 3コンパートメント化

## Summary

各SKILL.mdに `## Verification (C2)` と `## Learning (C3)` セクションを追加し、3コンパートメント構造を確立する。

## Motivation

現状のSKILL.mdは `## Procedure` と `## Observation` のみ。C2（verification）とC3（learning）の概念を明文化し、各スキルが「確認すべきCLIコマンド」と「学習パターンの記録場所」を持つようにする。

## Scope

- 対象: `.claude/skills/mspec-*/SKILL.md` 全12ファイル
- 変更: 各ファイル末尾に2セクションを追加
- CLIコードへの変更: なし

## Proposed Sections

### `## Verification (C2)`
anchor check / validate / schema validate など既存CLIへの参照を記述。エージェントがこのスキルを実行した後に「何をCLIで確認すべきか」を定義する。

### `## Learning (C3)`
このスキルの実行で発生した学習候補（post-condition候補）の記録フォーマットを定義。`mspec learn`（P4）が読み込む形式に準拠する。

## Constitution Check

| 原則 | Phase 0 |
|------|---------|
| I. 仕様駆動 | ✅ FR定義済み |
| II. TDD | ✅ Markdownのみ、コード変更なし |
| III. 双方向アンカー | ✅ アンカー追加予定 |
| IV. 決定論的アーカイブ | ✅ |
| V. リスク比例検証 | ✅ 低リスク |
