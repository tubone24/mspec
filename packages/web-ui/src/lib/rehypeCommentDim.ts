// @mspec-delta 2026-05-26-041226-reading-mode-themes/specs/code-syntax-highlight/spec.md
// Requirements implemented: FR-003
// Change: reading-mode-themes

import { visit } from 'unist-util-visit';
import type { Root, Element, Text } from 'hast';

export default function rehypeCommentDim() {
  return (tree: Root) => {
    visit(tree, 'comment', (node, index, parent) => {
      if (!parent || typeof index !== 'number') return;

      const span: Element = {
        type: 'element',
        tagName: 'span',
        properties: { className: ['md-comment'] },
        children: [{ type: 'text', value: `<!-- ${(node as unknown as { value: string }).value} -->` } as Text],
      };

      parent.children.splice(index, 1, span);
    });
  };
}
