import { mkdir, writeFile, readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import pc from 'picocolors';
import { projectPaths } from '../workflow/paths.js';
import { fileExists } from '../lib/change-discovery.js';

function constitutionTemplatePath(): string {
  const here = dirname(fileURLToPath(import.meta.url));
  return here.endsWith('commands')
    ? join(here, '..', '..', 'templates', 'constitution.md')
    : join(here, '..', 'templates', 'constitution.md');
}

export async function constitutionInitCommand(): Promise<void> {
  const paths = projectPaths(process.cwd());
  if (await fileExists(paths.constitutionFile)) {
    throw new Error(`already exists: ${paths.constitutionFile} (use \`mspec constitution show\` to view)`);
  }
  await mkdir(paths.memoryDir, { recursive: true });
  const template = await readFile(constitutionTemplatePath(), 'utf8').catch(
    () => DEFAULT_CONSTITUTION,
  );
  await writeFile(paths.constitutionFile, template, 'utf8');
  console.log(`${pc.green('✓')} ${paths.constitutionFile}`);
  console.log(`  ${pc.gray('edit this file to define your project principles')}`);
}

export async function constitutionShowCommand(): Promise<void> {
  const paths = projectPaths(process.cwd());
  if (!(await fileExists(paths.constitutionFile))) {
    throw new Error(
      `${paths.constitutionFile} not found. Run \`mspec constitution init\` first.`,
    );
  }
  const raw = await readFile(paths.constitutionFile, 'utf8');
  process.stdout.write(raw);
}

const DEFAULT_CONSTITUTION = `# Project Constitution

> Version: 1.0.0
> Ratified: ${new Date().toISOString().slice(0, 10)}
> Last Amended: ${new Date().toISOString().slice(0, 10)}

## Core Principles

### I. <Principle Name>
<本文を編集してください>

### II. <Principle Name>
<本文を編集してください>

## Additional Constraints

- セキュリティ:
- パフォーマンス:
- コンプライアンス:

## Development Workflow & Governance

<改訂手順とレビュー方針>
`;
