// @mspec-delta 2026-05-16-052329-artifact-language-config/specs/artifact-templates-i18n/spec.md
// Requirements implemented: FR-001, FR-002, FR-003, FR-004
// Change: artifact-language-config

import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import pc from 'picocolors';

export interface ResolvedTemplate {
  content: string;
  usedLocale: string;
  fellBack: boolean;
}

export class TemplateNotFoundError extends Error {
  constructor(artifact: string, locale: string) {
    super(`TemplateNotFoundError: no template found for "${artifact}" (locale: ${locale})`);
    this.name = 'TemplateNotFoundError';
  }
}

const warnedCache = new Set<string>();

/** Reset warning dedup cache (for testing). */
export function resetWarningCache(): void {
  warnedCache.clear();
}

async function tryRead(path: string): Promise<string | null> {
  try {
    return await readFile(path, 'utf8');
  } catch {
    return null;
  }
}

/** Resolve <artifact>.<locale>.md → <artifact>.en.md → <artifact>.md (legacy). */
export async function resolveTemplate(
  artifact: string,
  locale: string,
  templatesDir: string,
): Promise<ResolvedTemplate> {
  // 1. Exact locale match
  const localePath = join(templatesDir, `${artifact}.${locale}.md`);
  const localeContent = await tryRead(localePath);
  if (localeContent !== null) {
    return { content: localeContent, usedLocale: locale, fellBack: false };
  }

  // 2. English fallback
  const enPath = join(templatesDir, `${artifact}.en.md`);
  const enContent = await tryRead(enPath);
  if (enContent !== null) {
    emitFallbackWarning(artifact, locale, 'en');
    return { content: enContent, usedLocale: 'en', fellBack: true };
  }

  // 3. Legacy fallback (<artifact>.md — Phase A compatibility)
  const legacyPath = join(templatesDir, `${artifact}.md`);
  const legacyContent = await tryRead(legacyPath);
  if (legacyContent !== null) {
    emitFallbackWarning(artifact, locale, 'legacy');
    return { content: legacyContent, usedLocale: locale, fellBack: true };
  }

  throw new TemplateNotFoundError(artifact, locale);
}

/** Emit a fallback warning to stderr (deduplicated per (locale, artifact) pair). */
export function emitFallbackWarning(artifact: string, requested: string, used: string): void {
  const key = `${requested}:${artifact}`;
  if (warnedCache.has(key)) return;
  warnedCache.add(key);
  process.stderr.write(
    pc.yellow(
      `missing template: ${artifact} for locale '${requested}', falling back to '${used}'\n`,
    ),
  );
}
