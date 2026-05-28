---
doc_type: Tutorial
---

# Quickstart: postmortem-archive-integration

このチュートリアルでは、`mspec archive` 完了後に自動実行されるポストモーテムフローを体験する。Lessons が `memory/constitution.md` への原則提案として、Next Steps が新規チェンジとして変換される流れを確認する。

## Prerequisites

- mspec CLI がインストール済みであること
- 対象チェンジの全ステップ（proposal → implement）が完了していること
- 対象チェンジの `readme.md` に `### Lessons` と `### Next Steps` が記載されていること（archive ステップが Summary を自動生成する）
- プロジェクトが Git 管理下にあること（rollback 手段として）

## Setup

追加のセットアップは不要わん。既存の `mspec archive` コマンドにポストモーテムフックが組み込まれているわん。

```bash
# 現在のチェンジを確認
mspec status --json
```

## Try it（Golden Path）

### Step 1: archive を実行する

```bash
/mspec:archive
```

archive スキルが通常の処理（Summary 生成 → `mspec archive -y` → ファイル移動）を完了した後、ポストモーテムフローが自動的に開始される。

### Step 2: Lessons の提案を確認する

`mspec-lessons-analyzer` サブエージェントが `### Lessons` を分析し、`memory/constitution.md` への追記候補を生成する。

```
[AskUserQuestion]
constitution.md に追加する原則・制約を選択してください（複数選択可）

☐ [Additional Constraints] "各サブエージェントスキルは runtime と template の 2 箇所に同期更新する"
    元 Lesson: "SKILL.md を runtime 版だけ更新して template 版を忘れた"

☐ [Core Principles] "LLM 処理はメインコンテキストを汚染しないようサブエージェントに委譲する"
    元 Lesson: "archive スキルが長い分析テキストで context を使い切った"
```

追加したい項目を選択して送信する。

### Step 3: Next Steps の提案を確認する

`mspec-nextaction-planner` サブエージェントが `### Next Steps` を評価し、新規チェンジ候補を生成する。

```
[AskUserQuestion]
新しいチェンジとして登録する Next Steps を選択してください（複数選択可）

☐ [HIGH] e2e-coverage-improvement: "E2E テストのカバレッジを 80% 以上に引き上げる"
☐ [MEDIUM] docs-update: "ポストモーテムフローの README を更新する"
☐ [LOW] perf-optimization: "サブエージェント起動コストを計測する"
```

登録したい Next Steps を選択して送信する。

### Step 4: 結果を確認する

```bash
# constitution.md への追記を確認
cat memory/constitution.md | grep -A5 "Additional Constraints"

# 新規チェンジの生成を確認
ls changes/ | grep -v archive
```

承認した Lessons が `memory/constitution.md` に追記され、承認した Next Steps が `changes/<timestamp>-<kebab-name>/` ディレクトリとして生成されている。

## Verify

```bash
# constitution.md の変更を git diff で確認
git diff memory/constitution.md

# 新規チェンジのバリデーション
mspec validate --change <new-change-dir>
```

- `memory/constitution.md` に選択したエントリが追記されていること
- 選択した Next Steps 分の新規チェンジディレクトリが `changes/` 配下に存在すること
- 却下した提案は一切書き込まれていないこと

## Troubleshooting

### `### Lessons` または `### Next Steps` が空の場合

対応するフローはスキップされ、ユーザーへの通知のみが表示される。これは正常動作。

### 誤って承認してしまった場合

`memory/constitution.md` への誤追記は `git revert` で復元できる：

```bash
git log --oneline memory/constitution.md
git revert <commit-hash>
```

誤って生成された新規チェンジは、対象ディレクトリを削除するだけでよい：

```bash
rm -rf changes/<unwanted-change-dir>
```

### 提案の内容が意図と異なる場合

サブエージェントの分析精度は LLM に依存する。提案を却下して手動で `memory/constitution.md` を編集するか、次回の archive 時により明確な Lessons を書くことで精度が向上する。
