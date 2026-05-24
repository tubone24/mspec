---
doc_type: Reference
---

# Tasks: rename-visual-mock-to-prototype

## Phase 1: Setup

- [ ] T001 [P] 旧名称残存ベースラインを計測する — files: `(shell)`
      実行: `grep -r "mspec-visual-mock\|mspec mock\b\|/mspec:mock\|mock-feedback\|mock-server\b\|mockCommand\|startMockServer" packages/cli/src/ packages/cli/templates/ .claude/ .mspec/ 2>/dev/null | grep -v "Binary" | wc -l`
      期待: 件数 > 0（修正前は多数ヒットする）

## Phase 2: Foundational — スキル・コマンド名リネーム（FR-005）

### Tests-first (E2E)

- [ ] T010 E2E for FR-005 "スキルが mspec-visual-prototype に改名されている" — files: `(shell)`
      `ls .claude/skills/mspec-visual-prototype/SKILL.md 2>/dev/null && echo GREEN || echo RED`
      期待: 実装前は RED
      anchor:
        @mspec-delta 2026-05-23-085322-rename-visual-mock-to-prototype/specs/visual-mock/spec.md
        Requirements implemented: FR-005
        Change: rename-visual-mock-to-prototype

- [ ] T011 E2E for FR-005 "旧スキル mspec-visual-mock が削除されている" — files: `(shell)`
      `ls .claude/skills/mspec-visual-mock/ 2>/dev/null && echo RED || echo GREEN`
      期待: 実装前は RED（旧スキルが残存）
      anchor:
        @mspec-delta 2026-05-23-085322-rename-visual-mock-to-prototype/specs/visual-mock/spec.md
        Requirements implemented: FR-005
        Change: rename-visual-mock-to-prototype

- [ ] T012 E2E for FR-005 "コマンドファイルが prototype に改名されている" — files: `(shell)`
      `ls .claude/commands/mspec/prototype.md 2>/dev/null && ! ls .claude/commands/mspec/mock.md 2>/dev/null && echo GREEN || echo RED`
      期待: 実装前は RED
      anchor:
        @mspec-delta 2026-05-23-085322-rename-visual-mock-to-prototype/specs/visual-mock/spec.md
        Requirements implemented: FR-005
        Change: rename-visual-mock-to-prototype

### Implementation

- [ ] T013 FR-005 `.claude/skills/mspec-visual-mock/` → `mspec-visual-prototype/` にリネーム — files: `.claude/skills/mspec-visual-mock/SKILL.md`
      `git mv .claude/skills/mspec-visual-mock .claude/skills/mspec-visual-prototype`
      SKILL.md 内の `name:`, `when_to_use:`, スキル参照を `visual-prototype` に更新
      anchor:
        @mspec-delta 2026-05-23-085322-rename-visual-mock-to-prototype/specs/visual-mock/spec.md
        Requirements implemented: FR-005
        Change: rename-visual-mock-to-prototype

- [ ] T014 FR-005 `.claude/skills/mspec-visual-mock-runner/` を削除 — files: `.claude/skills/mspec-visual-mock-runner/`
      `git rm -r .claude/skills/mspec-visual-mock-runner/`
      anchor:
        @mspec-delta 2026-05-23-085322-rename-visual-mock-to-prototype/specs/visual-mock/spec.md
        Requirements implemented: FR-005
        Change: rename-visual-mock-to-prototype

- [ ] T015 FR-005 `.claude/commands/mspec/mock.md` → `prototype.md` にリネーム — files: `.claude/commands/mspec/mock.md`
      `git mv .claude/commands/mspec/mock.md .claude/commands/mspec/prototype.md`
      内容内の `/mspec:mock` → `/mspec:prototype`、スキル名参照を更新
      anchor:
        @mspec-delta 2026-05-23-085322-rename-visual-mock-to-prototype/specs/visual-mock/spec.md
        Requirements implemented: FR-005
        Change: rename-visual-mock-to-prototype

- [ ] T016 FR-005 `packages/cli/templates/claude/skills/mspec-visual-mock/` → `mspec-visual-prototype/` にリネーム — files: `packages/cli/templates/claude/skills/mspec-visual-mock/SKILL.md`
      `git mv packages/cli/templates/claude/skills/mspec-visual-mock packages/cli/templates/claude/skills/mspec-visual-prototype`
      SKILL.md 内容も T013 と同様に更新
      anchor:
        @mspec-delta 2026-05-23-085322-rename-visual-mock-to-prototype/specs/visual-mock/spec.md
        Requirements implemented: FR-005
        Change: rename-visual-mock-to-prototype

- [ ] T017 FR-005 `packages/cli/templates/claude/skills/mspec-visual-mock-runner/` を削除 — files: `packages/cli/templates/claude/skills/mspec-visual-mock-runner/`
      `git rm -r packages/cli/templates/claude/skills/mspec-visual-mock-runner/`
      anchor:
        @mspec-delta 2026-05-23-085322-rename-visual-mock-to-prototype/specs/visual-mock/spec.md
        Requirements implemented: FR-005
        Change: rename-visual-mock-to-prototype

- [ ] T018 FR-005 `packages/cli/templates/claude/commands/mspec/mock.md` → `prototype.md` にリネーム — files: `packages/cli/templates/claude/commands/mspec/mock.md`
      `git mv packages/cli/templates/claude/commands/mspec/mock.md packages/cli/templates/claude/commands/mspec/prototype.md`
      T015 と同様の内容更新をテンプレートにも適用
      anchor:
        @mspec-delta 2026-05-23-085322-rename-visual-mock-to-prototype/specs/visual-mock/spec.md
        Requirements implemented: FR-005
        Change: rename-visual-mock-to-prototype

- [ ] T019 FR-005 `packages/cli/templates/workflow.default.yaml` の visual-mock ステップを更新 — files: `packages/cli/templates/workflow.default.yaml`
      `command: /mspec:mock` → `/mspec:prototype`
      `skill: mspec-visual-mock` → `mspec-visual-prototype`
      `produces: [mock-feedback.md]` → `[prototype-feedback.md]`
      anchor:
        @mspec-delta 2026-05-23-085322-rename-visual-mock-to-prototype/specs/visual-mock/spec.md
        Requirements implemented: FR-005
        Change: rename-visual-mock-to-prototype

- [ ] T020 FR-005 `.mspec/workflow.yaml` の visual-mock ステップを更新 — files: `.mspec/workflow.yaml`
      T019 と同一の変換内容をライブ workflow.yaml に適用
      anchor:
        @mspec-delta 2026-05-23-085322-rename-visual-mock-to-prototype/specs/visual-mock/spec.md
        Requirements implemented: FR-005
        Change: rename-visual-mock-to-prototype

- [ ] T021 FR-005 `packages/cli/src/commands/continue.ts` の `mapSubagentName()` に `visual-mock` ケースを追加 — files: `packages/cli/src/commands/continue.ts`
      `case 'visual-mock': return 'mspec-visual-prototype-runner';` を switch 文に追加（208行目付近）
      anchor:
        @mspec-delta 2026-05-23-085322-rename-visual-mock-to-prototype/specs/visual-mock/spec.md
        Requirements implemented: FR-005
        Change: rename-visual-mock-to-prototype

### Verify (E2E GREEN)

- [ ] T022 E2E for FR-005 "スキル改名・旧スキル削除・コマンド改名を確認" — files: `(shell)`
      ```
      ls .claude/skills/mspec-visual-prototype/SKILL.md && \
      ! ls .claude/skills/mspec-visual-mock/ 2>/dev/null && \
      ls .claude/commands/mspec/prototype.md && \
      ! ls .claude/commands/mspec/mock.md 2>/dev/null && \
      echo GREEN
      ```
      期待: GREEN
      anchor:
        @mspec-delta 2026-05-23-085322-rename-visual-mock-to-prototype/specs/visual-mock/spec.md
        Requirements implemented: FR-005
        Change: rename-visual-mock-to-prototype

## Phase 3: User Story 1 — prototype コマンド・サーバー実装（FR-001, FR-002, FR-003）

### Tests-first (E2E)

- [ ] T101 E2E for FR-001 "prototype コマンドが prototype/ ディレクトリにファイルを生成する" — files: `packages/cli/tests/e2e/mock-command.e2e.test.ts`
      `prototype` コマンドのテストケースを追加: `changes/<change>/prototype/index.html` が生成される
      期待: 実装前は RED（`prototype.ts` が存在しないため）
      anchor:
        @mspec-delta 2026-05-23-085322-rename-visual-mock-to-prototype/specs/visual-mock/spec.md
        Requirements implemented: FR-001
        Change: rename-visual-mock-to-prototype

- [ ] T102 E2E for FR-002 "サーバー起動メッセージが 'Serving prototype at' を含む" — files: `packages/cli/tests/e2e/mock-command.e2e.test.ts`
      `Serving prototype at http://localhost:3737` メッセージのテストケースを追加（旧 `Serving mock at` を削除）
      期待: 実装前は RED
      anchor:
        @mspec-delta 2026-05-23-085322-rename-visual-mock-to-prototype/specs/visual-mock/spec.md
        Requirements implemented: FR-002
        Change: rename-visual-mock-to-prototype

- [ ] T103 E2E for FR-003 "フィードバックが prototype-feedback.md に保存される" — files: `packages/cli/tests/e2e/mock-generation.e2e.test.ts`, `packages/cli/tests/e2e/tasks-feedback.e2e.test.ts`
      `prototype-feedback.md` への書き込みテストケースを追加（`mock-feedback.md` を削除）
      期待: 実装前は RED
      anchor:
        @mspec-delta 2026-05-23-085322-rename-visual-mock-to-prototype/specs/visual-mock/spec.md
        Requirements implemented: FR-003
        Change: rename-visual-mock-to-prototype

### Implementation

- [ ] T104 FR-001/FR-002/FR-003 `src/commands/mock.ts` → `prototype.ts` にリネーム＆内容更新 — files: `packages/cli/src/commands/mock.ts`
      `git mv packages/cli/src/commands/mock.ts packages/cli/src/commands/prototype.ts`
      `mockCommand()` → `prototypeCommand()`、出力パス `mock/` → `prototype/`、メッセージを prototype に変更
      anchor:
        @mspec-delta 2026-05-23-085322-rename-visual-mock-to-prototype/specs/visual-mock/spec.md
        Requirements implemented: FR-001, FR-002, FR-003
        Change: rename-visual-mock-to-prototype

- [ ] T105 FR-002 `src/lib/mock-server.ts` → `prototype-server.ts` にリネーム＆内容更新 — files: `packages/cli/src/lib/mock-server.ts`
      `git mv packages/cli/src/lib/mock-server.ts packages/cli/src/lib/prototype-server.ts`
      `startMockServer()` → `startPrototypeServer()`、ログメッセージを `Serving prototype at` に変更
      anchor:
        @mspec-delta 2026-05-23-085322-rename-visual-mock-to-prototype/specs/visual-mock/spec.md
        Requirements implemented: FR-002
        Change: rename-visual-mock-to-prototype

- [ ] T106 FR-001/FR-002/FR-003 `src/index.ts` のコマンド登録を更新 — files: `packages/cli/src/index.ts`
      `program.command('mock')` → `program.command('prototype')`
      import パスも `./commands/prototype.js` に更新
      anchor:
        @mspec-delta 2026-05-23-085322-rename-visual-mock-to-prototype/specs/visual-mock/spec.md
        Requirements implemented: FR-001, FR-002, FR-003
        Change: rename-visual-mock-to-prototype

- [ ] T107 FR-003 E2E テスト `workflow-visual-mock.e2e.test.ts` のスキル名参照を更新 — files: `packages/cli/tests/e2e/workflow-visual-mock.e2e.test.ts`
      `mspec-visual-mock` → `mspec-visual-prototype` の文字列参照を更新（ファイル名リネームなし）
      anchor:
        @mspec-delta 2026-05-23-085322-rename-visual-mock-to-prototype/specs/visual-mock/spec.md
        Requirements implemented: FR-003
        Change: rename-visual-mock-to-prototype

### Verify (E2E GREEN)

- [ ] T108 E2E for FR-001/FR-002/FR-003 "prototype コマンドの E2E テストが GREEN" — files: `(npm test)`
      `cd packages/cli && npm test -- --testPathPattern="mock-command|mock-generation|tasks-feedback|workflow-visual-mock"`
      期待: GREEN
      anchor:
        @mspec-delta 2026-05-23-085322-rename-visual-mock-to-prototype/specs/visual-mock/spec.md
        Requirements implemented: FR-001, FR-002, FR-003
        Change: rename-visual-mock-to-prototype

## Phase 3: User Story 2 — init 時サブエージェントインストール（FR-004 cli-init-command）

### Tests-first (E2E)

- [ ] T201 E2E for FR-004 "mspec init 後に mspec-visual-prototype-runner.md が生成される" — files: `packages/cli/tests/e2e/`
      init E2E テストに `.claude/agents/mspec-visual-prototype-runner.md` 生成の検証を追加
      期待: 実装前は RED（テンプレートが存在しないため）
      anchor:
        @mspec-delta 2026-05-23-085322-rename-visual-mock-to-prototype/specs/cli-init-command/spec.md
        Requirements implemented: FR-004
        Change: rename-visual-mock-to-prototype

### Implementation

- [ ] T202 FR-004 `packages/cli/templates/claude/agents/mspec-visual-prototype-runner.md` を新規作成 — files: `packages/cli/templates/claude/agents/mspec-visual-prototype-runner.md`
      既存の `mspec-visual-mock-runner/SKILL.md` の内容をベースに agents 形式（`agent_type: subagent`）で作成
      anchor:
        @mspec-delta 2026-05-23-085322-rename-visual-mock-to-prototype/specs/cli-init-command/spec.md
        Requirements implemented: FR-004
        Change: rename-visual-mock-to-prototype

- [ ] T203 FR-004 `.claude/agents/mspec-visual-prototype-runner.md` を新規作成（ライブ環境） — files: `.claude/agents/mspec-visual-prototype-runner.md`
      T202 と同一内容をライブ `.claude/agents/` に配置
      anchor:
        @mspec-delta 2026-05-23-085322-rename-visual-mock-to-prototype/specs/cli-init-command/spec.md
        Requirements implemented: FR-004
        Change: rename-visual-mock-to-prototype

### Verify (E2E GREEN)

- [ ] T204 E2E for FR-004 "init 後のサブエージェント確認" — files: `(npm test)`
      `cd packages/cli && npm test -- --testPathPattern="init"`
      期待: GREEN（`.claude/agents/mspec-visual-prototype-runner.md` が生成される）
      anchor:
        @mspec-delta 2026-05-23-085322-rename-visual-mock-to-prototype/specs/cli-init-command/spec.md
        Requirements implemented: FR-004
        Change: rename-visual-mock-to-prototype

## Phase 4: Polish

- [ ] T301 [P] 全スコープ最終 grep — files: `(shell)`
      `grep -r "mspec-visual-mock\b\|/mspec:mock\b\|mock-feedback\b\|mock-server\b\|mockCommand\b\|startMockServer\b" packages/cli/src/ packages/cli/templates/ .claude/ .mspec/ 2>/dev/null | grep -v "Binary"`
      期待: 出力なし（0件）

- [ ] T302 [P] npm test でリグレッションがないことを確認 — files: `packages/cli/`
      `cd packages/cli && npm test`
      期待: 全テスト GREEN

- [ ] T303 [P] `mspec mock` コマンドが "unknown command" を返すことを確認 — files: `(shell)`
      `mspec mock 2>&1 | grep -i "unknown\|error" && echo OK`
      期待: OK（D-004: 旧コマンドが削除されている）

- [ ] T304 [P] E2E テストファイルの旧参照残存が 0件であることを確認 — files: `(shell)`
      `grep -r "mock-feedback\b\|startMockServer\b\|mspec-visual-mock\b" packages/cli/tests/e2e/ 2>/dev/null`
      期待: 出力なし（0件）

## Dependencies

- T010 blocks T013
- T011 blocks T014
- T012 blocks T015
- T013, T014, T015, T016, T017, T018, T019, T020, T021 block T022
- T101, T102 block T104
- T103 blocks T104
- T104 blocks T105
- T105 blocks T106
- T106 blocks T108
- T107 blocks T108
- T201 blocks T202
- T202 blocks T203
- T203 blocks T204
- T022, T108, T204 block T301
- T301 blocks T302

## Constitution Check

> Step: tasks | Constitution Version: 1.0

| Principle | Phase 0 | Phase 1 | Notes |
|-----------|---------|---------|-------|
| I. ステップ独立性 | ✅ | — | 各タスクは独立したファイルを修正；step id `visual-mock` を変更しないことで既存 done-log を保護 |
| II. 決定論的マージ | ✅ | — | E2E テストがゼロヒット grep を完了条件として定義；SoT マージは FR 番号重複なし |
| III. 質問駆動の要件確定 | ✅ | — | エイリアス有無・E2E ファイルリネーム方針・step id 保持はすべて design.md D-001〜D-005 で確定済み |
| IV. 双方向アンカー | ✅ | — | 全 impl/E2E タスクに `@mspec-delta` アンカーを付与済み |
| V. 強制ステップと拡張ステップの分離 | ✅ | — | visual-mock は skippable: true の任意ステップ；必須ステップ定義に影響しない |

### Complexity Tracking

None
