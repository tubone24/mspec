---
doc_type: Tasks
---

# Tasks: init-link-global-bin

## Phase 1: Setup

### TASK-001: `spawnSync` インポートを `init.ts` に追加する

`packages/cli/src/commands/init.ts` の import 文に `spawnSync` を追加する。

```
anchor:
  @mspec-delta 2026-05-17-100328-init-link-global-bin/specs/cli-init-command/spec.md
  Requirements implemented: FR-001
  Change: init-link-global-bin
```

- [ ] `import { spawnSync } from 'node:child_process';` を追加
- [ ] 既存の import 文と整合していること（`node:` prefix 統一）

---

## Phase 2: Foundational

### TASK-002: `ensureGlobalLink()` 関数を実装する

dev-mode 検出（`package.json` + `tsconfig.json` 両方存在）と `npm run build → npm link` の実行ロジックを `ensureGlobalLink()` として実装する。

```
anchor:
  @mspec-delta 2026-05-17-100328-init-link-global-bin/specs/cli-init-command/spec.md
  Requirements implemented: FR-001, FR-002, FR-003
  Change: init-link-global-bin
```

- [ ] `import.meta.url` → `fileURLToPath` → `dirname` → `resolve('..')` で `pkgCliDir` を取得
- [ ] `pathExists(join(pkgCliDir, 'package.json'))` と `pathExists(join(pkgCliDir, 'tsconfig.json'))` の **両方** が true の場合のみ dev-mode と判定（FR-002）
- [ ] dev-mode でなければ何もせず `return`（FR-002）
- [ ] `spawnSync('npm', ['run', 'build'], { cwd: pkgCliDir, stdio: 'inherit' })` を実行（FR-001）
- [ ] build の `status !== 0` または `error` が truthy の場合は `console.warn` で警告して `return`（FR-003）
- [ ] `spawnSync('npm', ['link'], { cwd: pkgCliDir, stdio: 'inherit' })` を実行（FR-001）
- [ ] link の `status !== 0` または `error` が truthy の場合は `console.warn` で警告して `return`（FR-003）
- [ ] 成功時に `console.log(pc.green('  ✓'), 'mspec linked globally')` を出力（FR-001）

### TASK-003: `initCommand` 末尾で `ensureGlobalLink()` を呼び出す

`initCommand` の末尾（`ensureGitignoreEntry()` 呼び出し後、`console.log('mspec init: done.')` の前）で `await ensureGlobalLink()` を呼び出す。

```
anchor:
  @mspec-delta 2026-05-17-100328-init-link-global-bin/specs/cli-init-command/spec.md
  Requirements implemented: FR-001, FR-002, FR-003
  Change: init-link-global-bin
```

- [ ] `await ensureGlobalLink()` を `ensureGitignoreEntry(root, '.mspec/cache/')` の後に追加
- [ ] `console.log()` と `console.log(pc.green('mspec init: done.'))` の前であること（設計 D-4）
- [ ] `ensureGlobalLink()` が warn して return した場合も `mspec init: done.` と `next:` メッセージが出力されること

---

## Phase 3: User Story（E2E → 実装）

### TASK-004 [E2E]: FR-001 dev-mode でグローバルコマンドが作成されることをテストする

`packages/cli/tests/` 配下に `init-global-link.test.ts` を作成し、`ensureGlobalLink` の単体テスト（モック使用）を書く。まず失敗するテストを書く。

```
anchor:
  @mspec-delta 2026-05-17-100328-init-link-global-bin/specs/cli-init-command/spec.md
  Requirements implemented: FR-001
  Change: init-link-global-bin
```

- [ ] `spawnSync` をモックして、dev-mode 環境では `npm run build` → `npm link` の順で呼ばれることをアサート
- [ ] `mspec test expect-red TASK-004 --change 2026-05-17-100328-init-link-global-bin` でテストが失敗することを確認

### TASK-005: FR-001 実装（TASK-002 完了後）

TASK-002 の実装が FR-001 を満たすことを確認する。

```
anchor:
  @mspec-delta 2026-05-17-100328-init-link-global-bin/specs/cli-init-command/spec.md
  Requirements implemented: FR-001
  Change: init-link-global-bin
```

- [ ] `mspec test expect-green TASK-004 --change 2026-05-17-100328-init-link-global-bin` でテストが通ることを確認

### TASK-006 [E2E]: FR-002 non-dev-mode でスキップされることをテストする

`tsconfig.json` が存在しない環境のモックで、`spawnSync` が一切呼ばれないことをアサートする。

```
anchor:
  @mspec-delta 2026-05-17-100328-init-link-global-bin/specs/cli-init-command/spec.md
  Requirements implemented: FR-002
  Change: init-link-global-bin
```

- [ ] `mspec test expect-red TASK-006 --change 2026-05-17-100328-init-link-global-bin` でテストが失敗することを確認

### TASK-007: FR-002 実装（TASK-002 完了後）

TASK-002 の実装が FR-002 を満たすことを確認する。

```
anchor:
  @mspec-delta 2026-05-17-100328-init-link-global-bin/specs/cli-init-command/spec.md
  Requirements implemented: FR-002
  Change: init-link-global-bin
```

- [ ] `mspec test expect-green TASK-006 --change 2026-05-17-100328-init-link-global-bin` でテストが通ることを確認

### TASK-008 [E2E]: FR-003 build 失敗時でも init が継続されることをテストする

`spawnSync` が `build` で `status: 1` を返すモックで、`console.warn` が呼ばれ、かつ `link` は呼ばれないことをアサート。また `initCommand` が reject しないことを確認する。

```
anchor:
  @mspec-delta 2026-05-17-100328-init-link-global-bin/specs/cli-init-command/spec.md
  Requirements implemented: FR-003
  Change: init-link-global-bin
```

- [ ] `mspec test expect-red TASK-008 --change 2026-05-17-100328-init-link-global-bin` でテストが失敗することを確認

### TASK-009 [E2E]: FR-003 link 失敗時でも init が継続されることをテストする

`spawnSync` が `link` で `status: 1` を返すモックで、`console.warn` が呼ばれ、`initCommand` が reject しないことをアサート。

```
anchor:
  @mspec-delta 2026-05-17-100328-init-link-global-bin/specs/cli-init-command/spec.md
  Requirements implemented: FR-003
  Change: init-link-global-bin
```

- [ ] `mspec test expect-red TASK-009 --change 2026-05-17-100328-init-link-global-bin` でテストが失敗することを確認

### TASK-010: FR-003 実装（TASK-002 完了後）

TASK-002 の実装が FR-003 を満たすことを確認する。

```
anchor:
  @mspec-delta 2026-05-17-100328-init-link-global-bin/specs/cli-init-command/spec.md
  Requirements implemented: FR-003
  Change: init-link-global-bin
```

- [ ] `mspec test expect-green TASK-008 --change 2026-05-17-100328-init-link-global-bin` でテストが通ることを確認
- [ ] `mspec test expect-green TASK-009 --change 2026-05-17-100328-init-link-global-bin` でテストが通ることを確認

---

## Phase 4: Polish

### TASK-011: `@mspec-delta` アンカーの整合性確認

実装完了後、`init.ts` に埋め込まれたアンカーブロックが正しいことを確認する。

```
anchor:
  @mspec-delta 2026-05-17-100328-init-link-global-bin/specs/cli-init-command/spec.md
  Requirements implemented: FR-001, FR-002, FR-003
  Change: init-link-global-bin
```

- [ ] `mspec anchor check --change 2026-05-17-100328-init-link-global-bin` でエラーなし
- [ ] `init.ts` にアンカーブロックが FR-001/002/003 に対応して埋め込まれていること

### TASK-012: 手動 smoke test（実環境確認）

実際に mspecリポジトリで `mspec init --force` を実行して、グローバルリンクが最新ビルドを指すことを確認する。

```
anchor:
  @mspec-delta 2026-05-17-100328-init-link-global-bin/specs/cli-init-command/spec.md
  Requirements implemented: FR-001
  Change: init-link-global-bin
```

- [ ] `mspec init --force` 実行後に `which mspec` が正しいパスを返すこと
- [ ] `mspec --version` が最新バージョンを返すこと
- [ ] `npm install -g @mspec/cli` 環境では init 後もグローバルリンク処理がスキップされること（FR-002 手動確認）

---

## Constitution Check

| Principle | Phase 0 | Phase 1 |
|-----------|---------|---------|
| I: ステップ独立性 | ✅ 全タスクが `init.ts` 単一ファイルに閉じており、他ステップに影響しない | — |
| II: 決定論的マージ | ✅ アンカーブロックは全タスクに付与。`npm link` は冪等 | — |
| III: 質問駆動の要件確定 | ✅ FR-001/002/003 と各タスクが 1:1 でトレース可能 | — |
| IV: 双方向アンカー | ✅ 全実装・E2Eタスクに `@mspec-delta` アンカーブロックを付与 | — |
| V: 強制ステップと拡張ステップの分離 | ✅ E2Eタスク（TASK-004/006/008/009）を実装タスクの前に配置 | — |
