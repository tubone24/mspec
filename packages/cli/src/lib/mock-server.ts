// @mspec-delta 2026-05-21-055911-ui-visual-mock-workflow/specs/visual-mock/spec.md
// Requirements implemented: FR-002
// Change: ui-visual-mock-workflow

import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';
import { readFile, access } from 'node:fs/promises';
import { join, extname } from 'node:path';

const MIME: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
};

export async function findFreePort(start: number): Promise<number> {
  for (let port = start; port < start + 10; port++) {
    if (await isPortFree(port)) return port;
  }
  throw new Error(`No free port found in range ${start}–${start + 9}`);
}

export async function startMockServer(
  mockDir: string,
  preferredPort = 3737,
): Promise<{ port: number; close: () => void }> {
  const port = await findFreePort(preferredPort);

  const server = createServer(async (req: IncomingMessage, res: ServerResponse) => {
    const urlPath = req.url === '/' || !req.url ? '/index.html' : req.url;
    const filePath = join(mockDir, urlPath.replace(/^\//, ''));

    try {
      await access(filePath);
      const data = await readFile(filePath);
      const mime = MIME[extname(filePath)] ?? 'application/octet-stream';
      res.writeHead(200, { 'Content-Type': mime });
      res.end(data);
    } catch {
      res.writeHead(404);
      res.end('Not found');
    }
  });

  await new Promise<void>((resolve) => server.listen(port, resolve));

  return {
    port,
    close: () => {
      server.close();
    },
  };
}

function isPortFree(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const probe = createServer();
    probe.once('error', () => resolve(false));
    probe.once('listening', () => {
      probe.close(() => resolve(true));
    });
    probe.listen(port);
  });
}
