---
doc_type: Reference
---

# Research: fix-command-name-consistency

## Decisions

- サブエージェント名（`mspec-researcher`、`mspec-checklist-auditor`、`mspec-self-reviewer`）は Claude Code スキルレジストリの識別子のため **変更しない**
- `@mspec-delta` アンカートークンは別の構文体系のため **変更しない**
- SKILL.md の `name:` フロントマターおよび `workflow.yaml` の `skill:` フィールドはスキル名識別子のため **変更しない**
- `workflow.yaml` の `command:` フィールド（例: `command: /mspec-new`）は `continue.ts` がプログラム的に読み取る。Claude Code の実際のコマンド解決は `/mspec:new`（コロン）形式で行われるため、**コロン形式に修正対象**とする
- `archive.test.ts` のインラインフィクスチャも `command:` 値を含むため **修正対象**

## Web References

なし（純粋なコードベース調査）

## Codebase Findings

### カテゴリ 1: ランタイム スキルファイル (`.claude/skills/mspec-*/SKILL.md`)

`when_to_use:` のスラッシュコマンド記述と、プロシージャ本文の `/mspec-continue` 参照が修正対象。  
`name:` フィールドはスキルレジストリ識別子のため変更しない。

| ファイル | 修正対象の内容 |
|---------|--------------|
| `.claude/skills/mspec-new/SKILL.md` | `when_to_use` 内の `/mspec-new`、末尾の `run /mspec-continue` |
| `.claude/skills/mspec-proposal/SKILL.md` | `when_to_use` 内の `/mspec-proposal`、末尾の `run /mspec-continue` |
| `.claude/skills/mspec-delta/SKILL.md` | `when_to_use` 内の `/mspec-delta`、末尾の `auto-continue via /mspec-continue` |
| `.claude/skills/mspec-research/SKILL.md` | `when_to_use` 内の `/mspec-research`、末尾の `run /mspec-continue` |
| `.claude/skills/mspec-design/SKILL.md` | `when_to_use` 内の `/mspec-design`、末尾の `run /mspec-continue` |
| `.claude/skills/mspec-quickstart/SKILL.md` | `when_to_use` 内の `/mspec-quickstart` |
| `.claude/skills/mspec-checklist/SKILL.md` | `when_to_use` 内の `/mspec-checklist` |
| `.claude/skills/mspec-tasks/SKILL.md` | `when_to_use` 内の `/mspec-tasks`、末尾の `run /mspec-continue` |
| `.claude/skills/mspec-implement/SKILL.md` | `when_to_use` 内の `/mspec-implement`、末尾の `run /mspec-continue` |
| `.claude/skills/mspec-archive/SKILL.md` | `when_to_use` 内の `/mspec-archive` |
| `.claude/skills/mspec-review/SKILL.md` | `when_to_use` 内の `/mspec-review`、末尾の `run /mspec-continue` |

### カテゴリ 2: ランタイム コマンドファイル (`.claude/commands/mspec/*.md`)

プロシージャ本文の `run /mspec-continue` 等が修正対象。

| ファイル | 修正対象の内容 |
|---------|--------------|
| `.claude/commands/mspec/new.md` | l.14: `instruct the user to run /mspec-continue` |
| `.claude/commands/mspec/proposal.md` | l.16: `instruct the user to run /mspec-continue` |
| `.claude/commands/mspec/delta.md` | l.13: `Run /mspec-continue to advance to research` |
| `.claude/commands/mspec/research.md` | l.16: `instruct the user to run /mspec-continue` |
| `.claude/commands/mspec/design.md` | l.15: `instruct the user to run /mspec-continue` |
| `.claude/commands/mspec/tasks.md` | l.20: `instruct the user to run /mspec-continue` |
| `.claude/commands/mspec/implement.md` | l.18: `instruct the user to run /mspec-continue` |
| `.claude/commands/mspec/review.md` | l.15: `instruct the user to run /mspec-continue` |
| `.claude/commands/mspec/continue.md` | l.13,15: `re-run /mspec-continue`、`run /mspec-continue again` |

### カテゴリ 3: ランタイム エージェントファイル (`.claude/agents/*.md`)

**変更不要**。すべての参照がサブエージェント名識別子または `@mspec-delta` アンカートークン。

### カテゴリ 4a: CLI ソース (`packages/cli/src/`)

| ファイル | 行 | 修正対象 |
|---------|---|---------|
| `packages/cli/src/commands/init.ts` | 238 | `'run /mspec-new <feature>'` → `'run /mspec:new <feature>'` |
| `packages/cli/src/commands/new.ts` | 41 | `'next: run /mspec-proposal'` → `'next: run /mspec:proposal'` |

`continue.ts` 内の `'mspec-researcher'`・`'mspec-checklist-auditor'` はサブエージェント名のため変更しない。

### カテゴリ 4b: CLI テストフィクスチャ (`packages/cli/src/commands/archive.test.ts`)

| ファイル | 行 | 修正対象 |
|---------|---|---------|
| `packages/cli/src/commands/archive.test.ts` | 12–43 | フィクスチャ内 `command: /mspec-new` 等のすべての `command:` 値 |

### カテゴリ 4c: CLI テンプレートファイル (`packages/cli/templates/claude/`)

ランタイムファイルのミラーのため、ランタイムと同一の修正箇所を持つ。

- `templates/claude/commands/mspec/*.md`（9ファイル）: ランタイム commands と同一
- `templates/claude/skills/mspec-*/SKILL.md`（11ファイル）: ランタイム skills と同一
- `templates/claude/agents/*.md`: **変更不要**（サブエージェント名のみ）

### カテゴリ 5: ワークフロー設定 (`.mspec/workflow.yaml`)

| 修正対象 | 内容 |
|---------|-----|
| `command:` フィールド全ステップ | `command: /mspec-new` → `command: /mspec:new`（全ステップ分） |
| `skill:` フィールド | **変更しない**（スキルレジストリ識別子） |

### カテゴリ 6: ドキュメント・仕様書

| ファイル | 修正対象 |
|---------|---------|
| `README.md` | l.35: ワークフロー図コメント内の `/mspec-proposal` 等 |
| `docs/design/mspec-design.md` | 複数箇所: ワークフロー図・手順説明の `/mspec-XXX` 参照 |
| `specs/claude-integration/spec.md` | FR 本文・シナリオ内の `/mspec-continue` 等の参照 |
| `specs/cli-init/spec.md` | l.125,130: `next: run /mspec-new` |

### ファイル数サマリー

| カテゴリ | 修正対象ファイル数 |
|---------|----------------|
| ランタイム スキル | 11 |
| ランタイム コマンド | 9 |
| ランタイム エージェント | 0（変更不要） |
| CLI ソース | 2 |
| CLI テストフィクスチャ | 1 |
| CLI テンプレート スキル | 11 |
| CLI テンプレート コマンド | 9 |
| CLI テンプレート エージェント | 0（変更不要） |
| workflow.yaml | 1 |
| ドキュメント・仕様書 | 4 |
| **合計** | **48** |

## Open Choices

なし（ユーザーへの質問で解決済み、サブエージェント調査で判断確定）

## Constitution Check

> Step: research | Constitution Version: 1.0

| Principle | Phase 0 | Phase 1 | Notes |
|-----------|---------|---------|-------|
| I. ステップ独立性 | ✅ | — | research は調査のみ；コード変更は implement で行う |
| II. 決定論的マージ | ✅ | — | 文字列置換は決定論的；サブエージェント名は除外ルール明確 |
| III. 質問駆動の要件確定 | ✅ | — | 対象範囲・廃止方針・完了基準を proposal 段階で確定済み |
| IV. 双方向アンカー | ✅ | — | FR-017・FR-001・FR-002 に対応する修正ファイルリストが揃っている |
| V. 強制ステップと拡張ステップの分離 | ✅ | — | 既存ファイルの文字列修正のみ；ステップ追加なし |

### Complexity Tracking

None
