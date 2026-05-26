# Delta Spec: cli-core

## Security Capabilities

<!-- 権限境界: changes/archive/ の読み取りのみ -->
<!-- アクセス増加: なし -->
<!-- エージェント権限: なし -->
<!-- ロールバック手段: git revert -->

## ADDED Requirements

### Requirement: FR-006 — mspec learn コマンド

<!-- risk_tier: standard -->
<!-- blast_radius: module -->

このシステムは SHALL `mspec learn` コマンドを提供し、archive済みchangesから修正パターンを抽出してpost-condition候補をJSON形式で stdout に出力する。

#### Scenario: self-review blockerからのパターン抽出
- GIVEN `changes/archive/` 配下の change に `.agent-runs.jsonl` が存在し edits > 0 のエントリがある
- WHEN `mspec learn` を実行する
- THEN `{ patterns: [{ type: "review-blocker", change: "...", step: "...", edits: N }] }` 形式のJSONが出力される

#### Scenario: verify:human 未チェック項目からのパターン抽出
- GIVEN archive済みchangeの `checklist.md` に `<!-- verify: human -->` が付いた `- [ ]` 行が存在する
- WHEN `mspec learn` を実行する
- THEN `{ patterns: [{ type: "unchecked-human-verify", change: "...", items: [...] }] }` 形式のJSONに含まれる

#### Scenario: archiveが空の場合のgraceful handling
- GIVEN `changes/archive/` が存在しないまたは空である
- WHEN `mspec learn` を実行する
- THEN `{ patterns: [] }` を出力して exit code 0 で終了する

## MODIFIED Requirements

## REMOVED Requirements

## RENAMED Requirements
