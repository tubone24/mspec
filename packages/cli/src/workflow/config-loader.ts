// @mspec-delta 2026-05-16-052329-artifact-language-config/specs/language-config/spec.md
// Requirements implemented: FR-001, FR-002, FR-003
// Change: artifact-language-config

import { readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse as parseYaml } from 'yaml';
import { ConfigSchema, type Config } from '../types/index.js';
import { resolveLocale, scanSupportedLocales, type ResolvedLocale } from '../lib/locale-resolver.js';

export class ConfigError extends Error {}

export interface LoadedConfig extends Config {
  resolvedLocale: ResolvedLocale;
}

function defaultTemplatesArtifactsDir(): string {
  const here = dirname(fileURLToPath(import.meta.url));
  return here.endsWith('workflow')
    ? join(here, '..', '..', 'templates', 'artifacts')
    : join(here, '..', 'templates', 'artifacts');
}

export async function loadConfig(path: string): Promise<LoadedConfig> {
  let raw: string;
  try {
    raw = await readFile(path, 'utf8');
  } catch {
    throw new ConfigError(`.mspec/config.yaml not found at ${path}`);
  }

  let parsed: unknown;
  try {
    parsed = parseYaml(raw);
  } catch (e) {
    throw new ConfigError(`config.yaml is not valid YAML: ${(e as Error).message}`);
  }

  const result = ConfigSchema.safeParse(parsed);
  if (!result.success) {
    throw new ConfigError(
      `config.yaml is invalid:\n${result.error.errors
        .map((e) => `  ${e.path.join('.')}: ${e.message}`)
        .join('\n')}`,
    );
  }

  const config = result.data;
  const tplDir = defaultTemplatesArtifactsDir();
  const supported = await scanSupportedLocales(tplDir);
  const resolvedLocale = resolveLocale(config, supported);

  return { ...config, resolvedLocale };
}
