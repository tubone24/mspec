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
