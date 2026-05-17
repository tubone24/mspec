---
doc_type: How-to
---

# Quickstart: checklist AI-driven verification

## Prerequisites

- mspec プロジェクトが初期化済み（`mspec init` または `.mspec/workflow.yaml` が存在する）
- 変更ディレクトリに `design.md` が存在する（checklist ステップを実行できる状態）
- `.claude/agents/mspec-checklist-auditor.md` に `verify:` アノテーション手順が追加済み
- `.claude/skills/mspec-implement/SKILL.md` に自動チェックロジックが追加済み

## Setup

本変更は Skill / Agent Markdown ファイルの更新のみ（CLI TypeScript の変更なし）。`npm run build` は不要。

変更が正しく適用されているか確認：

```sh
# runtime ファイルに verify: アノテーション手順が含まれることを確認
grep -n "verify:" .claude/agents/mspec-checklist-auditor.md

# template と runtime が一致することを確認
diff .claude/agents/mspec-checklist-auditor.md \
     packages/cli/templates/claude/agents/mspec-checklist-auditor.md

diff .claude/skills/mspec-implement/SKILL.md \
     packages/cli/templates/claude/skills/mspec-implement/SKILL.md
```

両 `diff` が空であれば runtime / template の同期が取れている（FR-014）。

## Try it (Golden Path)

### 1. checklist ステップを実行してアノテーション付き checklist.md を生成する

```
/mspec-checklist
```

生成された `checklist.md` に `<!-- verify: fr-NNN -->` と `<!-- verify: human -->` が付与されることを確認：

```sh
grep "verify:" changes/<change-dir>/checklist.md
```

期待出力（例）：
```
- [ ] FR-011 の Scenario が E2E テストでカバーされている <!-- verify: fr-011 -->
- [ ] design.md が FR-011 をカバーしている <!-- verify: human -->
- [ ] Constitution 原則 I — ステップ独立性が design.md でチェックされている <!-- verify: human -->
```

### 2. implement ステップを実行してタスク GREEN 時の自動チェックを確認する

```
/mspec-implement
```

各タスクが GREEN になると、対応する `<!-- verify: fr-NNN -->` 項目が自動的に `- [x]` に更新される：

```sh
# implement 中に checklist.md の変化を確認
grep "\- \[x\].*verify: fr-" changes/<change-dir>/checklist.md
```

期待出力（例）：
```
- [x] FR-011 の Scenario が E2E テストでカバーされている <!-- verify: fr-011 -->
```

### 3. 全タスク完了後の未チェック項目レポートを確認する

全タスクが GREEN になると、implement スキルが未チェック項目を種別ごとに報告する：

**verify: human 項目が残っている場合：**
```
以下の項目は人間によるレビューが必要です：
- [ ] design.md が FR-011 をカバーしている <!-- verify: human -->
- [ ] Constitution 原則 I — ステップ独立性が design.md でチェックされている <!-- verify: human -->
確認完了後にお知らせください。
```

**verify: fr-NNN ギャップが残っている場合：**
```
警告: 以下の checklist 項目が自動チェックされませんでした：
- [ ] FR-013 の ... <!-- verify: fr-013 -->

tasks.md の Requirements implemented アンカーに FR-013 が含まれていません。
チェックリストとタスクの対応関係を確認してください。
```

**全項目チェック済みの場合：**
```
✅ 全 checklist 項目がチェックされました。実装完了。
```

## Verify

```sh
# 1. checklist.md に verify: アノテーションが存在する（FR-011）
CHECKLIST="changes/<change-dir>/checklist.md"
if grep -q "<!-- verify: fr-" "$CHECKLIST" && grep -q "<!-- verify: human -->" "$CHECKLIST"; then
  echo "✓ verify: アノテーション OK"
else
  echo "FAIL: verify: アノテーションが見つからない"
fi

# 2. 1 行に verify: アノテーションが 2 つ以上付与されていないことを確認（重複なし）
if grep -E "verify:.*verify:" "$CHECKLIST" > /dev/null 2>&1; then
  echo "FAIL: 1 行に複数の verify: アノテーションが付与されている行がある"
  grep -n -E "verify:.*verify:" "$CHECKLIST"
else
  echo "✓ verify: アノテーション重複なし OK"
fi

# 3. implement 後に fr-NNN 項目が自動チェックされている
grep "\- \[x\].*<!-- verify: fr-" "$CHECKLIST" | wc -l
# GREEN になったタスク数と一致するはず

# 4. runtime と template の内容が一致している（FR-014）
diff .claude/agents/mspec-checklist-auditor.md \
     packages/cli/templates/claude/agents/mspec-checklist-auditor.md \
  && echo "✓ checklist-auditor runtime/template 同期 OK" \
  || echo "FAIL: checklist-auditor に差異あり"

diff .claude/skills/mspec-implement/SKILL.md \
     packages/cli/templates/claude/skills/mspec-implement/SKILL.md \
  && echo "✓ mspec-implement runtime/template 同期 OK" \
  || echo "FAIL: mspec-implement に差異あり"
```

## Troubleshooting

| 症状 | 原因 | 対処 |
|------|------|------|
| `checklist.md` に `<!-- verify: ... -->` が付与されない | auditor が古い定義を使用している | `.claude/agents/mspec-checklist-auditor.md` に `verify:` 付与手順が追加されているか確認 |
| タスク GREEN 後も checklist 項目が `- [ ]` のまま | tasks.md のアンカーに `Requirements implemented: FR-NNN` が記録されていない | 対象タスクのアンカーブロックを確認し、実装した FR 番号を追記 |
| fr-NNN ギャップ警告が出る | tasks.md にその FR を実装するタスクが存在しない | tasks.md を見直してカバーされていない FR にタスクを追加するか、checklist の アノテーションを修正 |
| `diff` に差異が出る（FR-014 違反） | runtime と template が別々に編集された | 両ファイルを並べて手動で差異を解消する |
| `mspec anchor check` がエラーになる | Markdown ファイルへの HTML コメントアンカーが認識されない | anchor scanner の `.md` ファイル対応状況を確認する（tasks.md で別途タスク化） |
