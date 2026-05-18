---
doc_type: AI-Internal
---

# Research: npm-publish-v0-1-beta

## Decisions

| 論点 | 採用案 | 代替案 | 根拠 |
|------|--------|--------|------|
| パッケージ名 | `@mspec/cli` のまま変更しない | `mspec`（unscoped）を追加 publish | `bin` エントリが単一（`"mspec"`）の場合、npm exec はバイナリ名でそのまま解決する。`npx @mspec/cli init` → `mspec init` が実行される。unscoped 名は名前スカッティングリスクと二重メンテコストがある。**ユーザー確認済: `@mspec/cli` のみ** |
| `publishConfig.access` | `"publishConfig": { "access": "public" }` を package.json に**追加** | なし（追加必須） | スコープ付きパッケージは初回 publish 時にデフォルトで private 扱い。未設定だと 402 Forbidden エラーになる |
| npm tag 戦略 | `npm publish --tag beta` | `latest` tag で publish | semver pre-release（`0.1.0`）を `latest` にすると `npm install @mspec/cli` でベータが引かれる。`--tag beta` なら誤インストールを防ぐ |
| バージョン管理 | `src/index.ts` で `package.json` から動的参照 | 手動 2 箇所 bump | `import { version } from '../package.json'` で一元管理。**ユーザー確認済: 動的参照** |
| GitHub Actions トリガー | `on: push: tags: ['v*']` + `on: release: types: [released]` 併用 | `push: tags` のみ | FR-001（tag push）と FR-003（GitHub Release）を両方カバー。`released` は Draft → Publish フローで安全 |
| CI の `working-directory` | 全ステップに `defaults.run.working-directory: packages/cli` | 各ステップに個別指定 | ルートに `package.json` がない monorepo 構成。全ステップが `packages/cli` で動く |
| Node.js バージョン | Node.js 20 LTS | matrix で 18 / 20 / 22 | `engines: ">=18.0.0"` と整合。20 LTS は 2026 年現在 active |
| NPM_TOKEN 管理 | npm Automation Token → GitHub Secret `NPM_TOKEN` → `NODE_AUTH_TOKEN` | OIDC Trusted Publishing | Automation Token は CI 向けで 2FA をバイパス可能。OIDC はオプションとして将来検討 |
| `files` フィールド | 既存 `"files": ["dist", "templates"]` を維持 | `.npmignore` 追加 | whitelist 方式で `src/`・`.claude/` を自動除外。変更不要 |

---

## Web References

- [npx / npm-exec | npm Docs](https://docs.npmjs.com/cli/v11/commands/npx/) — 単一 bin エントリの場合は package name と一致しなくてもバイナリ名で解決される
- [Prereleases and npm | Medium](https://medium.com/@mbostock/prereleases-and-npm-e778fc5e2420) — pre-release を `latest` にすると安定版ユーザーに降る問題
- [Files & Ignores · npm/cli Wiki](https://github.com/npm/cli/wiki/Files-&-Ignores) — `files` フィールドと `.npmignore` の優先順位
- [GitHub Actions: Publishing to npm | GitHub Docs](https://docs.github.com/en/actions/use-cases-and-examples/publishing-packages/publishing-nodejs-packages) — `setup-node` の `registry-url`・`NODE_AUTH_TOKEN` パターン
- [Scope | npm Docs](https://docs.npmjs.com/cli/v11/using-npm/scope/) — スコープ付きパッケージの `publishConfig.access: "public"` 要件

---

## Codebase Findings

- `packages/cli/package.json:1` — `"name": "@mspec/cli"`, `"version": "0.1.0-alpha.1"`. publish 前に `0.1.0` へ bump が必要。`publishConfig` フィールドは**未設定**（追加必須）
- `packages/cli/package.json:6-8` — `bin: { "mspec": "./dist/index.js" }` が単一エントリで設定済み。`npx @mspec/cli` は追加変更なしで動作する
- `packages/cli/package.json:10-13` — `files: ["dist", "templates"]` が設定済み。変更不要
- `packages/cli/package.json:15-22` — `scripts` に `build`・`test` あり。CI で利用可能
- `packages/cli/package.json:23-25` — `engines: { "node": ">=18.0.0" }` 設定済み
- `packages/cli/src/index.ts` — `program.version('0.1.0-alpha.1')` がハードコード。`package.json` からの動的参照に変更が必要
- `packages/cli/tsup.config.ts` — `banner: { js: '#!/usr/bin/env node' }` 設定済み。shebang が出力される
- プロジェクトルート — `.github/workflows/` ディレクトリが**存在しない**。新規作成が必要

---

## Open Choices（解決済み）

| 論点 | ユーザー判断 |
|------|------------|
| unscoped `mspec` 追加 publish | ❌ 不要。`@mspec/cli` のみ |
| バージョンのハードコード | `package.json` から動的参照に変更する |
| OIDC Trusted Publishing | 今回は不要。Automation Token + Secret で対応 |
| Node matrix | Node 20 LTS のみで十分 |
| `on: release` サブタイプ | `released`（Draft → Publish フローで安全） |

---

## Constitution Check

| Principle | Phase 0 | Phase 1 |
|-----------|---------|---------|
| I. ステップ独立性 | ✅ research のみ生成、実装なし | — |
| II. 決定論的マージ | ✅ 新規ファイルのみ、競合なし | — |
| III. 質問駆動の要件確定 | ✅ Open Choices を 2 問ユーザー確認済み | — |
| IV. 双方向アンカー | ✅ design ステップで付与予定 | — |
| V. 強制ステップと拡張ステップの分離 | ✅ 強制ステップのみ実行 | — |
