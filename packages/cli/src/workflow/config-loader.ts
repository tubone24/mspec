import { readFile } from 'node:fs/promises';
import { parse as parseYaml } from 'yaml';
import { ConfigSchema, type Config } from '../types/index.js';

export class ConfigError extends Error {}

export async function loadConfig(path: string): Promise<Config> {
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
  return result.data;
}
