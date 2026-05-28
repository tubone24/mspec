---
doc_type: Explanation
---

<!-- See also: ./design.md -->

# Design Rationale: fix-specviewer-purpose-regression

## Context

mspec の `mspec delta init --capability <name>` コマンドは新規 capability の SoT spec（`specs/<capability>/spec.md`）を `buildSotSkeleton()` 関数で生成する。このスケルトンには `## Purpose` セクションにテンプレートプレースホルダー `<このスペックがカバーする外部から観測可能な振る舞いの概要>` が埋め込まれる。

設計上の意図は「アーカイブ時に AI が Purpose を生成して埋め込む」ことだったが、`mspec-archive` SKILL.md にその手順が実装されなかった。結果として 41 件の capability spec がプレースホルダーのまま運用されており、SpecViewer でこの文字列が多数表示されるという問題が発生している。

本変更はこの実装漏れを SKILL.md に手順を追加することで修正する。CLI コードの変更は伴わない。

## Decisions

### Purpose 生成を SKILL.md（AI スキル側）で行う

CLI archive コマンド（`packages/cli/src/commands/archive.ts`）は Constitution 原則 II（決定論的マージ）に従い LLM を一切呼び出さない。Purpose の生成は「スペックの Requirements 全体を読んで 1〜2 文に要約する」という意味的なタスクであり、LLM フリーの CLI では実装できない。

一方、`mspec-archive` SKILL.md は AI エージェントが実行する手順書であり、既に step 3b で readme.md の Lessons/Next Steps 生成という同様の AI タスクを担当している。Purpose 生成もこの SKILL.md に step 3d として追加するのが最も自然な配置である。`design.md` の Project Structure も参照。

### step 3c の後に step 3d として追加する

Purpose 生成は `mspec archive -y`（step 3）完了後に行う必要がある。理由は：

1. `mspec archive -y` が Delta Spec の ADDED 要件を `specs/<capability>/spec.md` にマージするため、マージ後の完全な Requirements を読んで Purpose を生成できる
2. step 3c のポストモーテムフック（Lessons/NextAction）は readme.md に対する操作であり、Purpose 生成（spec ファイルへの書き込み）と干渉しない
3. step 3d を最後に置くことで、Purpose 生成が失敗しても archive 本体は成功扱いにできる（Purpose 生成は archive の必須条件ではない）

## Alternatives Considered

- **CLI archive コマンドに Purpose 生成を追加**: Constitution 原則 II（決定論的マージ）違反となるため却下
- **mspec-archive スキルの step 3 前（dry-run 段階）に Purpose を生成**: archive 前に生成しても Requirements がまだ未マージの状態で生成することになり、ADDED 要件を含まない不完全な Purpose になる可能性がある
- **`mspec fix-purpose` 独立コマンド（CLI）の新設**: CLI で Purpose を書くには LLM 呼び出しが必要となり原則 II 違反。スキル側でのアドホック実行で対応可能

## Trade-offs

- Purpose は AI 生成のため非決定論的（実行毎に文言が異なる可能性がある）。ただし Purpose は仕様の補助情報であり、厳密な再現性は不要
- 既存 41 件は今回のスコープ外。retroactive 修正は別 change で対応が必要
- step 3d が失敗しても archive 本体が成功済みのため、Purpose 未生成のまま archive が完了する可能性がある（許容範囲：Purpose はオプション情報）

## Rejected Options

- **CLI への LLM 統合**: 決定論的マージ原則（Constitution II）に違反するため却下
- **SpecViewer でプレースホルダーを非表示にする**: 根本原因（Purpose 未生成）を放置することになるため却下。ただし retroactive 修正と組み合わせる暫定対応としては有効

## Constitution Check

| Principle | Phase 0 | Phase 1 | Notes |
|-----------|---------|---------|-------|
| I. ステップ独立性 | ✅ | ✅ | Purpose 生成は archive 後の独立ステップ |
| II. 決定論的マージ | ✅ | ✅ | CLI 側は変更なし。AI 生成はスキル側のみ |
| III. 質問駆動の要件確定 | ✅ | ✅ | FR-005 に要件明記済み |
| IV. 双方向アンカー | N/A | N/A | コード変更なし |
| V. 強制ステップと拡張ステップの分離 | ✅ | ✅ | SKILL.md（拡張ステップ）のみ変更 |
| VI. Security by Default | ✅ | ✅ | ローカルファイル書き込みのみ |
