// @mspec-delta 2026-05-25-062234-web-ui-viewer-improvements/specs/artifact-preview/spec.md
// Requirements implemented: FR-009, FR-010
// Change: web-ui-viewer-improvements
// @mspec-delta 2026-05-26-041226-reading-mode-themes/specs/code-syntax-highlight/spec.md
// Requirements implemented: FR-001, FR-002, FR-003
// Change: reading-mode-themes
// @mspec-delta 2026-05-27-131059-fix-pre-tag-checklist-ui/specs/code-syntax-highlight/spec.md
// Requirements implemented: FR-006
// Change: fix-pre-tag-checklist-ui
// @mspec-delta 2026-05-27-131059-fix-pre-tag-checklist-ui/specs/web-ui-server/spec.md
// Requirements implemented: FR-005, FR-006
// Change: fix-pre-tag-checklist-ui
// @mspec-delta 2026-05-27-235634-checklist-reduce-verify-human/specs/artifact-preview/spec.md
// Requirements implemented: FR-012
// Change: checklist-reduce-verify-human

// @mspec-delta 2026-05-28-114434-fix-checklist-ui-sync/specs/artifact-preview/spec.md
// Requirements implemented: FR-013
// Change: fix-checklist-ui-sync

import { useArtifactContent, usePatchChecklistItem } from '../api/client.js';
import { buildUpdatedChecklist, parseCheckedItems } from '../lib/buildUpdatedChecklist.js';
import { MermaidRenderer } from './MermaidRenderer.js';
import { CodeBlock } from './CodeBlock.js';
import { PrototypeIframe } from './PrototypeIframe.js';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import rehypeCommentDim from '../lib/rehypeCommentDim.js';
import rehypeGherkinEars from '../lib/rehypeGherkinEars.js';
import { rehypeInlineCodeProperty } from 'react-shiki';
import type { Components } from 'react-markdown';
import type { Element } from 'hast';
import { useState, useRef, useEffect } from 'react';

export interface ArtifactViewerProps {
  changeId: string;
  relativePath: string;
  onClose?: () => void;
}

export function ArtifactViewer({ changeId, relativePath, onClose }: ArtifactViewerProps) {
  const { data: content, isLoading, error } = useArtifactContent(changeId, relativePath);
  const [checkedItems, setCheckedItems] = useState<Set<number>>(new Set());
  const checkboxCounter = useRef<number>(0);
  checkboxCounter.current = 0; // reset at the top of each render cycle
  const patchMutation = usePatchChecklistItem(changeId, relativePath);

  useEffect(() => {
    if (!content || !relativePath.endsWith('checklist.md')) return;
    setCheckedItems(parseCheckedItems(content));
  }, [content, relativePath]);

  const isHtml = relativePath.endsWith('.html');

  if (isLoading) return <div className="p-8 text-gray-500">Loading…</div>;
  if (error) return <div className="p-8 text-red-500">Error loading artifact.</div>;

  const markdownComponents: Components = {
    pre({ children }) {
      return <>{children}</>;
    },
    li({ children, node, ...props }) {
      const isAmberAnnotation = (text: string) =>
        text.includes('verify: human') || text.includes('verify: cmd:');
      const isVerifyHuman = (node as Element | undefined)?.children?.some((child) => {
        if (child.type === 'text') return ('value' in child) && isAmberAnnotation(String(child.value));
        if (child.type === 'element') {
          const el = child as Element;
          const classes = Array.isArray(el.properties?.className) ? el.properties.className : [];
          if (classes.includes('md-comment')) {
            return el.children?.some(
              (c) => c.type === 'text' && 'value' in c && isAmberAnnotation(String(c.value)),
            );
          }
        }
        return false;
      }) ?? false;
      if (isVerifyHuman) {
        return (
          <li
            {...props}
            className="bg-amber-50 border-l-4 border-amber-400 pl-2 rounded-sm"
          >
            {children}
          </li>
        );
      }
      return <li {...props}>{children}</li>;
    },
    input({ type, checked, ...props }) {
      if (type === 'checkbox') {
        const idx = checkboxCounter.current++;
        return (
          <input
            type="checkbox"
            data-idx={idx}
            checked={checkedItems.has(idx)}
            onChange={(event) => {
              // event.target の data-idx 属性から正確なインデックスを読む（stale closure 回避）
              const domIdx = Number((event.target as HTMLInputElement).getAttribute('data-idx') ?? idx);
              const newChecked = new Set(checkedItems);
              if (newChecked.has(domIdx)) newChecked.delete(domIdx);
              else newChecked.add(domIdx);
              setCheckedItems(newChecked);
              if (content && relativePath.endsWith('checklist.md')) {
                patchMutation.mutate(buildUpdatedChecklist(content, domIdx, !checkedItems.has(domIdx)));
              }
            }}
          />
        );
      }
      return <input type={type} checked={checked} {...props} />;
    },
    code({ className, children, node }) {
      // Inline code (single backtick) → plain <code>
      if ((node as Element | undefined)?.properties?.inline) {
        return <code className={className}>{children}</code>;
      }

      if (className === 'language-mermaid') {
        return <MermaidRenderer chart={String(children).trim()} />;
      }

      // Named language tag → Shiki syntax highlighting
      const lang = className?.replace('language-', '');
      return <CodeBlock language={lang} code={String(children)} />;
    },
  };

  return (
    <div className="relative h-full overflow-auto">
      {onClose && (
        <button
          onClick={onClose}
          className="absolute top-2 right-2 z-10 text-sm text-gray-500 hover:text-[var(--color-fg)] px-2 py-1 rounded hover:bg-[var(--color-surface)]"
          aria-label="Close viewer"
        >
          ✕
        </button>
      )}
      <div className="p-6">
        {isHtml ? (
          <PrototypeIframe html={content ?? ''} />
        ) : (
          <div className="prose dark:prose-invert max-w-none" data-testid="md-preview">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              rehypePlugins={[
                rehypeRaw,           // 1. pass raw HTML through (enables <!-- --> comment nodes)
                rehypeCommentDim,    // 2. dim HTML comment nodes → <span class="md-comment">
                rehypeGherkinEars,   // 3. wrap EARS/Gherkin keywords in colored spans
                rehypeInlineCodeProperty, // 4. mark inline <code> nodes
              ]}
              components={markdownComponents}
            >
              {content ?? ''}
            </ReactMarkdown>
          </div>
        )}
      </div>
    </div>
  );
}
