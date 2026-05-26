<!-- mspec: gaps in FR numbering are intentional. Removed requirements are archived under changes/archive/. -->

# web-ui-themes Specification

## Purpose

<このスペックがカバーする外部から観測可能な振る舞いの概要>

## Requirements

<!-- archive コマンドが Delta Spec の ADDED/MODIFIED/REMOVED/RENAMED を機械的にマージします -->

### Requirement: FR-001 — 4テーマの提供

<!-- risk_tier: standard -->
<!-- blast_radius: module -->

このシステムは SHALL ライト・セピア・グリーン・ダークの 4 種類の読書テーマを提供する.

#### Scenario: テーマ一覧の表示
- GIVEN ユーザーが Web UI を開いている
- WHEN テーマ選択 UI にアクセスする
- THEN ライト・セピア・グリーン・ダークの 4 択が表示される

### Requirement: FR-002 — テーマ別配色定義

<!-- risk_tier: standard -->
<!-- blast_radius: module -->

このシステムは SHALL 各テーマに対して背景色・本文色・アクセント色を Kindle 準拠の配色で定義する.

#### Scenario: セピアテーマの適用
- GIVEN ユーザーがセピアテーマを選択している
- WHEN ページが描画される
- THEN 背景色が暖かみのある黄土色（例: #F5E6C8）、本文色が濃い茶色（例: #3B2A1A）で表示される

#### Scenario: グリーンテーマの適用
- GIVEN ユーザーがグリーンテーマを選択している
- WHEN ページが描画される
- THEN 背景色が薄い緑（例: #D8E9D0）、本文色が深い緑（例: #1A3A1A）で表示される

### Requirement: FR-003 — テーマ選択の永続化

<!-- risk_tier: trivial -->
<!-- blast_radius: local -->

テーマが選択されたとき、このシステムは SHALL 選択されたテーマ名を localStorage に保存する.

#### Scenario: ページ再読み込み後のテーマ復元
- GIVEN ユーザーが以前にダークテーマを選択し localStorage に保存されている
- WHEN ページを再読み込みする
- THEN ダークテーマが自動的に適用された状態でページが表示される

### Requirement: FR-004 — 可読性フォントへの変更

<!-- risk_tier: standard -->
<!-- blast_radius: module -->

このシステムは SHALL Visual Prototype ステップで確定したフォントを本文テキストに適用する.

#### Scenario: フォント適用の確認
- GIVEN フォントが確定しシステムに設定されている
- WHEN ドキュメントが表示される
- THEN 確定フォントが本文テキスト全体に適用される

