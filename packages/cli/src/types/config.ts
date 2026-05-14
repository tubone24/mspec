import { z } from 'zod';

export const TestConfigSchema = z.object({
  /**
   * Shell command for running tests. Empty string means "not yet configured" —
   * `mspec test` will prompt the user interactively on first invocation and persist
   * the answer back to config.yaml.
   */
  command: z.string().default(''),
  expect_red_on_exit: z.array(z.number().int()).default([1, 2]),
  expect_green_on_exit: z.array(z.number().int()).default([0]),
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
  test: TestConfigSchema.optional(),
  project: ProjectConfigSchema.optional(),
  integrations: IntegrationsSchema.optional(),
});
export type Config = z.infer<typeof ConfigSchema>;
