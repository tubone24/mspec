---
doc_type: Reference
---

<!-- See also: ./design-rationale.md for採用理由・代替案 -->

# Design: fix-existing-purpose-placeholders

## Summary

このドキュメントは `fix-existing-purpose-placeholders` の技術設計を記述します。読者は実装エンジニア（Claude Code を実行するエージェント）を想定しています。採用理由・代替案は design-rationale.md を参照してください。

`specs/` 配下の 39 件の capability spec で `## Purpose` セクションがプレースホルダーのまま残っている。Claude Code が各ファイルの Requirements を読み取り、1〜2 文の Purpose を生成して正規表現でプレースホルダー行のみを置換する一回限りのアドホック処理。

## Goals

- 39 件のプレースホルダーをすべて意味のある 1〜2 文の Purpose で置換する
- 正規表現でプレースホルダー行のみ置換（他セクション不変）
- 冪等チェックで再実行時の二重上書きを防ぐ
- 部分失敗時も skip-and-continue で残り処理を継続する

## Non-Goals

- 新規 CLI コマンドの実装
- SKILL.md の変更（FR-005 は実装済み）
- Purpose の多言語同時生成
- SpecViewer の UI 変更

## Technical Context

- Language / Runtime: N/A（Claude Code の Edit ツールを直接使用）
- Dependencies (new): なし
- Storage: `specs/*/spec.md`（ローカルファイル書き込み）
- Testing framework: N/A（アドホック実行）
- Target platform: ローカル開発環境
- Performance / Constraints: 39 件 × 平均処理時間 ≒ 許容範囲内

## Constitution Check (Phase 0)

| Principle | Compliant? | Notes |
|-----------|-----------|-------|
| I. ステップ独立性 | ✅ | 他ステップに副作用なし |
| II. 決定論的マージ | ✅ | CLI マージは変更なし |
| III. 質問駆動の要件確定 | ✅ | proposal で全決定事項確認済み |
| IV. 双方向アンカー | N/A | アドホック実行のためアンカー対象なし |
| V. 強制ステップと拡張ステップの分離 | ✅ | SKILL.md・workflow.yaml 変更なし |
| VI. Security by Default | ✅ | ローカル書き込みのみ |
| VII. 設計意図と実装の対応確認 | ✅ | FR-006 として設計と実装が対応している |

## Project Structure (changes)

- 変更: `specs/*/spec.md` — 39 件の `## Purpose` セクション（プレースホルダー置換）

## Decisions

### Decision 1: 1 ファイルずつ逐次処理（並列なし）

各ファイルを順番に読み取り → AI 生成 → Edit ツールで書き込みの順で処理する。並列実行より遅いが、途中失敗時に残り処理を継続しやすい（skip-and-continue パターン）。

**受け入れ基準（FR-006 Scenario 対応）:**

| Scenario | GIVEN | WHEN | THEN |
|----------|-------|------|------|
| プレースホルダー置換 | Purpose がプレースホルダー | バックフィルスクリプト実行 | 1〜2 文で置換される |
| スキップ | Purpose が記述済み | バックフィルスクリプト実行 | ファイルは変更されない |
| 部分失敗継続 | 一部失敗 | バックフィルスクリプト実行中 | スキップして残りを続行・失敗件数を記録 |

## Constitution Check (Phase 1, 計画詳細後)

| Principle | Phase 0 | Phase 1 | Notes |
|-----------|---------|---------|-------|
| I. ステップ独立性 | ✅ | ✅ | 他ステップへの副作用なし |
| II. 決定論的マージ | ✅ | ✅ | CLI マージは変更なし |
| III. 質問駆動の要件確定 | ✅ | ✅ | 全決定事項が proposal に記録済み |
| IV. 双方向アンカー | N/A | N/A | アドホック実行 |
| V. 強制ステップと拡張ステップの分離 | ✅ | ✅ | SKILL.md 変更なし |
| VI. Security by Default | ✅ | ✅ | ローカル書き込みのみ |
| VII. 設計意図と実装の対応確認 | ✅ | ✅ | FR-006 として明示的に記録 |

### Complexity Tracking

None

## Migration Plan / Rollout

- 一回限りの実行。完了後は git commit で変更を記録する。
- ロールバック: git checkout HEAD specs/ で全変更を元に戻せる。

## Self-Review

<!-- mspec-self-reviewer pass — 2026-05-28 -->

### Findings

- [ok] FR-006 の 3 シナリオ（プレースホルダー置換・スキップ・部分失敗継続）が Delta Spec・design.md・architecture-overview.md で一貫して記述されている。
- [ok] architecture-overview.md に System Diagram と Sequence Diagram の 2 つの Mermaid ダイアグラムが存在する。
- [ok] quickstart.md は minor モードでスコープ外として適切にスキップ済み。
- [ok] Phase 0・Phase 1 の Constitution Check テーブルが design.md と architecture-overview.md で一致している。Principle IV は根拠付きで N/A と判定されている。
- [ok] checklist.md が FR-001〜FR-005 のリグレッションリスクと Constitution 原則を網羅している。
- [ok] Delta Spec に Security Capabilities セクションが存在し、権限境界・ロールバック手段が記載済み。
- [nit → resolved] checklist.md の Principle I チェックボックスが未チェックだったが、コンプライアンス確認済みのため `- [x]` に修正した。
- [nit] design.md 先頭コメントのスペース欠落は機能に影響なし（許容）。

### Summary

ブロッカー 0 件。全 FR にシナリオが定義されており、設計と実装の対応も明確。cosmetic nit 1 件を修正済み。
