# Checklist: rename-visual-mock-to-prototype

## Delta Spec Coverage

### visual-mock

- [x] **FR-005 (ADDED)** — `mspec-visual-prototype` スキルおよび `mspec-visual-prototype-runner` サブエージェントのリネームが実装されており、`/mspec:prototype` コマンドで Visual Prototype ステップが起動する <!-- verify: fr-005 -->
- [x] **FR-001 (MODIFIED)** — `mspec prototype` コマンド実行時に `changes/<change>/prototype/` ディレクトリ以下に HTML ファイルが生成される（旧 `mock/` ディレクトリへの出力が残っていないこと） <!-- verify: fr-001 -->
- [x] **FR-002 (MODIFIED)** — prototype ファイル生成後、`Serving prototype at http://localhost:3737` のメッセージが表示されブラウザでアクセスできる（旧 `Serving mock at` メッセージが残っていないこと） <!-- verify: fr-002 -->
- [x] **FR-003 (MODIFIED)** — Ctrl+C でサーバー停止後、フィードバックが `prototype-feedback.md` に保存される（旧 `mock-feedback.md` ではなく） <!-- verify: fr-003 -->
- [x] **FR-004 (MODIFIED)** — `prototype-feedback.md` が存在する場合に `mspec tasks` ステップ実行時にフィードバックが tasks.md に反映される <!-- verify: fr-004 -->

### cli-init-command

- [x] **FR-004 (ADDED)** — `mspec init` 実行時に `.claude/agents/mspec-visual-prototype-runner.md` が生成される <!-- verify: fr-004 -->
- [x] **FR-004 (ADDED)** — `.claude/agents/mspec-visual-prototype-runner.md` が既存の古いバージョンで存在する場合、上書きされる <!-- verify: fr-004 -->

## Source-of-Truth Regression

### visual-mock SoT (specs/visual-mock/spec.md)

- [x] **回帰リスク: `mock/` ディレクトリ参照** — SoT では FR-001 が `changes/<change>/mock/` ディレクトリを参照している。実装で旧パス `mock/` を参照するコードが残存すると既存のワークフローステップ（tasks ステップのフィードバック読み込みなど）が壊れる可能性がある。`mock-server.ts` / `mock.ts` の削除と `prototype-server.ts` / `prototype.ts` の新規作成が正しく行われていることを確認する <!-- verify: human -->
- [x] **回帰リスク: `mock-feedback.md` 参照** — SoT FR-003 / FR-004 は `mock-feedback.md` を参照している。tasks ステップがフィードバックファイルを探す際に旧ファイル名 `mock-feedback.md` を参照するロジックが残存していないか確認する <!-- verify: human -->
- [x] **回帰リスク: `mspec mock` コマンドの削除** — D-004 の設計判断によりエイリアスなしで旧コマンドを削除する。`index.ts` に `program.command('mock')` が残っていないこと、`mspec mock` を実行すると "unknown command" エラーが返ることを確認する <!-- verify: human -->
- [x] **回帰リスク: `workflow.default.yaml` の未更新** — `packages/cli/templates/workflow.default.yaml` の `id: visual-mock` ステップの `command`, `skill`, `produces` フィールドが旧値のまま残存していないか確認する <!-- verify: human -->
- [x] **回帰リスク: E2E テストの旧パス参照** — `mock-command.e2e.test.ts`, `mock-generation.e2e.test.ts`, `tasks-feedback.e2e.test.ts`, `workflow-visual-mock.e2e.test.ts` が旧パス・旧ファイル名・旧スキル名を参照したまま残存していないことを確認する <!-- verify: human -->

### cli-init-command SoT (specs/cli-init-command/spec.md)

- [x] **回帰リスク: 既存 FR-001/FR-002/FR-003 への影響** — `init.ts` の agents コピーロジック（228–238行）は既存ロジックをそのまま活用する設計。agents テンプレートへの追加によって既存の init 動作（dev-mode グローバルリンク作成・設定ファイル配置・エラー耐性）が影響を受けないか確認する <!-- verify: human -->
- [x] **回帰リスク: `mspec-visual-mock-runner` の旧 skills 配置** — `.claude/skills/mspec-visual-mock-runner/` が削除されず残存する場合、スキルシステムが旧サブエージェントを誤って呼び出す可能性がある。削除が完了していることを確認する <!-- verify: human -->

### continue.ts `mapSubagentName()` 回帰

- [x] **回帰リスク: `visual-mock` step id の継続** — `mapSubagentName()` に `case 'visual-mock': return 'mspec-visual-prototype-runner'` が追加されること。このケースが欠落すると default ブランチが `mspec-visual-mock-runner` を返し、存在しないサブエージェント名でサブエージェントが起動されてしまう <!-- verify: human -->
- [x] **回帰リスク: 既存 `mapSubagentName()` の他 case への影響** — `research` / `self-review` / `checklist` の既存 case が変更されていないことを確認する <!-- verify: human -->

### templates/ 配置の整合性

- [x] **回帰リスク: `mspec-visual-prototype-runner.md` テンプレートの不在** — `packages/cli/templates/claude/agents/mspec-visual-prototype-runner.md` が存在しない場合、`mspec init` 実行時に agents コピーロジックがファイルをコピーできず FR-004 が達成されない <!-- verify: human -->
- [x] **回帰リスク: skill テンプレートの旧ディレクトリ残存** — `packages/cli/templates/claude/skills/mspec-visual-mock/` と `mspec-visual-mock-runner/` が削除されず残存する場合、`mspec init` が旧スキルを引き続きインストールしてしまう可能性がある <!-- verify: human -->

## Constitution Check

- [x] **Principle I — ステップ独立性**: step id `visual-mock` を変更しないことで既存 change の done/skip ログが壊れない設計になっている。design.md Phase 0/1 で「`continue` のエンベロープ拡張はすべて後方互換な追加」に準拠していることを確認する <!-- verify: human -->
- [x] **Principle II — 決定論的マージ**: FR-005 (visual-mock) と FR-004 (cli-init-command) の番号が既存 SoT 仕様と重複しないこと、archive コマンドによる SoT マージが deterministic に実行されることを確認する <!-- verify: human -->
- [x] **Principle III — 質問駆動の要件確定**: エイリアス有無・関数名リネームはユーザー確認済みであり、設計判断の根拠が design.md の Decisions (D-001 〜 D-004) に記録されて追跡可能な状態になっていることを確認する <!-- verify: human -->
- [x] **Principle IV — 双方向アンカー**: `prototype.ts` / `prototype-server.ts` / E2E テストファイルに `@mspec-delta` アンカーが打たれており、`mspec anchor check` で全 FR が最低 1 つのアンカーに紐付くことを確認する <!-- verify: human -->
- [x] **Principle V — 強制ステップと拡張ステップの分離**: `visual-mock` ステップは `skippable: true` の任意ステップであり、今回の変更が `workflow.yaml` の強制ステップ（new/delta/checklist/tasks/implement/archive）の定義に影響しないことを確認する <!-- verify: human -->
