// @mspec-delta 2026-05-26-041226-reading-mode-themes/specs/code-syntax-highlight/spec.md
// Requirements implemented: FR-001, FR-002
// Change: reading-mode-themes
// @mspec-delta 2026-05-27-131059-fix-pre-tag-checklist-ui/specs/code-syntax-highlight/spec.md
// Requirements implemented: FR-006
// Change: fix-pre-tag-checklist-ui

import { useShikiHighlighter } from 'react-shiki';
import { useChangesStore } from '../store/useChangesStore.js';

// github-light comment color → dimmed (50% lighter)
// github-dark comment color → dimmed
const COMMENT_REPLACEMENTS: Record<string, string> = {
  '#6A737D': '#b0b7c0', // github-light / github-dark comment → dimmed
  '#8B949E': '#5a6270', // github-dark secondary comment → dimmed
};

interface CodeBlockProps {
  language?: string;
  code: string;
}

// Use useShikiHighlighter hook instead of ShikiHighlighter component to avoid
// the react-shiki container <pre> wrapping Shiki's own <pre> (pre-pre double-wrap).
export function CodeBlock({ language, code }: CodeBlockProps) {
  const { theme } = useChangesStore();
  const shikiTheme = theme === 'dark' ? 'github-dark' : 'github-light';

  const highlighted = useShikiHighlighter(code, language ?? 'text', shikiTheme, {
    colorReplacements: COMMENT_REPLACEMENTS,
  });

  return <div className="text-sm not-prose">{highlighted}</div>;
}
