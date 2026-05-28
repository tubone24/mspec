// @mspec-delta 2026-05-26-041226-reading-mode-themes/specs/web-ui-themes/spec.md
// Requirements implemented: FR-002
// Change: reading-mode-themes

import { visit } from 'unist-util-visit';
import type { Root, Text, Element, ElementContent } from 'hast';

interface Rule {
  re: RegExp;
  cls: string;
}

// Order matters: longer patterns first to avoid partial matches
const RULES: Rule[] = [
  { re: /\b(MUST NOT)\b/g,   cls: 'k-must-not' },
  { re: /\b(SHOULD NOT)\b/g, cls: 'k-should-not' },
  { re: /\b(SHALL)\b/g,      cls: 'k-shall' },
  { re: /\b(MUST)\b/g,       cls: 'k-must' },
  { re: /\b(SHOULD)\b/g,     cls: 'k-should' },
  { re: /\b(MAY)\b/g,        cls: 'k-may' },
  { re: /\b(GIVEN)\b/g,      cls: 'k-given' },
  { re: /\b(WHEN)\b/g,       cls: 'k-when' },
  { re: /\b(THEN)\b/g,       cls: 'k-then' },
  { re: /\b(AND)\b/g,        cls: 'k-and' },
  { re: /\b(BUT)\b/g,        cls: 'k-but' },
];

const HAS_KEYWORD =
  /\b(SHALL|MUST NOT|MUST|SHOULD NOT|SHOULD|MAY|GIVEN|WHEN|THEN|AND|BUT)\b/;

function tokenize(text: string): ElementContent[] {
  const result: ElementContent[] = [];
  let remaining = text;

  while (remaining.length > 0) {
    let earliest: { index: number; match: string; cls: string } | null = null;

    for (const rule of RULES) {
      rule.re.lastIndex = 0;
      const m = rule.re.exec(remaining);
      if (m && (earliest === null || m.index < earliest.index)) {
        earliest = { index: m.index, match: m[0], cls: rule.cls };
      }
    }

    if (!earliest) {
      result.push({ type: 'text', value: remaining });
      break;
    }

    if (earliest.index > 0) {
      result.push({ type: 'text', value: remaining.slice(0, earliest.index) });
    }

    const span: Element = {
      type: 'element',
      tagName: 'span',
      properties: { className: ['k', earliest.cls] },
      children: [{ type: 'text', value: earliest.match }],
    };
    result.push(span);

    remaining = remaining.slice(earliest.index + earliest.match.length);
  }

  return result;
}

export default function rehypeGherkinEars() {
  return (tree: Root) => {
    const taggedParents = new WeakSet<object>();
    visit(tree, 'text', (node: Text, index, parent) => {
      if (!parent || typeof index !== 'number') return;
      if (!HAS_KEYWORD.test(node.value)) return;

      // Skip inside <code> and <pre> — Shiki handles those
      const parentEl = parent as Element;
      if (parentEl.tagName === 'code' || parentEl.tagName === 'pre') return;

      const tokens = tokenize(node.value);
      if (tokens.length <= 1 && tokens[0]?.type === 'text') return;

      // Mark parent element with data-testid for E2E detection (once per element)
      if (!taggedParents.has(parent)) {
        parentEl.properties = parentEl.properties ?? {};
        if (!parentEl.properties['data-testid']) {
          parentEl.properties['data-testid'] = 'gherkin-highlight';
        }
        taggedParents.add(parent);
      }

      parent.children.splice(index, 1, ...tokens);
      return index + tokens.length;
    });
  };
}
