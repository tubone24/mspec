---
doc_type: Reference
---

<!-- See also: ./design-rationale.md for採用理由・代替案 -->

<!-- @mspec-delta 2026-05-18-094602-npm-publish-v0-1-beta/specs/cli-distribution/spec.md -->
<!-- Requirements implemented: FR-001, FR-002, FR-003 -->
<!-- @mspec-delta 2026-05-18-094602-npm-publish-v0-1-beta/specs/ci-cd/spec.md -->
<!-- Requirements implemented: FR-001, FR-002, FR-003 -->
<!-- Change: npm-publish-v0-1-beta -->

# Design: npm-publish-v0-1-beta

## Summary

`@mspec/cli` を npm registry に `0.1.0` として publish し、`npx @mspec/cli init` および `npm install -g @mspec/cli && mspec init` が動作する状態にする。加えて、git tag プッシュまたは GitHub Release 作成時に GitHub Actions が自動で npm publish する CI/CD パイプラインを構築する。

変更対象は以下の 3 つ：
1. `packages/cli/package.json` — `publishConfig` 追加・バージョン bump
2. `packages/cli/src/index.ts` — バージョンの動的参照
3. `.github/workflows/publish.yml` — 新規作成（CI/CD パイプライン）

---

## Technical Context

| 項目 | 現状 | 変更後 |
|------|------|--------|
| パッケージ名 | `@mspec/cli` | `@mspec/cli`（変更なし） |
| バージョン | `0.1.0-alpha.1` | `0.1.0` |
| npm tag | 未 publish | `beta`（`latest` は更新しない） |
| `publishConfig` | 未設定 | `{ "access": "public" }` |
| バージョン参照 | `index.ts` にハードコード | `package.json` から動的 import |
| CI/CD | なし | `.github/workflows/publish.yml` |

---

## Project Structure

```
mspec/
├── packages/
│   └── cli/
│       ├── package.json          # publishConfig 追加、version bump
│       ├── src/
│       │   └── index.ts          # version 動的参照に変更
│       ├── dist/                 # ビルド成果物（publish 対象）
│       └── templates/            # CLI テンプレート（publish 対象）
└── .github/
    └── workflows/
        └── publish.yml           # 新規作成
```

---

## Decisions

### D-001: package.json の publishConfig と version

**変更内容:**
```json
{
  "name": "@mspec/cli",
  "version": "0.1.0",
  "bin": {
    "mspec": "./dist/index.js"
  },
  "files": [
    "dist/",
    "templates/"
  ],
  "publishConfig": {
    "access": "public"
  }
}
```

> Note: `bin` と `files` は既存 `package.json` に設定済み。`version` bump と `publishConfig` の追加が本変更の実質的な差分。`bin`・`files` はリファレンスとして記載。

**受け入れ基準（cli-distribution FR-001 Scenario 対応）:**
- `npm pack` の tarball に `src/`・`.claude/` が含まれないこと
- `npm install -g @mspec/cli@beta` 後に `mspec --version` が `0.1.0` を出力すること

---

### D-002: src/index.ts のバージョン動的参照

**変更前:**
```typescript
program.version('0.1.0-alpha.1');
```

**変更後:**
```typescript
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { version } = require('../../package.json');

program.version(version);
```

> Note: ESM (`"type": "module"`) 環境では `import ... assert { type: 'json' }` は Node 20 以降で利用可能だが、`createRequire` の方が Node 18 との互換性が高い。

**受け入れ基準（cli-distribution FR-001 Scenario 対応）:**
- `package.json` の version を変更しただけで `mspec --version` の出力が自動更新されること

---

### D-003: .github/workflows/publish.yml の構成

**ファイル構造:**
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

**受け入れ基準（ci-cd FR-001, FR-002, FR-003 Scenario 対応）:**
- `v*` タグプッシュ時に publish job が起動すること
- `npm test` が失敗した場合 publish が実行されないこと
- GitHub Release `released` イベントでも publish job が起動すること

---

## Complexity Tracking

None.

---

## Constitution Check

| Principle | Phase 0 | Phase 1 |
|-----------|---------|---------|
| I. ステップ独立性 | ✅ design のみ生成、実装なし | ✅ proposal / research / delta と独立したファイルを生成 |
| II. 決定論的マージ | ✅ 新規ファイルのみ | ✅ D-001 に `bin`・`files`・`publishConfig`・`version` を全て明示（self-review で修正済み） |
| III. 質問駆動の要件確定 | ✅ research で Open Choices 解決済み | ✅ 追加の設計判断なし（全て research で確定） |
| IV. 双方向アンカー | ✅ `@mspec-delta` アンカーを冒頭に付与 | ✅ D-001〜D-003 が FR 番号と対応 |
| V. 強制ステップと拡張ステップの分離 | ✅ 強制ステップのみ | ✅ design-rationale・architecture-overview も必須成果物 |

---

## Self-Review

- ✅ **FR 網羅性**: cli-distribution FR-001〜FR-003、ci-cd FR-001〜FR-003 のすべてに対応するシナリオが記述されており、D-001〜D-003 と対応関係がある
- ✅ **architecture-overview.md**: System Diagram（`graph TD`）と Sequence Diagram が含まれており、ビジュアルでフローが追える
- ✅ **quickstart.md Golden Path**: `@beta` tag でのインストール → `mspec init` → `mspec new` → `mspec status` の順序が正確に記述されている
- ❌ **D-001 パッチに `files`・`bin` が欠落していた** → self-review で修正済み。D-001 に `bin`・`files`・`publishConfig`・`version` の完全なリファレンス値を追記した
- ⚠️ **ci-cd spec FR-003 のイベント名誤記** (`release: published` → `release: released`) → self-review で修正済み。design.md の D-003 YAML は元から正しかった
- ⚠️ **D-002 の `require` パス**: `require('../../package.json')` が `dist/index.js` から `packages/cli/package.json` を指す前提。`tsup.config.ts` の出力構造変更時はパスの再確認が必要（checklist HIGH リスク項目に記録済み）

**Constitution II（決定論的マージ）再評価**: D-001 修正後は `package.json` の変更仕様が完全に記述され、LLM に依存しない実装が可能な状態になった。
