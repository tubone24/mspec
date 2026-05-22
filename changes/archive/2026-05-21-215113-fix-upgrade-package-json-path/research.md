---
doc_type: AI-Internal
---

# fix-upgrade-package-json-path — Research

## Decisions

| 論点 | 採用案 | 代替案 | 根拠 |
|------|--------|--------|------|
| `package.json` の参照方法 | `fileURLToPath(import.meta.url)` + `dirname` + `join('../package.json')` + `readFileSync` | `createRequire` + `require('../package.json')` へパス修正 | プロジェクト内の `init.ts` が確立済みのイディオムで統一。ESM シングルバンドルで堅牢。 |
| 修正スコープ | `upgrade.ts` の `getCurrentVersion()` のみ | `index.ts` の `require('../package.json')` も同時修正 | `index.ts` は現状正しく動作しており、今回はスコープ外とする。 |
| tsup bundle 構造 | `dist/index.js` 1 ファイルにすべてバンドル | エントリポイントごとに別ファイル | `tsup.config.ts` で `splitting: false` かつ `entry: ['src/index.ts']` のみ。全コマンドが単一 `dist/index.js` に収まる。 |

## Web References

- [Node.js docs — `import.meta.url` and `fileURLToPath`](https://nodejs.org/api/esm.html#importmetaurl) — ESM モジュールで `__dirname` 相当を得るための公式パターン。`fileURLToPath(import.meta.url)` で現在ファイルの絶対パスを取得できる。
- [Node.js docs — `module.createRequire`](https://nodejs.org/api/module.html#modulecreaterequirefilename) — ESM 内で `require()` を使うための API。バンドル後のファイル位置に依存するため相対パスに注意が必要。
- [tsup — Single file bundling](https://tsup.egoist.dev/#bundle-formats) — `splitting: false` 設定時、すべてのソースが単一ファイルに統合される。各モジュールの相対パスはバンドル後のファイル位置を基準に再解釈される。
- [npm global install path resolution](https://docs.npmjs.com/cli/v10/configuring-npm/folders#node-modules) — グローバルインストール時のパス（例：`/opt/homebrew/lib/node_modules/@mspec/cli/dist/index.js`）。`../../package.json` はここから 2 階層上の `/opt/homebrew/lib/package.json` を指すためファイルが存在しない。

## Codebase Findings

- **バグ箇所**: `packages/cli/src/commands/upgrade.ts:31` — `const pkg = require('../../package.json')` — tsup バンドル後は `dist/index.js:3304` の `require3("../../package.json")` に相当し、グローバルインストール時に `Cannot find module` エラーを発生させる。
- **バンドル確認**: `packages/cli/dist/index.js:3304` — `require3("../../package.json")` — バンドル済みファイルで確認。`dist/index.js` から 2 階層上を参照しており、グローバル環境では `package.json` が存在しない。
- **正常動作例**: `packages/cli/dist/index.js:3525` — `require2("../package.json")` — `index.ts` のバンドル結果。1 階層上の参照で正しく動作する。
- **参考パターン**: `packages/cli/src/commands/init.ts:42` — `const here = dirname(fileURLToPath(import.meta.url))` — プロジェクト内で確立済みの正しいイディオム。
- **モジュール形式**: `packages/cli/tsup.config.ts` — `format: ['esm']`, `splitting: false`、`packages/cli/package.json` — `"type": "module"` — 純粋 ESM シングルバンドル。`__dirname` は使えず `fileURLToPath(import.meta.url)` が必要。

**具体的な修正内容（`upgrade.ts` の `getCurrentVersion` 関数）:**

現在のコード（バグあり）:
```typescript
export function getCurrentVersion(): string {
  const require = createRequire(import.meta.url);
  const pkg = require('../../package.json') as { version: string };
  return pkg.version;
}
```

修正後（`fileURLToPath` + `readFileSync` パターン）:
```typescript
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

export function getCurrentVersion(): string {
  const here = dirname(fileURLToPath(import.meta.url));
  const pkg = JSON.parse(
    readFileSync(join(here, '../package.json'), 'utf8')
  ) as { version: string };
  return pkg.version;
}
```

## Open Choices

（なし。ユーザーとの確認ですべて解決済み）
- 修正方針: `fileURLToPath` + `readFileSync` パターン採用
- `index.ts` の `require('../package.json')`: 今回はスコープ外

## Constitution Check

| Principle | Phase 0 | Phase 1 |
|-----------|---------|---------|
| I. ステップ独立性 | ✅ research.md のみ生成、実装なし | — |
| II. 決定論的マージ | ✅ 新規ファイルのみ、競合なし | — |
| III. 質問駆動の要件確定 | ✅ Open Choices をユーザーに確認し解決済み | — |
| IV. 双方向アンカー | ✅ tasks ステップでアンカー付与予定 | — |
| V. 強制ステップと拡張ステップの分離 | ✅ 強制ステップのみ実行 | — |
