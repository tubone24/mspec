---
doc_type: AI-Internal
---

# npm-publish-v0-1-beta — Proposal

## Why

mspec は現在ローカルビルド + `npm link` でのみ使用可能な状態である。
`npx @mspec/cli init` あるいは `npm install -g @mspec/cli` 経由で `mspec init` が打てる状態にし、
0.1beta として外部ユーザーが試せるようにすることが本変更の目的である。

## Goals

1. `@mspec/cli@0.1.0-beta.1` を npm registry に publish する
2. `npx @mspec/cli init` で既存の `init` コマンドが動作する
3. `npm install -g @mspec/cli` 後に `mspec init` / `mspec new` / `mspec status` などの全コマンドが動作する
4. git tag（`v*`）プッシュまたは GitHub Release 作成時に GitHub Actions が自動で npm publish する
5. publish 前にビルド・テストが通ることを CI で保証する

## Non-Goals

- Windows 対応（macOS / Linux のみ対象）
- 既存 API・コア機能の破壊的変更
- v1.0 に向けたアーキテクチャ整備・大規模リファクタリング
- 詳細なドキュメント（README / CHANGELOG）の充実

## Capabilities (touched)

- `cli-distribution`
- `ci-cd`

## Open Questions

1. **パッケージ名**: 現在は `@mspec/cli`。`npx mspec` を可能にするには `mspec`（スコープなし）への名前変更が必要か、あるいは `@mspec/cli` のままで十分か？
   - 類似 CLI（openspec, create-react-app 等）の慣例を research で確認する
2. **npm tag**: `npm publish --tag beta` にするか `latest` にするか？
   - 0.1beta を `latest` にすると `npm install @mspec/cli` でインストールされる。beta tag が安全か？
3. **monorepo publish**: ルートに `package.json` が無く `packages/cli` のみ。`npm publish` は `packages/cli` から実行で問題ないか？
4. **NPM_TOKEN**: GitHub Actions で自動 publish する際の `NPM_TOKEN` の管理方法（GitHub Secrets）

## Constitution Check

| Principle | Phase 0 | Phase 1 |
|-----------|---------|---------|
| I. ステップ独立性 | ✅ proposal のみ生成、実装なし | — |
| II. 決定論的マージ | ✅ 新規ファイルのみ、競合なし | — |
| III. 質問駆動の要件確定 | ✅ 4問の質問で要件確定済み | — |
| IV. 双方向アンカー | ✅ delta ステップで付与予定 | — |
| V. 強制ステップと拡張ステップの分離 | ✅ 強制ステップのみ実行 | — |
