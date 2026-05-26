// @mspec-delta 2026-05-24-085415-risk-tier-field/specs/delta-spec/spec.md
// Requirements implemented: FR-001, FR-002, FR-003
// Change: risk-tier-field
import { z } from 'zod';

export const ScenarioSchema = z.object({
  name: z.string(),
  lines: z.array(z.string()),
});
export type Scenario = z.infer<typeof ScenarioSchema>;

export const RiskTierSchema = z.enum(['critical', 'standard', 'trivial']);
export type RiskTier = z.infer<typeof RiskTierSchema>;

export const BlastRadiusSchema = z.enum(['local', 'module', 'system', 'external']);
export type BlastRadius = z.infer<typeof BlastRadiusSchema>;

export const RequirementSchema = z.object({
  fr_id: z.string().regex(/^FR-\d+$/),
  title: z.string(),
  body: z.string(),
  scenarios: z.array(ScenarioSchema),
  raw_block: z.string(),
  risk_tier: RiskTierSchema.default('standard'),
  blast_radius: BlastRadiusSchema.optional(),
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
