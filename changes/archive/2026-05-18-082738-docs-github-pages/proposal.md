---
doc_type: Explanation
---

# Proposal: docs/ を GitHub Pages として公開する

## Why

mspec は `docs/` 配下に Diátaxis フレームワーク（tutorials / how-to / explanation / reference）に従ったマークダウンドキュメントを保有している。現状はリポジトリを clone するか GitHub の web UI でしか閲覧できず、ナビゲーション・検索・見た目のいずれも開発者体験として最適ではない。

mspec の採用を広げるためには、ドキュメントを Web サイトとして手軽に閲覧できる状態にする必要がある。GitHub Pages はリポジトリと密結合で運用コストがゼロに近く、mspec のように単一リポジトリで完結するプロジェクトに最適である。

本変更は静的サイトジェネレータ（SSG）と GitHub Actions による自動デプロイを組み合わせ、main への push をトリガに最新ドキュメントが自動公開される構成を構築する。SSG の具体選定は research ステップで「セットアップ容易さ最優先」の基準で行う。

## Goals

- `docs/` 配下の既存マークダウン（Diátaxis 構造）を、追加加筆なく Web サイトとして公開できる
- main ブランチへの push をトリガに GitHub Actions が自動でビルド・GitHub Pages へデプロイする
- 公開サイトはサイト内検索と Diátaxis の 4 カテゴリナビゲーション（tutorials / how-to / explanation / reference）を備える
- 開発者がローカルでサイトをプレビューできるコマンドが提供される（SSG 標準機能で OK）
- 既存のリンク構造（相対パス・画像参照 `docs/images/`）が公開サイトでも壊れない

## Non-Goals

- カスタムドメインの設定（GitHub のデフォルト `<user>.github.io/<repo>` で運用する）
- 既存ドキュメント本文の加筆・修正（サイト公開インフラ整備のみに集中）
- 多言語対応 / i18n の実装（現状は英語版のみ。日本語版は将来課題）
- コメント欄・フィードバックウィジェット等のインタラクティブ要素
- 既存マークダウンの大規模リフォーマット（front matter 追加など最小限の調整は許容）

## Capabilities (touched)

- docs-site

## Open Questions

- SSG の最終選定（候補: MkDocs Material / Docusaurus / VitePress 等）→ research ステップで「セットアップ容易さ」を最優先基準として比較
- GitHub Actions ワークフローの実装詳細（Pages デプロイ用の公式 actions の選定）→ design ステップで決定
- `docs/README.md` のリンクテーブル等、既存マークダウンが SSG のナビゲーション設定とどう連携するか（front matter による doc_type が既にあるため流用余地あり）→ design ステップで設計
- 公開後の URL を README に記載するタイミング（実装フェーズ末尾を想定）

## Constitution Check

> Step: proposal | Constitution Version: 1.0.0

| Principle | Phase 0 | Phase 1 | Notes |
|-----------|---------|---------|-------|
| I. ステップ独立性 | ✅ | — | mspec ワークフロー本体のステップに変更なし。docs サイトはアーティファクトとして独立 |
| II. 決定論的マージ | ✅ | — | docs マージや SoT spec への影響なし。GitHub Pages 構築のみ |
| III. 質問駆動の要件確定 | ✅ | — | 5 問の clarifying questions で SSG 選定基準・デプロイ方式・機能・Non-Goal・完了指標を確定 |
| IV. 双方向アンカー | ✅ | — | 新規 capability `docs-site` に対する Delta Spec で FR-NNN アンカーを実装側に付与予定 |
| V. 強制ステップと拡張ステップの分離 | ✅ | — | research は SSG 選定のため有効化、design 必須、本変更はフルフローで進める |

### Complexity Tracking

None
