# Project Constitution

> Version: 1.1.0
> Ratified: 2026-05-14
> Last Amended: 2026-05-25

## Core Principles

### I. ステップ独立性

各ワークフローステップはコンテキスト独立である。ステップ再開時は必ず `mspec status` で前ステップの成果物を再読込してから着手し、前段の会話文脈に依存しない。`mspec continue` のエンベロープ拡張はすべて後方互換な追加に限り、既存ステップ間の依存関係を増やしてはならない。

### II. 決定論的マージ

Delta Spec から Source-of-Truth Spec へのマージは LLM を使わず CLI のパーサーで実施する (OpenSpec 方式)。`mspec archive` のマージサマリは lexicographic ソートと純粋関数による整形で生成し、同一入力に対して再実行してもバイト単位で一致しなければならない。

### III. 質問駆動の要件確定

要件は人間に Markdown を手書きさせず、AI が `AskUserQuestion` で 1 問 1 答して確定する (Superpowers 方式)。質問を抑制した場合でも、決定の根拠は research / design の成果物に追跡可能な形で記録し、後から検証できる状態を保つ。

### IV. 双方向アンカー

実装ファイルおよび E2E テストには、対応する Delta Spec を指す `@mspec-delta` アンカーを必ず打つ。CLI (`mspec anchor check`) でアンカーと Delta Spec の整合性を双方向に検証し、すべての FR が最低 1 つのアンカーブロックに紐付くことを保証する。アンカースキャナの除外設定は、本来アンカーを持つべき実装/テストファイルを巻き込んではならない。

### V. 強制ステップと拡張ステップの分離

Spec / Delta Spec / Archive のステップは `workflow.yaml` スキーマから削除できない強制ステップである。それ以外のステップはユーザーが追加・削除・並べ替え可能とする。本原則に関わる `removable` フラグおよびワークフロー構造は、成果物バリデーションの追加とは独立して扱い、安易に変更しない。

### VI. Security by Default

すべてのchangeのproposalステップにおいて、権限境界・外部API・メール/通知・秘密情報・認証に関するセキュリティ質問（PRP-SEC-001〜004）への回答を必須とする。エージェントが自律的にコードを生成・変更する際、セキュリティを後付けの考慮事項ではなく設計の一部として扱い、すべての変更がblast_radiusと権限変更の影響範囲を明示した状態でdelta specに記録されることを要求する。

## Additional Constraints

- セキュリティ: ファイルシステム操作は `changes/` / `specs/` / `memory/` の範囲に閉じ、外部ネットワーク依存を持ち込まない。
- パフォーマンス: アンカースキャナおよび spec-linter は走査対象の行数に対して線形時間を維持する。
- コンプライアンス: 成果物テンプレートと `workflow.yaml` の強制ステップ定義は、本憲法の改訂手続きを経ずに変更しない。
- RFC 2119 キーワードセマンティクス: Delta Spec の Requirement 本文では、`SHALL` = 機能要件（system の振る舞いを規定）、`MUST` = 制約・安全要件（絶対的禁止または強制）、`SHOULD` = 推奨（逸脱可能だが理由が必要）、`MAY` = 任意（オプション機能）の使い分けを採用する。`delta-init` が生成する ADDED Requirement スタブのデフォルトは `SHALL`。

## Development Workflow & Governance

- 改訂手順: 本憲法の変更は専用のチェンジを切り、`design.md` の Constitution Check (Phase 0 / Phase 1) で全原則への影響を評価したうえで `mspec archive` 経由で反映する。
- レビュー方針: 各チェンジの self-review ステップで 5 原則すべてを Phase 0 / Phase 1 の二段で再評価し、違反または逸脱があれば Complexity Tracking に明記する。
- バージョニング: 原則の追加・削除・意味変更は MINOR 以上、文言の明確化は PATCH として `Version` と `Last Amended` を更新する。
