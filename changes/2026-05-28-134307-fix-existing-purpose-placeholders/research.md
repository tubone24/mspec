# Research: fix-existing-purpose-placeholders

## Decisions

| Question | Decision | Rationale |
|----------|----------|-----------|
| 現在の対象件数 | 39 件（当初 41 件から 2 件はセッション中に修正済み） | `grep -rl "<このスペック...>" specs/ | wc -l` で確認 |
| 置換実装方法 | 正規表現でプレースホルダー行のみを対象にする | Requirements・FR 番号等を誤って変更しないための安全策 |
| 実行主体 | Claude Code がアドホックで直接 Edit ツールを使用 | 専用 CLI/SKILL.md は不要（一回限りの処理） |
| 冪等性 | プレースホルダー以外が記述済みのファイルはスキップ | FR-005 の skip-and-continue ポリシーと統一 |

## Web References

（内部コードベースのみ。外部参照不要）

## Codebase Findings

### 対象スペックの現状

- `grep -rl "<このスペックがカバーする外部から観測可能な振る舞いの概要>" specs/` → **39 件**
- セッション中に修正済み: `specs/mspec-archive/spec.md`（step 3d で自動生成）
- 対象例: `delta-spec-template`, `docs-site`, `search-index`, `web-ui-server`, `memory-constitution`, `mspec-proposal` など

### プレースホルダーの構造

各ファイルの `## Purpose` セクション:
```
## Purpose

<このスペックがカバーする外部から観測可能な振る舞いの概要>

## Requirements
```

置換対象は `<このスペックがカバーする外部から観測可能な振る舞いの概要>` 行のみ。他セクションは変更しない。

### 実装アプローチ

1. `grep -rl "..."` で対象ファイルリストを取得
2. 各ファイルについて `## Requirements` セクション以下を読んで AI が Purpose を生成
3. Edit ツールで `## Purpose` と `## Requirements` の間の行のみを置換
4. 処理結果（修正件数・スキップ件数・失敗件数）をサマリーに記録

## Open Choices

（なし。全決定事項を proposal.md の Decisions に記録済み）

## Constitution Check

| Principle | Phase 0 | Phase 1 |
|-----------|---------|---------|
| I. ステップ独立性 | PASS — アドホック実行は他ステップに影響しない | — |
| II. 決定論的マージ | PASS — CLI マージは変更なし | — |
| III. 質問駆動の要件確定 | PASS — proposal で全決定事項を確認済み | — |
| IV. 双方向アンカー | N/A — アドホック実行のためアンカー対象なし | — |
| V. 強制ステップと拡張ステップの分離 | PASS — SKILL.md・workflow.yaml 変更なし | — |
| VI. Security by Default | PASS — ローカル書き込みのみ。外部 API なし | — |
| VII. 設計意図と実装の対応確認 | PASS — FR-005 の設計意図（retroactive バックフィル）を FR-006 で明示的に実装 | — |
