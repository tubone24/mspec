import { z } from 'zod';

export const StepStateSchema = z.enum(['done', 'ready', 'blocked', 'skipped', 'invalid']);
export type StepState = z.infer<typeof StepStateSchema>;

export const StepStatusSchema = z.object({
  id: z.string(),
  produces: z.array(z.string()),
  state: StepStateSchema,
});
export type StepStatus = z.infer<typeof StepStatusSchema>;

export const StatusSchema = z.object({
  change: z.string(),
  current_step: z.string().nullable(),
  steps: z.array(StepStatusSchema),
  blockers: z.array(z.string()).default([]),
});
export type Status = z.infer<typeof StatusSchema>;
