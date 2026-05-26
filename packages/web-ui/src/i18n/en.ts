// @mspec-delta 2026-05-24-130128-mspec-web-ui/specs/artifact-preview/spec.md
// Requirements implemented: FR-001
// Change: mspec-web-ui
// @mspec-delta 2026-05-26-083855-web-ui-enhancements/specs/change-dashboard/spec.md
// Requirements implemented: FR-008, FR-009
// Change: web-ui-enhancements

export const en = {
  dashboard: {
    title: 'MSPEC Dashboard',
    filter: {
      all: 'All',
      full: 'Full-flow',
      bugfix: 'Bugfix',
      minor: 'Minor',
      typo: 'Typo',
    },
    columns: {
      change: 'Change',
      mode: 'Mode',
      currentStep: 'Current Step',
      progress: 'Progress',
    },
    noChanges: 'No active changes found.',
    showArchived: 'Show archived',
    archivedBadge: 'Archived',
    specViewer: 'Spec Viewer',
  },
  specViewer: {
    title: 'Spec Viewer',
    selectCapability: 'Select a capability',
  },
  changeDetail: {
    artifacts: 'Artifacts',
    testResults: 'Test Results',
    back: '← Back to Dashboard',
  },
  artifactPreview: {
    loading: 'Loading…',
    error: 'Failed to load artifact.',
    darkMode: 'Dark',
    lightMode: 'Light',
  },
  testResults: {
    title: 'Test Results',
    pass: 'pass',
    fail: 'fail',
    skip: 'skip',
    noResults: 'No test results found.',
    stackTrace: 'Stack Trace',
  },
  theme: {
    toggle: 'Toggle theme',
  },
} as const;

export type I18nKeys = typeof en;
