import { defineConfig } from 'tsup';

export default defineConfig({
  entry: { index: 'src/index.ts', 'server-process': 'src/server/server-process.ts' },
  format: ['esm'],
  target: 'node18',
  outDir: 'dist',
  clean: true,
  splitting: false,
  sourcemap: true,
  minify: false,
  shims: true,
  banner: {
    js: '#!/usr/bin/env node',
  },
});
