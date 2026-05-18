---
doc_type: AI-Internal
---

<!-- @mspec-delta 2026-05-18-125018-cli-upgrade/specs/cli-upgrade/spec.md -->
<!-- Requirements implemented: FR-001, FR-002, FR-003, FR-004 -->
<!-- @mspec-delta 2026-05-18-125018-cli-upgrade/specs/version-check/spec.md -->
<!-- Requirements implemented: FR-001, FR-002, FR-003 -->
<!-- Change: cli-upgrade -->

# Tasks: cli-upgrade

## Phase 1 — Setup

### T-001: [Impl] `packages/cli/src/commands/upgrade.ts` を作成する

`@mspec-delta` アンカーヘッダーと `upgradeCommand` の空エクスポートを含む新規ファイルを作成する。

ファイル先頭に以下の 3 行アンカーブロックを付ける:
```
// @mspec-delta 2026-05-18-125018-cli-upgrade/specs/cli-upgrade/spec.md
// Requirements implemented: FR-001, FR-002, FR-003, FR-004
// Change: cli-upgrade
```

```
anchor:
  @mspec-delta 2026-05-18-125018-cli-upgrade/specs/cli-upgrade/spec.md
  Requirements implemented: FR-001, FR-002, FR-003, FR-004
  Change: cli-upgrade
```

---

### T-002: [Impl] `packages/cli/src/index.ts` に `mspec upgrade` を登録する

`upgradeCommand` を import し、`program.command('upgrade')` として登録する。`--yes`/`-y` オプションを定義する。

```
anchor:
  @mspec-delta 2026-05-18-125018-cli-upgrade/specs/cli-upgrade/spec.md
  Requirements implemented: FR-001
  Change: cli-upgrade
```

---

### T-003: TypeScript ビルドが通ることを確認する

```bash
cd packages/cli && npm run build
```

エラーなしでビルドが完了することを確認する。（アンカーなし — 検証タスク）

---

## Phase 2 — Foundational（version-check capability）

### T-004: [E2E] version-check FR-001 — npm registry 取得成功テスト（赤）

`packages/cli/src/commands/upgrade.test.ts` を作成し、以下を検証するテストを書く:
- GIVEN: ネットワーク正常（`fetch` をモック）
- WHEN: `fetchLatestVersion()` を呼ぶ
- THEN: `{ version: "1.0.0" }` の JSON レスポンスから `"1.0.0"` が返ること

実装前にテストが失敗（赤）することを確認する。

```
anchor:
  @mspec-delta 2026-05-18-125018-cli-upgrade/specs/version-check/spec.md
  Requirements implemented: FR-001
  Change: cli-upgrade
```

---

### T-005: [Impl] `fetchLatestVersion()` を実装する（version-check FR-001, FR-003）

`upgrade.ts` に以下を実装する:
- `fetch('https://registry.npmjs.org/@mspec/cli/latest', { signal: AbortSignal.timeout(10_000) })`
- レスポンスの `.version` フィールドを返す
- `latest` タグのエンドポイントを使用するため beta/RC は自動除外（FR-003 を自然に満たす）

T-004 のテストが緑になることを確認する。

```
anchor:
  @mspec-delta 2026-05-18-125018-cli-upgrade/specs/version-check/spec.md
  Requirements implemented: FR-001, FR-003
  Change: cli-upgrade
```

---

### T-006: [E2E] version-check FR-002 — ネットワークエラーハンドリングテスト（赤）

`upgrade.test.ts` に追加:
- GIVEN: `fetch` が `TypeError`（またはタイムアウトエラー）を throw
- WHEN: `upgradeCommand()` を呼ぶ
- THEN: stderr にエラーメッセージが出力され、`process.exit(1)` が呼ばれること

```
anchor:
  @mspec-delta 2026-05-18-125018-cli-upgrade/specs/version-check/spec.md
  Requirements implemented: FR-002
  Change: cli-upgrade
```

---

### T-007: [Impl] `fetchLatestVersion()` にネットワークエラーハンドリングを追加する（version-check FR-002）

`upgrade.ts` で `fetchLatestVersion()` を `try/catch` で囲み:
- catch 内: `console.error('バージョン情報の取得に失敗しました:', error.message)` を出力
- `process.exit(1)` で終了

T-006 のテストが緑になることを確認する。

```
anchor:
  @mspec-delta 2026-05-18-125018-cli-upgrade/specs/version-check/spec.md
  Requirements implemented: FR-002
  Change: cli-upgrade
```

---

### T-008: [E2E] version-check FR-003 — pre-release 除外確認テスト

`latest` タグエンドポイント（`/latest`）のみを使用することで、`next`/`beta`/`rc` タグが除外されることを確認する。
- `fetch` モックが `{ version: "1.0.0" }` を返すとき、pre-release バージョンが混入しないことをアサートする

```
anchor:
  @mspec-delta 2026-05-18-125018-cli-upgrade/specs/version-check/spec.md
  Requirements implemented: FR-003
  Change: cli-upgrade
```

---

## Phase 3 — User Story（cli-upgrade capability）

### T-009: [E2E] cli-upgrade FR-001 — `mspec upgrade` がコマンドとして認識されるテスト（赤）

統合テスト（または `program.parse` を使ったユニットテスト）で:
- GIVEN: `mspec` CLI がセットアップされている
- WHEN: `mspec upgrade` を実行する（`--yes` 付き、fetch をモック）
- THEN: エラーなく実行が開始されること（コマンド未認識エラーが出ないこと）

```
anchor:
  @mspec-delta 2026-05-18-125018-cli-upgrade/specs/cli-upgrade/spec.md
  Requirements implemented: FR-001
  Change: cli-upgrade
```

---

### T-010: [E2E] cli-upgrade FR-002 — バージョン表示フォーマットテスト（赤）

`upgrade.test.ts` に追加:
- GIVEN: `getCurrentVersion()` が `"0.1.0"` を返す、`fetchLatestVersion()` が `"1.0.0"` を返す
- WHEN: `upgradeCommand({ yes: true })` を呼ぶ
- THEN: stdout に `現在のバージョン: 0.1.0` と `最新バージョン:   1.0.0` の 2 行が出力されること

```
anchor:
  @mspec-delta 2026-05-18-125018-cli-upgrade/specs/cli-upgrade/spec.md
  Requirements implemented: FR-002
  Change: cli-upgrade
```

---

### T-011: [Impl] `getCurrentVersion()` と `upgradeCommand()` のバージョン表示を実装する（cli-upgrade FR-001, FR-002）

`upgrade.ts` に以下を実装する:
- `getCurrentVersion()`: `createRequire(import.meta.url)` で `package.json` を require し `version` を返す
- `upgradeCommand()` 本体: `getCurrentVersion()` → `fetchLatestVersion()` → 2 行表示

T-009・T-010 のテストが緑になることを確認する。

```
anchor:
  @mspec-delta 2026-05-18-125018-cli-upgrade/specs/cli-upgrade/spec.md
  Requirements implemented: FR-001, FR-002
  Change: cli-upgrade
```

---

### T-012: [E2E] cli-upgrade FR-004 — already up-to-date テスト（赤）

`upgrade.test.ts` に追加:
- GIVEN: `getCurrentVersion()` と `fetchLatestVersion()` が同一バージョン（例: `"1.0.0"`）を返す
- WHEN: `upgradeCommand({ yes: false })` を呼ぶ
- THEN: stdout に `すでに最新バージョンです (1.0.0)` が出力され、`npm install` が呼ばれないこと、exit 0

```
anchor:
  @mspec-delta 2026-05-18-125018-cli-upgrade/specs/cli-upgrade/spec.md
  Requirements implemented: FR-004
  Change: cli-upgrade
```

---

### T-013: [Impl] already up-to-date チェックを実装する（cli-upgrade FR-004）

`upgradeCommand()` に以下を追加:
- `if (currentVersion === latestVersion)` → `console.log(`すでに最新バージョンです (${currentVersion})`)` して return

T-012 のテストが緑になることを確認する。

```
anchor:
  @mspec-delta 2026-05-18-125018-cli-upgrade/specs/cli-upgrade/spec.md
  Requirements implemented: FR-004
  Change: cli-upgrade
```

---

### T-014: [E2E] cli-upgrade FR-003 — アップグレード実行テスト（赤）

`upgrade.test.ts` に追加:
- GIVEN: 新しいバージョンが存在し（`"0.1.0"` < `"1.0.0"`）、`spawnSync` をモック
- WHEN: `upgradeCommand({ yes: true })` を呼ぶ（確認スキップ）
- THEN: `spawnSync('npm', ['install', '-g', '@mspec/cli@latest'], { stdio: 'inherit' })` が呼ばれること

確認プロンプト（`ask()`）の `"y"` 入力バリアントも追加でテストする。

```
anchor:
  @mspec-delta 2026-05-18-125018-cli-upgrade/specs/cli-upgrade/spec.md
  Requirements implemented: FR-003
  Change: cli-upgrade
```

---

### T-015: [Impl] 確認プロンプトと npm install 実行を実装する（cli-upgrade FR-003）

`upgradeCommand()` に以下を実装する:
- `opts.yes` が truthy なら確認スキップ
- そうでなければ `ask('アップグレードしますか？ [y/N] ')` を呼び、`"y"` または `"Y"` のみ進む
- `const result = spawnSync('npm', ['install', '-g', '@mspec/cli@latest'], { stdio: 'inherit' })`
- `result.status !== 0` なら `process.exit(1)`
- 成功なら `console.log('✓ アップグレード完了')`

T-014 のテストが緑になることを確認する。

```
anchor:
  @mspec-delta 2026-05-18-125018-cli-upgrade/specs/cli-upgrade/spec.md
  Requirements implemented: FR-003
  Change: cli-upgrade
```

---

## Phase 4 — Polish

### T-016: `mspec anchor check` を実行してアンカー整合性を確認する

```bash
mspec anchor check --change 2026-05-18-125018-cli-upgrade
```

すべての FR に対してアンカーが正常に解決されること（非ゼロ終了しないこと）を確認する。（アンカーなし — 検証タスク）

---

### T-017: 全テストスイートを実行する

```bash
cd packages/cli && npm test
```

すべてのテストが緑であることを確認する。（アンカーなし — 検証タスク）

---

### T-018: 非 TTY キャンセル動作の手動スモークテスト

以下を確認する（非インタラクティブ環境のシミュレーション）:
- `echo "" | mspec upgrade`（非 TTY 相当）→ キャンセルメッセージが表示されて exit 0 すること
- `mspec upgrade --yes`（fetch は実際の registry を使用、npm install はモックまたは中断）→ 確認なしで進むこと

（アンカーなし — 手動スモークテスト）

---

## Constitution Check

| 原則 | Phase 0 (Tasks) | Phase 1 (Tasks) |
|------|----------------|----------------|
| I ステップ独立性 | OK — tasks.md は design.md と checklist.md のみを入力とし、実装コードを参照していない | — |
| II 決定論的マージ | OK — T-001〜T-018 は順序が明示されており、同じ input から同じタスクリストが生成される | — |
| III 質問駆動の要件確定 | OK — `--yes` フラグ仕様、タイムアウト 10 秒、非 TTY キャンセル挙動はすべて design.md で確定済み | — |
| IV 双方向アンカー | OK — E2E タスク・実装タスクに `anchor:` ブロックを付け、T-001 の `upgrade.ts` 先頭アンカーも明示 | — |
| V 強制ステップと拡張ステップの分離 | OK — tasks.md は implement ステップの入力であり、archive ステップには干渉しない | — |
