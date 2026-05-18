---
doc_type: Research
---

# Research: init-link-global-bin

## Decisions

| 論点 | 採用案 | 代替案 | 根拠 |
|------|--------|--------|------|
| dev-mode 検出方法 | `import.meta.url` → `fileURLToPath` → dirname 1段上がって `packages/cli/package.json` の存在確認 | 環境変数 `MSPEC_DEV=1` を手動セット | `findTemplatesDir()` が同じパターン（候補リスト試行）を既に採用しており一貫性がある。dist から1段上が `packages/cli` になる。 |
| 子プロセス実行 API | `spawnSync` (`stdio: 'inherit'`) | `execSync` / 非同期 `spawn` | `spawnSync` はシェル展開なし（安全）・`stdio:'inherit'` でリアルタイム出力・戻り値に `status`/`error` が揃っておりエラー判定しやすい。 |
| ビルド失敗時の挙動 | warn して init 継続（FR-003 SHOULD） | プロセス終了 | init の主目的はプロジェクトファイル配置であり、build 失敗でそれを阻害すべきでない。 |
| link 失敗時の挙動 | warn して init 継続 | エラー終了・手動対応を促す | build 失敗と同様に、設定ファイル配置は完了させる。警告メッセージで手動対応の案内を出す。 |
| npm link の sudo 要否 | sudo 不要 | sudo 付与 | `/opt/homebrew` は Homebrew インストール時にユーザー書き込み可能。既存シンボリックリンクは `npm link` が自動上書きする。 |
| dev-mode 検出精度 | `package.json` 存在のみ（ユーザー確認済み） | `name` フィールドが `"@mspec/cli"` か確認 | シンプルな実装で十分。mspecリポジトリ外で誤検出するケースは実用上無視できる。 |
| 無限再帰リスク | リスクなし（構造上） | ガード用環境変数で防御 | `npm run build && npm link` は `mspec init` を呼び出さない。npm lifecycle script では `link` イベントで init がトリガーされる経路はない。 |
| Node.js バージョン互換性 | `fileURLToPath` + `dirname` パターンを維持 | `import.meta.dirname`（Node 20.11+） | エンジン要件は `>=18.0.0`。現状の `init.ts` が同じパターンを採用しており一貫性がある。 |

## Web References

- [npm-link | npm Docs](https://docs.npmjs.com/cli/v11/commands/npm-link/) — `npm link` は `{prefix}/bin/{name}` にシンボリックリンクを作成し、既存リンクを自動で上書きする。sudo は不要（prefix がユーザー所有の場合）。
- [Node.js Child Process — spawnSync](https://nodejs.org/api/child_process.html#child_processspawnsynccommand-args-options) — `spawnSync` は shell オプションなしでコマンドを直接実行し、`stdio:'inherit'` で親プロセスのストリームを引き継ぐ。戻り値の `status` と `error` でエラー判定可能。
- [__dirname is back in Node.js with ES modules | Sonar](https://www.sonarsource.com/blog/dirname-node-js-es-modules) — Node.js 20.11+ では `import.meta.dirname` が利用可能。それ未満では `fileURLToPath(import.meta.url)` + `dirname()` のパターンが標準。
- [tsup shims and import.meta.url issue #958](https://github.com/egoist/tsup/issues/958) — tsup の `shims: true` は CJS 向けに `import.meta.url` を shim するが、`splitting: false` なので chunk-path ズレ問題は発生しない。

## Codebase Findings

- `packages/cli/src/commands/init.ts:36-55` — `resolveTemplatesDir()` と `findTemplatesDir()` が `fileURLToPath(import.meta.url)` + `dirname()` からの相対候補リストを試行するパターンを既に実装。dev-mode 検出も同じ手法で実装できる。
- `packages/cli/src/commands/init.ts:57-64` — `pathExists()` ヘルパーが `access()` を用いて存在確認を行う。dev-mode 検出（`packages/cli/package.json` の存在確認）にそのまま再利用可能。
- `packages/cli/src/commands/test.ts` — `runShell()` が `spawn(command, { shell: true, stdio: 'inherit' })` を使用。build/link ステップは `spawnSync` で代替するが、`stdio:'inherit'` 方針は共通。
- `packages/cli/tsup.config.ts` — `splitting: false`, `shims: true`, `format: ['esm']`。code splitting 無効なので tsup shims の chunk-path ズレ問題は発生しない。
- `packages/cli/package.json:6-8` — `"bin": { "mspec": "./dist/index.js" }`。`npm link` は `packages/cli` ディレクトリで実行すれば `/opt/homebrew/bin/mspec` → `../lib/node_modules/@mspec/cli/dist/index.js` のシンボリックリンクを作成・上書きする。

### パス解決の具体的な計算

`dist/index.js` 実行時:
```
import.meta.url  → file:///path/to/mspec/packages/cli/dist/index.js
dirname(here)    → /path/to/mspec/packages/cli/dist
resolve(here, '..') → /path/to/mspec/packages/cli   ← ここに package.json が存在 = dev-mode
```

### 実装スケッチ

```typescript
import { spawnSync } from 'node:child_process';

async function ensureGlobalLink(): Promise<void> {
  const here = dirname(fileURLToPath(import.meta.url));
  const pkgCliDir = resolve(here, '..');
  if (!(await pathExists(join(pkgCliDir, 'package.json')))) return; // non-dev skip

  console.log(pc.cyan('dev-mode:'), 'building and linking mspec globally...');

  const build = spawnSync('npm', ['run', 'build'], { cwd: pkgCliDir, stdio: 'inherit' });
  if (build.status !== 0) {
    console.warn(pc.yellow('warn:'), 'build failed; skipping npm link. Run `npm run build && npm link` manually.');
    return;
  }

  const link = spawnSync('npm', ['link'], { cwd: pkgCliDir, stdio: 'inherit' });
  if (link.status !== 0) {
    console.warn(pc.yellow('warn:'), 'npm link failed. Run `cd packages/cli && npm link` manually.');
    return;
  }

  console.log(pc.green('  ✓'), 'mspec linked globally');
}
```

## Open Choices（解決済み）

| 論点 | 決定 |
|------|------|
| dev-mode 検出精度 | `package.json` 存在のみ（ユーザー確認）|
| link 失敗時の挙動 | 警告して init 継続（ユーザー確認）|
| build 失敗時のメッセージ | `console.warn` で stderr へ |
| `npm run build` の `cwd` | `pkgCliDir` を明示（安全）|
| Node.js バージョン | `fileURLToPath` + `dirname` パターンを維持 |

## Constitution Check

| Principle | Phase 0 | Phase 1 |
|-----------|---------|---------|
| I: ステップ独立性 | ✅ `init.ts` に閉じた変更。`spawnSync` はNode.js標準モジュール。他ファイルへの影響なし | — |
| II: 決定論的マージ | ✅ `npm link` は冪等（繰り返し実行で同じ結果）。ファイル配置と独立したフェーズとして追加 | — |
| III: 質問駆動の要件確定 | ✅ dev-mode検出精度・link失敗挙動をユーザーと確認済み | — |
| IV: 双方向アンカー | ✅ 実装ファイル `init.ts` に `@mspec-delta` アンカーを埋め込む | — |
| V: 強制ステップと拡張ステップの分離 | ✅ `initCommand` 末尾への追加のみ。既存の設定ファイル配置ロジックを変更しない | — |
