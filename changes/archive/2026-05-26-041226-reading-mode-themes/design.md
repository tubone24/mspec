---
doc_type: Reference
---

<!-- See also: ./design-rationale.md for採用理由・代替案 -->

# Design: reading-mode-themes

## Summary

Web UI の読書テーマを 4 種類（ライト・セピア・グリーン・ダーク）に拡張する。CSS カスタムプロパティによるテーマシステムへ全面移行し、Shiki によるシンタックスハイライトと rehype によるMarkdown コメント減光を追加する。フォントは Visual Prototype ステップで確定後に `index.css` へ追記する。

---

## Technical Context

- **Runtime**: React + Vite + TypeScript。Tailwind CSS v3 (`darkMode: 'class'`)
- **State**: Zustand + `persist` middleware（`mspec-ui-store` localStorage キー）
- **Markdown**: `react-markdown` + `remark-gfm` + `rehype-*`
- **既存テーマ**: `type Theme = 'light' | 'dark'` の 2 値。`classList.add('dark')` で切り替え

---

## Project Structure

### 新規作成ファイル

| ファイル | 役割 |
|---------|------|
| `packages/web-ui/src/components/ThemePicker.tsx` | 4択 Pill ボタン群のテーマ選択 UI |
| `packages/web-ui/src/components/CodeBlock.tsx` | Shiki ラッパー（言語・テーマ動的ロード） |
| `packages/web-ui/src/lib/rehypeCommentDim.ts` | Markdown HTMLコメントを `<span class="md-comment">` に変換する rehype プラグイン |

### 変更ファイル

| ファイル | 変更内容 |
|---------|---------|
| `packages/web-ui/src/store/useChangesStore.ts` | `type Theme` を 4 値に拡張、`toggleTheme` 削除 |
| `packages/web-ui/src/components/ThemeToggle.tsx` | `ThemePicker` にリネーム・UI 刷新（または削除し ThemePicker に置換） |
| `packages/web-ui/src/components/ArtifactViewer.tsx` | `code` renderer に `CodeBlock` を統合、`rehypeCommentDim` を追加 |
| `packages/web-ui/tailwind.config.ts` | `darkMode` を `['selector', '[data-theme="dark"], .dark']` に変更、CSS 変数トークンを `theme.extend` に追加 |
| `packages/web-ui/src/index.css` | CSS カスタムプロパティ定義、`.md-comment` スタイル追加 |
| `packages/web-ui/index.html` | Google Fonts `<link>` タグ追加（フォント URL は Visual Prototype ステップで確定） |
| `packages/web-ui/package.json` | `shiki`、`react-shiki` を追加 |
| `packages/web-ui/src/pages/Dashboard.tsx` | 全 `dark:` ユーティリティクラスを CSS 変数参照（`bg-[var(--color-bg)]` 等）に移行 |
| `packages/web-ui/src/pages/ChangeDetail.tsx` | 同上 |
| `packages/web-ui/src/pages/TestResults.tsx` | 同上 |
| `packages/web-ui/src/pages/ArtifactPreview.tsx` | ThemeToggle → ThemePicker に置換、全 `dark:` クラスを CSS 変数参照に移行 |
| `packages/web-ui/src/e2e/artifact-preview.e2e.test.ts` | T204 の `[data-testid="theme-toggle"]` セレクタを ThemePicker Dark ボタンのセレクタに更新 |

---

## Data Model

### Theme 型

```typescript
// useChangesStore.ts
type Theme = 'light' | 'sepia' | 'green' | 'dark';
```

### CSS カスタムプロパティ（index.css）

```css
:root, [data-theme="light"] {
  --color-bg:      #FFFFFF;
  --color-fg:      #1a1a1a;
  --color-accent:  #4B7BEC;
  --color-surface: #F3F4F6;
  --color-border:  #E5E7EB;
}

[data-theme="sepia"] {
  --color-bg:      #FBF0D9;
  --color-fg:      #5F4B32;
  --color-accent:  #7A5C3F;
  --color-surface: #F0E6CC;
  --color-border:  #D4C5A0;
}

[data-theme="green"] {
  --color-bg:      #C5E8C5;  /* 暫定。Visual Prototype で確認 */
  --color-fg:      #1A3D1A;
  --color-accent:  #2D5A2D;
  --color-surface: #B5DDB5;
  --color-border:  #9DC89D;
}

[data-theme="dark"] {
  --color-bg:      #1C1C1E;
  --color-fg:      #E5E5EA;
  --color-accent:  #4B7BEC;
  --color-surface: #2C2C2E;
  --color-border:  #3A3A3C;
}

.md-comment {
  opacity: 0.4;
  font-style: italic;
}
```

### Tailwind 設定（tailwind.config.ts）

```typescript
export default {
  darkMode: ['selector', '[data-theme="dark"], .dark'],
  // .dark も含めることで prose-invert など .dark クラス依存の CSS と共存可能にする
  theme: {
    extend: {
      backgroundColor: { theme: 'var(--color-bg)', surface: 'var(--color-surface)' },
      textColor:        { theme: 'var(--color-fg)' },
      borderColor:      { theme: 'var(--color-border)' },
    },
  },
  plugins: [typography],
} satisfies Config;
```

---

## Component Contracts

### ThemePicker

```typescript
// props なし（Zustand store から直接読み書き）
export function ThemePicker(): JSX.Element;
// - 4 つの Pill ボタン: ☀ Light / 📖 Sepia / 🌿 Green / 🌙 Dark
// - 配置先: Dashboard.tsx, ChangeDetail.tsx, TestResults.tsx, ArtifactPreview.tsx の各ページヘッダー
//   （既存 ThemeToggle import をすべて ThemePicker に置換する）
// - 選択時: setTheme(theme) + document.documentElement.setAttribute('data-theme', theme)
// - Dark 選択時: document.documentElement.classList.add('dark')
//   （tailwind.config.ts の darkMode に '.dark' も含めるため。prose-invert 等 .dark 依存 CSS との共存）
// - 非 Dark 選択時: classList.remove('dark')
// - aria-pressed で選択状態を表現
```

### CodeBlock

```typescript
interface CodeBlockProps {
  language: string | undefined;  // className の 'language-xxx' から抽出
  code: string;
}
export function CodeBlock({ language, code }: CodeBlockProps): JSX.Element;
// - useChangesStore().theme を読み、'dark' → 'github-dark'、その他 → 'github-light' を選択
// - react-shiki の useShikiHighlighter フックを使用
// - 言語・テーマは shiki/core で遅延ロード
// - colorReplacements: コメントトークン色を 50% 明度調整した色に置換
```

### rehypeCommentDim プラグイン

```typescript
// unified プラグイン。Hast を walk し、
// type === 'comment' の HTML コメントノードを
// { type: 'element', tagName: 'span', properties: { className: ['md-comment'] }, children: [{ type: 'text', value: '<!-- ' + node.value + ' -->' }] }
// に変換する。
export default function rehypeCommentDim(): (tree: Root) => void;
```

### ArtifactViewer の変更点

```typescript
// Before (line 59-67):
return <code className={className}>{children}</code>;

// After:
const lang = className?.replace('language-', '');
return <CodeBlock language={lang} code={String(children)} />;

// rehypePlugins 追加:
<ReactMarkdown
  remarkPlugins={[remarkGfm]}
  rehypePlugins={[rehypeCommentDim]}
  components={markdownComponents(isSpec)}
>
```

---

## Decisions

| 決定 | 内容 | 受け入れ基準（Delta Spec 対応） |
|------|------|--------------------------------|
| テーマ適用方法 | `document.documentElement.setAttribute('data-theme', theme)` | web-ui-themes FR-001: 4択表示 ✓ |
| ダークの `dark` クラス維持 | Tailwind Prose `prose-invert` 互換のため Dark 時のみ `dark` クラスも付与 | web-ui-themes FR-002: Dark テーマ配色 ✓ |
| Shiki テーマ | `github-light` / `github-dark` | code-syntax-highlight FR-001: ハイライト適用 ✓ |
| コメント減光 | `colorReplacements` で comment トークン色をソフト化 | code-syntax-highlight FR-002: コメント薄色 ✓ |
| Markdown コメント変換 | `rehypeCommentDim` プラグインで `<span class="md-comment">` に変換 | code-syntax-highlight FR-003: MD コメント薄色 ✓ |
| テーマ永続化 | 既存 `persist` ミドルウェアの `mspec-ui-store` を拡張 | web-ui-themes FR-003: localStorage 永続化 ✓ |
| フォント | Visual Prototype ステップで確定後に `index.html` + `index.css` に追加 | web-ui-themes FR-004: フォント適用 ✓（後続） |

---

## Constitution Check

| Principle | Phase 0 | Phase 1 |
|-----------|---------|---------|
| I. ステップ独立性 | ✅ design は research.md のみを入力とする | ✅ design.md は後続ステップへの直接参照を持たない |
| II. 決定論的マージ | ✅ CSS 変数値・型定義・コンポーネント契約がすべて明示 | ✅ 未確定フォントは Visual Prototype への委譲として明示。tasks.md で「フォント placeholder」タスクを設ける |
| III. 質問駆動の要件確定 | ✅ research ステップで全 Open Choices を解決済み | ✅ design ステップで追加の不確定事項なし |
| IV. 双方向アンカー | ✅ ファイル・行番号・コンポーネント名を具体的に記述 | ✅ Decisions テーブルで Delta Spec FR-NNN と対応付け |
| V. 強制ステップと拡張ステップの分離 | ✅ フォント確定は拡張ステップ（Visual Prototype）に委譲 | ✅ 本 design は Visual Prototype の結果を待たずに実装可能な設計 |
| VI. Security by Default | ✅ Google Fonts CDN は外部依存。既存の index.html に CSP なし、今回追加しない（スコープ外） | ✅ rehype プラグインはユーザー入力を HTML として出力しない（テキストノード化のみ） |

### Complexity Tracking

None

---

## Self-Review

> Reviewed by `mspec-self-reviewer` subagent.

### Findings

| Severity | Area | Finding |
|----------|------|---------|
| ✅ ok | FR Coverage | 全 7 FR（web-ui-themes FR-001〜004, code-syntax-highlight FR-001〜003）が design.md・checklist.md・quickstart.md に対応付け済み |
| ✅ ok | rehypeCommentDim XSS | コメント内容をテキストノード化のみで出力。`dangerouslySetInnerHTML` 未使用。XSS リスクなし |
| ✅ ok | Mermaid 図 | System / Sequence (×2) / ERD の 4 図あり。要件満足 |
| ✅ ok | Quickstart | Prerequisites / Setup (8 steps) / Golden Path / Verify / Troubleshooting が揃っている |
| ✅ ok | Open Choices | research.md の全 Open Choices が解決済み。未確定項目（フォント・Green カラー）は Visual Prototype へ明示的に委譲 |
| 🔴 blocker → 修正済み | 変更ファイル表の不完全さ | Dashboard.tsx / ChangeDetail.tsx / TestResults.tsx / ArtifactPreview.tsx / E2E test ファイルが変更ファイル表に欠落していた。上記テーブルに追加済み |
| ⚠ warning → 修正済み | Tailwind `dark` クラス根拠の不正確さ | `darkMode: ['selector', '[data-theme="dark"]']` では `.dark` クラスが不要だが、prose-invert 等の `.dark` 依存 CSS 共存のため `['selector', '[data-theme="dark"], .dark']` に修正済み |
| ⚠ warning → 修正済み | ThemePicker 配置先の未記載 | Component Contracts に配置先ページ 4 件を明記済み |
| ⚠ warning → 修正済み | proposal.md SEC 開示ギャップ | Google Fonts CDN 依存を proposal.md の SEC Decisions 表に追記済み |
| ⚠ warning (残) | FR-002 カラー値の表記ゆれ | spec.md の「例: #F5E6C8」と design.md の `#FBF0D9` が異なるが、「例:」は非規定値。research.md の出典明記で根拠あり。許容範囲 |

### Verdict

**✅ tasks.md 生成可能**。ブロッカーは全て修正済み。残 warning（カラー表記ゆれ）は許容範囲のため実装を妨げない。
