# Research: postmortem-archive-integration

## Decisions

| 決定事項 | 結論 | 代替案 | 根拠 |
|---------|------|--------|------|
| サブエージェント呼び出しタイミング | `mspec archive -y` 完了後（ステップ 3 と 4 の間） | archive 前に呼び出す | archive 完了後に `readme.md` が `changes/archive/` へ移動するため、完了後のパスを参照する必要がある |
| サブエージェントへの渡すパス | `changes/archive/<change-dir>/readme.md` | `changes/<change-dir>/readme.md` | `mspec archive -y` が `git mv` で移動するため、postmortem 実行時点ではアーカイブパスが正しい |
| 読み取るセクション名（Lessons） | `### Lessons` | `### NextActions`（誤称） | 実在テンプレートとアーカイブ済み readme はすべて `### Lessons` を使用 |
| 読み取るセクション名（NextActions） | `### Next Steps` | `### NextActions`（誤称） | テンプレート・全アーカイブ済み readme がいずれも `### Next Steps` を使用。Delta Spec の `NextActions` 表記は `Next Steps` に修正が必要 |
| `target_section` の型 | 固定 enum（`Core Principles` または `Additional Constraints`） | 自由テキスト | セクション名の誤記・不整合を防ぐ。constitution.md の実在セクションに対応 |
| ポストモーテム空セクションの扱い | スキップして通知のみ（サブエージェント不起動） | サブエージェントを起動してエラー返却 | 不要なコンテキスト消費を避け、ユーザーへの通知で十分 |
| constitution.md への追記セクション | LLM の `target_section` フィールドで指定（固定 enum） | 常に `## Additional Constraints` 末尾に固定 | 原則レベルの提案と制約レベルの提案を区別できる |
| サブエージェント呼び出しパターン | archive スキル内インライン起動（Agent tool 直接） | `mspec continue` 経由の subagent_prompt | mspec-proposal の security-analyzer パターンに準拠。postmortem はワークフロー定義上の独立ステップでなく archive 内の後続動作 |
| ロールバック手段 | `git revert` のみ | 独自バックアップ | プロジェクトが Git 管理下にあり、constitution.md も git mv 済み change も revert で復元可能 |

## Web References

- [Zalando: Dead Ends or Data Goldmines? AI-Powered Postmortem Analysis](https://engineering.zalando.com/): LLM によるポストモーテム自動分析の実践例。根本原因帰属の誤りを防ぐには人間の承認ゲートが必須であることを報告
- [Epsilla Blog: The 3 Essential Sub-Agent Patterns for Production-Grade AI Systems](https://www.epsilla.com/): Tool-based Delegation / Orchestrator-Worker / fan-out fan-in の 3 パターンを整理。構造化出力スキーマをエージェント境界で使用することでばらつきを削減できると推奨
- [Rootly: Accelerate Learning with Automated Postmortem Tools](https://rootly.com/): タイムライン再構成は自動化に適するが、最終的な根本原因分析は人間の専門知識が必要と指摘。ユーザー承認ゲートの重要性を支持

## Codebase Findings

### mspec-archive skill 現状

`/Users/kagadminmac/project/mspec/.claude/skills/mspec-archive/SKILL.md`

- 現在のステップ構成: 1 → 2 → 3b（readme 生成）→ 3（`mspec archive -y` 実行）→ 4（レポート）
- postmortem フックの挿入点は **ステップ 3 と 4 の間**（`mspec archive -y` 完了後、ユーザーへの最終レポート前）
- ステップ 3b が readme の `## Summary` を生成するため、サブエージェントはアーカイブ済みの完全な readme を読める
- `packages/cli/templates/claude/skills/mspec-archive/SKILL.md` も同期更新が必要（runtime と template の 2 箇所）

### readme.md Lessons/NextActions フォーマット

`/Users/kagadminmac/project/mspec/packages/cli/templates/artifacts/readme.en.md`

テンプレートの正式セクション構造（`### Lessons` / `### Next Steps`）:

```markdown
## Summary (Lessons / Next Steps)
<!-- archive step will auto-fill -->
```

アーカイブ済みチェンジ（`dynamic-security-questions`, `full-text-search`, `multi-test-runner-support`）すべてが以下の構造を持つ:

```markdown
### Lessons
- bullet ...
### Next Steps
- bullet ...
```

**重要**: Delta Spec が `NextActions` と参照しているセクションは存在しない。正しい名称は `### Next Steps`。実装時は必ずこのセクション名でパースすること。

### constitution.md 構造

`/Users/kagadminmac/project/mspec/memory/constitution.md`

- `## Core Principles` — I〜VI の番号付き原則（`### I. <タイトル>` 形式）
- `## Additional Constraints` — 箇条書きの制約リスト
- `## Development Workflow & Governance` — 改訂・レビュー・バージョニング手順
- `target_section` の固定 enum 値: `"Core Principles"` または `"Additional Constraints"`

### 既存サブエージェントパターン

`/Users/kagadminmac/project/mspec/.claude/skills/mspec-proposal/SKILL.md:4a`

- `mspec continue` 経由でなく **archive スキル内で直接 Agent tool を使いインライン起動**（security-analyzer パターン）
- これが postmortem サブエージェントの直接の先例

サブエージェントの戻り値フォーマット推奨（構造化データ）:
- mspec-lessons-analyzer: `{ text, target_section, source_lesson }`
- mspec-nextaction-planner: `{ priority, kebab_name, summary }`

## Open Choices

すべて解決済み:

| 選択事項 | 決定 |
|---------|------|
| `### Next Steps` vs `### NextActions` | `### Next Steps`（既存テンプレートに合わせる） |
| `target_section` の型 | 固定 enum（`Core Principles` / `Additional Constraints`） |
| 空セクションのフォールバック | スキップして通知のみ |
| runtime/template SKILL.md 同期 | 両方同時に更新（実装タスクで対応） |

## Constitution Check

| 原則 | Phase 0 | Phase 1 |
|------|---------|---------|
| I. ステップ独立性 | OK — postmortem サブエージェントは archive 完了後に `changes/archive/<change-dir>/readme.md` を独立して読み込む。前段の会話コンテキストに依存しない | — |
| II. 決定論的マージ | OK — `constitution.md` への追記は純粋なテキスト追加であり、既存の Delta Spec マージロジック（CLI パーサー）を変更しない | — |
| III. 質問駆動の要件確定 | OK — Lessons 提案・NextActions 提案ともに `AskUserQuestion` を経由し、ユーザーが承認したもののみ実行する | — |
| IV. 双方向アンカー | OK — archive スキルの修正箇所と新規サブエージェントスキル（SKILL.md）に `@mspec-delta` アンカーを付与する | — |
| V. 強制ステップと拡張ステップの分離 | OK — `workflow.yaml` のステップ定義は変更しない。postmortem は archive 強制ステップ内の後続動作として追加 | — |
| VI. Security by Default | OK — `constitution.md` 書き込みはユーザー承認後のみ、`mspec new` は `changes/` 配下のみ、`### Next Steps` テキストは LLM が kebab-case に正規化してからコマンド引数に渡す | — |
