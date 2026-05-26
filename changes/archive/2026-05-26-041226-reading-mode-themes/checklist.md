---
doc_type: Reference
---

# Checklist: reading-mode-themes

## Delta Spec Coverage

### web-ui-themes

- [x] **FR-001** — ThemePicker UI が Light / Sepia / Green / Dark の 4 択を表示し、各ボタンが `data-testid` 付きで描画されることをシナリオ「テーマ一覧の表示」で検証する。 <!-- verify: fr-001 -->
- [x] **FR-002 (Sepia)** — セピアテーマ選択時に `--color-bg: #F5E6C8` 系（design では `#FBF0D9`）および `--color-fg` の暖色が body に適用されることをシナリオ「セピアテーマの適用」で検証する。 <!-- verify: fr-002 -->
- [x] **FR-002 (Green)** — グリーンテーマ選択時に `--color-bg: #C5E8C5`、`--color-fg: #1A3D1A` が適用されることをシナリオ「グリーンテーマの適用」で検証する。 <!-- verify: fr-002 -->
- [x] **FR-003** — ダークテーマ選択後にページを再読み込みしても `localStorage` の `mspec-ui-store` に `theme: 'dark'` が残り、ダークテーマが自動適用されることをシナリオ「ページ再読み込み後のテーマ復元」で検証する。 <!-- verify: fr-003 -->
- [ ] **FR-004** — Visual Prototype ステップで確定したフォントが `index.html` + `index.css` に反映され、本文テキスト全体に適用されることをシナリオ「フォント適用の確認」で検証する（フォント URL は後続 Visual Prototype ステップで確定する旨を tasks.md に記載すること）。 <!-- verify: fr-004 -->

### code-syntax-highlight

- [x] **FR-001 (JS highlight)** — ` ```javascript ` コードブロックが Shiki による色分け済み HTML として描画され、少なくとも 1 つの色付き span が生成されることをシナリオ「JavaScript コードブロックのハイライト」で検証する。 <!-- verify: fr-001 -->
- [x] **FR-001 (no-lang)** — 言語指定なしコードブロックがエラーを投げずにプレーンテキストとして表示されることをシナリオ「言語指定なしコードブロックの扱い」で検証する。 <!-- verify: fr-001 -->
- [x] **FR-002** — シンタックスハイライト済みコードブロック内のコメントトークンが、キーワード等の他トークンより明らかに薄い色（opacity 低下または低輝度色）で表示されることをシナリオ「コメントが薄く表示される」で検証する。 <!-- verify: fr-002 -->
- [x] **FR-003** — Markdown ドキュメント内の `<!-- ... -->` が `<span class="md-comment">` に変換され、`opacity: 0.4` 相当の薄い色で表示されることをシナリオ「Markdown コメントが薄く表示される」で検証する。 <!-- verify: fr-003 -->

---

## Source-of-Truth Regression Risk

### [HIGH] 既存ページの `dark:` Tailwind クラスがセピア・グリーンで機能しない

- [x] `Dashboard.tsx`、`ChangeDetail.tsx`、`TestResults.tsx`、`ArtifactPreview.tsx` の `bg-white dark:bg-gray-900` / `border-gray-200 dark:border-gray-700` 等のクラスは `dark` クラス有無で切り替わる。セピア・グリーンテーマでは `dark` クラスが付与されないため、これらページの背景・ボーダーが白のまま固定される。→ **実装済み**: 全ページの `dark:` クラスを `bg-[var(--color-bg)]` / `border-[var(--color-border)]` 等に移行完了。 <!-- verify: human -->

### [HIGH] E2E テスト T204 の `[data-testid="theme-toggle"]` セレクタが破綻する

- [x] `artifact-preview.e2e.test.ts` の T204 は `[data-testid="theme-toggle"]` をクリックして `html.classList.contains('dark')` を検証している。→ **実装済み**: T204 を `[data-testid="theme-picker"] button[aria-label="dark"]` に更新済み。 <!-- verify: human -->

### [HIGH] Tailwind v3 `darkMode: ['selector', '[data-theme="dark"]']` と既存 `dark:` クラスの共存

- [x] Tailwind v3 の `selector` 戦略で `'[data-theme="dark"]'` を指定した場合、生成される `dark:` ユーティリティは `[data-theme="dark"]` セレクタにのみ反応し、`html.dark` クラスには反応しない。→ **実装済み**: `darkMode: ['selector', '[data-theme="dark"], .dark']` で両方に対応。ThemePicker は Dark 時に `classList.add('dark')` も実行するため `prose-invert` 互換を維持。 <!-- verify: human -->

### [MEDIUM] `toggleTheme` の削除による localStorage スキーマ後方互換性

- [x] `useChangesStore.ts` の `toggleTheme` が削除される。→ **実装済み**: `toggleTheme` 削除、`isTheme()` 型ガードと `merge` オプションで未知の値を `'light'` にフォールバック。既存の `'light'`/`'dark'` 値は引き続き有効。 <!-- verify: human -->

### [MEDIUM] GherkinHighlight のハードコード `dark:` カラークラスがセピア・グリーンで不整合になる

- [x] `GherkinHighlight.tsx` の `text-red-600 dark:text-red-400`、`text-green-700 dark:text-green-400` 等は `dark` クラスが付かないセピア・グリーンテーマでは常に light バリアント（`text-red-600` 等）が適用される。→ **実装済み**: `text-red-700 [data-theme="dark"_&]:text-red-400` 等の data-theme セレクタに更新。セピア・グリーン背景でも視認性のある濃いめの赤・緑を使用。 <!-- verify: human -->

### [MEDIUM] ArtifactViewer の isSpec ブランチが CodeBlock 経由にならないことの確認

- [x] `ArtifactViewer.tsx` の `markdownComponents` 内で `isSpec === true` のとき `GherkinHighlight` を使うブランチが引き続き存在することを確認すること。→ **実装済み**: `isSpec` → `GherkinHighlight`、それ以外 → `CodeBlock` の分岐を維持。T205 の `[data-testid="gherkin-highlight"]` アサーションは引き続き機能する。 <!-- verify: human -->

### [LOW] ThemeToggle を import している全ページが ThemePicker への切り替えを必要とする

- [x] 以下の 4 ファイルが `ThemeToggle` を import している。ThemePicker への置き換えを漏れなく行うこと: `pages/Dashboard.tsx`、`pages/ChangeDetail.tsx`、`pages/TestResults.tsx`、`pages/ArtifactPreview.tsx`。→ **実装済み**: 全 4 ファイルで `ThemePicker` に置換完了。 <!-- verify: human -->

### [LOW] `@mspec-delta` アンカーの付与

- [x] 新規作成する `ThemePicker.tsx`、`CodeBlock.tsx`、`rehypeCommentDim.ts` および新規 E2E テストファイルに `@mspec-delta` ヘッダーが付与されていることを `mspec anchor check` で確認すること（Constitution IV. 双方向アンカー）。→ **実装済み**: `mspec anchor check` 219 anchors / 0 errors。 <!-- verify: human -->

---

## Constitution Check

- [ ] **I. ステップ独立性** — design.md が research.md のみを前提入力とし、後続ステップ（tasks.md、Visual Prototype）への直接参照を持たず、他ステップとの新たな依存関係を生んでいないことを確認する。 <!-- verify: human -->
- [ ] **II. 決定論的マージ** — CSS カスタムプロパティの値・型定義・コンポーネント契約がすべて design.md に明示されており、フォント URL のみ Visual Prototype への委譲として明記されていることを確認する。 <!-- verify: human -->
- [ ] **III. 質問駆動の要件確定** — research ステップで Open Choices が解決済みであること、design ステップで追加の未確定事項がないことを確認する。 <!-- verify: human -->
- [ ] **IV. 双方向アンカー** — 実装ファイル・E2E テストすべてに `@mspec-delta` アンカーが付与され、`mspec anchor check` でゼロエラーになることを確認する。 <!-- verify: human -->
- [ ] **V. 強制ステップと拡張ステップの分離** — フォント確定が Visual Prototype（拡張ステップ）に委譲されており、強制ステップ（Spec / Delta Spec / Archive）の構造を変更していないことを確認する。 <!-- verify: human -->
- [ ] **VI. Security by Default** — proposal ステップの PRP-SEC-001〜004 回答に Google Fonts CDN 外部依存が開示されていることを確認する。`rehypeCommentDim` がユーザー入力を HTML として出力せず（テキストノード化のみ）、XSS リスクがないことを確認する。blast_radius が両 Delta Spec に `module` / `local` として明記されていることを確認する。 <!-- verify: human -->
