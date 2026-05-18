// @mspec-delta 2026-05-18-082738-docs-github-pages/specs/docs-site/spec.md
// Requirements implemented: FR-001, FR-002, FR-003, FR-004, FR-005
// Change: docs-github-pages

import { describe, it, expect } from 'vitest'
import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const ROOT = resolve(__dirname, '../../../')
const DOCS = resolve(ROOT, 'docs')
const VITEPRESS = resolve(DOCS, '.vitepress')

describe('T-006: docs/.vitepress/config.ts が存在し VitePress ビルドに必要な設定を持つ (FR-001)', () => {
  it('config.ts が存在する', () => {
    expect(existsSync(resolve(VITEPRESS, 'config.ts'))).toBe(true)
  })

  it('base が /mspec/ に設定されている', () => {
    const content = readFileSync(resolve(VITEPRESS, 'config.ts'), 'utf-8')
    expect(content).toContain("base: '/mspec/'")
  })
})

describe('T-008: package.json に docs:dev スクリプトが存在する (FR-004)', () => {
  it('root package.json が存在する', () => {
    expect(existsSync(resolve(ROOT, 'package.json'))).toBe(true)
  })

  it('docs:dev スクリプトが定義されている', () => {
    const pkg = JSON.parse(readFileSync(resolve(ROOT, 'package.json'), 'utf-8'))
    expect(pkg.scripts?.['docs:dev']).toBeDefined()
    expect(pkg.scripts?.['docs:dev']).toContain('vitepress')
  })

  it('docs:build スクリプトが定義されている', () => {
    const pkg = JSON.parse(readFileSync(resolve(ROOT, 'package.json'), 'utf-8'))
    expect(pkg.scripts?.['docs:build']).toBeDefined()
    expect(pkg.scripts?.['docs:build']).toContain('vitepress build docs')
  })

  it('docs:preview スクリプトが定義されている', () => {
    const pkg = JSON.parse(readFileSync(resolve(ROOT, 'package.json'), 'utf-8'))
    expect(pkg.scripts?.['docs:preview']).toBeDefined()
  })

  it('vitepress が devDependencies に含まれる', () => {
    const pkg = JSON.parse(readFileSync(resolve(ROOT, 'package.json'), 'utf-8'))
    expect(pkg.devDependencies?.['vitepress']).toBeDefined()
  })
})

describe('T-009: config.ts にサイト内検索と Diátaxis 4タブナビが設定されている (FR-003)', () => {
  it('themeConfig.search が local provider で設定されている', () => {
    const content = readFileSync(resolve(VITEPRESS, 'config.ts'), 'utf-8')
    expect(content).toContain('provider: ')
    expect(content).toContain("'local'")
  })

  it('nav に tutorials タブが含まれる', () => {
    const content = readFileSync(resolve(VITEPRESS, 'config.ts'), 'utf-8')
    expect(content).toContain('Tutorials')
    expect(content).toContain('/tutorials/')
  })

  it('nav に how-to タブが含まれる', () => {
    const content = readFileSync(resolve(VITEPRESS, 'config.ts'), 'utf-8')
    expect(content).toContain('How-To')
    expect(content).toContain('/how-to/')
  })

  it('nav に explanation タブが含まれる', () => {
    const content = readFileSync(resolve(VITEPRESS, 'config.ts'), 'utf-8')
    expect(content).toContain('Explanation')
    expect(content).toContain('/explanation/')
  })

  it('nav に reference タブが含まれる', () => {
    const content = readFileSync(resolve(VITEPRESS, 'config.ts'), 'utf-8')
    expect(content).toContain('Reference')
    expect(content).toContain('/reference/')
  })
})

describe('T-010: .github/workflows/deploy-docs.yml が正しい構造を持つ (FR-002)', () => {
  const workflowPath = resolve(ROOT, '.github/workflows/deploy-docs.yml')

  it('deploy-docs.yml が存在する', () => {
    expect(existsSync(workflowPath)).toBe(true)
  })

  it('on.push.branches に main が含まれる', () => {
    const content = readFileSync(workflowPath, 'utf-8')
    expect(content).toContain('branches: [main]')
  })

  it('permissions に pages: write が含まれる', () => {
    const content = readFileSync(workflowPath, 'utf-8')
    expect(content).toContain('pages: write')
  })

  it('permissions に id-token: write が含まれる', () => {
    const content = readFileSync(workflowPath, 'utf-8')
    expect(content).toContain('id-token: write')
  })

  it('upload-pages-artifact が使用されている', () => {
    const content = readFileSync(workflowPath, 'utf-8')
    expect(content).toContain('upload-pages-artifact')
  })

  it('deploy-pages@v4 が使用されている', () => {
    const content = readFileSync(workflowPath, 'utf-8')
    expect(content).toContain('deploy-pages@v4')
  })
})

describe('T-012: docs/public/images/logo.png が存在する (FR-005)', () => {
  it('logo.png が docs/public/images/ に存在する', () => {
    expect(existsSync(resolve(DOCS, 'public/images/logo.png'))).toBe(true)
  })

  it('docs/images/ ディレクトリは削除されている', () => {
    expect(existsSync(resolve(DOCS, 'images'))).toBe(false)
  })

  it('config.ts に logo 設定が含まれる', () => {
    const content = readFileSync(resolve(VITEPRESS, 'config.ts'), 'utf-8')
    expect(content).toContain('/images/logo.png')
  })
})
