// @mspec-delta 2026-05-16-170347-lightweight-change-mode/specs/cli-workflow-engine/spec.md
// Requirements implemented: FR-019, FR-021
// Change: lightweight-change-mode

import { z } from 'zod';

export const ModeRuleSchema = z.object({
  skip: z.array(z.string()).default([]),
  force: z.array(z.string()).default([]),
});
export type ModeRule = z.infer<typeof ModeRuleSchema>;

export const StepSchema = z.object({
  id: z.string().regex(/^[a-z][a-z0-9-]*$/, 'step id must be kebab-case'),
  command: z.string(),
  skill: z.string(),
  requires: z.array(z.string()).default([]),
  produces: z.array(z.string()).default([]),
  block: z.boolean(),
  removable: z.boolean(),
  ask_questions: z.boolean().default(false),
  subagent: z.boolean().default(false),
  constitution_check: z.boolean().default(false),
  enforce_anchor: z.boolean().default(false),
  enforce_e2e: z.boolean().default(false),
  enforce_fr_ids: z.boolean().default(false),
  enforce_tdd: z.boolean().default(false),
  skippable: z.boolean().default(false),
  enabled: z.boolean().default(true),
});
export type Step = z.infer<typeof StepSchema>;

export const WorkflowSchema = z.object({
  version: z.literal(1),
  name: z.string(),
  description: z.string().optional(),
  steps: z.array(StepSchema).min(1),
  modes: z.record(ModeRuleSchema).optional(),
});
export type Workflow = z.infer<typeof WorkflowSchema>;

export const REQUIRED_STEP_IDS = ['new', 'proposal', 'delta', 'tasks', 'implement', 'archive'] as const;
export type RequiredStepId = (typeof REQUIRED_STEP_IDS)[number];
