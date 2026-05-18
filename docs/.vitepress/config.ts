// @mspec-delta 2026-05-18-082738-docs-github-pages/specs/docs-site/spec.md
// Requirements implemented: FR-001, FR-003, FR-004, FR-005
// Change: docs-github-pages

import { defineConfig } from 'vitepress'

export default defineConfig({
  base: '/mspec/',
  title: 'mspec',
  description: 'Spec-Driven Development framework CLI for Claude Code',
  ignoreDeadLinks: true,
  themeConfig: {
    logo: '/images/logo.png',
    nav: [
      { text: 'Tutorials', link: '/tutorials/getting-started' },
      { text: 'How-To', link: '/how-to/customize-workflow' },
      { text: 'Explanation', link: '/explanation/why-mspec' },
      { text: 'Reference', link: '/reference/cli' },
    ],
    sidebar: {
      '/tutorials/': [
        { text: 'Getting Started', link: '/tutorials/getting-started' },
      ],
      '/how-to/': [
        { text: 'Customize Workflow', link: '/how-to/customize-workflow' },
        { text: 'Fix Anchor Errors', link: '/how-to/fix-anchor-errors' },
        { text: 'Lightweight Changes', link: '/how-to/lightweight-changes' },
      ],
      '/explanation/': [
        { text: 'Why mspec?', link: '/explanation/why-mspec' },
      ],
      '/reference/': [
        { text: 'CLI', link: '/reference/cli' },
        { text: 'Anchors', link: '/reference/anchors' },
        { text: 'Configuration', link: '/reference/configuration' },
        { text: 'Doc Types', link: '/reference/doc-types' },
        { text: 'Workflow', link: '/reference/workflow' },
      ],
    },
    search: { provider: 'local' },
    socialLinks: [
      { icon: 'github', link: 'https://github.com/tubone24/mspec' },
    ],
  },
})
