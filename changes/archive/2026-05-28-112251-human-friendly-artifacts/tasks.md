---
doc_type: Reference
---

# Tasks: human-friendly-artifacts

## Phase 1 — Setup

### Task 1.1: テンプレートファイルの現行状態を確認する

確認対象ファイルの grep でベースラインを取得する。

```bash
# 現行の見出し名を確認
grep -n "## Delta Spec\|## Source-of-Truth\|## Constitution" \
  packages/cli/templates/artifacts/checklist.ja.md \
  packages/cli/templates/artifacts/checklist.en.md

# 現行の auditor セクション名を確認
grep -n "Delta Spec Coverage\|Source-of-Truth Regression\|Constitution" \
  packages/cli/templates/claude/agents/mspec-checklist-auditor.md

# 現行の design.md ## Summary 直下内容を確認
grep -n -A3 "## Summary" packages/cli/templates/artifacts/design.ja.md
grep -n -A3 "## Summary" packages/cli/templates/artifacts/design.en.md
```

## Phase 2 — Foundational

### Task 2.1: E2E — auditor 更新後の checklist セクション名を検証する（FR-007）

<!-- @mspec-delta 2026-05-28-112251-human-friendly-artifacts/specs/artifact-templates-i18n/spec.md -->
<!-- Requirements implemented: FR-007 -->
<!-- Change: human-friendly-artifacts -->

実装前にテスト（検証スクリプト）を書く。

```bash
# 新しいセクション名が auditor に存在することを確認するテスト（実装後に GREEN になるはず）
grep -q "機能確認\|Functional Verification" packages/cli/templates/claude/agents/mspec-checklist-auditor.md \
  && echo "PASS: ja heading found" \
  || echo "FAIL: ja heading not found"

grep -q "リグレッションリスク\|Regression Risk" packages/cli/templates/claude/agents/mspec-checklist-auditor.md \
  && echo "PASS: regression heading found" \
  || echo "FAIL: regression heading not found"
```

### Task 2.2: IMPL — mspec-checklist-auditor.md のセクション名を更新する（FR-007）

<!-- @mspec-delta 2026-05-28-112251-human-friendly-artifacts/specs/artifact-templates-i18n/spec.md -->
<!-- Requirements implemented: FR-007 -->
<!-- Change: human-friendly-artifacts -->

`packages/cli/templates/claude/agents/mspec-checklist-auditor.md` の Job 手順 5 に記載されたセクション名を以下の通り更新する。

- `## Delta Spec Coverage` → `## 機能確認`
- `## Source-of-Truth Regression`（または `## Source-of-Truth Regression Risk`）→ `## リグレッションリスク`
- `## Constitution` → `## デプロイ前確認`

**注意**: auditor のロジック・手順・他のセクション（Introduction、Job、Verification など）は変更しない。セクション名のハードコード部分のみを変更する。

## Phase 3 — User Story

### Task 3.1: E2E — checklist.ja.md の新見出し・説明文を検証する（FR-006, FR-007）

<!-- @mspec-delta 2026-05-28-112251-human-friendly-artifacts/specs/artifact-templates-i18n/spec.md -->
<!-- Requirements implemented: FR-006, FR-007 -->
<!-- Change: human-friendly-artifacts -->

```bash
# 新しい日本語見出しが存在すること
grep -q "## 機能確認" packages/cli/templates/artifacts/checklist.ja.md \
  && echo "PASS: 機能確認 heading exists" || echo "FAIL"
grep -q "## リグレッションリスク" packages/cli/templates/artifacts/checklist.ja.md \
  && echo "PASS: リグレッションリスク heading exists" || echo "FAIL"
grep -q "## デプロイ前確認" packages/cli/templates/artifacts/checklist.ja.md \
  && echo "PASS: デプロイ前確認 heading exists" || echo "FAIL"

# 各 H2 直下に説明文（HTML コメントでない行）が存在すること
python3 -c "
import re
content = open('packages/cli/templates/artifacts/checklist.ja.md').read()
sections = re.split(r'^## ', content, flags=re.MULTILINE)[1:]
for s in sections:
    lines = [l for l in s.splitlines()[1:] if l.strip() and not l.strip().startswith('<!--') and not l.strip().startswith('-')]
    assert lines, f'No prose found in section: {s[:30]}'
print('PASS: All sections have prose')
"
```

### Task 3.2: IMPL — checklist.ja.md を更新する（FR-006, FR-007）

<!-- @mspec-delta 2026-05-28-112251-human-friendly-artifacts/specs/artifact-templates-i18n/spec.md -->
<!-- Requirements implemented: FR-006, FR-007 -->
<!-- Change: human-friendly-artifacts -->

`packages/cli/templates/artifacts/checklist.ja.md` を以下の構造に更新する。

```markdown
## 機能確認

このセクションでは、実装した機能が Delta Spec の要件を満たしているか確認します。

<!-- auditor が FR ごとのチェック項目を生成 -->

## リグレッションリスク

このセクションでは、変更が既存機能へ意図せず影響していないか確認します。

<!-- auditor が既存 SoT spec への影響分析を生成 -->

## デプロイ前確認

このセクションでは、リリースに向けた最終確認をします。

<!-- auditor が Constitution 準拠チェックを生成 -->
```

### Task 3.3: E2E — checklist.en.md の新見出し・説明文を検証する（FR-006, FR-007）

<!-- @mspec-delta 2026-05-28-112251-human-friendly-artifacts/specs/artifact-templates-i18n/spec.md -->
<!-- Requirements implemented: FR-006, FR-007 -->
<!-- Change: human-friendly-artifacts -->

```bash
grep -q "## Functional Verification" packages/cli/templates/artifacts/checklist.en.md \
  && echo "PASS" || echo "FAIL: Functional Verification not found"
grep -q "## Regression Risk" packages/cli/templates/artifacts/checklist.en.md \
  && echo "PASS" || echo "FAIL: Regression Risk not found"
grep -q "## Pre-deploy Checklist" packages/cli/templates/artifacts/checklist.en.md \
  && echo "PASS" || echo "FAIL: Pre-deploy Checklist not found"
```

### Task 3.4: IMPL — checklist.en.md を更新する（FR-006, FR-007）

<!-- @mspec-delta 2026-05-28-112251-human-friendly-artifacts/specs/artifact-templates-i18n/spec.md -->
<!-- Requirements implemented: FR-006, FR-007 -->
<!-- Change: human-friendly-artifacts -->

`packages/cli/templates/artifacts/checklist.en.md` を英語版に対応する構造に更新する（`## Source-of-Truth Regression Risk` → `## Regression Risk`）。各見出し直下に英語の一文説明を追加する。

### Task 3.5: E2E — design.ja.md の ## Summary 直下リード文を検証する（FR-006, FR-008）

<!-- @mspec-delta 2026-05-28-112251-human-friendly-artifacts/specs/artifact-templates-i18n/spec.md -->
<!-- Requirements implemented: FR-006, FR-008 -->
<!-- Change: human-friendly-artifacts -->

```bash
python3 -c "
content = open('packages/cli/templates/artifacts/design.ja.md').read()
lines = content.splitlines()
for i, line in enumerate(lines):
    if line.strip() == '## Summary':
        # 次の非空行がコメントでない散文であること
        for j in range(i+1, min(i+5, len(lines))):
            if lines[j].strip():
                assert not lines[j].strip().startswith('<!--'), f'Lead text is a comment: {lines[j]}'
                assert 'ドキュメント' in lines[j] or 'document' in lines[j].lower(), f'Lead text missing reader context: {lines[j]}'
                print(f'PASS: Lead text found: {lines[j][:50]}')
                break
        break
"
```

### Task 3.6: IMPL — design.ja.md に ## Summary 直下リード文プレースホルダを追加する（FR-006, FR-008）

<!-- @mspec-delta 2026-05-28-112251-human-friendly-artifacts/specs/artifact-templates-i18n/spec.md -->
<!-- Requirements implemented: FR-006, FR-008 -->
<!-- Change: human-friendly-artifacts -->

`packages/cli/templates/artifacts/design.ja.md` の `## Summary` セクション直下に以下のリード文プレースホルダを追加する（既存コンテンツの前に挿入）。

```markdown
## Summary

このドキュメントは <変更名> の技術設計を記述します。読者は <対象読者（例: 実装エンジニア、レビュアー）> を想定しています。採用理由・代替案は design-rationale.md を参照してください。

<設計の概要を 3 行以内で記述>
```

### Task 3.7: E2E — design.en.md の ## Summary 直下リード文を検証する（FR-006, FR-008）

<!-- @mspec-delta 2026-05-28-112251-human-friendly-artifacts/specs/artifact-templates-i18n/spec.md -->
<!-- Requirements implemented: FR-006, FR-008 -->
<!-- Change: human-friendly-artifacts -->

```bash
python3 -c "
content = open('packages/cli/templates/artifacts/design.en.md').read()
lines = content.splitlines()
for i, line in enumerate(lines):
    if line.strip() == '## Summary':
        for j in range(i+1, min(i+5, len(lines))):
            if lines[j].strip():
                assert not lines[j].strip().startswith('<!--'), f'Lead text is a comment'
                print(f'PASS: Lead text found: {lines[j][:60]}')
                break
        break
"
```

### Task 3.8: IMPL — design.en.md に ## Summary 直下リード文プレースホルダを追加する（FR-006, FR-008）

<!-- @mspec-delta 2026-05-28-112251-human-friendly-artifacts/specs/artifact-templates-i18n/spec.md -->
<!-- Requirements implemented: FR-006, FR-008 -->
<!-- Change: human-friendly-artifacts -->

`packages/cli/templates/artifacts/design.en.md` の `## Summary` セクション直下に英語版リード文プレースホルダを追加する。

```markdown
## Summary

This document describes the technical design of <change-name>. Intended readers: <target audience (e.g., implementing engineers, reviewers)>. For rationale and alternatives, see design-rationale.md.

<Design overview in 3 lines or fewer>
```

### Task 3.9: E2E — proposal.ja.md の各 H2 直下説明文を検証する（FR-006）

<!-- @mspec-delta 2026-05-28-112251-human-friendly-artifacts/specs/artifact-templates-i18n/spec.md -->
<!-- Requirements implemented: FR-006 -->
<!-- Change: human-friendly-artifacts -->

```bash
python3 -c "
import re
content = open('packages/cli/templates/artifacts/proposal.ja.md').read()
# ## Why / ## Goals / ## Non-Goals の各 H2 直下に散文が存在することを確認
target_sections = ['## Why', '## Goals', '## Non-Goals']
for section in target_sections:
    pattern = rf'{re.escape(section)}\n\n?(.+?)(\n##|\Z)'
    m = re.search(pattern, content, re.DOTALL)
    if m:
        first_line = m.group(1).strip().splitlines()[0]
        assert not first_line.startswith('<!--'), f'{section}: prose is a comment'
        assert not first_line.startswith('<'), f'{section}: prose is a placeholder only'
        print(f'PASS {section}: {first_line[:40]}')
    else:
        print(f'FAIL: {section} not found or no content')
"
```

### Task 3.10: IMPL — proposal.ja.md の各 H2 直下に一文の説明を追加する（FR-006）

<!-- @mspec-delta 2026-05-28-112251-human-friendly-artifacts/specs/artifact-templates-i18n/spec.md -->
<!-- Requirements implemented: FR-006 -->
<!-- Change: human-friendly-artifacts -->

`packages/cli/templates/artifacts/proposal.ja.md` の各 H2 セクション直下（プレースホルダの前）に一文の説明を追加する。

| セクション | 追加する説明文 |
|-----------|-------------|
| `## Why` | このセクションでは、変更の背景・動機・解決したい課題を記述してください。 |
| `## Goals` | このセクションでは、この変更で達成したいことを箇条書きで記述してください。 |
| `## Non-Goals` | このセクションでは、この変更では意図的に対応しないことを明記してください。 |
| `## Capabilities (touched)` | このセクションでは、変更が影響するシステムの機能・コンポーネント名を列挙してください。 |
| `## Open Questions` | このセクションでは、まだ決まっていない事項や確認が必要な点を記述してください。 |

### Task 3.11: E2E — proposal.en.md の各 H2 直下説明文を検証する（FR-006）

<!-- @mspec-delta 2026-05-28-112251-human-friendly-artifacts/specs/artifact-templates-i18n/spec.md -->
<!-- Requirements implemented: FR-006 -->
<!-- Change: human-friendly-artifacts -->

```bash
python3 -c "
import re
content = open('packages/cli/templates/artifacts/proposal.en.md').read()
target_sections = ['## Why', '## Goals', '## Non-Goals']
for section in target_sections:
    pattern = rf'{re.escape(section)}\n\n?(.+?)(\n##|\Z)'
    m = re.search(pattern, content, re.DOTALL)
    if m:
        first_line = m.group(1).strip().splitlines()[0]
        assert not first_line.startswith('<!--'), f'{section}: prose is a comment'
        print(f'PASS {section}: {first_line[:40]}')
    else:
        print(f'FAIL: {section} not found')
"
```

### Task 3.12: IMPL — proposal.en.md の各 H2 直下に一文の説明を追加する（FR-006）

<!-- @mspec-delta 2026-05-28-112251-human-friendly-artifacts/specs/artifact-templates-i18n/spec.md -->
<!-- Requirements implemented: FR-006 -->
<!-- Change: human-friendly-artifacts -->

`packages/cli/templates/artifacts/proposal.en.md` の各 H2 セクション直下に英語版の一文説明を追加する。

## Phase 4 — Polish

### Task 4.1: 対称性の最終確認（FR-003 回帰テスト）

全変更ファイルの ja/en 対称性を確認する。

```bash
# 変更した全テンプレートファイルが ja/en 両方存在すること
for f in checklist design proposal; do
  [ -f "packages/cli/templates/artifacts/${f}.ja.md" ] && echo "PASS: ${f}.ja.md exists" || echo "FAIL"
  [ -f "packages/cli/templates/artifacts/${f}.en.md" ] && echo "PASS: ${f}.en.md exists" || echo "FAIL"
done
```

### Task 4.2: mspec new で "missing template" 警告が出ないことを確認（FR-005 回帰テスト）

```bash
# テスト用の一時 change を作成して warning が出ないことを確認
mspec new test-template-smoke 2>&1 | grep "missing template" && echo "FAIL: regression detected" || echo "PASS: no missing template warnings"
# クリーンアップ
rm -rf changes/*-test-template-smoke/
```

## Constitution Check

| Principle | Phase 0 | 備考 |
|-----------|---------|------|
| I. ステップ独立性 | ✅ | tasks は design/checklist のみに依存し、他ステップに影響しない |
| II. 決定論的マージ | ✅ | E2E → IMPL の順序が明確で再現可能 |
| III. 質問駆動の要件確定 | ✅ | design での全 OC 解決済み |
| IV. 双方向アンカー | ✅ | 全タスクに @mspec-delta アンカーブロックあり |
| V. 強制ステップと拡張ステップの分離 | ✅ | workflow.yaml への変更なし |
| VI. Security by Default | ✅ | ローカルファイル変更のみ |

<!-- LEARNING: risk_tier: trivial の FR のみを含む変更では verify アノテーションが不要になり、tasks.md が短くなる | source: FR-006 | confidence: high -->
