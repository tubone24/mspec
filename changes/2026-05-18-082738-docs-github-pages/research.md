---
doc_type: Reference
---

# Research: docs-github-pages

## Decisions

| Decision | Choice | Alternatives | Rationale |
|----------|--------|--------------|-----------|
| SSG | **VitePress** | MkDocs Material (maintenance mode), Docusaurus (heavy React overhead) | mspec は Node.js/TypeScript プロジェクトのため、貢献者は既に Node をインストール済み。VitePress は `npm install -D vitepress` + `npx vitepress init` で即起動、新たなランタイム追加不要。MkDocs Material は 2025-11-11 にメンテナンスモード移行（9.7.0 が最終機能リリース）。Diátaxis 対応コミュニティテンプレートも存在する。 |
| GitHub Actions デプロイ方式 | **`actions/upload-pages-artifact` + `actions/deploy-pages@v4`** | `peaceiris/actions-gh-pages`（コミュニティ・レガシー） | GitHub 公式パス。OIDC トークン認証で PAT/デプロイキー不要。VitePress 公式ドキュメントも現在はこちらを推奨。 |
| GitHub Pages ソース設定 | **GitHub Actions**（モダン） | ブランチからデプロイ（`gh-pages` ブランチ） | `actions/deploy-pages` の動作に必須。独立した `gh-pages` ブランチ不要。リポジトリの Settings → Pages → Source で一度設定する。 |
| ベースパス | `/mspec/` サブパス | カスタムドメイン（Non-Goal） | Proposal でカスタムドメインは Non-Goal と明記。デフォルト `<user>.github.io/<repo>` を対象とする。VitePress では `base: '/<repo>/'` を `config.ts` に設定が必要。 |
| docs/ のルート設定 | `docs/` を VitePress `srcDir` に指定 | 別途 `docs-site/` ソースツリーを作成 | 既存マークダウンは全て `docs/` 配下にある。`srcDir: 'docs'` を指定するだけでコンテンツ移行ゼロ。 |
| 既存 `doc_type` フロントマター | そのまま維持（情報フィールドとして残す） | サイドバーフィルタリングに流用 | VitePress はカスタムフロントマターを自動ナビゲーションに使用しない。`doc_type` フィールドは有効な YAML のまま保持され、将来 Vue コンポーネントで活用可能。 |

## Web References

- [VitePress — Deploy to GitHub Pages](https://vitepress.dev/guide/deploy) — 公式ガイド：2ジョブの最小ワークフロー（build + deploy）、GitHub Actions ソース設定とサブパスの `base` 設定を解説
- [Code2Life/vitepress-diataxis-template](https://github.com/Code2Life/vitepress-diataxis-template) — VitePress 用 Diátaxis 4カテゴリテンプレート。tutorials/how-to/explanation/reference がナビタブに直接マッピングされる
- [actions/deploy-pages](https://github.com/actions/deploy-pages) — GitHub 公式アクション。OIDC 認証で推奨の Pages デプロイパス
- [peaceiris/actions-gh-pages](https://github.com/peaceiris/actions-gh-pages) — コミュニティアクション。単一ステップで `publish_dir` 指定。README では公式代替を参照するよう案内
- [Material for MkDocs — Maintenance Mode 情報](https://squidfunk.github.io/mkdocs-material/blog/2025/11/05/zensical/) — 9.7.0 が最終機能リリース（2025-11-11）、12ヶ月の重大バグ修正のみサポート
- [Documentation Generator Comparison 2025 — VitePress vs Docusaurus vs MkDocs](https://okidoki.dev/documentation-generator-comparison) — セットアップ容易さの比較。VitePress と MkDocs がシンプルさでトップ

## Codebase Findings

- `docs/README.md` — `doc_type: Reference` YAML フロントマターを持つ。全 11 マークダウンファイルが `doc_type:` を持ち統一されている。SSG 投入前の修正不要
- `docs/README.md:9-14` — ナビゲーションテーブルに相対 Markdown リンク（`tutorials/getting-started.md` 形式）が含まれる。VitePress は `.md` → `.html` を自動変換するため手動修正不要
- `docs/images/logo.png` — 単一の画像アセット。VitePress の `public/` または `srcDir` からの相対参照で解決する必要がある
- `docs/` ディレクトリ構造 — `tutorials/`（1ファイル）、`how-to/`（3ファイル）、`explanation/`（1ファイル）、`reference/`（5ファイル）、`images/`（PNG 1枚）、`README.md`。4タブナビに 1:1 マッピング可能。ネスト1段のみでシンプルな `config.ts` で対応できる
- `.github/` ディレクトリが存在しない — `.github/workflows/deploy-docs.yml` を新規追加できるクリーンな状態
- `packages/cli` — Node.js/TypeScript プロジェクト（vitest 使用）。Node ランタイムが既存依存関係として確認。MkDocs の Python ランタイムアドバンテージなし

## Open Choices（解決済み）

1. **`docs/images/` の扱い** → **A) `docs/public/images/` に移動**（VitePress 標準イディオム。マークダウン内の画像参照を1箇所更新）

2. **`docs/README.md` の扱い** → **A) `README.md` のまま維持**（VitePress がインデックスとして認識）

3. **ワークフローのトリガースコープ** → **A) `main` への全 push でトリガー**（シンプル設定）

4. **GitHub Pages リポジトリ設定（手動前提条件）**: Repository → Settings → Pages → Source を「GitHub Actions」に変更する一度きりの手動設定が必要。リポジトリの管理者権限が前提条件となる。

## Constitution Check

> Step: research | Constitution Version: 1.0.0

| Principle | Phase 0 | Notes |
|-----------|---------|-------|
| I. ステップ独立性 | ✅ | research ステップは research.md のみを生成。コードや spec ファイルは変更しない |
| II. 決定論的マージ | ✅ | このステップで spec コンテンツのマージは発生しない |
| III. 質問駆動の要件確定 | ✅ | Open Choices セクションで残る4つのユーザー判断事項を明示化 |
| IV. 双方向アンカー | ✅ | FR-NNN アンカーはこのステップでは作成しない。アンカー管理は implement ステップに委任 |
| V. 強制ステップと拡張ステップの分離 | ✅ | research はオプション/拡張ステップ。本変更で proposal に従い明示的に実行 |
