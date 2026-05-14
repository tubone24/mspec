import { z } from 'zod';

export const ScenarioSchema = z.object({
  name: z.string(),
  lines: z.array(z.string()),
});
export type Scenario = z.infer<typeof ScenarioSchema>;

export const RequirementSchema = z.object({
  fr_id: z.string().regex(/^FR-\d+$/),
  title: z.string(),
  body: z.string(),
  scenarios: z.array(ScenarioSchema),
  raw_block: z.string(),
});
export type Requirement = z.infer<typeof RequirementSchema>;

export const DeltaSpecSchema = z.object({
  capability: z.string(),
  added: z.array(RequirementSchema).default([]),
  modified: z.array(RequirementSchema).default([]),
  removed: z.array(RequirementSchema).default([]),
  renamed: z.array(RequirementSchema).default([]),
});
export type DeltaSpec = z.infer<typeof DeltaSpecSchema>;

export const DELTA_SECTIONS = ['ADDED', 'MODIFIED', 'REMOVED', 'RENAMED'] as const;
export type DeltaSection = (typeof DELTA_SECTIONS)[number];
