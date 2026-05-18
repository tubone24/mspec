---
doc_type: Tutorial
---

# Quickstart: docs/ を GitHub Pages として公開する

このガイドでは、mspec の `docs/` 配下のドキュメントを VitePress + GitHub Actions で GitHub Pages に自動公開するまでの手順を説明します。完了後、`main` への push をトリガに最新ドキュメントが自動デプロイされるようになります。

**所要時間**: 約 15 分

## Prerequisites

- Node.js 18 以上がインストールされていること（`node -v` で確認）
- `tubone24/mspec` リポジトリへの push 権限があること
- GitHub リポジトリの **Settings を変更できる管理者権限**があること

## Setup

### 1. GitHub Pages のソース設定（一度きりの手動操作）

1. GitHub リポジトリ（`https://github.com/tubone24/mspec`）を開く
2. **Settings** タブ → 左メニューの **Pages** をクリック
3. **Source** を `"Deploy from a branch"` から **`"GitHub Actions"`** に変更して保存

> この設定は `actions/deploy-pages@v4` の動作に必須です。省略するとデプロイジョブが失敗します。

### 2. root `package.json` を作成する

プロジェクトルートに `package.json` を新規作成します（VitePress の devDependency 管理用）。

```json
{
  "name": "mspec-docs",
  "private": true,
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

### 3. VitePress をインストールする

```bash
npm install
```

### 4. 画像アセットを移動する

VitePress の静的アセット規約に従い、`docs/images/` を `docs/public/images/` に移動します。

```bash
mkdir -p docs/public/images
mv docs/images/logo.png docs/public/images/logo.png
rmdir docs/images
```

> `docs/` 配下の Markdown ファイルは現時点で `docs/images/` への参照を持たないため、Markdown 本文の変更は不要です。`config.ts` の `themeConfig.logo: '/images/logo.png'` で VitePress が `docs/public/images/logo.png` を参照します。

### 5. VitePress 設定ファイルを作成する

```bash
mkdir -p docs/.vitepress
```

`docs/.vitepress/config.ts` を以下の内容で作成します。

```typescript
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
    socialLinks: [
      { icon: 'github', link: 'https://github.com/tubone24/mspec' },
    ],
  },
})
```

### 6. GitHub Actions ワークフローを作成する

```bash
mkdir -p .github/workflows
```

`.github/workflows/deploy-docs.yml` を以下の内容で作成します。

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

### 7. `.gitignore` に VitePress ビルド出力を追加する

既存の `.gitignore`（または新規作成）に以下を追加します。

```
docs/.vitepress/dist
docs/.vitepress/cache
```

## Try it (Golden Path)

全ファイルを作成したら、ローカルプレビューで動作確認してから push します。

### ローカルプレビューで確認

```bash
npm run docs:dev
```

ブラウザで `http://localhost:5173/mspec/` を開き、以下を確認します。

- tutorials / how-to / explanation / reference の4タブナビゲーションが表示される
- 検索ボックスが表示される（右上のアイコンをクリック）
- ロゴ画像が表示される

### GitHub Pages にデプロイ

```bash
git add .
git commit -m "docs: add VitePress GitHub Pages site"
git push origin main
```

GitHub リポジトリの **Actions** タブでワークフローの実行を確認します。

## Verify

デプロイが完了（GitHub Actions のステータスが ✅ green）したら、以下を確認します。

- [ ] `https://tubone24.github.io/mspec/` がブラウザで開ける
- [ ] トップページに tutorials / how-to / explanation / reference のナビゲーションタブが表示される
- [ ] サイト内検索でキーワード入力が機能する
- [ ] `https://tubone24.github.io/mspec/tutorials/getting-started` が正常に表示される
- [ ] ロゴ画像（`/images/logo.png`）が表示される（404 でない）

## Troubleshooting

### デプロイジョブが "Error: HttpError: Not Found" で失敗する

**原因**: GitHub Pages の Source が "GitHub Actions" に設定されていない。  
**対処**: Step 1 に戻り、Settings → Pages → Source を "GitHub Actions" に変更する。

### `npm run docs:dev` で `vitepress: command not found` が出る

**原因**: `npm install` が未実行。  
**対処**: `npm install` を実行する。

### ローカルでロゴが表示されない

**原因**: `docs/public/images/logo.png` が存在しない（移動が未完了）、または `config.ts` の `themeConfig.logo` が設定されていない。  
**対処**: `mv docs/images/logo.png docs/public/images/logo.png` を実行し、`config.ts` に `logo: '/images/logo.png'` が設定されていることを確認する。

### ページが空白または 404 になる

**原因**: `base: '/mspec/'` の設定漏れ、またはリポジトリ名と base が不一致。  
**対処**: `docs/.vitepress/config.ts` の `base` フィールドがリポジトリ名（`/mspec/`）と一致していることを確認する。

### sidebar のページリンクが機能しない

**原因**: `config.ts` の sidebar リンクが実際のファイルパスと一致していない。  
**対処**: `docs/` 配下のファイル一覧（`find docs -name "*.md" -not -path "*/.vitepress/*"`）を確認し、sidebar の `link` フィールドを実際のパスに合わせる。
