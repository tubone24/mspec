---
doc_type: Reference
---

# Research: human-friendly-artifacts

## Decisions

| 論点 | 採用案 | 代替案 | 根拠 |
|------|--------|--------|------|
| FR-006: 各セクション冒頭の説明文の形式 | 1〜2文の散文プレースホルダをコメントではなく本文として各 H2 直下に配置 | HTML コメントで非表示の説明文 / セクション末尾に配置 | コメントは生成後の成果物で不可視になりレビュアーが目にしない。Google Developer Style Guide の「conversational but not casual」原則に沿い本文として配置する |
| FR-007: checklist.md の見出し名 | `機能確認` / `リグレッションリスク` / `デプロイ前確認` に変更（auditor 定義も更新）| 現行の `Delta Spec Coverage` / `Source-of-Truth Regression` / `Constitution` を維持 | ユーザー選択: 見出し名を変更し auditor も更新する |
| FR-008: design.md リード文の挿入位置 | `## Summary` 直下にリード文プレースホルダを追加（構造維持） | `## Summary` → `## Purpose` にリネームして FR-008 と完全一致 | ユーザー選択: 現行 `## Summary` 構造を維持しつつリード文を追加する |
| OC-3: Constitution 改訂手続き要否 | 不要（コンテンツ改善のみ、ステップ定義・ワークフロー定義は変更なし） | 改訂手続きを踏む | テンプレートの「内容改善」であり強制ステップ定義には触れない |
| OC-4: proposal.md の改善スコープ | 各セクション冒頭に一文の説明を追加（最小スコープ） | 全セクションの文体を大幅に書き直す | 最小変更で FR-006 Scenario を満たせる。全書き直しは不要 |

## Web References

- [Google Developer Documentation Style Guide — Voice and Tone](https://developers.google.com/style/tone) — 「conversational but not casual」原則。二人称 "you" の使用、能動態、短文の推奨。FR-006 の文体基準の拠り所。

- [Diátaxis — Reference documentation](https://diataxis.fr/reference/) — Reference ドキュメントは「何を含むか・誰が参照するか」を冒頭で明示することで利用者の文脈設定を助ける。FR-008 の design.md リード文プレースホルダのパターン根拠。

- [Plain Language Best Practices — Paligo](https://paligo.net/blog/how-to/the-essential-guide-to-effective-technical-documentation/) — 平易な言語は技術的正確さを犠牲にしない。専門用語は使用するが文脈を添えることで理解を促進。

- [UX Checklists for Interface Designers — Smashing Magazine](https://www.smashingmagazine.com/2022/09/ux-checklists-for-interface-designers/) — カテゴリ別グループ化はレビュアーの認知負荷を下げ、担当者ごとの確認範囲を明確にする。1カテゴリあたりの上限設定（≤10件）は「ミラーの法則」的効果がある。

- [checklist.design — UX Writing](https://www.checklist.design/topics/ux-writing) — 実際のプロダクト開発チームが使うチェックリスト構造の実例集。カテゴリ見出し＋説明文＋チェック項目の三層構造が標準パターン。

## Codebase Findings

- `packages/cli/templates/artifacts/checklist.ja.md` — 現行テンプレートは 3 H2 セクション（`Delta Spec Coverage` / `Source-of-Truth Regression` / `Constitution`）をフラットに並べた構造。各セクションに説明文なし。実際の生成は auditor が担当する薄いスケルトン。

- `packages/cli/templates/artifacts/checklist.en.md` — 英語版も同構造。`Source-of-Truth Regression Risk` の見出し名が `.ja.md` と微妙に異なる（「Risk」付き）。

- `packages/cli/templates/artifacts/design.ja.md` — `## Summary` セクションが存在。`## Purpose` は存在しない。`## Summary` 直下にリード文プレースホルダを追加する。

- `packages/cli/templates/artifacts/design.en.md` — 英語版も `## Summary` 構造。ja 版と構造差異あり（`## Goals` / `## Non-Goals` の有無）。

- `packages/cli/templates/artifacts/proposal.ja.md` — `## Why` から始まる 5 セクション構成。背景プレースホルダは `<背景・動機。3 段落以内>` のみで説明文なし。各 H2 直下に一文の説明を追加する。

- `packages/cli/templates/claude/agents/mspec-checklist-auditor.md` (Job 手順 5) — `## Delta Spec Coverage` / `## Source-of-Truth Regression` / `## Constitution` の 3 セクション名をハードコードで指定している。FR-007 対応には **この定義の更新も必須**。

- `packages/cli/templates/claude/skills/mspec-checklist/SKILL.md` — checklist スキルは auditor サブエージェントを Task tool 経由で起動し、返却されたボディを checklist.md に書き込む。テンプレートファイルはスキル手順に明示的に参照されていない。

- `memory/constitution.md` — Additional Constraints に「成果物テンプレートと workflow.yaml の強制ステップ定義は、本憲法の改訂手続きを経ずに変更しない」とある。今回はコンテンツ改善のみ（ステップ定義変更なし）のため手続き不要と判断。

## Open Choices

すべての OC はユーザーとの確認により解決済み。上記 Decisions テーブル参照。

## Constitution Check (Phase 0)

| Principle | 評価 | 備考 |
|-----------|------|------|
| I. ステップ独立性 | ✅ | テンプレート変更はステップ独立性に影響しない |
| II. 決定論的マージ | ✅ | Delta Spec の FR が明確で archive で機械的にマージできる |
| III. 質問駆動の要件確定 | ✅ | OC-1〜OC-4 をユーザー確認済み |
| IV. 双方向アンカー | ✅ | 本 research.md は FR-006〜FR-008 を参照している |
| V. 強制ステップと拡張ステップの分離 | ✅ | テンプレート変更はステップ定義（workflow.yaml）を変更しない |
| VI. Security by Default | ✅ | ファイルシステムローカルの変更のみ。権限昇格なし |
