---
doc_type: AI-Internal
---

# Research: cli-upgrade

## Decisions

| 論点 | 採用案 | 代替案 | 根拠 |
|------|--------|--------|------|
| バージョン取得エンドポイント | `https://registry.npmjs.org/@mspec/cli/latest` (latest タグ直接取得) | `/dist-tags` フィールド fetch、`npm view` CLI | `latest` エンドポイントは beta/RC を除外した安定版のみ返す。提案の FR-001/FR-003 と完全一致。Node.js 18+ 組み込み `fetch` で依存追加不要 |
| HTTP クライアント | Node.js 18+ 組み込み `fetch` (グローバル) | `node-fetch`、`npm-registry-fetch`、`latest-version` パッケージ | `engines.node: >=18.0.0` が既に設定されており、外部依存追加不要。タイムアウトは `AbortSignal.timeout()` で実装可能 |
| semver 比較 | 軽量インライン実装 (`a === b` 文字列比較 + split による数値比較) | `semver` パッケージ、`compare-versions` パッケージ | アップグレード判定は「currentVersion === latestVersion」の単純等価比較で十分。既存の `package.json` に semver 依存なし。追加依存を避けるのがプロジェクト方針に合致 |
| ユーザー確認プロンプト | 既存の `src/lib/prompt.ts` の `ask()` 関数を再利用 | `readline.createInterface`、`inquirer` | `ask()` が既にコードベースに存在し、非 TTY 環境での空文字返却も実装済み。`archive.ts` や `test.ts` でも実績あり |
| アップグレード実行 | `spawnSync('npm', ['install', '-g', '@mspec/cli@latest'], { stdio: 'inherit' })` | `spawn()` + Promise ラップ、`execSync` | `spawnSync` は `stdio: 'inherit'` でライブ出力を表示しつつブロッキング実行できる。`init.ts` の `ensureGlobalLink()` で全く同じパターンが既に使われている |
| バージョン読み取り (現在) | `createRequire(import.meta.url)` で `package.json` を require | `import.meta.resolve`、`fs.readFile` | `index.ts` の `version` 読み取りで既に採用されているパターン。ESM (`type: module`) 環境でも動作実証済み |
| コマンド登録方法 | `index.ts` にトップレベル `program.command('upgrade')` として登録 | サブコマンドグループ (例: `mspec self upgrade`) | 他のすべてのトップレベルコマンド (`init`, `new`, `status`, ...) と対称的。提案では `mspec upgrade` と明示されている |

## Web References

- [npm Registry API: GET /:package/:version — github.com/npm/registry](https://github.com/npm/registry/blob/main/docs/REGISTRY-API.md) — `https://registry.npmjs.org/@mspec/cli/latest` は `latest` dist-tag の完全なバージョンオブジェクトを返す。`version` フィールドに安定版バージョン文字列が入る
- [latest-version npm package — github.com/sindresorhus/latest-version](https://github.com/sindresorhus/latest-version) — `npm view` と registry API を使った参照実装。内部実装は単純な `fetch` + JSON parse であり、自前実装のベースラインとなる
- [Node.js Child Process docs — nodejs.org](https://nodejs.org/api/child_process.html) — `spawnSync` / `spawn` の `stdio: 'inherit'` オプションでライブ出力を親プロセスに流す方法を説明
- [semver npm package — npmjs.com/package/semver](https://www.npmjs.com/package/semver) — フル機能の semver 実装。今回は単純等価比較のみ必要なため採用不要だが、将来のダウングレード防止等で必要になる場合の参照先
- [compare-versions npm package — npmjs.com/package/compare-versions](https://www.npmjs.com/package/compare-versions) — 依存なし・軽量の semver 比較ライブラリ。もし単純文字列比較では不十分と判断した場合の第一候補

## Codebase Findings

- `packages/cli/package.json` — パッケージ名は `@mspec/cli`、現在バージョン `0.1.0-beta.1`。`type: module` (ESM)、`engines.node: >=18.0.0`
- `packages/cli/package.json` — `bin.mspec` は `./dist/index.js` を指す。グローバルインストール後のエントリポイント
- `packages/cli/src/index.ts:28-29` — バージョン取得パターン: `const require = createRequire(import.meta.url); const { version } = require('../../package.json')` — ESM 内で `package.json` を同期 require する実績パターン
- `packages/cli/src/index.ts:31-36` — Commander.js (`commander@^12.1.0`) を使用。`program.name('mspec').version(version)` でトップレベルコマンド定義
- `packages/cli/src/index.ts:38-197` — すべてのサブコマンドは `program.command('<name>')` でフラットに登録。`upgrade` もここに追加する
- `packages/cli/src/lib/prompt.ts:1-28` — `ask(question: string): Promise<string>` — 非 TTY 時は即座に `''` を返す。ユーザー確認プロンプトとして直接再利用可能
- `packages/cli/src/commands/init.ts:8` — `spawnSync` を `node:child_process` から import する実績
- `packages/cli/src/commands/init.ts:143-155` — `spawnSync('npm', ['run', 'build'], { cwd: pkgCliDir, stdio: 'inherit' })` / `spawnSync('npm', ['link'], ...)` — npm CLI を spawnSync で呼ぶ完全なパターン。`upgrade` コマンドの `npm install -g` 呼び出しに直接転用可能
- `packages/cli/src/commands/test.ts` — `spawn` (非同期版) + `Promise` ラップの `runShell()` パターンも存在。ライブ出力 + 非同期が必要な場合の代替
- `packages/cli/src/commands/archive.ts` — `ask()` を使った確認フロー (`-y/--yes` オプションでスキップ) の実績。`upgrade` コマンドの `--yes` フラグ設計の参考になる
- `packages/cli/src/commands/init.ts:107-119` — `process.stdin.isTTY` チェックによる非インタラクティブ環境対応パターン

## Open Choices

~~`--yes` / `-y` フラグを `upgrade` コマンドに追加するか~~ → **追加する**（`archive` と同パターン）
~~fetch タイムアウト値~~ → **10 秒**（`AbortSignal.timeout(10_000)`）
- 現在バージョンが最新より新しい (dev build) 場合の扱い: インライン semver 比較で「current > latest」のケースを無視してよいか（設計フェーズで検討）

## Constitution Check

| 原則 | Phase 0 (Research) | Phase 1 (Design) |
|------|--------------------|------------------|
| I ステップ独立性 | OK — research.md は proposal.md と Delta Spec のみを入力とし、後続ステップへの決定の委譲は明示的な Open Choices に限定されている | — |
| II 決定論的マージ | OK — 採用案は表形式で一意に記録されており、後続の design ステップが同じ結論に到達できる | — |
| III 質問駆動の要件確定 | OK — `--yes` フラグとタイムアウト値の 2 点をユーザーに確認し、回答を記録した | — |
| IV 双方向アンカー | OK — Codebase Findings は Delta Spec の FR 番号ごとに対応する実装パターンを明記 | — |
| V 強制ステップと拡張ステップの分離 | OK — 設計判断（エラー終了コードの統一等）は design ステップに委ねており、research 段階での過剰決定なし | — |
