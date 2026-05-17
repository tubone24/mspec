/**
 * Utility functions that replace regions of text with equal-length whitespace
 * so downstream line/column offsets remain valid after masking.
 */

/**
 * Blank out all HTML comment blocks (`<!-- ... -->`).
 * Newlines within the comment are preserved as `\n`; all other characters
 * become spaces, keeping every line length identical to the original.
 */
export function blankOutHtmlComments(input: string): string {
  return blankOutRegex(input, /<!--[\s\S]*?-->/g);
}

/**
 * Blank out fenced code blocks. Supports ``` and ~~~ fences. The fence
 * open/close lines themselves are also blanked so language hints are not
 * scanned by callers.
 */
export function blankOutFences(input: string): string {
  const lines = input.split('\n');
  let inFence = false;
  let fenceChar: '`' | '~' | null = null;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i] ?? '';
    const open = line.match(/^(\s*)(`{3,}|~{3,})/);
    if (open) {
      const marker = open[2]![0] as '`' | '~';
      if (!inFence) {
        inFence = true;
        fenceChar = marker;
        lines[i] = blankLine(line);
        continue;
      } else if (marker === fenceChar) {
        inFence = false;
        fenceChar = null;
        lines[i] = blankLine(line);
        continue;
      }
    }
    if (inFence) lines[i] = blankLine(line);
  }
  return lines.join('\n');
}

function blankOutRegex(input: string, re: RegExp): string {
  return input.replace(re, (chunk) =>
    chunk
      .split('')
      .map((ch) => (ch === '\n' ? '\n' : ' '))
      .join(''),
  );
}

function blankLine(line: string): string {
  return ' '.repeat(line.length);
}
