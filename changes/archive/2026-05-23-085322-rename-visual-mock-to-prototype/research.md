# Research: rename-visual-mock-to-prototype

## Decisions

| 論点 | 採用案 | 代替案 | 根拠 |
|------|--------|--------|------|
| CLI コマンド名 | `mspec prototype` | `mspec mock` を残す / エイリアス追加 | Delta Spec FR-005 確定済み。`mock` はユーザー向けに公開されており、`prototype` へ統一することで「動くプロトタイプ」という意味が明確になる |
| 旧コマンドのエイリアス | **削除（破壊的変更）** | deprecated エイリアスとして残す | beta 段階のため影響ユーザーが少なく、すっきり削除する。ユーザー確認済み |
| ワークフロー step id | `visual-mock` → **変更なし**（step id は internal） | `visual-prototype` に変更 | `workflow.default.yaml` の `id: visual-mock` を変更すると既存チェンジの skipped/done ログ参照がズレる。コマンド名とスキル名のみを変更し、step id は `visual-mock` のまま据え置く |
| スキルディレクトリ名 | `mspec-visual-mock` → `mspec-visual-prototype` | ディレクトリ名はそのまま | FR-005 で `mspec-visual-prototype` への改名が要求されている。templates/ 側と `.claude/skills/` 側の両方を変更 |
| サブエージェントファイル名 | `mspec-visual-mock-runner` → `mspec-visual-prototype-runner` | 旧名のまま | FR-005 確定。`continue.ts` の `mapSubagentName()` に `case 'visual-mock': return 'mspec-visual-prototype-runner'` を追加する必要あり |
| `mock-server.ts` の関数名 | **`startPrototypeServer` にリネーム**、ファイルも `prototype-server.ts` に変更 | 内部実装なので変えない | 一貫性重視。ユーザー確認済み |
| 出力ディレクトリ名 | `mock/` → `prototype/` | `mock/` のまま | Delta Spec FR-001 で `changes/<change>/prototype/` に変更 |
| フィードバックファイル名 | `mock-feedback.md` → `prototype-feedback.md` | `mock-feedback.md` のまま | Delta Spec FR-003・FR-004 で変更 |
| `mspec init` でのサブエージェント自動インストール | `mspec-visual-prototype-runner` を `.claude/agents/` に配置 | skills として配置のまま | Delta Spec cli-init-command FR-004 確定済み。`init.ts` が `templates/claude/agents/` を列挙してコピーする既存仕組みを活用 |
| `mspec-visual-mock-runner` の扱い | skills から agents に昇格（ファイル種別変更） | skills のまま | `init.ts` が agents テンプレートを読む仕組みに合わせるため `templates/claude/agents/mspec-visual-prototype-runner.md` として配置。旧 skills エントリは削除 |
| コマンドファイル | `templates/claude/commands/mspec/mock.md` → `prototype.md` | `mock.md` を残す | `/mspec:prototype` を機能させるためにファイル名変更必須 |

## Web References

- [Semantic difference: mock vs prototype (UX Stack Exchange)](https://ux.stackexchange.com/questions/58553/whats-the-difference-between-a-prototype-and-a-mockup): mock = 静止画・見た目のみ、prototype = インタラクション付き。本機能は HTML/JS を生成するため `prototype` がより正確
- [Commander.js — command aliases](https://github.com/tj/commander.js#aliases): `program.command('prototype').alias('mock')` でエイリアス追加が可能だが、今回はエイリアス追加なし（削除で確定）

## Codebase Findings

### Files to Rename / Update

| ファイル | 現在の参照 | 新しい参照 |
|----------|------------|------------|
| `packages/cli/src/index.ts` | `program.command('mock')`, `import { mockCommand }` | `program.command('prototype')`, `import { prototypeCommand }` |
| `packages/cli/src/commands/mock.ts` | ファイル全体 | `prototype.ts` にリネーム。`mockDir` → `prototypeDir`、`mock-feedback.md` → `prototype-feedback.md`、stdout メッセージ更新 |
| `packages/cli/src/lib/mock-server.ts` | `startMockServer` | `prototype-server.ts` にリネーム。`startPrototypeServer` に変更 |
| `packages/cli/src/commands/continue.ts` | `mapSubagentName()` の default ケース | `case 'visual-mock': return 'mspec-visual-prototype-runner'` を追加 |
| `packages/cli/templates/workflow.default.yaml` | `command: /mspec:mock`, `skill: mspec-visual-mock`, `produces: [mock-feedback.md]` | `command: /mspec:prototype`, `skill: mspec-visual-prototype`, `produces: [prototype-feedback.md]` |
| `packages/cli/templates/claude/commands/mspec/mock.md` | ファイル全体 | `prototype.md` にリネーム。内容中の `mspec mock`、`mock-feedback.md` を更新 |
| `packages/cli/templates/claude/skills/mspec-visual-mock/SKILL.md` | ディレクトリごと | `mspec-visual-prototype/SKILL.md` にリネーム。内容中の `mock/` → `prototype/` 等を更新 |
| `packages/cli/templates/claude/skills/mspec-visual-mock-runner/SKILL.md` | ファイル全体 | **削除**（agents に昇格）。`templates/claude/agents/mspec-visual-prototype-runner.md` として再配置 |
| `.claude/skills/mspec-visual-mock/SKILL.md` | ディレクトリごと | `mspec-visual-prototype/SKILL.md` にリネーム・内容更新 |
| `.claude/skills/mspec-visual-mock-runner/SKILL.md` | ファイル全体 | **削除**。`.claude/agents/mspec-visual-prototype-runner.md` として追加 |
| `packages/cli/tests/e2e/mock-command.e2e.test.ts` | `mockCommand`, `mock/`, `mock-feedback.md` | `prototypeCommand`, `prototype/`, `prototype-feedback.md` に更新 |
| `packages/cli/tests/e2e/mock-generation.e2e.test.ts` | `mock/`, `mock-feedback.md` | `prototype/`, `prototype-feedback.md` に更新 |
| `packages/cli/tests/e2e/tasks-feedback.e2e.test.ts` | `mock-feedback.md` | `prototype-feedback.md` に更新 |
| `packages/cli/tests/e2e/workflow-visual-mock.e2e.test.ts` | skill 名参照部分 | step id `visual-mock` はそのまま、skill 名参照のみ更新 |

### mspec init 実装の調査

`packages/cli/src/commands/init.ts` の 219–237 行が `templates/claude/agents/` ディレクトリを列挙して `.claude/agents/` にコピーする既存ロジックを持つ。`templates/claude/agents/mspec-visual-prototype-runner.md` を追加するだけで FR-004（cli-init-command）の要件を満たせる。追加実装は不要。

### step id `visual-mock` を据え置く根拠

`packages/cli/src/types/workflow.ts` の `StepSchema` は step id を文字列として扱い、state-engine は `readme.md` の `> Status:` とファイル存在チェックに基づいて状態を判定する。step id を変えると既存プロジェクトの skip ログ・done ログと不整合が起きるため、内部識別子 `visual-mock` は変更しない。コマンド名・スキル名は外向き API なので変更するが後方互換は維持する。

### `mspec-visual-mock-runner` の agents 昇格

現状は `.claude/skills/mspec-visual-mock-runner/SKILL.md` だが、Claude Code のエージェントとして機能させるには `.claude/agents/` への配置が正しい。`init.ts` の既存コピーロジックにより、`templates/claude/agents/mspec-visual-prototype-runner.md` を追加するだけで自動インストールが実現できる。

## Open Choices（解決済み）

- **`mock-server.ts` の関数名**：→ `prototype-server.ts` / `startPrototypeServer` にリネーム（ユーザー確認済み）
- **エイリアス `/mspec:mock` の後方互換**：→ 削除（破壊的変更、beta 段階なので問題なし）（ユーザー確認済み）

## Constitution Check

| Principle | Phase 0 | Phase 1 |
|-----------|---------|---------|
| I  ステップ独立性 | ✅ research は既存ファイルを読み込むのみで変更しない | — |
| II  決定論的マージ | ✅ `research.md` は `changes/` 以下に配置。SoT spec と衝突しない | — |
| III  質問駆動の要件確定 | ✅ step id 据え置き・runner の agents 昇格・alias 削除をユーザー確認済み | — |
| IV  双方向アンカー | ✅ Delta Spec アンカーは `specs/visual-mock/spec.md` と `specs/cli-init-command/spec.md` に存在 | — |
| V  強制ステップと拡張ステップの分離 | ✅ `visual-mock` は `removable: true, skippable: true` の任意ステップ。本変更は必須ステップに影響しない | — |
