// @mspec-delta 2026-05-16-052329-artifact-language-config/specs/language-config/spec.md
// Requirements implemented: FR-001, FR-002, FR-003, FR-004
// Change: artifact-language-config

import { readdir } from 'node:fs/promises';

export const DEFAULT_LOCALE = 'ja';

export interface ResolvedLocale {
  locale: string;
  unsupported: boolean;
  requested: string | undefined;
  supported: Set<string>;
}

/** Resolve active locale from config. Never throws — returns {unsupported:true} if unknown.
 *  DEFAULT_LOCALE (ja) and 'en' (universal fallback) are always treated as supported. */
export function resolveLocale(
  config: { locale?: string },
  supported: Set<string>,
): ResolvedLocale {
  // Always include DEFAULT_LOCALE and universal fallback 'en' in the effective supported set
  const effectiveSupported = new Set([DEFAULT_LOCALE, 'en', ...supported]);

  const requested = config.locale;
  if (!requested) {
    return { locale: DEFAULT_LOCALE, unsupported: false, requested: undefined, supported: effectiveSupported };
  }
  if (effectiveSupported.has(requested)) {
    return { locale: requested, unsupported: false, requested, supported: effectiveSupported };
  }
  return { locale: DEFAULT_LOCALE, unsupported: true, requested, supported: effectiveSupported };
}

/** Scan templates dir for *.{locale}.md to discover supported locales (ISO 639-1 lex sort). */
export async function scanSupportedLocales(templatesDir: string): Promise<Set<string>> {
  let entries: string[];
  try {
    entries = await readdir(templatesDir);
  } catch {
    return new Set();
  }

  const localePattern = /^[^.]+\.([a-z]{2})\.md$/;
  const locales = new Set<string>();
  for (const entry of entries) {
    const m = localePattern.exec(entry);
    if (m) locales.add(m[1]!);
  }

  return new Set([...locales].sort());
}
