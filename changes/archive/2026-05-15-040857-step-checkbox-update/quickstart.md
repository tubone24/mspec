---
doc_type: How-to
---

# Quickstart: step-checkbox-update

## Prerequisites

- mspec プロジェクトが初期化済み（`.mspec/workflow.yaml` が存在する）
- ランタイムスキルファイル 8 本（`mspec-proposal` 〜 `mspec-tasks` の 7 step skills + `mspec-implement`）と `.claude/agents/mspec-checklist-auditor.md` に本変更が適用済み
- 対応する CLI テンプレート 9 本も同一内容で更新済み（FR-014 同期要件）

## Setup

本変更は Skill / Agent Markdown ファイルへの手順追加のみ（CLI TypeScript の変更なし）。`npm run build` は不要。

変更が正しく適用されているか確認：

```sh
# 各スキルに Artifacts 更新手順が含まれることを確認
grep -l "Artifacts" .claude/skills/mspec-proposal/SKILL.md \
                    .claude/skills/mspec-delta/SKILL.md \
                    .claude/skills/mspec-research/SKILL.md \
                    .claude/skills/mspec-design/SKILL.md \
                    .claude/skills/mspec-quickstart/SKILL.md \
                    .claude/skills/mspec-checklist/SKILL.md \
                    .claude/skills/mspec-tasks/SKILL.md

# mspec-implement に tasks.md 更新手順が含まれることを確認
grep -n "TNNN" .claude/skills/mspec-implement/SKILL.md

# checklist-auditor に自己検証ルールが含まれることを確認
grep -n "自己検証\|re-scan\|アノテーションなし" .claude/agents/mspec-checklist-auditor.md

# runtime と template の差分がないことを確認（FR-014）
for skill in mspec-proposal mspec-delta mspec-research mspec-design mspec-quickstart mspec-checklist mspec-tasks mspec-implement; do
  diff ".claude/skills/${skill}/SKILL.md" \
       "packages/cli/templates/claude/skills/${skill}/SKILL.md" \
    && echo "✓ ${skill} 同期 OK" \
    || echo "FAIL: ${skill} に差異あり"
done
diff .claude/agents/mspec-checklist-auditor.md \
     packages/cli/templates/claude/agents/mspec-checklist-auditor.md \
  && echo "✓ mspec-checklist-auditor 同期 OK" \
  || echo "FAIL: mspec-checklist-auditor に差異あり"
```

## Try it (Golden Path)

### 1. 新規 change を作成して proposal ステップを実行する

```
/mspec-new
/mspec-proposal
```

proposal.md が書き込まれた後、`readme.md` の `## Artifacts` 節が更新されることを確認：

```sh
grep "\- \[x\]" changes/<change-dir>/readme.md
```

期待出力：
```
- [x] proposal.md
```

### 2. delta ステップを実行して Artifacts 行を確認する

```
/mspec-delta
```

delta 完了後：

```sh
grep "\- \[x\]" changes/<change-dir>/readme.md
```

期待出力（proposal + delta が追加される）：
```
- [x] proposal.md
- [x] specs/*/spec.md (Delta Spec)
```

### 3. implement ステップでタスクチェックボックスの自動更新を確認する

```
/mspec-implement
```

各タスクが GREEN になるたびに `tasks.md` の対応行が更新される：

```sh
# implement 途中でもタスクが GREEN になった時点で更新される
grep "\- \[x\]" changes/<change-dir>/tasks.md
```

期待出力（GREEN になったタスク分だけ更新）：
```
- [x] T001: ...
- [x] T002: ...
- [ ] T003: ...
```

### 4. checklist-auditor の全項目アノテーションを確認する

```
/mspec-checklist
```

`checklist.md` を確認し、全項目に `verify:` アノテーションが付与されているかチェック：

```sh
CHECKLIST="changes/<change-dir>/checklist.md"
# 全チェックボックス行数 と verify: アノテーション数を比較
COUNT=$(grep -c "^- \[ \]\|^- \[x\]" "$CHECKLIST" 2>/dev/null || echo 0)
ANNOT=$(grep -c "<!-- verify:" "$CHECKLIST" 2>/dev/null || echo 0)
echo "チェックボックス行: ${COUNT} / verify: アノテーション: ${ANNOT}"
```

両数値が一致すれば全項目にアノテーションが付与されている（FR-011）。（数値はチェンジにより異なる）

## Verify

```sh
# 1. readme.md の Artifacts チェックボックスが正しく更新されている（FR-015）
CHANGE_DIR="changes/<change-dir>"
README="${CHANGE_DIR}/readme.md"
echo "=== Artifacts 更新確認 ==="
grep "^\- \[" "$README"
# - [x] になっている行の数が完了ステップ数と一致するはず

# 2. validate 失敗後にロールバックされること（FR-015 ロールバック）
# ※ 手動検証: 意図的に不正な spec.md を書いてから mspec validate を実行し
#    失敗後に readme.md の対応行が - [ ] に戻ることを確認する

# 3. tasks.md のタスクチェックボックスが GREEN ごとに更新される（FR-016）
TASKS="${CHANGE_DIR}/tasks.md"
echo "=== tasks.md チェックボックス確認 ==="
grep "^\- \[x\] T" "$TASKS" | wc -l
# implement で GREEN になったタスク数と一致するはず

# 4. checklist.md 全行に verify: アノテーションが付与されている（FR-011）
CHECKLIST="${CHANGE_DIR}/checklist.md"
echo "=== checklist.md アノテーション確認 ==="
BOXES=$(grep -c "^- \[ \]\|^- \[x\]" "$CHECKLIST" 2>/dev/null || echo 0)
ANNOTS=$(grep -c "<!-- verify:" "$CHECKLIST" 2>/dev/null || echo 0)
if [ "$BOXES" -eq "$ANNOTS" ]; then
  echo "✓ 全 ${BOXES} 項目にアノテーション済み"
else
  echo "FAIL: ${BOXES} 行 vs ${ANNOTS} アノテーション — 漏れあり"
  grep -n "^- \[\|^- \[x\]" "$CHECKLIST" | grep -v "verify:"
fi

# 5. runtime / template 同期（FR-014）
echo "=== runtime/template 同期確認 ==="
for skill in mspec-proposal mspec-delta mspec-research mspec-design mspec-quickstart mspec-checklist mspec-tasks mspec-implement; do
  diff ".claude/skills/${skill}/SKILL.md" \
       "packages/cli/templates/claude/skills/${skill}/SKILL.md" \
    && echo "✓ ${skill}" \
    || echo "FAIL: ${skill}"
done
diff .claude/agents/mspec-checklist-auditor.md \
     packages/cli/templates/claude/agents/mspec-checklist-auditor.md \
  && echo "✓ mspec-checklist-auditor" \
  || echo "FAIL: mspec-checklist-auditor"
```

## Troubleshooting

| 症状 | 原因 | 対処 |
|------|------|------|
| ステップ完了後も `readme.md` が `- [ ]` のまま | スキルに Artifacts 更新手順が追加されていない | 対象スキルの `SKILL.md` に `## Artifacts` 更新ステップが存在するか確認 |
| `mspec validate` 失敗後も `- [x]` のまま残る | ロールバック手順がスキルに実装されていない | スキルの Procedure を確認し、`mspec validate` 失敗時に `- [x]` → `- [ ]` へ戻す手順を追加 |
| `tasks.md` の `TNNN` 行が更新されない | `mspec-implement` にタスクチェックボックス更新手順が追加されていない | `.claude/skills/mspec-implement/SKILL.md` に `- [x] TNNN` 置換手順があるか確認 |
| `checklist.md` に `verify:` なし行がある | checklist-auditor が自己検証ステップを実行していない | `.claude/agents/mspec-checklist-auditor.md` の `## Constraints` に自己検証ルールが追加されているか確認 |
| `diff` に差異が出る（FR-014 違反） | runtime と template が別々に編集された | 両ファイルを並べて手動で差異を解消する |
