// @mspec-delta 2026-05-27-062657-spec-viewer-fulltext-search/specs/spec-viewer-search/spec.md
// Requirements implemented: FR-006
// Change: spec-viewer-fulltext-search

import { visit } from 'unist-util-visit';
import type { Root, Text, Element, ElementContent } from 'hast';

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function splitWithMark(text: string, regex: RegExp): ElementContent[] {
  const parts: ElementContent[] = [];
  let last = 0;
  let match: RegExpExecArray | null;
  regex.lastIndex = 0;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > last) {
      parts.push({ type: 'text', value: text.slice(last, match.index) });
    }
    const mark: Element = {
      type: 'element',
      tagName: 'mark',
      properties: {},
      children: [{ type: 'text', value: match[0] }],
    };
    parts.push(mark);
    last = match.index + match[0].length;
  }

  if (last < text.length) {
    parts.push({ type: 'text', value: text.slice(last) });
  }

  return parts;
}

// D-09: must be placed AFTER rehypeGherkinEars in rehypePlugins array
export function rehypeMarkText(query: string) {
  return (tree: Root) => {
    if (!query.trim()) return;

    const regex = new RegExp(escapeRegExp(query), 'gi');

    visit(tree, 'text', (node: Text, index, parent) => {
      if (!parent || typeof index !== 'number') return;
      if (!regex.test(node.value)) { regex.lastIndex = 0; return; }
      regex.lastIndex = 0;

      // D-06: skip pre/code subtrees and language-mermaid blocks
      const parentEl = parent as Element;
      if (parentEl.tagName === 'code' || parentEl.tagName === 'pre') return;
      if (
        Array.isArray(parentEl.properties?.className) &&
        (parentEl.properties.className as string[]).some((c) => c.includes('language-mermaid'))
      ) return;

      const tokens = splitWithMark(node.value, regex);
      if (tokens.length <= 1 && tokens[0]?.type === 'text') return;

      parent.children.splice(index, 1, ...tokens);
      return index + tokens.length;
    });
  };
}
