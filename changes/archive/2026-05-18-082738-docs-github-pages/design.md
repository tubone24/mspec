---
doc_type: Reference
---

<!-- See also: ./design-rationale.md for採用理由・代替案 -->

# Design: docs-github-pages

## Summary

`docs/` 配下の既存 Diátaxis マークダウドキュメントを VitePress で静的サイト化し、GitHub Actions（`actions/deploy-pages@v4`）で GitHub Pages へ自動デプロイする構成を設計する。追加ランタイム不要・設定最小・既存コンテンツ変更ゼロを優先する。

## Technical Context

- **リポジトリ**: `tubone24/mspec` → GitHub Pages URL: `https://tubone24.github.io/mspec/`
- **既存 docs/ 構造**: tutorials / how-to / explanation / reference の4カテゴリ（Diátaxis 準拠）、11 Markdown ファイル、`images/logo.png` 1枚
- **ランタイム**: Node.js（`packages/cli` で既存依存）、root `package.json` は未存在のため新規作成
- **変更が必要なファイル**: `docs/images/logo.png` のみ移動（`docs/public/images/logo.png`）。Markdown 本文の追加加筆なし
- **フロントマター**: 全ファイルに `doc_type:` が付与済み。VitePress はカスタムフロントマターを無視するため互換性あり

## Project Structure

```
mspec/                              # プロジェクトルート
├── package.json                    # 新規作成 (VitePress devDependency)
├── docs/
│   ├── .vitepress/
│   │   └── config.ts               # 新規作成 (VitePress 設定)
│   ├── public/
│   │   └── images/
│   │       └── logo.png            # 移動元: docs/images/logo.png
│   ├── README.md                   # そのまま維持 (VitePress root index)
│   ├── tutorials/
│   ├── how-to/
│   ├── explanation/
│   └── reference/
└── .github/
    └── workflows/
        └── deploy-docs.yml         # 新規作成 (GitHub Actions)
```

## Decisions

### D-001: VitePress 設定ファイル (`docs/.vitepress/config.ts`)

**概要**: VitePress の設定を `docs/.vitepress/config.ts` に配置する。`base: '/mspec/'`、ローカル検索、Diátaxis 4タブナビゲーションを設定する。

**受け入れ基準** (FR-001 Scenario、FR-003 Scenario に対応):

| 設定項目 | 値 | 対応 FR |
|----------|-----|---------|
| `base` | `/mspec/` | FR-001 |
| `srcDir` | `docs` として `vitepress build docs` で指定 | FR-001 |
| `themeConfig.nav` | tutorials / how-to / explanation / reference の4タブ | FR-003 |
| `themeConfig.search` | `{ provider: 'local' }` | FR-003 |
| `themeConfig.logo` | `/images/logo.png` | FR-005 |

```typescript
// docs/.vitepress/config.ts
import { defineConfig } from 'vitepress'

export default defineConfig({
  base: '/mspec/',
  title: 'mspec',
  description: 'Spec-Driven Development framework CLI for Claude Code',
  themeConfig: {
    logo: '/images/logo.png',
    nav: [
      { text: 'Tutorials', link: '/tutorials/getting-started' },
      { text: 'How-To', link: '/how-to/customize-workflow' },
      { text: 'Explanation', link: '/explanation/why-mspec' },
      { text: 'Reference', link: '/reference/cli' },
    ],
    sidebar: {
      '/tutorials/': [
        { text: 'Getting Started', link: '/tutorials/getting-started' },
      ],
      '/how-to/': [
        { text: 'Customize Workflow', link: '/how-to/customize-workflow' },
        { text: 'Fix Anchor Errors', link: '/how-to/fix-anchor-errors' },
        { text: 'Lightweight Changes', link: '/how-to/lightweight-changes' },
      ],
      '/explanation/': [
        { text: 'Why mspec?', link: '/explanation/why-mspec' },
      ],
      '/reference/': [
        { text: 'CLI', link: '/reference/cli' },
        { text: 'Anchors', link: '/reference/anchors' },
        { text: 'Configuration', link: '/reference/configuration' },
        { text: 'Doc Types', link: '/reference/doc-types' },
        { text: 'Workflow', link: '/reference/workflow' },
      ],
    },
    search: { provider: 'local' },
    socialLinks: [{ icon: 'github', link: 'https://github.com/tubone24/mspec' }],
  },
})
```

> **Note**: `docs/` 配下には `how-to/`・`explanation/`・`reference/` ディレクトリに `index.md` が存在しないため、nav リンクには各カテゴリの最初のファイルを直接指定する。将来的にカテゴリランディングページが必要な場合は各ディレクトリに `index.md` を追加する。

### D-002: root `package.json`

**概要**: VitePress の devDependency を管理するためルートに `package.json` を新規作成する。

**npm scripts**:

```json
{
  "scripts": {
    "docs:dev": "vitepress dev docs",
    "docs:build": "vitepress build docs",
    "docs:preview": "vitepress preview docs"
  },
  "devDependencies": {
    "vitepress": "^1.6.0"
  }
}
```

**受け入れ基準** (FR-004 Scenario に対応): `npm run docs:dev` でローカルサーバーが起動し、ブラウザでプレビュー可能。

### D-003: GitHub Actions ワークフロー (`.github/workflows/deploy-docs.yml`)

**概要**: `main` ブランチへの push をトリガに、VitePress ビルド → GitHub Pages デプロイを自動実行する。

**受け入れ基準** (FR-002 Scenario に対応):

```yaml
name: Deploy docs to GitHub Pages

on:
  push:
    branches: [main]

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: pages
  cancel-in-progress: false

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: npm
      - run: npm ci
      - run: npm run docs:build
      - uses: actions/upload-pages-artifact@v3
        with:
          path: docs/.vitepress/dist

  deploy:
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    needs: build
    runs-on: ubuntu-latest
    steps:
      - uses: actions/deploy-pages@v4
        id: deployment
```

### D-004: 画像アセット移動 (`docs/images/` → `docs/public/images/`)

**概要**: VitePress の静的アセット規約に従い `docs/images/logo.png` を `docs/public/images/logo.png` へ移動する。現時点で `docs/` 配下のいずれの Markdown ファイルも `docs/images/` への参照を持たないため、Markdown 本文の変更は不要。`docs/.vitepress/config.ts` の `themeConfig.logo: '/images/logo.png'` で参照される。

**受け入れ基準** (FR-005 Scenario に対応):

- `docs/public/images/logo.png` が存在し、`docs/images/` ディレクトリが削除されている
- `docs/` 配下の全 `.md` ファイルに `docs/images/` または `images/logo` への参照がないこと（grep で確認）
- ビルド後の HTML でロゴ画像が 404 にならない

### D-005: 手動前提条件（GitHub Pages ソース設定）

**概要**: GitHub Pages のソースを「GitHub Actions」に設定する一度きりの手動操作が必要。

- リポジトリ Settings → Pages → Source を "GitHub Actions" に変更
- 管理者権限が必要
- ワークフロー初回実行前に完了させること

### D-006: 非 TypeScript ファイルのアンカー戦略

**概要**: このチェンジで追加する3ファイルのアンカー対応方針を以下のとおり決定する。

| ファイル | 形式 | アンカー方針 |
|----------|------|------------|
| `docs/.vitepress/config.ts` | TypeScript | `// @mspec-delta ...` 形式で3行アンカーブロックを付与する |
| `.github/workflows/deploy-docs.yml` | YAML | `# @mspec-delta ...` 形式で3行アンカーブロックを付与する（YAML はコメント可能） |
| `package.json` | JSON | JSON はコメント構文を持たないため、アンカーを付与しない。`mspec anchor check` でのスキャン対象から `.json` を除外する（`.mspecignore` または CLI の `--ignore-ext` 設定で対応） |

## Constitution Check

> Step: design | Constitution Version: 1.0.0

### Phase 0

| Principle | Phase 0 | Notes |
|-----------|---------|-------|
| I. ステップ独立性 | ✅ | design ステップは design.md / design-rationale.md / architecture-overview.md のみを生成 |
| II. 決定論的マージ | ✅ | spec ファイルの変更なし |
| III. 質問駆動の要件確定 | ✅ | research の Open Choices がユーザー回答により解決済み。設計に不確定要素なし |
| IV. 双方向アンカー | ✅ | FR-001〜FR-005 への受け入れ基準参照を Decisions に記載。implement ステップでコードにアンカーを付与 |
| V. 強制ステップと拡張ステップの分離 | ✅ | design は必須ステップ。本変更のスコープ（新規ファイル追加のみ）と一致 |

### Phase 1

| Principle | Phase 1 | Notes |
|-----------|---------|-------|
| I. ステップ独立性 | ✅ | 設計ドキュメントは `changes/` 内に閉じており、mspec のコアステップには干渉しない |
| II. 決定論的マージ | ✅ | 新規ファイル追加のみ（既存 Markdown の変更は画像参照1箇所のみ）。競合リスクなし |
| III. 質問駆動の要件確定 | ✅ | D-005 の手動前提条件を明示化。実装者への情報漏れなし |
| IV. 双方向アンカー | ✅ | 各 Decision が FR-NNN の Scenario と対応付けられており、checklist・tasks.md のトレーサビリティが担保される |
| V. 強制ステップと拡張ステップの分離 | ✅ | 設計スコープが proposal の Goals・Non-Goals と一致している |

### Complexity Tracking

None

## Self-Review

> Reviewer: mspec-self-reviewer | Date: 2026-05-18 (pass 2)

### Verdict

PASS

### Findings

| # | Severity | Location | Finding | Action |
|---|----------|----------|---------|--------|
| 1 | INFO | `design.md` D-001 sidebar | 全サイドバーリンクが実ファイルパスを使用（`/how-to/customize-workflow`、`/reference/cli` 等）。ディレクトリ URL なし。ディスク上の 11 ファイルと照合済み。 | 対応不要 |
| 2 | INFO | `design.md` D-004 | phantom 画像参照更新を正しく削除済み。全 11 `docs/*.md` ファイルに `docs/images/` または `images/logo` への参照がないことを grep で確認済み。 | 対応不要 |
| 3 | INFO | `design.md` D-006 | 3ファイル種別全てのアンカー戦略を文書化：`.ts` は `// @mspec-delta`、`.yml` は `# @mspec-delta`、`.json` は `.mspecignore` で除外。 | 対応不要 |
| 4 | INFO | `checklist.md` ファイル数 | ファイル数が 11 に統一済み。phantom 画像更新アイテム削除済み。`.gitignore` アイテム追加済み。 | 対応不要 |
| 5 | INFO | `quickstart.md` | `README.md` 画像参照更新の誤記述なし。Step 4 は `mv` のみ記述。サイドバー設定は D-001 と一致する実ファイルパスを使用。 | 対応不要 |
| 6 | INFO | `design.md` Phase 1 IV | tasks.md のトレーサビリティに関する forward-looking ✅ 評価。pass 1 で承認済み。 | Accept：tasks ステップ完了後に再評価 |
| 7 | NIT | `specs/docs-site/spec.md` FR-005 Scenario 2 | シナリオが「`docs/images/` への参照がマークダウンに含まれている」と記述しているが、現状は参照がゼロ。将来の回帰ガードとして機能するため問題なし。 | Accept as-is（回帰ガード） |

### Summary

pass 1 で検出した4つの WARN 項目が全て修正済みであることを確認した。サイドバーリンクは実ファイルを解決し、phantom README.md 画像更新要件は削除され、YAML/JSON のアンカー戦略が D-006 に文書化され、checklist のファイル数が 11 に修正されている。残りの項目は全て INFO/NIT レベルでブロッカーなし。tasks ステップへ進む準備完了。
