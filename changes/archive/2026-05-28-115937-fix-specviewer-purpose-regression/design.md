---
doc_type: Reference
---

<!-- See also: ./design-rationale.md for採用理由・代替案 -->

# Design: fix-specviewer-purpose-regression

## Summary

このドキュメントは `fix-specviewer-purpose-regression` の技術設計を記述します。読者は mspec スキル実装エンジニアおよびレビュアーを想定しています。採用理由・代替案は design-rationale.md を参照してください。

`mspec-archive` SKILL.md に Purpose フィールド自動生成ステップ（step 3d）を追加する。アーカイブ完了後、アーカイブ対象 capability の `specs/<capability>/spec.md` に テンプレートプレースホルダーが残っている場合のみ、スペック内容を基に 1〜2 文の Purpose を AI が生成して上書きする。

## Goals

- `mspec archive` 完了後に Purpose プレースホルダーが自動的に意味のある記述に置換される
- 既に Purpose が記述済みの spec は変更されない（べき等性）
- CLI archive（LLM フリー）の動作に影響しない

## Non-Goals

- 既存 41 件の retroactive 一括修正（別 change で対応）
- `cli-archive` CLI コードの変更
- Purpose の多言語同時生成（locale 設定に従い 1 言語のみ）

## Technical Context

- Language / Runtime: N/A（SKILL.md の手順追加のみ）
- Dependencies (new): なし
- Storage: `specs/<capability>/spec.md`（ローカルファイル書き込み）
- Testing framework: N/A
- Target platform: mspec-archive スキルを実行する AI エージェント環境
- Performance / Constraints: 対象は Delta Spec に含まれる capability のみ（通常 1〜3 件）

## Constitution Check (Phase 0)

| Principle | Compliant? | Notes |
|-----------|-----------|-------|
| I. ステップ独立性 | ✅ | Purpose 生成は archive 後の独立ステップ。他ステップへの副作用なし |
| II. 決定論的マージ | ✅ | CLI 側（LLM フリー）は変更しない。AI 生成は SKILL.md 側のみ |
| III. 質問駆動の要件確定 | ✅ | 要件は Delta Spec FR-005 に明記済み |
| IV. 双方向アンカー | N/A | コード変更なし |
| V. 強制ステップと拡張ステップの分離 | ✅ | 強制ステップ（cli-archive）は変更せず、SKILL.md の拡張ステップに追加 |
| VI. Security by Default | ✅ | ローカルファイル書き込みのみ |

## Project Structure (changes)

- 修正: `.claude/skills/mspec-archive/SKILL.md` — step 3d を追加（Purpose 生成ループ）

## Decisions

### Decision 1: step 3c の後に step 3d として Purpose 生成ループを追加

step 3（`mspec archive -y` 実行）の後に spec ファイルがマージ済みになるため、完全な Requirements 内容を読んで Purpose を生成できる。ポストモーテムフック（step 3c）の後に追加することで、Lessons/NextAction フローとの干渉を避ける。

**受け入れ基準（FR-005 Scenario 対応）:**

| Scenario | GIVEN | WHEN | THEN |
|----------|-------|------|------|
| Purpose が自動生成される | Delta Spec で capability が ADDED/MODIFIED、かつ Purpose がプレースホルダー | `mspec archive -y` 完了後 | SKILL が Purpose を 1〜2 文で上書き |
| 記述済みの場合スキップ | Purpose にプレースホルダー以外のテキスト | archive 完了後 | Purpose フィールドは変更されない |

### Decision 2: 対象 capability の特定方法

SKILL.md の step 3d では以下の手順で対象 capability を特定する:

1. Delta Spec のパス（`changes/<change>/specs/*/spec.md`）から capability 名を抽出
2. 各 capability の SoT spec（`specs/<capability>/spec.md`）を読む
3. `## Purpose` セクションの内容がプレースホルダーと一致する場合のみ生成・上書き

## Constitution Check (Phase 1, 計画詳細後)

| Principle | Phase 0 | Phase 1 | Notes |
|-----------|---------|---------|-------|
| I. ステップ独立性 | ✅ | ✅ | Purpose 生成は archive 後の独立ステップ。副作用なし |
| II. 決定論的マージ | ✅ | ✅ | CLI 側は変更なし。AI 生成はスキル側のみ |
| III. 質問駆動の要件確定 | ✅ | ✅ | FR-005 に要件明記済み |
| IV. 双方向アンカー | N/A | N/A | コード変更なし |
| V. 強制ステップと拡張ステップの分離 | ✅ | ✅ | SKILL.md のみ変更 |
| VI. Security by Default | ✅ | ✅ | ローカルファイル書き込みのみ |

### Complexity Tracking

None

### Decision 3: step 3d の部分失敗挙動 — skip-and-continue

複数 capability を含む archive で一部の Purpose 生成が失敗した場合、step 3d は **失敗した capability をログに記録してスキップし、残りの capability の処理を続行する**（skip-and-continue）。archive 本体（step 3）は既に完了済みのため、Purpose 生成の失敗は archive 完了の判定に影響しない。

**受け入れ基準:**

| Scenario | GIVEN | WHEN | THEN |
|----------|-------|------|------|
| 部分失敗でもアーカイブ完了 | 2 capabilityのうち1つの Purpose 生成が失敗する | step 3d を実行する | 失敗した capability のみスキップし、成功した capability の Purpose は書き込まれ、archive は完了扱いになる |
| 失敗のログ出力 | Purpose 生成に失敗した capability が存在する | step 3d が完了する | マージサマリーに「Purpose 未生成: <capability>」が記録される |

## Migration Plan / Rollout

- SKILL.md 修正は即時反映（次の archive 実行から有効）
- 既存 41 件のプレースホルダーは別 change で retroactive 修正を検討

## Self-Review

<!-- mspec-self-reviewer pass — 2026-05-28 -->

### Findings

- [blocker → resolved] `architecture-overview.md` System Diagram で step 3b が step 3 より前に表示されていて意図が不明瞭だった。注記を追加して意図的な設計（CLI が readme.md を validate するため CLI 前に必須）を明示した。
- [blocker → resolved] step 3d の部分失敗挙動（複数 capability のうち一部が失敗した場合）が未定義だった。Decision 3 として skip-and-continue ポリシーと受け入れ基準を追加した。
- [warning] FR-005 の Scenario テーブルにファイル書き込み失敗ケースが未記載。Decision 3 の部分失敗シナリオでカバー済みとして許容。
- [warning] Constitution Check Principle II で AI 生成テキストが SoT spec に書き込まれることの影響が未分析。design-rationale.md の Trade-offs に「Purpose は非決定論的 AI 生成のため文言が実行毎に異なる可能性」として記載済みで許容範囲。
- [ok] FR-005 は Delta Spec に 2 つの GIVEN/WHEN/THEN シナリオ（自動生成・スキップ）を持ち明確。
- [ok] べき等性要件が Goals と Scenario テーブルの両方に記載されている。
- [ok] Constitution Phase 0・Phase 1 の両テーブルが完全に埋まっている。
- [ok] `architecture-overview.md` に 3 つの Mermaid ダイアグラム（System/Sequence/Data Model）が存在する。
- [ok] Principle VI（Security by Default）が Delta Spec の Security Capabilities と Constitution Check テーブルで対処済み。
- [ok] チェックリストが FR-001〜FR-005 と Constitution 6 原則すべてを網羅している。

### Summary

ブロッカー 2 件を修正済み（System Diagram の注記追加、部分失敗挙動の Decision 3 追加）。警告 2 件は既存記述でカバー範囲内として許容。実装は SKILL.md の手順追加のみで、CLI コードへの影響なし。
