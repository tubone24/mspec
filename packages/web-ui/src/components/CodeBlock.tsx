// @mspec-delta 2026-05-26-041226-reading-mode-themes/specs/code-syntax-highlight/spec.md
// Requirements implemented: FR-001, FR-002
// Change: reading-mode-themes

import { ShikiHighlighter } from 'react-shiki';
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

export function CodeBlock({ language, code }: CodeBlockProps) {
  const { theme } = useChangesStore();
  const shikiTheme = theme === 'dark' ? 'github-dark' : 'github-light';

  return (
    <ShikiHighlighter
      language={language ?? 'text'}
      theme={shikiTheme}
      colorReplacements={COMMENT_REPLACEMENTS}
      addDefaultStyles={false}
      showLanguage={false}
      className="text-sm"
    >
      {code}
    </ShikiHighlighter>
  );
}
