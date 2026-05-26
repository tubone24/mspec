---
doc_type: How-to
---

# Tasks: reading-mode-themes

> TDD 方針: E2E タスクは必ず対応する実装タスクの前に配置する（RED → GREEN）。

---

## Phase 1: Setup

### T001 — パッケージ追加

`packages/web-ui/package.json` に `shiki` と `react-shiki` を追加する。

```bash
cd packages/web-ui
pnpm add shiki react-shiki
```

---

### T002 — Tailwind darkMode 設定変更

`packages/web-ui/tailwind.config.ts` の `darkMode` を変更し、CSS 変数トークンを `theme.extend` に追加する。

```typescript
// tailwind.config.ts
darkMode: ['selector', '[data-theme="dark"], .dark'],
theme: {
  extend: {
    backgroundColor: { theme: 'var(--color-bg)', surface: 'var(--color-surface)' },
    textColor:        { theme: 'var(--color-fg)' },
    borderColor:      { theme: 'var(--color-border)' },
  },
},
```

---

### T003 — index.css に CSS カスタムプロパティを追加

`packages/web-ui/src/index.css` に 4 テーマ分の CSS 変数と `.md-comment` スタイルを追加する。

```css
:root, [data-theme="light"] { --color-bg: #FFFFFF; --color-fg: #1a1a1a; ... }
[data-theme="sepia"]        { --color-bg: #FBF0D9; --color-fg: #5F4B32; ... }
[data-theme="green"]        { --color-bg: #C5E8C5; --color-fg: #1A3D1A; ... } /* 暫定値 */
[data-theme="dark"]         { --color-bg: #1C1C1E; --color-fg: #E5E5EA; ... }
.md-comment { opacity: 0.4; font-style: italic; }
```

---

### T004 — Google Fonts placeholder を index.html に追加

`packages/web-ui/index.html` の `<head>` に Google Fonts `<link>` タグ placeholder を追加する（フォント URL は Visual Prototype ステップで確定後に差し替える）。

```html
<!-- TODO: Visual Prototype ステップで確定したフォント URL に差し替える -->
<!-- <link rel="preconnect" href="https://fonts.googleapis.com"> -->
<!-- <link href="https://fonts.googleapis.com/css2?family=FONT_NAME&display=swap" rel="stylesheet"> -->
```

---

## Phase 2: Foundational

### T005 — useChangesStore の Theme 型を 4 値に拡張

`packages/web-ui/src/store/useChangesStore.ts:8` の `type Theme` を `'light' | 'sepia' | 'green' | 'dark'` に変更し、`toggleTheme` を削除する。`setTheme` のみに統一する。

```typescript
// anchor:
// @mspec-delta 2026-05-26-041226-reading-mode-themes/specs/web-ui-themes/spec.md
// Requirements implemented: FR-003
// Change: reading-mode-themes
```

<!-- verify: fr-003 はtrivialのためアノテーション不要 -->

---

### T006 — ThemePicker コンポーネントを新規作成

`packages/web-ui/src/components/ThemePicker.tsx` を新規作成する。4 つの Pill ボタン（☀ Light / 📖 Sepia / 🌿 Green / 🌙 Dark）を横並びで配置し、選択時に `setTheme`・`setAttribute('data-theme', ...)`・Dark 時は `classList.add('dark')` を実行する。`data-testid="theme-picker"` を付与する。

```typescript
// anchor:
// @mspec-delta 2026-05-26-041226-reading-mode-themes/specs/web-ui-themes/spec.md
// Requirements implemented: FR-001, FR-002, FR-003
// Change: reading-mode-themes
```

<!-- verify: fr-001 -->

---

### T007 — rehypeCommentDim プラグインを新規作成

`packages/web-ui/src/lib/rehypeCommentDim.ts` を新規作成する。`unist-util-visit` で hast の `comment` ノードを `<span class="md-comment">` に変換する。

```typescript
// anchor:
// @mspec-delta 2026-05-26-041226-reading-mode-themes/specs/code-syntax-highlight/spec.md
// Requirements implemented: FR-003
// Change: reading-mode-themes
```

<!-- verify: trivial のためアノテーション不要 -->

---

### T008 — CodeBlock コンポーネントを新規作成

`packages/web-ui/src/components/CodeBlock.tsx` を新規作成する。`react-shiki` の `useShikiHighlighter` を使い、テーマに応じて `github-light` / `github-dark` を選択する。コメントトークンは `colorReplacements` で薄い色に置換する。

```typescript
// anchor:
// @mspec-delta 2026-05-26-041226-reading-mode-themes/specs/code-syntax-highlight/spec.md
// Requirements implemented: FR-001, FR-002
// Change: reading-mode-themes
```

<!-- verify: fr-001 -->

---

## Phase 3: User Story

### T009 — [E2E] ThemePicker 4 択表示テスト（FR-001 RED）

`packages/web-ui/src/e2e/theme-picker.e2e.test.ts` を新規作成する。

- GIVEN: Web UI を開いている
- WHEN: ページ読み込み
- THEN: `[data-testid="theme-picker"]` 内に Light / Sepia / Green / Dark の 4 ボタンが存在する

```typescript
// anchor:
// @mspec-delta 2026-05-26-041226-reading-mode-themes/specs/web-ui-themes/spec.md
// Requirements implemented: FR-001
// Change: reading-mode-themes
```

<!-- verify: fr-001 -->

---

### T010 — ThemeToggle → ThemePicker 置換（4 ページ）（FR-001 GREEN）

以下 4 ファイルの `ThemeToggle` import と使用箇所を `ThemePicker` に置き換える。同時に各ページの `dark:bg-*` / `dark:text-*` / `dark:border-*` クラスを CSS 変数参照（`bg-[var(--color-bg)]` 等）に移行する。

- `packages/web-ui/src/pages/Dashboard.tsx`
- `packages/web-ui/src/pages/ChangeDetail.tsx`
- `packages/web-ui/src/pages/TestResults.tsx`
- `packages/web-ui/src/pages/ArtifactPreview.tsx`

```typescript
// anchor:
// @mspec-delta 2026-05-26-041226-reading-mode-themes/specs/web-ui-themes/spec.md
// Requirements implemented: FR-001, FR-002
// Change: reading-mode-themes
```

<!-- verify: fr-001 -->

---

### T011 — [E2E] テーマ配色テスト（FR-002 RED）

`theme-picker.e2e.test.ts` にシナリオを追加する。

- Sepia 選択時: `document.documentElement` の `data-theme` が `sepia`、背景色が `rgb(251, 240, 217)` であること
- Green 選択時: `data-theme` が `green`、背景色が `rgb(197, 232, 197)` であること（暫定値）
- Dark 選択時: `data-theme` が `dark`、`classList.contains('dark')` が `true` であること

```typescript
// anchor:
// @mspec-delta 2026-05-26-041226-reading-mode-themes/specs/web-ui-themes/spec.md
// Requirements implemented: FR-002
// Change: reading-mode-themes
```

<!-- verify: fr-002 -->

---

### T012 — GherkinHighlight の dark: クラスを CSS 変数参照に移行（FR-002 GREEN）

`packages/web-ui/src/components/GherkinHighlight.tsx` の `dark:text-red-*` / `dark:text-green-*` 等のクラスを、セピア・グリーン背景でも視覚的に許容できる CSS 変数参照か、テーマ非依存なスタイルに変更する。

```typescript
// anchor:
// @mspec-delta 2026-05-26-041226-reading-mode-themes/specs/web-ui-themes/spec.md
// Requirements implemented: FR-002
// Change: reading-mode-themes
```

<!-- verify: fr-002 -->

---

### T013 — [E2E] localStorage 永続化テスト（FR-003 RED）

`theme-picker.e2e.test.ts` にシナリオを追加する。

- Dark テーマ選択 → ページリロード → Dark テーマが維持されること
- `localStorage.getItem('mspec-ui-store')` に `theme: 'dark'` が含まれること

```typescript
// anchor:
// @mspec-delta 2026-05-26-041226-reading-mode-themes/specs/web-ui-themes/spec.md
// Requirements implemented: FR-003
// Change: reading-mode-themes
```

---

### T014 — [E2E] シンタックスハイライトテスト（FR-001 RED）

`packages/web-ui/src/e2e/code-highlight.e2e.test.ts` を新規作成する。

- GIVEN: ` ```javascript ` コードブロックを含む Markdown
- WHEN: ArtifactViewer で表示
- THEN: `<span style="color:...">` が 1 件以上生成されること
- AND: 言語指定なし ` ``` ` ブロックがエラーなくプレーンテキストとして表示されること

```typescript
// anchor:
// @mspec-delta 2026-05-26-041226-reading-mode-themes/specs/code-syntax-highlight/spec.md
// Requirements implemented: FR-001
// Change: reading-mode-themes
```

<!-- verify: fr-001 -->

---

### T015 — ArtifactViewer に CodeBlock を統合（FR-001 GREEN）

`packages/web-ui/src/components/ArtifactViewer.tsx:59-67` の `code` renderer の fallback を `<CodeBlock language={lang} code={String(children)} />` に置き換える。`isSpec` の `GherkinHighlight` ブランチは維持する。

```typescript
// anchor:
// @mspec-delta 2026-05-26-041226-reading-mode-themes/specs/code-syntax-highlight/spec.md
// Requirements implemented: FR-001, FR-002
// Change: reading-mode-themes
```

<!-- verify: fr-001 -->

---

### T016 — [E2E] コメント薄色テスト（FR-002 RED）

`code-highlight.e2e.test.ts` にシナリオを追加する。

- GIVEN: コメントを含む JavaScript コードブロック
- WHEN: ArtifactViewer で表示
- THEN: コメント span の `color` 値がキーワード span より明度が高い（薄い）こと

```typescript
// anchor:
// @mspec-delta 2026-05-26-041226-reading-mode-themes/specs/code-syntax-highlight/spec.md
// Requirements implemented: FR-002
// Change: reading-mode-themes
```

---

### T017 — [E2E] Markdown コメント薄色テスト（FR-003 RED）

`code-highlight.e2e.test.ts` にシナリオを追加する。

- GIVEN: `<!-- コメント -->` を含む Markdown
- WHEN: ArtifactViewer で表示
- THEN: `<span class="md-comment">` 要素が存在し、`opacity` が 0.4 以下であること

```typescript
// anchor:
// @mspec-delta 2026-05-26-041226-reading-mode-themes/specs/code-syntax-highlight/spec.md
// Requirements implemented: FR-003
// Change: reading-mode-themes
```

---

### T018 — ArtifactViewer に rehypeCommentDim を統合（FR-003 GREEN）

`packages/web-ui/src/components/ArtifactViewer.tsx` の `<ReactMarkdown>` に `rehypePlugins={[rehypeCommentDim]}` を追加する。

```typescript
// anchor:
// @mspec-delta 2026-05-26-041226-reading-mode-themes/specs/code-syntax-highlight/spec.md
// Requirements implemented: FR-003
// Change: reading-mode-themes
```

---

## Phase 4: Polish

### T019 — E2E T204 セレクタ更新

`packages/web-ui/src/e2e/artifact-preview.e2e.test.ts` の T204 テストで使用している `[data-testid="theme-toggle"]` セレクタを ThemePicker の Dark ボタン（`[data-testid="theme-picker"] button[aria-label="Dark"]` 等）に更新する。

```typescript
// anchor:
// @mspec-delta 2026-05-26-041226-reading-mode-themes/specs/web-ui-themes/spec.md
// Requirements implemented: FR-001
// Change: reading-mode-themes
```

<!-- verify: fr-001 -->

---

### T020 — localStorage 型ガード確認

`packages/web-ui/src/store/useChangesStore.ts` の `persist` 設定で、rehydrate 時に未知の `theme` 値（例: 将来の拡張や破損データ）を `'light'` にフォールバックする型ガードが存在することを確認する。存在しない場合は追加する。

```typescript
// anchor:
// @mspec-delta 2026-05-26-041226-reading-mode-themes/specs/web-ui-themes/spec.md
// Requirements implemented: FR-003
// Change: reading-mode-themes
```

---

### T021 — フォント placeholder タスク（Visual Prototype 後）

Visual Prototype ステップでフォントが確定した後に実施:
1. `packages/web-ui/index.html` の `<head>` の placeholder コメントを実際の Google Fonts `<link>` タグに差し替える
2. `packages/web-ui/src/index.css` の `:root` に `--font-body: '<FontName>', serif;` を追加し、`body { font-family: var(--font-body); }` を設定する

```typescript
// anchor:
// @mspec-delta 2026-05-26-041226-reading-mode-themes/specs/web-ui-themes/spec.md
// Requirements implemented: FR-004
// Change: reading-mode-themes
```

<!-- verify: fr-004 -->

---

## Constitution Check

| Principle | Phase 0 | Phase 1 |
|-----------|---------|---------|
| I. ステップ独立性 | ✅ tasks.md は design.md と checklist.md のみを入力とする | — |
| II. 決定論的マージ | ✅ 全タスクにファイルパス・行番号レベルの変更箇所を明記 | — |
| III. 質問駆動の要件確定 | ✅ 全タスクが確定済み要件から導出。未確定（フォント・Green カラー）は T021 に明示委譲 | — |
| IV. 双方向アンカー | ✅ 全実装・E2E タスクに `@mspec-delta` anchor ブロックを付与 | — |
| V. 強制ステップと拡張ステップの分離 | ✅ T021（フォント適用）は Visual Prototype 後の後続タスクとして明示 | — |
| VI. Security by Default | ✅ T018（rehypeCommentDim）は XSS 安全。T007 の実装でテキストノード化のみを確認すること | — |
