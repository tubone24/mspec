---
doc_type: AI-Internal
---

<!-- @mspec-delta 2026-05-18-094602-npm-publish-v0-1-beta/specs/cli-distribution/spec.md -->
<!-- Requirements implemented: FR-001, FR-002, FR-003 -->
<!-- @mspec-delta 2026-05-18-094602-npm-publish-v0-1-beta/specs/ci-cd/spec.md -->
<!-- Requirements implemented: FR-001, FR-002, FR-003 -->
<!-- Change: npm-publish-v0-1-beta -->

# Tasks: npm-publish-v0-1-beta

## Phase 1 — Setup

### T-001: `.github/workflows/` ディレクトリ構造を作成する

- プロジェクトルートに `.github/workflows/` ディレクトリを作成する
- このディレクトリは Phase 3 の publish.yml 作成に必要

---

## Phase 2 — Foundational

### T-002: [E2E] npm pack tarball 内容確認テスト（赤）

`npm pack --dry-run` の出力に `src/`・`.claude/`・`node_modules/` が含まれず、`dist/` と `templates/` が含まれることを確認する手動テストを実行し、現状を記録する。

```
anchor:
  @mspec-delta 2026-05-18-094602-npm-publish-v0-1-beta/specs/cli-distribution/spec.md
  Requirements implemented: FR-001
  Change: npm-publish-v0-1-beta
```

### T-003: [Impl] package.json に publishConfig 追加・バージョン bump

`packages/cli/package.json` を以下のように変更する：
- `"version"` を `"0.1.0-beta.1"` に変更
- `"publishConfig": { "access": "public" }` を追加

```
anchor:
  @mspec-delta 2026-05-18-094602-npm-publish-v0-1-beta/specs/cli-distribution/spec.md
  Requirements implemented: FR-001, FR-002, FR-003
  Change: npm-publish-v0-1-beta
```

### T-004: [E2E] `mspec --version` 動的参照テスト（赤）

現状の `src/index.ts` で `mspec --version` を実行し、`0.1.0-alpha.1` が出力されることを確認する。T-005 実装後に `0.1.0-beta.1` が出力されることを検証するためのベースラインを記録する。

```
anchor:
  @mspec-delta 2026-05-18-094602-npm-publish-v0-1-beta/specs/cli-distribution/spec.md
  Requirements implemented: FR-001
  Change: npm-publish-v0-1-beta
```

### T-005: [Impl] `src/index.ts` のバージョンを `package.json` から動的参照に変更

`packages/cli/src/index.ts` を変更する：

```typescript
// 変更前
program.version('0.1.0-alpha.1');

// 変更後
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { version } = require('../../package.json');
program.version(version);
```

変更後に `npm run build && node dist/index.js --version` で `0.1.0-beta.1` が出力されることを確認する。

```
anchor:
  @mspec-delta 2026-05-18-094602-npm-publish-v0-1-beta/specs/cli-distribution/spec.md
  Requirements implemented: FR-001
  Change: npm-publish-v0-1-beta
```

---

## Phase 3 — User Story

### T-006: [E2E] `publish.yml` の YAML 構文・トリガー設定確認テスト（赤）

`.github/workflows/publish.yml` がまだ存在しないことを確認する。T-007 実装後に YAML の構文と以下のトリガーが正しく設定されていることを検証する：
- `on.push.tags: ['v*']`
- `on.release.types: [released]`
- `defaults.run.working-directory: packages/cli`

```
anchor:
  @mspec-delta 2026-05-18-094602-npm-publish-v0-1-beta/specs/ci-cd/spec.md
  Requirements implemented: FR-001, FR-002, FR-003
  Change: npm-publish-v0-1-beta
```

### T-007: [Impl] `.github/workflows/publish.yml` を作成する

以下の内容で `.github/workflows/publish.yml` を新規作成する：

```yaml
name: Publish to npm

on:
  push:
    tags:
      - 'v*'
  release:
    types: [released]

defaults:
  run:
    working-directory: packages/cli

jobs:
  publish:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          registry-url: 'https://registry.npmjs.org'
      - run: npm ci
      - run: npm run build
      - run: npm test
      - run: npm publish --tag beta
        env:
          NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
```

```
anchor:
  @mspec-delta 2026-05-18-094602-npm-publish-v0-1-beta/specs/ci-cd/spec.md
  Requirements implemented: FR-001, FR-002, FR-003
  Change: npm-publish-v0-1-beta
```

### T-008: [E2E] `npx @mspec/cli@beta init` の動作確認

グローバルインストールなし環境で `npx @mspec/cli@beta init` が実行可能であることを確認する（publish 後に手動実施）。

```
anchor:
  @mspec-delta 2026-05-18-094602-npm-publish-v0-1-beta/specs/cli-distribution/spec.md
  Requirements implemented: FR-002
  Change: npm-publish-v0-1-beta
```

### T-009: [E2E] beta tag 管理の確認（publish 後）

publish 後に以下を確認する：
- `npm view @mspec/cli dist-tags` に `beta: 0.1.0-beta.1` が含まれること
- `latest` タグが存在しないか古いバージョンのままであること

```
anchor:
  @mspec-delta 2026-05-18-094602-npm-publish-v0-1-beta/specs/cli-distribution/spec.md
  Requirements implemented: FR-003
  Change: npm-publish-v0-1-beta
```

---

## Phase 4 — Polish

### T-010: checklist HIGH リスク項目の手動確認

以下を実施する：
1. `npm run build` 後に `node packages/cli/dist/index.js --version` を実行し、`createRequire('../../package.json')` のパス解決が正しいことを確認する
2. `npm pack --dry-run` で `templates/` が配布物に含まれることを確認する
3. `mspec status`・`mspec validate` などのサブコマンドがビルド後の `dist/` から正常に起動することを確認する

### T-011: GitHub Secrets に `NPM_TOKEN` を設定する（手動）

npm の Automation Token を生成し、GitHub リポジトリの Secrets に `NPM_TOKEN` として登録する。

---

## Constitution Check

| Principle | Phase 0 |
|-----------|---------|
| I. ステップ独立性 | ✅ tasks のみ生成、実装なし |
| II. 決定論的マージ | ✅ 各タスクに具体的なファイル名・変更内容を明示 |
| III. 質問駆動の要件確定 | ✅ 全判断が research/design で確定済み |
| IV. 双方向アンカー | ✅ 全実装・E2E タスクに `anchor:` ブロックを付与 |
| V. 強制ステップと拡張ステップの分離 | ✅ 強制ステップのみ実行 |
