// @mspec-delta 2026-05-25-062234-web-ui-viewer-improvements/specs/artifact-preview/spec.md
// Requirements implemented: FR-009, FR-010
// Change: web-ui-viewer-improvements
// @mspec-delta 2026-05-26-041226-reading-mode-themes/specs/code-syntax-highlight/spec.md
// Requirements implemented: FR-001, FR-002, FR-003
// Change: reading-mode-themes

import { useArtifactContent } from '../api/client.js';
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

export interface ArtifactViewerProps {
  changeId: string;
  relativePath: string;
  onClose?: () => void;
}

export function ArtifactViewer({ changeId, relativePath, onClose }: ArtifactViewerProps) {
  const { data: content, isLoading, error } = useArtifactContent(changeId, relativePath);

  const isHtml = relativePath.endsWith('.html');

  if (isLoading) return <div className="p-8 text-gray-500">Loading…</div>;
  if (error) return <div className="p-8 text-red-500">Error loading artifact.</div>;

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

const markdownComponents: Components = {
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
