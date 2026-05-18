---
doc_type: Design
---

# Design: init-link-global-bin

## Summary

`packages/cli/src/commands/init.ts` の `initCommand` 末尾に `ensureGlobalLink()` を追加する。
この関数は、`dist/index.js` の1段上ディレクトリ（`packages/cli`）に `package.json` と `tsconfig.json` の両方が存在する場合（dev-mode）に限り、`npm run build` → `npm link` を順次実行してグローバルコマンドを登録する。
既存のファイル配置ロジックには一切変更を加えない単一ファイル・単一関数追加の変更。

## Technical Context

| 項目 | 内容 |
|------|------|
| 変更対象ファイル | `packages/cli/src/commands/init.ts` のみ |
| 使用 API | `node:child_process` の `spawnSync` |
| 使用済みヘルパー | `pathExists()`, `fileURLToPath(import.meta.url)`, `dirname()`, `resolve()`, `join()` |
| Node.js 要件 | `>=18.0.0`（現行エンジン要件と同じ） |
| npm link 動作 | npm グローバル bin ディレクトリ（`npm config get prefix`/bin）の `mspec` を上書き |
| spawnSync cwd | `packages/cli`（`resolve(dirname(fileURLToPath(import.meta.url)), '..')`） |
| `ensureGlobalLink()` 呼び出し位置 | `ensureGitignoreEntry()` の後、`console.log('mspec init: done.')` の前 |

## Project Structure

```
packages/cli/src/commands/init.ts   ← 変更のみ（新規ファイルなし）
  + ensureGlobalLink(): Promise<void>   ← 追加関数
  + initCommand() 末尾で await ensureGlobalLink() を呼び出し
```

## Decisions

### D-1: dev-mode 検出は `package.json` + `tsconfig.json` の両方存在確認 (FR-001, FR-002)

`import.meta.url` → `fileURLToPath` → `dirname` → `resolve('..')` で `packages/cli` ディレクトリを取得し、`package.json` と `tsconfig.json` の **両方** の存在を確認する。`package.json` 単体では `npm install -g @mspec/cli` 環境でも誤検出されるため（`<prefix>/lib/node_modules/@mspec/cli/package.json` が1段上に存在する）、`tsconfig.json`（ビルドソースが存在する証拠）を追加条件とする。

**受け入れ基準 (FR-001 Scenario)**
- GIVEN mspecリポジトリをクローンして `packages/cli/package.json` と `packages/cli/tsconfig.json` が存在する環境
- WHEN `mspec init` 実行
- THEN `npm run build` + `npm link` が順次実行される

**受け入れ基準 (FR-002 Scenario)**
- GIVEN `npm install -g @mspec/cli` でインストールした環境（`tsconfig.json` が存在しない）
- WHEN `mspec init` 実行
- THEN グローバルリンク処理はスキップされ、設定ファイル配置のみ実行される

### D-2: `spawnSync` + `stdio: 'inherit'` を使用 (FR-001)

`execSync` ではなく `spawnSync` を採用。シェル展開を経由しないため安全。`stdio: 'inherit'` により build/link の進捗をリアルタイムでユーザーのターミナルに表示する。

### D-3: build・link 失敗時は warn して init 継続 (FR-003)

`spawnSync` の戻り値 `status !== 0` または `error` が truthy の場合に `console.warn` で警告を出力し、`return` する。init の設定ファイル配置は既に完了しているため、グローバルリンク失敗（build/link どちらも）はワーニングのみとする。`mspec init: done.` と `next:` メッセージは warn 後も必ず出力される。

**受け入れ基準 (FR-003 build Scenario)**
- GIVEN TypeScript コンパイルエラーがある環境
- WHEN `mspec init` 実行
- THEN ビルドエラー警告が表示されるが、`.mspec/config.yaml` 等の配置は完了し `mspec init: done.` が出力される

**受け入れ基準 (FR-003 link Scenario)**
- GIVEN グローバル npm bin への書き込み権限がない環境
- WHEN `mspec init` 実行
- THEN `npm link` エラー警告が表示されるが、設定ファイル配置は完了し `mspec init: done.` が出力される

### D-4: `ensureGlobalLink()` は `initCommand` の末尾（ファイル配置完了後）に呼び出す (FR-001)

ファイル配置が完了した後にビルド・リンクを実行することで、init の主機能（設定ファイル配置）が必ず完了する。

## Constitution Check

| Principle | Phase 0 | Phase 1 |
|-----------|---------|---------|
| I: ステップ独立性 | ✅ `init.ts` のみの変更。`spawnSync` は Node.js 標準。他ステップ・他コマンドへの影響なし | ✅ `ensureGlobalLink` は独立した関数として追加。`initCommand` の既存ロジックを改変しない |
| II: 決定論的マージ | ✅ `npm link` は冪等。ファイル配置ロジックは変更なし | ✅ アンカーブロックを `init.ts` に埋め込む。マージ時の衝突リスクなし |
| III: 質問駆動の要件確定 | ✅ dev-mode検出精度・link/build失敗挙動をユーザーと確認済み | ✅ Self-Review でD-1を `tsconfig.json` 追加条件に改訂、`npm link` 失敗シナリオをFR-003に追記して解決 |
| IV: 双方向アンカー | ✅ `init.ts` に `@mspec-delta` アンカーブロックを実装フェーズで埋め込む | ✅ FR-001/002/003 と実装箇所を対応付ける |
| V: 強制ステップと拡張ステップの分離 | ✅ `initCommand` 末尾への追加のみ。既存の設定ファイル配置ロジックを変更しない | ✅ `ensureGlobalLink` はオプション的挙動（dev-mode 時のみ）として明確に分離 |

### Complexity Tracking

None

## Self-Review

### Blockers（修正済み）

| # | 種別 | 内容 | 対応 |
|---|------|------|------|
| 1 | BLOCKER | dev-mode検出が `package.json` 存在確認のみでは `npm install -g @mspec/cli` 環境でも誤検出する | D-1を `package.json` + `tsconfig.json` 両方確認に改訂。FR-001/002のScenarioも更新 |
| 2 | BLOCKER | `npm link` 失敗シナリオがDelta Specに存在しないが、architecture-overview.md には `WarnLink` ノードがある | FR-003のprose・タイトルを「Build or Link Failure Tolerance」に改訂し、`npm link` 失敗シナリオを追加 |
| 3 | BLOCKER | `ensureGlobalLink()` の呼び出し順序（done-log前後）が未指定 | Technical Context テーブルに「`ensureGitignoreEntry()` 後、`mspec init: done.` 前」を明記 |

### Nits（修正済み）

- `/opt/homebrew/bin/mspec` のハードコードを `quickstart.md` で汎用化
- Technical Context テーブルに `spawnSync cwd` コントラクトを追記
- Principle III の Phase 1 ステータスを Self-Review での改訂を反映して更新
