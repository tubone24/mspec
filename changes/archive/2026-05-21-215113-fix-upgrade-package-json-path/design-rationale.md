---
doc_type: Explanation
---

<!-- See also: ./design.md -->

# Design Rationale: fix-upgrade-package-json-path

## Context

`@mspec/cli` は tsup で `splitting: false` のシングルバンドル（`dist/index.js`）を生成する純粋 ESM パッケージである。
`upgrade.ts` の `getCurrentVersion()` は `createRequire(import.meta.url)` を使って
`'../../package.json'` を相対参照しているが、バンドル後はすべてのコードが `dist/index.js` に統合される。
このため `../../package.json` は「`dist/index.js` から 2 階層上」を指し、
グローバルインストール時（`/opt/homebrew/lib/node_modules/@mspec/cli/dist/index.js`）では
`/opt/homebrew/lib/package.json` という存在しないパスを参照してしまう。

Node.js の ESM モジュールでは `__dirname` が使えないため、`fileURLToPath(import.meta.url)` +
`dirname()` でバンドル済みファイルの絶対パスを取得するパターンが公式の代替手段である。
プロジェクト内の `init.ts` がすでにこのパターンを採用しており、今回もそれに倣う。

## Decisions

### D-001: `fileURLToPath` + `readFileSync` パターンの採用

`createRequire` を使った `require('../../package.json')` から、`fileURLToPath(import.meta.url)` +
`readFileSync` + `join('../package.json')` パターンへ移行する。
`fileURLToPath(import.meta.url)` はバンドル済み `dist/index.js` の絶対パスを返すため、
グローバル・ローカルどちらのインストール環境でも `../package.json`（1 階層上）を正しく解決できる。
`init.ts` の確立済みイディオムと統一することでコードベースの一貫性も向上する。

### D-002: 修正スコープを `upgrade.ts` のみに限定

`index.ts:34` にも `require('../package.json')` があるが、そちらは `../package.json` と
1 階層上の参照であり現状グローバル環境でも正しく動作している。
今回の変更スコープは最小限とし、`index.ts` は触らない。

### D-003: ビルド成果物 `dist/index.js` の再生成

ソース修正後に tsup でリビルドが必要。既存の `tsup.config.ts` をそのまま使用するため
ビルドプロセスの変更は一切ない。

## Alternatives Considered

- **`createRequire` + パスを `../package.json` に変更（最小 1 行変更）**: 最も差分が小さい。ただし tsup のバンドル挙動（相対パスがバンドル後ファイル基準で評価される）への暗黙依存が残り、将来 `splitting: true` や別エントリに変更した際に再発する可能性がある。
- **`import.meta.resolve` を使ったモジュール解決**: Node.js 20.6+ で利用可能だが、ターゲット環境の Node.js バージョン制約が不明なため採用しない。
- **ビルド時に `package.json` の `version` を定数としてインライン化**: バンドル時に version を埋め込む方式（tsup の `define` オプション等）。実装コストが高く、今回のスコープには過剰。

## Trade-offs

- `readFileSync` はファイル I/O を同期的に行うため、呼び出しタイミング（CLI 起動時）次第では起動レイテンシがわずかに増加する可能性がある。ただし CLI の性質上（1 回の起動で 1 回のみ実行）、実用上の問題はない。
- `node:fs/node:url/node:path` の 3 モジュールを追加 import するが、いずれも Node.js 組み込みであり外部依存は増えない。

## Rejected Options

- **`createRequire` + `'../../package.json'` のまま（現状維持）**: バグの根本原因であり却下。
- **`init.ts` の `candidates` 配列で複数の深さを試す防御的パターン**: tsup のシングルバンドル出力が確定しているため、候補を複数試す必要がなく過剰。シンプルな `join(here, '../package.json')` で十分。

## Constitution Check

| Principle | Phase 0 | Phase 1 |
|-----------|---------|---------|
| I. ステップ独立性 | ✅ design-rationale.md のみ生成、実装なし | ✅ 他ステップの成果物に依存せず独立 |
| II. 決定論的マージ | ✅ 新規ファイルのみ、競合なし | ✅ 設計判断は一意に特定されている |
| III. 質問駆動の要件確定 | ✅ research 段階で選択肢確認済み | ✅ 追加の判断事項なし |
| IV. 双方向アンカー | ✅ design.md と相互参照 | ✅ D-001/D-002/D-003 が design.md と対応 |
| V. 強制ステップと拡張ステップの分離 | ✅ 強制ステップのみ実行 | ✅ 拡張ステップへの依存なし |

### Complexity Tracking

None
