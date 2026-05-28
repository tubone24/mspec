---
doc_type: Explanation
---

<!-- See also: ./design.md -->

# Design Rationale: postmortem-archive-integration

## Context

mspec のチェンジワークフローは、`mspec archive` が完了すると `readme.md` の `## Summary (Lessons / Next Steps)` に学習事項と次のアクションが記録される。しかしこれらは「書き捨て」の状態にあり、Lessons は個別チェンジの経験として閉じ、Next Steps は次のアクションが取られないまま埋もれることが多かった。

このチェンジは、その「ポストモーテム情報」をシステム全体の改善に循環させる仕組みを設計する。Lessons は `memory/constitution.md` の原則・制約として抽象化され、Next Steps は新しいチェンジとして継続的に取り組める形に変換される。

ユーザーが関与しない自動化は避ける。誤った原則が constitution.md に混入したり、不要なチェンジが乱立したりするリスクを防ぐため、すべての提案はユーザーの明示的な承認を必要とする設計とした。

## Decisions

### サブエージェント委譲パターンの採用

Lessons の分析と Next Steps の評価を専用サブエージェント（mspec-lessons-analyzer / mspec-nextaction-planner）に委譲する理由は 2 つある。第一に、archive スキルのメインコンテキストが長い分析テキストで汚染されるのを防ぐため。第二に、各サブエージェントが Constitution の原則 I（ステップ独立性）に従い独立したコンテキストで動作できるため。

mspec-proposal の security-analyzer が先例として存在しており、同じインライン Agent tool パターンを踏襲することでコードの一貫性も保たれる。

### multi-select AskUserQuestion の採用

提案を 1 件ずつ Yes/No で問う方式は、提案数が多い場合にユーザー体験が悪化する。全件を multi-select で一覧表示する方式は、ユーザーが全体感を把握した上で優先度判断ができ、操作回数も最小化できる。

### 固定 enum による target_section

LLM が自由テキストでセクション名を返すと、誤記（例：`Additional Constraint`）や存在しないセクション名（例：`## Security`）が混入するリスクがある。`"Core Principles"` と `"Additional Constraints"` の 2 値に限定することで、constitution.md の既存構造との整合性を保証する。

## Alternatives Considered

- **`mspec continue` 経由の subagent_prompt パターン**: checklist / review ステップが採用するワークフロー定義型サブエージェント。しかし postmortem は archive の後続動作であり、独立したワークフローステップとして定義すると原則 V（強制ステップと拡張ステップの分離）に抵触するリスクがある。archive スキル内のインライン起動を選択した。
- **archive 前に分析する**: 分析実行時点で `readme.md` がまだ `changes/` 配下にある方が直感的だが、Summary セクションは archive ステップ 3b で生成されるため、archive 前では Lessons/Next Steps が存在しない。
- **独自バックアップ（.bak）**: constitution.md 書き込み前に自動バックアップを作成する案は、Git 管理下では冗長であり git revert で十分。

## Trade-offs

- **提案の質は LLM に依存する**: mspec-lessons-analyzer が生成する原則の抽象化品質は LLM の能力に依存する。ユーザー承認ゲートが品質保証の最終防衛線となる。
- **サブエージェント起動コスト**: 毎回の archive で 2 つのサブエージェントが起動するため、Lessons/Next Steps が空の場合でもわずかなコンテキスト消費が発生する。スキップ条件（空セクションは起動しない）で緩和する。
- **multi-select の上限**: AskUserQuestion の選択肢は最大 4 件の制約がある。提案が 4 件を超える場合の処理（優先度上位 4 件に絞る / 複数回に分けて提示）は設計上未確定だが、実際の Lessons/Next Steps は通常 3〜5 件以内であり、実用上は問題になりにくい。

## Rejected Options

- **ユーザー確認なしの自動追記**: 誤った原則が constitution.md に蓄積するリスクが受け入れられない。Non-Goal として明示的に除外。
- **過去アーカイブの一括再分析**: 対象チェンジが多数あり、実行コストとノイズが大きい。今回のスコープ外とし、将来の別チェンジで対応可能な設計にする。
- **constitution.md 以外のメモリファイルへの書き込み**: スコープを絞ることで Constitution 原則（ファイルシステムアクセスは `changes/` / `specs/` / `memory/` の範囲に閉じる）への整合性を保ちつつ、誤書き込みのリスクを排除する。

## Constitution Check

| 原則 | Phase 0 | Phase 1 |
|------|---------|---------|
| I. ステップ独立性 | OK — 設計全体がコンテキスト独立を前提とした構造 | OK — サブエージェントが独立コンテキストで動作するアーキテクチャを採用 |
| II. 決定論的マージ | OK — 追記はテキスト追加のみ、マージロジック非変更 | OK — target_section 固定 enum で追記先が決定論的に決まる |
| III. 質問駆動の要件確定 | OK — すべての提案に AskUserQuestion を経由 | OK — multi-select で全提案を一覧表示し、ユーザー選択が入力 |
| IV. 双方向アンカー | OK — SKILL.md に @mspec-delta アンカーを付与する設計 | OK — 各サブエージェント SKILL.md が対応 FR に紐付くアンカーを持つ |
| V. 強制ステップと拡張ステップの分離 | OK — workflow.yaml を変更しない | OK — archive スキルの後続動作として実装し、ステップ定義を追加しない |
| VI. Security by Default | OK — 承認ゲート・最小権限・インジェクション対策が設計に組み込まれている | OK — design.md D-004 で追記フォーマットを最小差分に限定し、任意コード実行の入口を排除 |

### Complexity Tracking

None
