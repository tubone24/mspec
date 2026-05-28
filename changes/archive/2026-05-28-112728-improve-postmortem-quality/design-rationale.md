---
doc_type: Explanation
---

<!-- See also: ./design.md -->

# Design Rationale: improve-postmortem-quality

## Context

mspec のポストモーテムフローは、archive ステップ後に2つのサブエージェント（`mspec-lessons-analyzer` と `mspec-nextaction-planner`）を起動してナレッジ転移を行う。しかし現状では以下の2つの品質上の欠陥がある。

第一に、`mspec-lessons-analyzer` が生成する Lessons 提案が具体的すぎる。サブエージェントの指示は「general, not change-specific」と書かれているが、どの程度の抽象度が「general」なのかの基準が定義されていない。結果として「mspec validate を実行し忘れた」「spec.md のプレースホルダーを埋め忘れた」というツール・ファイル固有の表現がそのまま `constitution.md` の提案として現れ、次のプロジェクトや別ツールでは活用できない。

第二に、`mspec-nextaction-planner` が `mspec:new` を提案しても、生成されるチェンジの `readme.md` が未記入のまま残る。これは次のセッションで「このチェンジは何だったか」が一切わからないという問題を引き起こす。`mspec new --request` CLI フラグが既に実装されているにも関わらず活用されていなかった。

## Decisions

### Lessons の抽象化: 固有名詞シグナルルール

抽象化の必要性を判定する最もシンプルかつ信頼性の高い基準として「固有名詞シグナル」を採用した。ツール名・コマンド名・ファイル名・パスは、特定の技術スタックや実装に依存する指標であり、これらが含まれる Lesson は本質的なプロセス原則に変換されていないと見なせる。逆に、これらを含まずに「〜してはならない」「〜を確保する」「〜に依存しない」という語彙で構成される Lesson はすでに十分に抽象化されている。

この二分法は Google SRE の postmortem 文化における "Auxiliary Reasons"（当面の技術的原因）と "Fundamental Reasons"（構造的・組織的制約）の区別に対応する。固有名詞を含む Lesson は Auxiliary Reasons であり、固有名詞を除去してプロセス・設計レベルに引き上げることで Fundamental Reasons になる。

抽象化は最大1段階に制限する。「なぜ×5」的な再帰抽象化は哲学的命題を生み出すが実用価値がない。「ツール依存の判断をした → 状態管理コンポーネントの出力を参照せずにアクションを決定した」レベルが適切な着地点である。

### request_summary のフィールド追加と archive スキルでの --request 活用

`mspec-nextaction-planner` のアーキテクチャ原則は「read-only サブエージェント」である。ファイル書き込みをプランナー自身に持たせると、将来のサブエージェント権限モデルの変更に影響を与えるため、この原則を維持した。

代わりに、プランナーが生成する JSON に `request_summary` フィールドを追加し、archive スキルが `mspec new --request` フラグ経由で渡す設計を選んだ。CLI フラグは既存実装（`packages/cli/src/commands/new.ts:105`）があり、`{{request}}` プレースホルダー置換が実装済みであるため、CLI 変更コストはゼロである。

`request_summary` を optional（非必須）フィールドとした理由は後方互換性の保護のためである。archive スキルが古い（`request_summary` を返さない）プランナー出力を受け取っても動作が壊れないよう、フォールバックを明示的に設計した。

### .claude/agents/ ファイルの変更を cp コマンドで行う

`memory/constitution.md` に「`.claude/agents/` への直接 Write はブロックされる場合がある」という制約が明記されている。実装タスクで直接 Write を試みるとパーミッションプロンプトが発生し作業が中断するリスクがある。cp コマンドはシェルの通常操作として許可されているため、実装上の障害なく変更を適用できる。

## Alternatives Considered

- **planner が readme.md を直接 Edit する（Option A）**: planner の read-only 原則を破ることになる。archive スキルのファイル権限管理が複雑化する。
- **archive スキルが mspec new 後に Edit ツールで後書きする（Option A 変形）**: CLI の --request フラグが活用できず、実装が冗長になる。readme テンプレートの変更に追随する必要がある。
- **全 Lesson を無条件に再抽象化する**: 既に抽象的な Lesson が過剰変換されて意味を失うリスクがある。FR-003 Scenario 3 に違反する。
- **`request_summary` を必須フィールドにする**: in-flight の変更でプランナーを呼ぶ archive スキルが壊れる。後方互換性が失われる。

## Trade-offs

- **固有名詞シグナルルールの限界**: 固有名詞を含まない具体的 Lesson（例：「3回試みたが失敗した」）は pass-through になる可能性がある。ただし現実の Lesson 記録の大半はツール名・コマンド名を含むため、実用上の問題は小さい。
- **request_summary の1行制限**: 長い Next Steps の場合、文脈を圧縮しきれない可能性がある。ただし詳細化は後続の proposal ステップに委ねる設計方針と整合している。

## Rejected Options

- **抽象化深度を複数段階にする**: 哲学的命題を生成するリスクが高く、実用価値がない。Google SRE が1段階の "Root Cause" 特定を推奨していることとも整合しない。
- **permissions に `.claude/agents/**` を追加して直接 Write**: パーミッション設定の変更は副作用の範囲が広い。最小権限原則に反する。

## Constitution Check

| 原則 | Phase 0 | Phase 1 |
|------|---------|---------|
| I. ステップ独立性 | ✅ 設計は読み取り専用入力から生成 | ✅ design-rationale.md は他アーティファクトに副作用を持たない |
| II. 決定論的マージ | ✅ FR-003 追加のみ | ✅ 既存原則・制約への意図しない変更なし |
| III. 質問駆動の要件確定 | ✅ 全 Open Choices を確認済み | ✅ 追加の設計判断は不要 |
| IV. 双方向アンカー | ✅ 各 Decision が FR-003 Scenario と対応 | ✅ 実装タスクが design.md の Decisions を参照できる |
| V. 強制ステップと拡張ステップの分離 | ✅ design は拡張ステップ | ✅ 強制ステップの設計変更なし |
| VI. Security by Default | ✅ planner read-only 維持 | ✅ request_summary への改行禁止でシェルインジェクションリスクを明示的に排除 |

### Complexity Tracking

None
