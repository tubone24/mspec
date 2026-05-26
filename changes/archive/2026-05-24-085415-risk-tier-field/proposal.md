---
doc_type: Explanation
---

<!-- @mspec-delta 2026-05-15-063805-fix-command-name-consistency/specs/claude-integration/spec.md -->
<!-- Requirements implemented: FR-017 -->
<!-- Change: fix-command-name-consistency -->

# Proposal: risk-tier-field

## Why

AIコーディング時代において「すべての変更を同じ厳密さで扱うことはもはや経済的でない」という認識が広まっている（ThoughtWorks Retreat 2026）。現在の mspec は FR-NNN に対してフラットな verify 要求を課しており、重大な変更（外部 API に影響するもの）と軽微な変更（ローカル関数のリネーム）が同等の人間レビュー負荷を生じさせている。

`risk_tier` と `blast_radius` フィールドを FR-NNN に追加することで、verify の種別をリスクに比例させる。critical は `verify: human` 必須、trivial は自動検証のみとし、standard はデフォルトの現在動作を維持する。これにより人間のレビュー注意を本当に重要な変更に集中させることができる。

既存 FR（risk_tier 未記載）は `standard` としてデフォルト扱いし、後方互換性を完全に維持する。

## Goals

- Delta Spec の FR-NNN に `risk_tier: critical | standard | trivial` フィールドを追加する
- Delta Spec の FR-NNN に `blast_radius: local | module | system | external` フィールドを追加する
- delta / tasks / checklist / implement の全ステップで risk_tier に応じた verify 分岐を行う
- critical FR は `verify: human` を必須とし、trivial FR は checklist 項目を生成しない（verify アノテーションなし）
- risk_tier 未記載の既存 FR は `standard` としてデフォルト扱いし後方互換性を維持する

## Non-Goals

- risk_tier に基づく CI 自動ブロック（将来の拡張として検討）
- Constitution への第 6 原則「VI. Risk-Proportionate Verification」追加（専用 change として別途実施）
- UI / Web ダッシュボードでの risk 可視化
- risk_tier / blast_radius の AI 自動推定
- 既存 SoT spec への risk_tier 一括バックフィル（migration コマンド）

## Capabilities (touched)

- `delta-spec` — FR の YAML フィールド拡張（risk_tier / blast_radius 追加）、parser 対応
- `verify-routing` — verify 種別の risk_tier による自動分岐（tasks / checklist / implement）

## Open Questions

- Constitution 改訂 change（VI. Risk-Proportionate Verification）はいつ切るか？本 change の archive 後すぐか、他の change と抱き合わせか。
- blast_radius の値が `external` の場合、verify: human 以外の追加ガードレール（例：security capability 必須化）を将来設けるか？
- 【research 判明】実装の主要ターゲットは TypeScript CLI parser だけでなく SKILL.md / `mspec-checklist-auditor.md` 等のエージェントプロンプト改訂が中心。design でファイル担当を明確化する。
- 【archive 後タスク】両 capability が同番号 FR-001〜FR-005 を持つため `<!-- verify: fr-NNN -->` が capability を一意に特定しない既知の制限がある。将来の change で verify アノテーションに capability スコープを含める（例: `<!-- verify: delta-spec/fr-001 -->`）改善を検討する。

## Constitution Check

> Step: proposal | Constitution Version: 1.0.0

| Principle | Phase 0 | Phase 1 | Notes |
|-----------|---------|---------|-------|
| I. ステップ独立性 | ✅ | — | 各ステップは独立して risk_tier フィールドを参照するだけ。ステップ間依存は増えない |
| II. 決定論的マージ | ✅ | — | risk_tier は FR のメタフィールドとして追加。ADDED/MODIFIED/REMOVED/RENAMED マージロジック自体は変更なし |
| III. 質問駆動の要件確定 | ✅ | — | AskUserQuestion で 5 問確定済み（適用範囲 / blast_radius 値 / 後方互換 / Constitution 評価タイミング / Non-Goal） |
| IV. 双方向アンカー | ✅ | — | risk_tier は FR メタデータ。anchor 構造（@mspec-delta / Requirements implemented / Change）は変更しない |
| V. 強制ステップと拡張ステップの分離 | ✅ | — | ステップ構造は変更なし。フィールド追加のみ |

### Complexity Tracking

None
