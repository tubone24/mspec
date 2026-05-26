---
doc_type: How-to
---

# Quickstart: reading-mode-themes

## Prerequisites

- Node.js 20+、pnpm 9+ がインストール済み
- `packages/web-ui` の開発サーバーが起動可能な状態
- `shiki` と `react-shiki` パッケージを追加済み（後述）

## Setup

### 1. パッケージを追加する

```bash
cd packages/web-ui
pnpm add shiki react-shiki
```

### 2. CSS カスタムプロパティを追加する（`src/index.css`）

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
  --color-bg:      #C5E8C5;
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

### 3. Tailwind の `darkMode` 設定を変更する（`tailwind.config.ts`）

```typescript
export default {
  darkMode: ['selector', '[data-theme="dark"]'],
  theme: {
    extend: {
      backgroundColor: { theme: 'var(--color-bg)', surface: 'var(--color-surface)' },
      textColor:        { theme: 'var(--color-fg)' },
      borderColor:      { theme: 'var(--color-border)' },
    },
  },
  // ...
} satisfies Config;
```

### 4. Theme 型を 4 値に拡張する（`src/store/useChangesStore.ts`）

```typescript
type Theme = 'light' | 'sepia' | 'green' | 'dark';

// toggleTheme を削除し setTheme のみを残す
```

### 5. `ThemePicker` コンポーネントを作成する（`src/components/ThemePicker.tsx`）

```typescript
import { useEffect } from 'react';
import { useChangesStore } from '../store/useChangesStore.js';

const THEMES = [
  { value: 'light', label: '☀ Light' },
  { value: 'sepia', label: '📖 Sepia' },
  { value: 'green', label: '🌿 Green' },
  { value: 'dark',  label: '🌙 Dark'  },
] as const;

export function ThemePicker() {
  const { theme, setTheme } = useChangesStore();

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  return (
    <div className="flex gap-1">
      {THEMES.map(({ value, label }) => (
        <button
          key={value}
          onClick={() => setTheme(value)}
          aria-pressed={theme === value}
          className={`px-2 py-1 text-xs border rounded ${
            theme === value
              ? 'bg-[var(--color-accent)] text-white border-transparent'
              : 'border-[var(--color-border)] hover:bg-[var(--color-surface)]'
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
```

### 6. `CodeBlock` コンポーネントを作成する（`src/components/CodeBlock.tsx`）

```typescript
import { useShikiHighlighter } from 'react-shiki';
import { useChangesStore } from '../store/useChangesStore.js';

const COMMENT_DIM: Record<string, string> = {
  '#6A737D': '#B0B7C0',  // github-light comment → dimmed
  '#8B949E': '#5A6270',  // github-dark comment → dimmed
};

export function CodeBlock({ language, code }: { language?: string; code: string }) {
  const { theme } = useChangesStore();
  const shikiTheme = theme === 'dark' ? 'github-dark' : 'github-light';

  const highlighted = useShikiHighlighter(code, language ?? 'text', shikiTheme, {
    colorReplacements: COMMENT_DIM,
  });

  if (!highlighted) return <code>{code}</code>;
  return <div dangerouslySetInnerHTML={{ __html: highlighted }} />;
}
```

### 7. `rehypeCommentDim` プラグインを作成する（`src/lib/rehypeCommentDim.ts`）

```typescript
import { visit } from 'unist-util-visit';
import type { Root } from 'hast';

export default function rehypeCommentDim() {
  return (tree: Root) => {
    visit(tree, 'comment', (node, index, parent) => {
      if (!parent || index === null) return;
      parent.children[index] = {
        type: 'element',
        tagName: 'span',
        properties: { className: ['md-comment'] },
        children: [{ type: 'text', value: `<!-- ${(node as any).value} -->` }],
      };
    });
  };
}
```

### 8. `ArtifactViewer.tsx` に統合する

```typescript
import { CodeBlock } from './CodeBlock.js';
import rehypeCommentDim from '../lib/rehypeCommentDim.js';

// ReactMarkdown に rehypePlugins を追加
<ReactMarkdown
  remarkPlugins={[remarkGfm]}
  rehypePlugins={[rehypeCommentDim]}
  components={markdownComponents(isSpec)}
>

// code renderer を更新
code({ className, children }) {
  if (className === 'language-mermaid') { ... }
  if (isSpec) { return <GherkinHighlight ... />; }
  const lang = className?.replace('language-', '');
  return <CodeBlock language={lang} code={String(children)} />;
}
```

## Try it（Golden Path）

```bash
# 開発サーバーを起動
cd packages/web-ui
pnpm dev
```

1. ブラウザで `http://localhost:5173` を開く
2. ヘッダーに **☀ Light / 📖 Sepia / 🌿 Green / 🌙 Dark** のボタンが表示されていることを確認
3. **Sepia** をクリック → 背景が黄土色（`#FBF0D9`）に変わることを確認
4. **Dark** をクリック → 背景がダークグレー（`#1C1C1E`）に変わることを確認
5. ページをリロードしてもテーマが維持されることを確認
6. Markdown ドキュメントを開いてコードブロックにシンタックスハイライトが当たることを確認
7. `<!-- comment -->` を含む Markdown で、コメントが薄い色・斜体で表示されることを確認

## Verify

```bash
# TypeScript エラーがないことを確認
pnpm typecheck

# テストを実行
pnpm test
```

## Troubleshooting

| 症状 | 原因 | 対処 |
|------|------|------|
| テーマ切替後もページが白いまま | `data-theme` 属性が設定されていない | `ThemePicker` の `useEffect` が正しく動作しているか確認 |
| `prose-invert` が Dark テーマで効かない | `dark` クラスが付いていない | `ThemePicker` で `classList.add('dark')` が呼ばれているか確認 |
| シンタックスハイライトが適用されない | `shiki` 未インストール | `pnpm add shiki react-shiki` を実行 |
| コードブロックが空白になる | Shiki の非同期ロード中 | `CodeBlock` でローディング中に `<code>{code}</code>` フォールバックを確認 |
| Markdown コメントが表示されない | `rehypeCommentDim` 未登録 | `ArtifactViewer` の `rehypePlugins` に追加されているか確認 |
| Green テーマの色が意図と異なる | 暫定カラーを使用中 | Visual Prototype ステップで確定後に `index.css` を更新 |
