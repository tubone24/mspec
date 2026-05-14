import { unified } from 'unified';
import remarkParse from 'remark-parse';
import { toString as mdastToString } from 'mdast-util-to-string';
import type { Root, Heading, Content } from 'mdast';

export function parseMd(source: string): Root {
  return unified().use(remarkParse).parse(source) as Root;
}

export function headingText(node: Heading): string {
  return mdastToString(node).trim();
}

/**
 * Split a document into sections by a given heading depth.
 * Each section starts at a heading of `targetDepth` and continues until the next
 * heading of the same or smaller depth.
 */
export interface MdSection {
  heading: string;
  depth: number;
  startLine: number;
  endLine: number;
  children: Content[];
}

export function sectionsByDepth(root: Root, targetDepth: number): MdSection[] {
  const out: MdSection[] = [];
  const children = root.children;

  for (let i = 0; i < children.length; i++) {
    const node = children[i] as Content;
    if (node.type !== 'heading' || (node as Heading).depth !== targetDepth) continue;

    const heading = node as Heading;
    const start = heading.position?.start.line ?? -1;
    const inner: Content[] = [];
    let endLine = heading.position?.end.line ?? start;

    for (let j = i + 1; j < children.length; j++) {
      const next = children[j] as Content;
      if (next.type === 'heading' && (next as Heading).depth <= targetDepth) break;
      inner.push(next);
      endLine = next.position?.end.line ?? endLine;
    }

    out.push({
      heading: headingText(heading),
      depth: targetDepth,
      startLine: start,
      endLine,
      children: inner,
    });
  }

  return out;
}

/**
 * Reconstruct the raw markdown lines for a given section using the original source.
 */
export function sliceSource(source: string, startLine: number, endLine: number): string {
  const lines = source.split(/\r?\n/);
  return lines.slice(startLine - 1, endLine).join('\n');
}
