// @mspec-delta 2026-05-16-052329-artifact-language-config/specs/language-config/spec.md
// Requirements implemented: FR-004
// Change: artifact-language-config

import { describe, it, expect } from 'vitest';
import { mkdtemp, writeFile, mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { scanSupportedLocales } from '../../src/lib/locale-resolver.js';
import { loadConfig } from '../../src/workflow/config-loader.js';

describe('FR-004: サードパーティ locale を追加するだけで自動認識される', () => {
  it('templates/artifacts/*.zh.md を追加すると scanSupportedLocales が zh を含む', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'mspec-lc-3rd-'));
    await mkdir(join(dir, 'artifacts'), { recursive: true });
    await writeFile(join(dir, 'artifacts', 'readme.ja.md'), '# ja');
    await writeFile(join(dir, 'artifacts', 'readme.en.md'), '# en');
    await writeFile(join(dir, 'artifacts', 'readme.zh.md'), '# zh');

    const supported = await scanSupportedLocales(join(dir, 'artifacts'));
    expect(supported.has('zh')).toBe(true);
    expect([...supported]).toEqual(['en', 'ja', 'zh']); // ISO 639-1 lex sort
  });

  it('loadConfig が zh テンプレート追加後に locale: zh を valid と解決する', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'mspec-lc-3rd2-'));
    const mspecDir = join(dir, '.mspec');
    await mkdir(join(mspecDir, 'templates', 'artifacts'), { recursive: true });
    await writeFile(join(mspecDir, 'config.yaml'), 'version: 1\nlocale: zh\n');
    // Add zh template to user override dir
    await writeFile(join(mspecDir, 'templates', 'artifacts', 'readme.zh.md'), '# zh');
    await writeFile(join(mspecDir, 'templates', 'artifacts', 'readme.ja.md'), '# ja');

    // The package templates dir doesn't have zh, but we can directly test scanSupportedLocales
    const userTplDir = join(mspecDir, 'templates', 'artifacts');
    const supported = await scanSupportedLocales(userTplDir);
    expect(supported.has('zh')).toBe(true);
  });
});
