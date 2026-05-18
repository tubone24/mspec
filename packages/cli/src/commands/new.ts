// @mspec-delta 2026-05-15-063805-fix-command-name-consistency/specs/cli-core/spec.md
// Requirements implemented: FR-001
// Change: fix-command-name-consistency
// @mspec-delta 2026-05-14-063708-diataxis-artifact-structure/specs/artifact-taxonomy/spec.md
// Requirements implemented: FR-003
// Change: diataxis-artifact-structure

// @mspec-delta 2026-05-16-052329-artifact-language-config/specs/language-config/spec.md
// Requirements implemented: FR-001, FR-002, FR-004
// Change: artifact-language-config

// @mspec-delta 2026-05-18-044538-revise-artifact-taxonomy/specs/artifact-taxonomy/spec.md
// Requirements implemented: FR-005
// Change: revise-artifact-taxonomy

import { mkdir, writeFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import pc from 'picocolors';
import { projectPaths } from '../workflow/paths.js';
import { dirExists } from '../lib/change-discovery.js';
import { makeChangeDirName } from '../lib/datetime.js';
import { loadConfig } from '../workflow/config-loader.js';
import { resolveTemplate } from '../lib/template-resolver.js';

const FEATURE_RE = /^[a-z][a-z0-9-]*$/;

export interface NewOptions {
  request?: string;
  cwd?: string;
}

function defaultTemplatesArtifactsDir(cwd: string): string {
  const here = dirname(fileURLToPath(import.meta.url));
  const pkgTpl = here.endsWith('commands')
    ? join(here, '..', '..', 'templates', 'artifacts')
    : join(here, '..', 'templates', 'artifacts');
  // Check for user overrides in .mspec/templates/artifacts
  return join(cwd, '.mspec', 'templates', 'artifacts');
}

async function resolveArtifactTemplate(
  artifact: string,
  locale: string,
  cwd: string,
): Promise<string> {
  // 1. Try user override dir (.mspec/templates/artifacts/)
  const userDir = join(cwd, '.mspec', 'templates', 'artifacts');
  const here = dirname(fileURLToPath(import.meta.url));
  const pkgDir = here.endsWith('commands')
    ? join(here, '..', '..', 'templates', 'artifacts')
    : join(here, '..', 'templates', 'artifacts');

  try {
    return (await resolveTemplate(artifact, locale, userDir)).content;
  } catch {
    // fall through to package templates
  }
  return (await resolveTemplate(artifact, locale, pkgDir)).content;
}

export async function newCommand(feature: string, opts: NewOptions = {}): Promise<void> {
  if (!FEATURE_RE.test(feature)) {
    throw new Error(`feature name must be kebab-case (lowercase, hyphens): "${feature}"`);
  }

  const cwd = opts.cwd ?? process.cwd();
  const paths = projectPaths(cwd);
  if (!(await dirExists(paths.mspecDir))) {
    throw new Error('.mspec/ not found. Run `mspec init` first.');
  }

  let locale = 'ja';
  try {
    const config = await loadConfig(paths.configFile);
    locale = config.resolvedLocale.locale;
  } catch {
    // config.yaml missing or invalid — use default locale
  }

  const changeName = makeChangeDirName(feature);
  const changeDir = join(paths.changesDir, changeName);

  if (await dirExists(changeDir)) {
    throw new Error(`change directory already exists: ${changeDir}`);
  }

  await mkdir(changeDir, { recursive: true });

  const today = new Date().toISOString().slice(0, 10);
  const readmeContent = await resolveArtifactTemplate('readme', locale, cwd)
    .catch(() => buildReadmeFallback(changeName, opts.request));
  const glossaryContent = await resolveArtifactTemplate('glossary', locale, cwd)
    .catch(() => buildGlossaryFallback(changeName));

  await writeFile(
    join(changeDir, 'readme.md'),
    readmeContent
      .replace(/{{changeName}}/g, changeName)
      .replace(/{{request}}/g, opts.request ?? '<ユーザーの元の要求を 1-3 行で要約>')
      .replace(/__TODAY__/g, today),
    'utf8',
  );
  await writeFile(join(changeDir, 'glossary.md'), glossaryContent, 'utf8');

  console.log(`${pc.green('✓')} Created ${pc.cyan(changeName)}`);
  console.log(`  ${pc.gray('next: run /mspec:proposal')}`);
}

function buildReadmeFallback(changeName: string, request?: string): string {
  const today = new Date().toISOString().slice(0, 10);
  return `# ${changeName}

> Status: new
> Created: ${today}

## Request

${request ?? '<ユーザーの元の要求を 1-3 行で要約>'}

## Artifacts

- [ ] glossary.md
- [ ] proposal.md
- [ ] specs/<capability>/spec.md (Delta Spec)
- [ ] research.md
- [ ] design.md / architecture-overview.md
- [ ] design-rationale.md
- [ ] quickstart.md
- [ ] checklist.md
- [ ] tasks.md

## Skipped Steps

<!-- \`mspec skip <step-id> --reason "..."\` 実行時に追記される -->

## Summary (Lessons / Next Steps)

<!-- archive ステップで AI が生成 -->
`;
}

function buildGlossaryFallback(changeName: string): string {
  return `---
doc_type: Reference
---

# Glossary: ${changeName}

> この glossary.md はチェンジ内の全成果物が共有する用語の単一ソースです。
> 各成果物の用語定義はここへのリンクで代替してください。

## Terms

| 用語 | 定義 |
|------|------|
| <term> | <definition> |
`;
}
