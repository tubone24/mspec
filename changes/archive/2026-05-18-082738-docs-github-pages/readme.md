---
doc_type: Tutorial
---

<!-- @mspec-delta 2026-05-18-044538-revise-artifact-taxonomy/specs/artifact-taxonomy/spec.md -->
<!-- Requirements implemented: FR-005 -->
<!-- Change: revise-artifact-taxonomy -->

# docs-github-pages

> Status: new
> Created: 2026-05-18

## Request

`docs/` 配下のマークダウン（mspec のドキュメント）を GitHub Pages として公開し、見やすい Web サイトとして閲覧できるようにする。GitHub への push で自動的にビルド・デプロイされる構成を、最適な静的サイトジェネレータ（MkDocs / Docusaurus / VitePress 等）の調査を踏まえて構築する。

## Artifacts

- [x] proposal.md
- [x] specs/docs-site/spec.md (Delta Spec)
- [x] research.md
- [x] design.md / design-rationale.md / architecture-overview.md
- [x] quickstart.md
- [x] checklist.md
- [x] tasks.md

## Skipped Steps

<!-- `mspec skip <step-id> --reason "..."` 実行時に追記される -->
<!-- 例: - research: typo 修正のみのため省略 (skipped at 2026-05-14T10:30:00Z) -->

## Summary (Lessons / Next Steps)

### Lessons

- **VitePress はゼロランタイム追加で導入できた**: Node.js が既存依存のプロジェクトでは MkDocs（Python 必要）より VitePress が優位。`npm install -D vitepress` の1コマンドで完結した。
- **self-review の2パス戦略が効いた**: 1st pass で4つの WARN（phantom 画像参照、404 サイドバー、ファイル数カウント不整合、アンカー戦略未定）を検出・修正し、2nd pass で PASS を確認。実装フェーズに入る前に修正できたため手戻りゼロ。
- **`docs/images/` は既存 Markdown に参照されていなかった**: design 段階で仮定していた "README.md の画像参照更新" が不要だった。self-review による実ファイル検証が設計の仮定を正した。
- **`mspec done <step-id>` が `produces:[]` ステップ進行の鍵**: self-review は成果物ファイルを生成しないため `mspec continue` が自動で次ステップへ進まない。このコマンドを事前に把握しておくべきだった。
- **`cd` による作業ディレクトリ変更に注意**: `packages/cli/` に `cd` した後に `mspec anchor check` を実行するとプロジェクトルートから離れ、全アンカーが `change_dir not found` エラーになる。絶対パス指定または明示的な `cd` 復帰が必要。

### Next Steps

- **カテゴリランディングページの作成**: `how-to/`・`explanation/`・`reference/` に `index.md` がないため直接ファイルリンクで回避中。将来的にカテゴリ概要ページ（`index.md`）を追加することで UX が向上する。
- **サイドバーの自動生成**: ドキュメント数が増えた際は `vitepress-sidebar` プラグインを導入して `config.ts` の手動管理を解消する。
- **デプロイ確認**: main への push 後に `https://tubone24.github.io/mspec/` が正常にアクセスできることを確認し、GitHub Actions ワークフローが成功することを検証する（FR-002 最終確認）。
