---
doc_type: How-to
---

# Quickstart: fix-command-name-consistency

## Prerequisites

- mspec リポジトリのルートにいること（`/Users/kagadminmac/project/mspec`）
- `grep` コマンドが使えること

## Setup

追加のセットアップは不要。この変更はすべてテキスト置換のみ。

## Try it (Golden Path)

### 修正前の状態を確認する

```bash
# ハイフン形式のスラッシュコマンド参照を確認（修正前は多数ヒットする）
grep -r "/mspec-" .claude/commands/ .claude/skills/ packages/cli/src/ packages/cli/templates/ docs/ README.md .mspec/ specs/ 2>/dev/null | grep -v "Binary" | wc -l
```

### 修正を適用する（implement ステップで実施）

tasks.md が承認されたら、以下のコマンドで implement ステップを実行する：

```
/mspec:implement
```

または Claude Code の CLI から：

```bash
# tasks.md に従い各ファイルを修正する（implement スキルが実行）
```

### 修正後を確認する

```bash
# スラッシュコマンド文脈でのハイフン形式が 0 件であることを確認（全スコープ）
grep -r "/mspec-" .claude/commands/ .claude/skills/ packages/cli/src/ packages/cli/templates/ .mspec/workflow.yaml docs/ README.md specs/ 2>/dev/null | grep -v "Binary"
# → 出力なし（0件）であること

# サブエージェント名・スキル識別子は保持されていることを確認
grep -r "mspec-researcher\|mspec-checklist-auditor\|name: mspec-" .claude/ packages/cli/templates/ 2>/dev/null | wc -l
# → 0 より大きい値（これらは変更してはいけない）
```

## Verify

- **Expected output**: `grep -r "/mspec-" .claude/ packages/cli/ .mspec/workflow.yaml docs/ README.md specs/` が 0 件
- **Expected file changes**: 55 ファイルが変更される（スキル 11、コマンド 12、テンプレート 23、CLI ソース 2、テスト 1、workflow.yaml 2、docs/specs 4）
- **変更されないもの**: `name:` フロントマター・`skill:` フィールド・サブエージェント名はハイフン形式のまま

```bash
# テスト実行でリグレッションがないことを確認
cd packages/cli && npm test
```

## Troubleshooting

| 症状 | 原因 | 対処 |
|------|------|------|
| `grep` でまだヒットする | テンプレートと Runtime の片方だけ修正した | ランタイム（`.claude/`）とテンプレート（`packages/cli/templates/claude/`）の両方を確認する |
| テストが失敗する | `archive.test.ts` のフィクスチャが未修正 | `packages/cli/src/commands/archive.test.ts` の `command:` 値もコロン形式に修正する |
| `workflow.yaml` でエラー | `command:` フィールドを修正し忘れた | `.mspec/workflow.yaml` と `packages/cli/templates/workflow.default.yaml` 両方の全 `command:` 行を `/mspec:<step>` 形式に修正する |
| サブエージェントが起動しない | サブエージェント名まで変更してしまった | `mspec-researcher` 等のエージェント名はハイフン形式のまま戻す |
