// @mspec-delta 2026-05-21-055911-ui-visual-mock-workflow/specs/visual-mock/spec.md
// Requirements implemented: FR-003
// Change: ui-visual-mock-workflow

/**
 * Minimal interactive prompt using raw stdin/stdout. No external deps.
 * Returns the user's input (without trailing newline). Returns empty string if no TTY.
 */
export function ask(question: string): Promise<string> {
  return new Promise((resolve) => {
    if (!process.stdin.isTTY) {
      resolve('');
      return;
    }
    process.stdout.write(question);
    let buf = '';
    const onData = (chunk: Buffer): void => {
      const s = chunk.toString('utf8');
      for (const ch of s) {
        if (ch === '\n' || ch === '\r') {
          process.stdin.removeListener('data', onData);
          process.stdin.pause();
          resolve(buf);
          return;
        }
        buf += ch;
      }
    };
    process.stdin.resume();
    process.stdin.on('data', onData);
  });
}

/** Collects multiline input until a blank line (Enter only). Returns empty string if no TTY. */
export function askMultiline(prompt: string): Promise<string> {
  return new Promise((resolve) => {
    if (!process.stdin.isTTY) {
      resolve('');
      return;
    }
    process.stdout.write(prompt + '\n');
    const lines: string[] = [];
    let buf = '';

    const onData = (chunk: Buffer): void => {
      const s = chunk.toString('utf8');
      for (const ch of s) {
        if (ch === '\n' || ch === '\r') {
          if (buf === '') {
            process.stdin.removeListener('data', onData);
            process.stdin.pause();
            resolve(lines.join('\n'));
            return;
          }
          lines.push(buf);
          buf = '';
        } else {
          buf += ch;
        }
      }
    };

    process.stdin.resume();
    process.stdin.on('data', onData);
  });
}
