---
doc_type: Reference
---

# Tasks: docs-github-pages

## Phase 1: Setup

### T-001: root `package.json` を新規作成する

`vitepress ^1.6.0` devDependency と `docs:dev` / `docs:build` / `docs:preview` npm scripts を含む root `package.json` を作成する。

**対象ファイル**: `package.json`（新規）
**関連**: D-002, FR-004

```
@mspec-delta 2026-05-18-082738-docs-github-pages/specs/docs-site/spec.md
Requirements implemented: FR-004
Change: docs-github-pages
```

---

### T-002: VitePress をインストールする

`npm install` を実行して VitePress をインストールする。

**コマンド**: `npm install`
**関連**: D-002, FR-004

---

### T-003: GitHub Pages ソース設定（手動前提条件）

GitHub リポジトリ Settings → Pages → Source を "GitHub Actions" に変更する。

**作業**: GitHub Web UI での手動操作（管理者権限が必要）
**関連**: D-005

---

### T-004: `.gitignore` に VitePress ビルド出力を追加する

`.gitignore` に `docs/.vitepress/dist` と `docs/.vitepress/cache` を追加する。

**対象ファイル**: `.gitignore`（修正または新規）
**関連**: checklist .gitignore 項目

---

## Phase 2: Foundational

### T-005: 画像アセットを移動する（FR-005）

`docs/images/logo.png` を `docs/public/images/logo.png` へ移動する。`docs/images/` ディレクトリを削除する。

**操作**:
```bash
mkdir -p docs/public/images
mv docs/images/logo.png docs/public/images/logo.png
rmdir docs/images
```

**確認**: `docs/` 配下の全 `.md` ファイルに `docs/images/` または `images/logo` への参照がないことを grep で確認する。

**対象ファイル**: `docs/images/logo.png`（移動）→ `docs/public/images/logo.png`
**関連**: D-004, FR-005

```
@mspec-delta 2026-05-18-082738-docs-github-pages/specs/docs-site/spec.md
Requirements implemented: FR-005
Change: docs-github-pages
```

---

## Phase 3: User Story（E2E 先行）

### T-006: [E2E] `docs/.vitepress/dist/` に 11 HTML ファイルが生成されること（FR-001）

**シナリオ**: docs/ 配下の全ファイルがサイトに反映される

- GIVEN `docs/.vitepress/config.ts` が存在し VitePress がインストールされている
- WHEN `npm run docs:build`（`vitepress build docs`）を実行する
- THEN `docs/.vitepress/dist/` に 11 ファイル分の HTML が生成され、各カテゴリ（tutorials / how-to / explanation / reference）のページが存在する

**検証コマンド**:
```bash
npm run docs:build
find docs/.vitepress/dist -name "*.html" | wc -l  # 11以上
ls docs/.vitepress/dist/tutorials/
ls docs/.vitepress/dist/how-to/
ls docs/.vitepress/dist/explanation/
ls docs/.vitepress/dist/reference/
```

**関連**: FR-001

```
@mspec-delta 2026-05-18-082738-docs-github-pages/specs/docs-site/spec.md
Requirements implemented: FR-001
Change: docs-github-pages
```

---

### T-007: [Impl] `docs/.vitepress/config.ts` を作成する（FR-001, FR-003, FR-005）

VitePress 設定ファイルを作成する。`base: '/mspec/'`、Diátaxis 4タブナビゲーション、ローカル検索、logo 設定を含む。

**対象ファイル**: `docs/.vitepress/config.ts`（新規）

**設定内容**:
- `base: '/mspec/'`
- `themeConfig.nav`: tutorials（`/tutorials/getting-started`）/ how-to（`/how-to/customize-workflow`）/ explanation（`/explanation/why-mspec`）/ reference（`/reference/cli`）の4タブ
- `themeConfig.sidebar`: 各カテゴリの全実ファイルを列挙
- `themeConfig.search: { provider: 'local' }`
- `themeConfig.logo: '/images/logo.png'`

**関連**: D-001, FR-001, FR-003, FR-005

```
@mspec-delta 2026-05-18-082738-docs-github-pages/specs/docs-site/spec.md
Requirements implemented: FR-001, FR-003, FR-005
Change: docs-github-pages
```

---

### T-008: [E2E] ローカルサーバーが `localhost:5173/mspec/` で起動すること（FR-004）

**シナリオ**: ローカルでサイトをプレビューできる

- GIVEN `package.json` の `docs:dev` スクリプトが定義されている
- WHEN `npm run docs:dev` を実行する
- THEN ローカルサーバーが起動し `http://localhost:5173/mspec/` でサイトが閲覧できる

**検証**: `npm run docs:dev` を実行し、出力に `localhost:5173` が含まれること（Ctrl+C で終了）

**関連**: FR-004

```
@mspec-delta 2026-05-18-082738-docs-github-pages/specs/docs-site/spec.md
Requirements implemented: FR-004
Change: docs-github-pages
```

---

### T-009: [E2E] ビルド後にサイト内検索と4タブナビが機能すること（FR-003）

**シナリオ**: ユーザーがキーワードで検索できる / Diátaxis 4カテゴリのナビゲーションが機能する

- GIVEN `vitepress build docs` が成功している
- WHEN `npm run docs:preview` でプレビューサーバーを起動する
- THEN 検索ボックスが表示され、4カテゴリのナビゲーションタブが存在し、各リンクが正しいページへ遷移する

**検証**:
```bash
npm run docs:build
grep -r "search" docs/.vitepress/dist/assets/*.js | head -3  # search plugin bundle 確認
grep -c "customize-workflow" docs/.vitepress/dist/how-to/customize-workflow.html
```

**関連**: FR-003

```
@mspec-delta 2026-05-18-082738-docs-github-pages/specs/docs-site/spec.md
Requirements implemented: FR-003
Change: docs-github-pages
```

---

### T-010: [E2E] GitHub Actions ワークフローが正しい構造を持つこと（FR-002）

**シナリオ**: main への push でサイトが更新される

- GIVEN `.github/workflows/deploy-docs.yml` が存在する
- WHEN ファイルの構造を検査する
- THEN `on.push.branches: [main]`、`permissions.pages: write`、`permissions.id-token: write`、`actions/upload-pages-artifact@v3`、`actions/deploy-pages@v4` が全て含まれている

**検証コマンド**:
```bash
grep "branches: \[main\]" .github/workflows/deploy-docs.yml
grep "pages: write" .github/workflows/deploy-docs.yml
grep "id-token: write" .github/workflows/deploy-docs.yml
grep "upload-pages-artifact" .github/workflows/deploy-docs.yml
grep "deploy-pages@v4" .github/workflows/deploy-docs.yml
```

**関連**: FR-002

```
@mspec-delta 2026-05-18-082738-docs-github-pages/specs/docs-site/spec.md
Requirements implemented: FR-002
Change: docs-github-pages
```

---

### T-011: [Impl] `.github/workflows/deploy-docs.yml` を作成する（FR-002）

GitHub Actions ワークフローファイルを作成する。`on.push.branches: [main]` トリガー、`actions/upload-pages-artifact@v3` でビルド成果物をアップロード、`actions/deploy-pages@v4` でデプロイする2ジョブ構成。

**対象ファイル**: `.github/workflows/deploy-docs.yml`（新規）
**関連**: D-003, FR-002

```
@mspec-delta 2026-05-18-082738-docs-github-pages/specs/docs-site/spec.md
Requirements implemented: FR-002
Change: docs-github-pages
```

---

### T-012: [E2E] ビルド後にロゴ画像が dist/ に存在し 404 にならないこと（FR-005）

**シナリオ**: 画像参照が公開サイトで表示される

- GIVEN `docs/public/images/logo.png` が存在する
- WHEN `npm run docs:build` を実行する
- THEN `docs/.vitepress/dist/images/logo.png` が生成される

**検証コマンド**:
```bash
npm run docs:build
ls docs/.vitepress/dist/images/logo.png
grep -r "images/logo" docs/.vitepress/dist/index.html  # ロゴ参照の確認
```

**関連**: FR-005

```
@mspec-delta 2026-05-18-082738-docs-github-pages/specs/docs-site/spec.md
Requirements implemented: FR-005
Change: docs-github-pages
```

---

## Phase 4: Polish

### T-013: アンカーブロックを実装ファイルに付与する（D-006）

`docs/.vitepress/config.ts` と `.github/workflows/deploy-docs.yml` に `@mspec-delta` アンカーブロックを付与する。`package.json` は JSON のため除外。

**config.ts に追加するコメント**（ファイル先頭）:
```typescript
// @mspec-delta 2026-05-18-082738-docs-github-pages/specs/docs-site/spec.md
// Requirements implemented: FR-001, FR-003, FR-004, FR-005
// Change: docs-github-pages
```

**deploy-docs.yml に追加するコメント**（ファイル先頭）:
```yaml
# @mspec-delta 2026-05-18-082738-docs-github-pages/specs/docs-site/spec.md
# Requirements implemented: FR-002
# Change: docs-github-pages
```

**`package.json` の `.mspecignore` 除外**: `.mspecignore` ファイルに `*.json` を追加する（JSON はコメント構文を持たないため）。

**関連**: D-006, 原則 IV（双方向アンカー）

---

### T-014: `mspec anchor check` を実行してエラーゼロを確認する

`mspec anchor check` を実行し、アンカー欠落のエラーがないことを確認する。

**コマンド**: `mspec anchor check --change 2026-05-18-082738-docs-github-pages`
**期待結果**: エラーゼロ（warning は許容）

---

### T-015: `npm ci && npm run docs:build` でエンドツーエンドのビルドが成功することを確認する

クリーンインストール後にビルドが成功することを最終確認する。`packages/cli` の既存テストも通過することを確認する。

**コマンド**:
```bash
npm ci
npm run docs:build
# packages/cli のテスト実行
cd packages/cli && npm test
```

**期待結果**: 全コマンドが終了コード 0 で完了

---

### T-016: README にドキュメントサイト URL を追記する

`README.md` に公開サイト URL `https://tubone24.github.io/mspec/` を追記する。

**対象ファイル**: `README.md`（修正）
**関連**: proposal の "公開後の URL を README に記載するタイミング"（実装フェーズ末尾）

---

## Constitution Check

> Step: tasks | Constitution Version: 1.0.0

| Principle | Phase 0 | Notes |
|-----------|---------|-------|
| I. ステップ独立性 | ✅ | tasks.md は `changes/` 内に閉じた成果物。mspec のコアステップを変更しない |
| II. 決定論的マージ | ✅ | tasks.md 自体は SoT spec に影響しない。アンカーブロックは implement ステップで付与される |
| III. 質問駆動の要件確定 | ✅ | 全 Open Choices が design ステップで解決済み。tasks に未決定事項なし |
| IV. 双方向アンカー | ✅ | T-013 でアンカーブロック付与を明示タスク化。全 FR-001〜FR-005 が最低1つのアンカーブロックに対応 |
| V. 強制ステップと拡張ステップの分離 | ✅ | tasks は強制ステップ。本変更のスコープ（新規ファイル追加のみ）と一致 |

### Complexity Tracking

None
