---
doc_type: Reference
---

# Research: reading-mode-themes

## Decisions

| 論点 | 採用案 | 代替案 | 根拠 |
|------|--------|--------|------|
| シンタックスハイライトライブラリ | `shiki` (コア) + `react-shiki` ラッパー | `react-syntax-highlighter`, `prism-react-renderer` | react-shiki は Shiki v1 の非同期ライフサイクルを React フックに隠蔽し、Vite の dynamic import でオンデマンドロードが可能。バンドル管理がしやすく、2026-04 時点でアクティブメンテナンス中 |
| Shikiバンドル戦略 | `shiki/core` (fine-grained bundle) で使用言語・テーマのみ import | `shiki` フル (~1.2MB gzip) | ArtifactViewer の `code` renderer に限定使用するため、フルバンドルは過剰 |
| Shiki テーマ | `github-light`（ライト/セピア/グリーン）/ `github-dark`（ダーク） | min-light / one-dark-pro | コントラストが穏やかで読書用途に適合。ユーザー確定 |
| テーマ切り替えの CSS 戦略 | 全体 CSS カスタムプロパティ移行。`dark:` クラスを全廃し `[data-theme="..."]` + CSS 変数で統一管理 | `dark:` クラスを維持して最小変更 | ユーザー選択。クリーンな設計を優先。全コンポーネントの `dark:` クラスを `[data-theme="dark"]:` または CSS 変数参照に書き換える |
| Tailwind darkMode 設定 | `darkMode: ['selector', '[data-theme="dark"]']` | `darkMode: 'class'` (現状) | 全体 CSS 変数移行に伴い変更が必要 |
| テーマ永続化 | Zustand の `persist` ミドルウェア（`mspec-ui-store` 既存キーを拡張） | 独立した `localStorage` 直接操作 | すでに `useChangesStore` が `persist` を利用。`type Theme` 型の拡張で最小コスト実装が可能 |
| Light テーマカラー | bg `#FFFFFF` / fg `#1a1a1a` | 変更なし (既存) | 既存 `bg-white` / `text-gray-900` と同等 |
| Sepia テーマカラー | bg `#FBF0D9` / fg `#5F4B32` / accent `#7A5C3F` | 他のウォームベージュ系 | 複数の独立したソースで Kindle Sepia と確認済み |
| Green テーマカラー | bg `#C5E8C5` / fg `#1A3D1A` (暫定) | `#D4E9D4`, `#E0EAD0` | 公式 hex 値未確認のため暫定。Visual Prototype ステップで確認 |
| Dark テーマカラー | bg `#1C1C1E` / fg `#E5E5EA` | `#111827` (gray-900) | iOS Kindle ダークに近い暗めのウォームグレー |
| コードコメントの視覚的減光 | Shiki `colorReplacements` でコメントトークン色を opacity 0.45 相当の色に置換 | CSS ユニバーサルセレクタでの事後書き換え | Shiki は `<span style="color:...">` を出力するため、`colorReplacements` での差し替えが最もクリーン |
| Markdown HTMLコメント (`<!-- -->`) の減光 | `rehype` パイプラインでコメントノードを `<span class="md-comment">` に変換し CSS で薄い色を適用 | 正規表現での事後処理 | react-markdown の rehype transformer として追加するのが Markdown パイプラインの構成に合致 |
| Markdown HTMLコメント減光スコープ | 全 Markdown ドキュメント | spec.md のみ | ユーザー選択。ArtifactViewer で表示する全 Markdown に一律適用 |
| テーマ選択 UI | Pill ボタン群（4択横並び） | select ドロップダウン / アイコンボタン | ユーザー選択。現在の 2 択トグル UI の自然な拡張 |
| 本文フォント | Visual Prototype ステップで確定 | — | 候補: Literata / Source Serif 4 / Inter / Noto Serif JP |
| フォント読み込み方法 | Google Fonts の `<link>` タグ (`index.html`) | `@font-face` + ローカルホスト配信 | 現在 `index.css` にフォントロード機構なし。変更差分最小化のため Google Fonts が適切 |

### フォント候補 pros/cons

| フォント | pros | cons |
|---------|------|-------|
| **Literata** | Google Play Books 採用。デジタル長文読書用設計。温かみがある | 日本語文字未サポート |
| **Source Serif 4** | 高品質な移行期セリフ。可変フォント対応 | 日本語未サポート |
| **Inter** | 画面可読性高い。Tailwind との親和性良好 | セリフではないため長文では疲労感の可能性あり |
| **Noto Serif JP** | 日本語対応。CJK 統合 | ファイルサイズ大 (500KB+) |

---

## Web References

- [Installation & Usage | Shiki](https://shiki.matsu.io/guide/install) — v1 以降は言語・テーマをオンデマンドで ESM lazy-load する設計
- [Bundles | Shiki](https://shiki.matsu.io/guide/bundles) — `core` エントリポイントで使用言語・テーマを明示 import しバンドルサイズを最小化
- [Light/Dark Dual Themes | Shiki](https://shiki.style/guide/dual-themes) — CSS カスタムプロパティによる複数テーマの単一パスレンダリング手法
- [Theme Colors Manipulation | Shiki](https://shiki.matsu.io/guide/theme-colors) — `colorReplacements` オプションで特定トークン色を置換する公式 API
- [react-shiki (npm)](https://www.npmjs.com/package/react-shiki) — React 向け Shiki ラッパー。言語/テーマの動的 import・非同期ライフサイクル管理を自動化。2026-04 アクティブ
- [GitHub - AVGVSTVS96/react-shiki](https://github.com/avgvstvs96/react-shiki) — `useShikiHighlighter` フック実装参照
- [Kindle Sepia Color Code | greatnote.com](https://www.greatnote.com/2018/03/kindle-sepia-color-code.html) — Kindle Sepia: bg `#FBF0D9` / text `#5F4B32` の記録
- [Kindle Sepia Color Code | Medium](https://medium.com/greatnote/kindle-sepia-color-code-1fed14b1a5ef) — 上記の独立確認ソース
- [Do you want to use Amazon Kindle app's green background? | TeleRead](https://www.teleread.com/want-use-amazon-kindle-apps-green-background/index.html) — Kindle green テーマの存在確認。公式 hex 値未確認
- [Inter - Google Fonts](https://fonts.google.com/specimen/Inter) — 画面向け sans-serif
- [Best Fonts for Reading: 10 Tested and Ranked | Nook](https://getnook.net/blog/best-reading-fonts-nobody-talks-about) — Literata が長文デジタル読書に最適との評価
- [Tailwind CSS Dark Mode (v3 docs)](https://v3.tailwindcss.com/docs/dark-mode) — `darkMode: 'class'` の仕様。4テーマ展開には `selector` 戦略が必要
- [Simple dark mode support with Tailwind & CSS variables | invertase.io](https://invertase.io/blog/tailwind-dark-mode) — Tailwind + CSS カスタムプロパティを組み合わせたマルチテーマ実装例

---

## Codebase Findings

- `packages/web-ui/src/store/useChangesStore.ts:8` — `type Theme = 'light' | 'dark'` の 2 値型。`'light' | 'sepia' | 'green' | 'dark'` に拡張し `toggleTheme` を `setTheme` ベースのセレクター UI に置き換える
- `packages/web-ui/src/store/useChangesStore.ts:16-27` — `persist` ミドルウェア (`mspec-ui-store` キー) が既存。テーマ永続化の追加コストはほぼゼロ
- `packages/web-ui/src/components/ThemeToggle.tsx:14-19` — `classList.add('dark')` / `classList.remove('dark')` の 2 値ロジック。`document.documentElement.setAttribute('data-theme', theme)` に変更し Pill ボタン群 UI に刷新
- `packages/web-ui/tailwind.config.ts:7` — `darkMode: 'class'` → `['selector', '[data-theme="dark"]']` に変更が必要
- `packages/web-ui/src/index.css:1-3` — Tailwind ディレクティブのみ。CSS カスタムプロパティ定義・フォント読み込み・Shiki スタイル上書き・`.md-comment` 定義を**新規追加**
- `packages/web-ui/src/components/ArtifactViewer.tsx:59-67` — `code` renderer の非 mermaid / 非 spec パスが `<code className={className}>{children}</code>` を素通しで返す。**Shiki インテグレーションポイント**
- `packages/web-ui/src/components/ArtifactViewer.tsx:43` — `prose dark:prose-invert` クラス使用。全体 CSS 変数移行後は Tailwind Prose の `darkMode` 設定変更に伴い対応が必要
- `packages/web-ui/src/components/GherkinHighlight.tsx:1-85` — 既存のシンタックスハイライトは Gherkin / EARS キーワードの正規表現ベース。汎用コードブロックへの Shiki 適用とは競合しない
- `packages/web-ui/src/pages/Dashboard.tsx:32`, `ArtifactPreview.tsx:17` — `dark:bg-gray-900`・`dark:text-gray-100` 等の `dark:` クラスが多数散在。全体 CSS 変数移行で対応
- `packages/web-ui/package.json` — `shiki` / `react-shiki` ともに**未インストール**。新規追加が必要
- フォント読み込み機構: **存在しない**。`index.html` に `<link>` タグを追加

---

## Open Choices

> ✅ 全ての Open Choices がユーザー回答により解決済み（Green テーマのカラーとフォントは Visual Prototype ステップで確認）

| 項目 | 解決内容 |
|------|----------|
| `dark:` クラスの移行範囲 | 全体 CSS 変数移行（ユーザー確定） |
| Shiki テーマ選択 | `github-light` / `github-dark`（ユーザー確定） |
| Markdown HTMLコメント減光スコープ | 全 Markdown（ユーザー確定） |
| テーマ選択 UI | Pill ボタン群（横並び）（ユーザー確定） |
| Green テーマの正確な配色 | 暫定 bg `#C5E8C5` / fg `#1A3D1A`。Visual Prototype で確認 |
| 本文フォント最終選択 | Visual Prototype ステップで確定 |

---

## Constitution Check

| Principle | Phase 0 | Phase 1 |
|-----------|---------|---------|
| I. ステップ独立性 | ✅ research は proposal.md と spec.md のみを入力とし、後続ステップへの直接依存なし | — |
| II. 決定論的マージ | ✅ 全 Open Choices が解決済み。未解決事項は Visual Prototype ステップに明示的に委譲 | — |
| III. 質問駆動の要件確定 | ✅ 4問のユーザー確認（CSS移行範囲・Shikiテーマ・コメントスコープ・選択UI）を実施 | — |
| IV. 双方向アンカー | ✅ Codebase Findings でファイル・行番号レベルの変更ポイントを特定 | — |
| V. 強制ステップと拡張ステップの分離 | ✅ フォントとGreenカラーは Visual Prototype（拡張ステップ）に委譲 | — |
| VI. Security by Default | ✅ 外部 CDN（Google Fonts）の使用は CSP 設定の確認が推奨。ただし既存の index.html に CSP 設定なし。今回スコープ内では変更なし | — |
