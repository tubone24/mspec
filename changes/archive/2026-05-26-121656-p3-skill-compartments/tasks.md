# Tasks: p3-skill-compartments

## Constitution Check

| 原則 | Phase 0 |
|------|---------|
| I. 仕様駆動 | ✅ FR-024 定義済み |
| II. TDD | ✅ Markdownのみ |
| III. 双方向アンカー | ✅ |
| IV. 決定論的アーカイブ | ✅ |
| V. リスク比例検証 | ✅ trivial |

<!-- @mspec-delta 2026-05-26-121656-p3-skill-compartments/specs/claude-integration/spec.md -->
<!-- Requirements implemented: FR-024 -->
<!-- Change: p3-skill-compartments -->

## Task List

- [ ] T001: 全SKILL.mdに ## Verification (C2) と ## Learning (C3) セクションを追加

```anchor
@mspec-delta 2026-05-26-121656-p3-skill-compartments/specs/claude-integration/spec.md
Requirements implemented: FR-024
Change: p3-skill-compartments
```

対象ファイル:
- `.claude/skills/mspec-archive/SKILL.md`
- `.claude/skills/mspec-checklist/SKILL.md`
- `.claude/skills/mspec-delta/SKILL.md`
- `.claude/skills/mspec-design/SKILL.md`
- `.claude/skills/mspec-implement/SKILL.md`
- `.claude/skills/mspec-new/SKILL.md`
- `.claude/skills/mspec-proposal/SKILL.md`
- `.claude/skills/mspec-quickstart/SKILL.md`
- `.claude/skills/mspec-research/SKILL.md`
- `.claude/skills/mspec-review/SKILL.md`
- `.claude/skills/mspec-tasks/SKILL.md`
- `.claude/skills/mspec-visual-prototype/SKILL.md`

実装内容: 各ファイル末尾に以下を追加
```markdown
## Verification (C2)

- `mspec validate --change <change>` — アーティファクト整合性チェック
- `mspec anchor check --change <change>` — アンカー解決確認
- [スキル固有の確認コマンド]

## Learning (C3)

このスキルの実行で発生した学習候補を以下のフォーマットで記録する:

```
<!-- LEARNING: <パターン説明> | source: <FR-ID> | confidence: low|medium|high -->
```

`mspec learn` コマンドが archive 済み changes からこれらを収集する。
```
