---
doc_type: Explanation
---

<!-- See also: ./design.md -->

# Design Rationale: docs-github-pages

## Context

mspec は `docs/` 配下に Diátaxis フレームワークに従ったドキュメントを整備しているが、これまで GitHub の Web UI か clone しなければ閲覧できなかった。採用促進のためには検索・ナビゲーション付きの Web サイトとして公開する必要があった。

プロジェクトは Node.js/TypeScript モノレポ（`packages/cli`）であり、貢献者は既に Node.js ランタイムを持つ。一方、既存の root `package.json` は存在しない。「セットアップ容易さ最優先」という Proposal の制約のもと、追加ランタイムを不要とし、既存コンテンツを無変更で公開できる SSG を選ぶ必要があった。

GitHub Pages は運用コストがゼロに近く、GitHub Actions との組み合わせで自動デプロイが実現できる。パブリックリポジトリであれば無料で使用できるため、mspec のような OSS プロジェクトに最適である。

## Decisions

### VitePress を SSG として採用した理由

VitePress を選んだ最大の理由は「プロジェクトに既存の Node.js ランタイムを流用できる」ことである。MkDocs を使うには Python + pip が必要で、貢献者のセットアップコストが増加する。VitePress は `npm install -D vitepress` の1コマンドで導入でき、`npx vitepress init` でインタラクティブに初期設定できる。

また、MkDocs Material は 2025-11-11 に最終機能リリース（v9.7.0）を迎えてメンテナンスモードに移行した。新規プロジェクトにメンテナンスモードの SSG を採用するリスクは回避すべきと判断した。

VitePress はビルトインのローカル検索（`search: { provider: 'local' }`）を持ち、ゼロコンフィグで動作する。Diátaxis の4カテゴリに対応するナビゲーションタブの設定も `themeConfig.nav` の配列で数行で完結する。

### `actions/deploy-pages@v4` を採用した理由

GitHub 公式の `actions/deploy-pages@v4` は OIDC トークンを使用するため、Personal Access Token（PAT）やデプロイキーの管理が不要である。セキュリティ的に優れており、VitePress 公式ドキュメントも現在はこちらを推奨している。

コミュニティ製の `peaceiris/actions-gh-pages` と比べて公式サポートがあり、GitHub 側の Pages 仕様変更に追従しやすい。

### `docs/public/images/` への移動を選択した理由

VitePress は `docs/public/` 配下のファイルをビルド時にサイトルートに配置する。`docs/images/` をそのまま残す場合は VitePress の `assetsDir` 設定を調整する必要があり、設定の複雑度が上がる。

`docs/public/images/` に移動することで VitePress の標準イディオムに準拠し、`/images/logo.png` というシンプルな URL でアクセスできる。変更が必要な Markdown 参照は `docs/README.md` の1箇所のみであり、影響範囲は最小限である。

### root `package.json` を新規作成する理由

現在のリポジトリには root `package.json` が存在しない（`packages/cli/package.json` のみ）。VitePress の npm scripts（`docs:dev`、`docs:build`、`docs:preview`）を定義するために root レベルの `package.json` が必要である。

`packages/cli/package.json` に追加する案も検討したが、docs サイトの依存関係を CLI ツールの依存関係と混在させることは関心の分離に反する。root `package.json` をドキュメントサイト専用として作成する方が整合性が高い。

## Alternatives Considered

- **MkDocs Material**: Python ランタイム追加が必要。メンテナンスモード移行済み（2025-11-11）。→ 却下
- **Docusaurus**: React を内包する重量 SSG。mspec のドキュメントサイトのスケールには過剰。セットアップが VitePress より複雑。→ 却下
- **Zensical（squidfunk の新 SSG）**: MkDocs Material の後継候補だが 2025 時点では安定版未リリース。→ 却下
- **`peaceiris/actions-gh-pages`**: コミュニティ製アクション。動作するが公式の `actions/deploy-pages` の方がメンテナンス持続性が高い。→ 代替として残す（参考）
- **`docs/images/` を assetsDir で維持**: VitePress の非標準設定が必要で設定が複雑になる。画像参照の変更1箇所で済む移動の方がシンプル。→ 却下
- **`docs/README.md` を `index.md` にリネーム**: ユーザー確認で「そのまま維持」を選択。VitePress は README.md をインデックスとして認識するため機能的に問題なし。→ 却下

## Trade-offs

- **root `package.json` の追加**: モノレポの root に `package.json` を追加することで、将来の workspace 設定と干渉する可能性がある。ただし現時点では workspace 設定は `packages/cli` のみに閉じており、リスクは低い
- **`docs/public/images/` への移動**: `docs/images/` の慣れ親しんだパスが変わるが、変更は1ファイル（`docs/README.md`）の1箇所のみ
- **全 main push でのトリガー**: docs と無関係なコードの push でもビルドが走るが、VitePress のビルドは高速（数十秒程度）であり運用上の問題は小さい
- **VitePress の設定複雑度**: 現状の4カテゴリ構成では sidebar を手動で管理する必要がある。ファイルが増えた場合は自動サイドバー生成プラグインの導入が必要になる（将来課題）

## Rejected Options

- **カスタムドメイン**: proposal の Non-Goal として明示的に除外
- **`docs/README.md` → `index.md` リネーム**: ユーザーが「そのまま維持」を選択。VitePress の互換性で問題なし
- **`docs/**` 変更時のみトリガー**: ユーザーが「全 main push」を選択。シンプルさを優先
- **GitHub Pages ブランチ方式（`gh-pages` ブランチ）**: `actions/deploy-pages` の採用により不要。管理すべきブランチが減る

## Constitution Check

> Step: design | Constitution Version: 1.0.0

### Phase 0

| Principle | Phase 0 | Notes |
|-----------|---------|-------|
| I. ステップ独立性 | ✅ | design-rationale.md はデザインドキュメントとして独立。mspec コアに干渉なし |
| II. 決定論的マージ | ✅ | 新規ファイル作成のみ |
| III. 質問駆動の要件確定 | ✅ | 全 Open Choices がユーザー回答により解決済み |
| IV. 双方向アンカー | ✅ | design.md の各 Decision と相互参照を設定 |
| V. 強制ステップと拡張ステップの分離 | ✅ | design は必須ステップ |

### Phase 1

| Principle | Phase 1 | Notes |
|-----------|---------|-------|
| I. ステップ独立性 | ✅ | Explanation ドキュメントとして設計根拠のみを記述 |
| II. 決定論的マージ | ✅ | 既存ファイルへの変更なし |
| III. 質問駆動の要件確定 | ✅ | Rejected Options にユーザー判断の経緯を記録 |
| IV. 双方向アンカー | ✅ | design.md との相互参照がコメントで設定済み |
| V. 強制ステップと拡張ステップの分離 | ✅ | design-rationale.md の Explanation は proposal の設計判断を網羅 |

### Complexity Tracking

None
