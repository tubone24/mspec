// @mspec-delta 2026-05-16-052329-artifact-language-config/specs/language-config/spec.md
// Requirements implemented: FR-001, FR-002, FR-003, FR-004
// Change: artifact-language-config

// @mspec-delta 2026-05-27-032635-multi-test-runner-support/specs/cli-test-tdd/spec.md
// Requirements implemented: FR-010
// Change: multi-test-runner-support

import { z } from 'zod';

export const RunnerSchema = z.object({
  name: z.string().min(1),
  command: z.string().min(1),
  cwd: z.string().optional(),
  expect_red_on_exit: z.array(z.number().int()).optional(),
  expect_green_on_exit: z.array(z.number().int()).optional(),
  results_src: z.string().optional(),
});
export type Runner = z.infer<typeof RunnerSchema>;

export const TestConfigSchema = z.object({
  /**
   * Shell command for running tests. Empty string means "not yet configured" —
   * `mspec test` will prompt the user interactively on first invocation and persist
   * the answer back to config.yaml.
   */
  command: z.string().default(''),
  expect_red_on_exit: z.array(z.number().int()).default([1, 2]),
  expect_green_on_exit: z.array(z.number().int()).default([0]),
  /**
   * Path to the test results file produced by the test runner (relative to project root).
   * When set, `mspec test expect-red/green` automatically copies the file to
   * `changes/<change-id>/e2e-results/<basename>` after each run.
   * Supports glob patterns (e.g. "packages/web-ui/test-results/*.json").
   */
  results_src: z.string().optional(),
  runners: z.array(RunnerSchema).optional(),
});

export const ProjectConfigSchema = z.object({
  default_capability: z.string().optional(),
  language: z.string().optional(),
});

export const ClaudeIntegrationSchema = z.object({
  enabled: z.boolean().default(true),
  subagents: z.boolean().default(true),
});

export const IntegrationsSchema = z.object({
  claude: ClaudeIntegrationSchema.optional(),
});

export const ConfigSchema = z.object({
  version: z.literal(1),
  locale: z.string().regex(/^[a-z]{2}$/).optional(),
  test: TestConfigSchema.optional(),
  project: ProjectConfigSchema.optional(),
  integrations: IntegrationsSchema.optional(),
});
export type Config = z.infer<typeof ConfigSchema>;
