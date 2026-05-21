// @mspec-delta 2026-05-21-055911-ui-visual-mock-workflow/specs/visual-mock/spec.md
// Requirements implemented: FR-001
// Change: ui-visual-mock-workflow

import { readFile, access } from 'node:fs/promises';
import { join } from 'node:path';

export type FrameworkInfo = {
  name: 'material-ui' | 'tailwind' | 'bootstrap' | 'chakra' | 'antd' | 'none';
  cdnSnippet?: string;
  promptHint: string;
};

const NONE: FrameworkInfo = {
  name: 'none',
  promptHint: 'plain HTML and CSS without any framework',
};

export async function detectFramework(projectRoot: string): Promise<FrameworkInfo> {
  const pkgPath = join(projectRoot, 'package.json');
  let deps: Record<string, unknown> = {};

  try {
    const raw = await readFile(pkgPath, 'utf8');
    const pkg = JSON.parse(raw) as {
      dependencies?: Record<string, unknown>;
      devDependencies?: Record<string, unknown>;
    };
    deps = { ...(pkg.dependencies ?? {}), ...(pkg.devDependencies ?? {}) };
  } catch {
    return NONE;
  }

  if ('@mui/material' in deps) {
    return { name: 'material-ui', promptHint: 'Material UI (MUI) v5+ components and styling' };
  }
  if ('tailwindcss' in deps || (await hasTailwindConfig(projectRoot))) {
    return { name: 'tailwind', promptHint: 'Tailwind CSS utility classes' };
  }
  if ('bootstrap' in deps) {
    return { name: 'bootstrap', promptHint: 'Bootstrap 5 classes and components' };
  }
  if ('@chakra-ui/react' in deps) {
    return { name: 'chakra', promptHint: 'Chakra UI components' };
  }
  if ('antd' in deps) {
    return { name: 'antd', promptHint: 'Ant Design components' };
  }

  return NONE;
}

async function hasTailwindConfig(projectRoot: string): Promise<boolean> {
  for (const ext of ['js', 'ts', 'mjs', 'cjs']) {
    try {
      await access(join(projectRoot, `tailwind.config.${ext}`));
      return true;
    } catch {
      // continue
    }
  }
  return false;
}
