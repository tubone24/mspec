---
doc_type: Reference
---

<!-- @mspec-delta 2026-05-18-082738-docs-github-pages/specs/docs-site/spec.md -->
<!-- Requirements implemented: FR-001, FR-002, FR-003, FR-004, FR-005 -->
<!-- Change: docs-github-pages -->

# Checklist: docs-github-pages

## Delta Spec Coverage

| FR | Title | Implementation Task | Verification |
|----|-------|---------------------|--------------|
| FR-001 | Markdown ドキュメントの静的サイト公開 | `docs/.vitepress/config.ts` に `base: '/mspec/'` と srcDir 設定を記述し、`vitepress build docs` がすべての `.md` を HTML に変換する | `docs/.vitepress/dist/` に全ページの HTML が生成されること |
| FR-002 | main ブランチ push による自動デプロイ | `.github/workflows/deploy-docs.yml` を新規作成し、`on.push.branches: [main]` トリガーと `actions/deploy-pages@v4` によるデプロイジョブを定義する | main への push 後に GitHub Actions が成功し GitHub Pages が更新されること |
| FR-003 | サイト内検索と Diátaxis ナビゲーション | `themeConfig.search: { provider: 'local' }` と `themeConfig.nav` に tutorials / how-to / explanation / reference の4タブを設定する | ビルド後サイトで検索ボックスが機能し、4カテゴリのナビリンクが正しいページへ遷移すること |
| FR-004 | ローカルプレビューコマンド | `package.json` に `docs:dev`, `docs:build`, `docs:preview` の npm scripts と `vitepress ^1.6.0` devDependency を追加する | `npm run docs:dev` でローカルサーバーが起動しブラウザでプレビューできること |
| FR-005 | 既存リンク構造の維持 | `docs/images/logo.png` を `docs/public/images/logo.png` へ移動する（`docs/` 配下の Markdown ファイルに画像参照なし、Markdown 本文変更不要） | ビルド後の HTML で内部リンクが切れず、ロゴ画像が 404 にならないこと |

## Source-of-Truth Regression Risk

| Spec File | Risk | Reason |
|-----------|------|--------|
| `specs/cli-anchor/spec.md` | Medium | 新規追加する `package.json` は JSON 形式のため `@mspec-delta` 3行アンカーブロックを記述できない。アンカースキャナ（FR-001〜FR-017）が `.json` ファイルをスキャン対象に含める場合、`package.json` に対してアンカー欠落の誤検知が発生しうる。スキャナの対象ファイル拡張子フィルターを事前に確認し、必要なら `.json` を除外リストに追加すること。 |
| `specs/cli-anchor/spec.md` | Low | `.github/workflows/deploy-docs.yml`（YAML）と `docs/.vitepress/config.ts`（TypeScript）は `#` および `/** */` コメントを使用できるため 3行アンカーブロックの配置は技術的に可能。ただし deploy-docs.yml はインフラファイルであり、mspec のアンカースキャナが `.yml` を走査対象とする場合はアンカー欠落として報告される可能性がある。 |
| `specs/docs-site/spec.md` | Low | 現状 SoT spec は空テンプレート（Purpose と Requirements が未記入）。このチェンジが archive される際、FR-001〜FR-005 が正しくマージされることを確認する。競合リスクは低い。 |
| `specs/cli-workflow-engine/spec.md` | Low | このチェンジは workflow.yaml や CLI には触れないが、ルート `package.json` を新規作成することで `npm ci` が mspec パッケージのビルドにも影響する可能性がある。`packages/cli` の既存ビルドが root `package.json` 追加後も壊れないことを確認すること。 |

## Implementation Checklist

### package.json（ルート新規作成）

- [x] `package.json` に `"vitepress": "^1.6.0"` devDependency が含まれる <!-- verify: fr-004 -->
- [x] `package.json` に `docs:dev`, `docs:build`, `docs:preview` の 3 つの npm scripts が定義される <!-- verify: fr-004 -->
- [x] `npm ci && npm run docs:build` が終了コード 0 で完了する <!-- verify: fr-001 -->
- [x] `packages/cli` の既存ビルド・テストがルート `package.json` 追加後も通過する <!-- verify: human -->

### docs/.vitepress/config.ts（新規作成）

- [x] `base: '/mspec/'` が設定されている <!-- verify: fr-001 -->
- [x] `themeConfig.nav` に tutorials / how-to / explanation / reference の 4 タブが定義される <!-- verify: fr-003 -->
- [x] `themeConfig.search: { provider: 'local' }` が設定されている <!-- verify: fr-003 -->
- [x] `themeConfig.logo: '/images/logo.png'` が設定されている <!-- verify: fr-005 -->
- [x] `docs/.vitepress/dist/` に `docs/` 配下の全 `.md` ファイル（11 ファイル）に対応する HTML が生成される <!-- verify: fr-001 -->
- [x] サイドバー設定（`/tutorials/`, `/how-to/`, `/explanation/`, `/reference/`）が VitePress ビルドによりすべてのページを到達可能にする（FR-001「全マークダウンファイルが HTML に出力される」を満たすことを確認） <!-- verify: fr-001 -->

### .github/workflows/deploy-docs.yml（新規作成）

- [x] `on.push.branches: [main]` が設定されている <!-- verify: fr-002 -->
- [x] `permissions: { pages: write, id-token: write }` が設定されている <!-- verify: fr-002 -->
- [x] `actions/upload-pages-artifact@v3` の `path` が `docs/.vitepress/dist` を指す <!-- verify: fr-002 -->
- [x] `actions/deploy-pages@v4` が deploy ジョブで使用されている <!-- verify: fr-002 -->
- [x] GitHub Pages の Source が "GitHub Actions" に設定されている（D-005 手動前提条件） <!-- verify: human -->

### 画像アセット移動（FR-005）

- [x] `docs/public/images/logo.png` が存在し `docs/images/` ディレクトリが削除されている <!-- verify: fr-005 -->
- [x] `docs/` 配下の全 `.md` ファイルに `docs/images/` または `images/logo` への参照がないことをグレップで確認する（Markdown 本文変更は不要のはずだが念のため確認） <!-- verify: fr-005 -->
- [x] ビルド後 `docs/.vitepress/dist/images/logo.png` が存在し、生成 HTML 内のロゴ参照が 404 を返さない <!-- verify: fr-005 -->

### .gitignore

- [x] `.gitignore` に `docs/.vitepress/dist` と `docs/.vitepress/cache` が追加されている <!-- verify: fr-001 -->

### アンカー整合性（D-006 方針に従う）

- [x] `docs/.vitepress/config.ts` に `// @mspec-delta ...` 形式の3行アンカーブロックが付与されている <!-- verify: human -->
- [x] `.github/workflows/deploy-docs.yml` に `# @mspec-delta ...` 形式の3行アンカーブロックが付与されている（YAML コメント形式） <!-- verify: human -->
- [x] `package.json` が `.mspecignore` または CLI の `--ignore-ext` 設定でアンカースキャン対象外になっている（JSON はコメント不可） <!-- verify: human -->
- [x] `mspec anchor check` が新規ファイル追加後にエラーゼロで通過する <!-- verify: human -->

## Constitution Check Items

- [x] 原則 I（ステップ独立性）: このチェンジの成果物（`package.json`, `config.ts`, `deploy-docs.yml`）は `changes/` スコープ外のファイルに新たな依存を追加しない。`docs/README.md` の 1 行変更は後続ステップの会話文脈に依存しない <!-- verify: human -->
- [ ] 原則 II（決定論的マージ）: Delta Spec（FR-001〜FR-005）から SoT `specs/docs-site/spec.md` へのマージが `mspec archive` の CLI パーサーで実行され、同一入力で再現できる <!-- verify: human -->
- [x] 原則 III（質問駆動の要件確定）: research / design の成果物に Open Choices の解決根拠が記録されており（VitePress 選択理由、GitHub Actions 設定根拠）、後から検証可能な状態にある <!-- verify: human -->
- [x] 原則 IV（双方向アンカー）: 実装ファイル（最低 `config.ts`）に `@mspec-delta` アンカーが付与され、`mspec anchor check` で全 FR が最低 1 つのアンカーブロックに紐付くことが確認される <!-- verify: human -->
- [x] 原則 V（強制ステップと拡張ステップの分離）: このチェンジは `workflow.yaml` の強制ステップ定義（`new`, `proposal`, `delta`, `tasks`, `implement`, `archive`）を変更しない <!-- verify: human -->
