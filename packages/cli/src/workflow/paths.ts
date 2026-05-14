import { join, resolve } from 'node:path';

export interface ProjectPaths {
  root: string;
  mspecDir: string;
  configFile: string;
  workflowFile: string;
  questionsDir: string;
  cacheDir: string;
  specsDir: string;
  changesDir: string;
  changesArchiveDir: string;
  memoryDir: string;
  constitutionFile: string;
}

export function projectPaths(root: string): ProjectPaths {
  const r = resolve(root);
  return {
    root: r,
    mspecDir: join(r, '.mspec'),
    configFile: join(r, '.mspec', 'config.yaml'),
    workflowFile: join(r, '.mspec', 'workflow.yaml'),
    questionsDir: join(r, '.mspec', 'questions'),
    cacheDir: join(r, '.mspec', 'cache'),
    specsDir: join(r, 'specs'),
    changesDir: join(r, 'changes'),
    changesArchiveDir: join(r, 'changes', 'archive'),
    memoryDir: join(r, 'memory'),
    constitutionFile: join(r, 'memory', 'constitution.md'),
  };
}

export function changeDir(paths: ProjectPaths, changeName: string): string {
  return join(paths.changesDir, changeName);
}

export function archivedChangeDir(paths: ProjectPaths, changeName: string): string {
  return join(paths.changesArchiveDir, changeName);
}
