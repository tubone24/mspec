// @mspec-delta 2026-05-26-083855-web-ui-enhancements/specs/change-dashboard/spec.md
// Requirements implemented: FR-009
// Change: web-ui-enhancements

import { useParams, useNavigate, Link } from 'react-router-dom';
import { useSpecs, useSpecContent } from '../api/client.js';
import { ThemePicker } from '../components/ThemePicker.js';
import { en } from '../i18n/en.js';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import rehypeCommentDim from '../lib/rehypeCommentDim.js';
import rehypeGherkinEars from '../lib/rehypeGherkinEars.js';
import { rehypeInlineCodeProperty } from 'react-shiki';
import { MermaidRenderer } from '../components/MermaidRenderer.js';
import { CodeBlock } from '../components/CodeBlock.js';
import type { Components } from 'react-markdown';
import type { Element } from 'hast';

export function SpecViewer() {
  const { capability } = useParams<{ capability?: string }>();
  const navigate = useNavigate();
  const { data: specs, isLoading, error } = useSpecs();
  const { data: specContent, isLoading: contentLoading } = useSpecContent(capability ?? '');

  return (
    <div className="min-h-screen bg-[var(--color-bg)] text-[var(--color-fg)] flex flex-col">
      <header className="flex items-center justify-between px-8 py-4 border-b border-[var(--color-border)] flex-shrink-0">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/')}
            className="text-sm text-[var(--color-accent)] hover:underline"
          >
            ← Back to Dashboard
          </button>
          <h1 className="text-lg font-bold">{en.specViewer.title}</h1>
        </div>
        <ThemePicker />
      </header>

      <div className={capability ? 'grid grid-cols-[240px_1fr] flex-1 min-h-0' : 'flex-1 flex'}>
        <aside
          className={`px-6 py-6 overflow-auto${capability ? ' border-r border-[var(--color-border)]' : ''}`}
          data-testid="spec-capability-list"
        >
          <h2 className="text-sm font-semibold mb-3 text-gray-500 uppercase tracking-wide">
            Capabilities
          </h2>
          {isLoading && <p className="text-sm text-gray-400">Loading…</p>}
          {error && <p className="text-sm text-red-500">Error loading specs.</p>}
          <ul className="space-y-1">
            {(specs ?? []).map((s) => (
              <li key={s.capability}>
                <Link
                  to={`/spec-viewer/${s.capability}`}
                  data-testid="capability-item"
                  className={`block text-sm font-mono px-2 py-1 rounded hover:bg-[var(--color-surface)] ${
                    capability === s.capability
                      ? 'text-[var(--color-accent)] font-semibold bg-[var(--color-surface)]'
                      : 'text-[var(--color-accent)]'
                  }`}
                >
                  {s.capability}
                </Link>
              </li>
            ))}
          </ul>
        </aside>

        {capability && (
          <section
            className="overflow-auto p-8"
            data-testid="spec-content"
          >
            {contentLoading && <p className="text-gray-400">Loading spec…</p>}
            {!contentLoading && specContent && (
              <div className="prose prose-sm dark:prose-invert max-w-none">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  rehypePlugins={[
                    rehypeRaw,
                    rehypeCommentDim,
                    rehypeGherkinEars,
                    rehypeInlineCodeProperty,
                  ]}
                  components={specMarkdownComponents}
                >
                  {specContent}
                </ReactMarkdown>
              </div>
            )}
            {!contentLoading && !specContent && (
              <p className="text-gray-400">{en.specViewer.selectCapability}</p>
            )}
          </section>
        )}

        {!capability && (
          <div className="flex-1 flex items-center justify-center text-gray-400">
            <p>{en.specViewer.selectCapability}</p>
          </div>
        )}
      </div>
    </div>
  );
}

const specMarkdownComponents: Components = {
  code({ className, children, node }) {
    if ((node as Element | undefined)?.properties?.inline) {
      return <code className={className}>{children}</code>;
    }
    if (className === 'language-mermaid') {
      return <MermaidRenderer chart={String(children).trim()} />;
    }
    const lang = className?.replace('language-', '');
    return <CodeBlock language={lang} code={String(children)} />;
  },
};
