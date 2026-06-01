// @mspec-delta 2026-05-29-133745-fix-e2e-flakiness-verify-cmd-auto-execute/specs/artifact-preview/spec.md
// Requirements implemented: FR-014
// Change: fix-e2e-flakiness-verify-cmd-auto-execute

import type { FastifyInstance } from 'fastify';
import { spawn } from 'node:child_process';

interface RunCmdBody {
  cmd: string;
}

interface RunCmdResponse {
  exitCode: number;
  stdout: string;
  stderr: string;
}

export async function registerRunCmdRoute(app: FastifyInstance, root: string): Promise<void> {
  app.post<{ Body: RunCmdBody }>('/api/run-cmd', async (request, reply) => {
    const { cmd } = request.body;

    if (!cmd || typeof cmd !== 'string') {
      return reply.code(400).send({ error: 'cmd is required' });
    }

    const tokens = cmd.trim().split(/\s+/);
    if (tokens[0] !== 'mspec') {
      return reply.code(403).send({ error: 'forbidden: only mspec commands are allowed' });
    }

    return new Promise<RunCmdResponse>((resolve, reject) => {
      let stdout = '';
      let stderr = '';

      const child = spawn(tokens[0]!, tokens.slice(1), {
        shell: false,
        cwd: root,
      });

      child.stdout.on('data', (chunk: Buffer) => {
        stdout += chunk.toString();
      });

      child.stderr.on('data', (chunk: Buffer) => {
        stderr += chunk.toString();
      });

      child.on('close', (code) => {
        resolve({ exitCode: code ?? 1, stdout, stderr });
      });

      child.on('error', (err) => {
        reject(err);
      });
    }).then(
      (result) => reply.code(200).send(result),
      (err: Error) => reply.code(500).send({ error: err.message }),
    );
  });
}
