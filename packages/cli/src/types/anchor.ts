import { z } from 'zod';

export const AnchorBlockSchema = z.object({
  change_dir: z.string().regex(/^\d{4}-\d{2}-\d{2}-\d{6}-[a-z0-9-]+$/),
  capability: z.string().regex(/^[a-z0-9-]+$/),
  delta_spec_path: z.string(),
  requirements: z.array(z.string().regex(/^FR-\d+$/)).min(1),
  change: z.string().regex(/^[a-z0-9-]+$/),
  source_file: z.string(),
  source_line: z.number().int().positive(),
});
export type AnchorBlock = z.infer<typeof AnchorBlockSchema>;

export const FR_ID_RE = /^FR-(\d+)$/;
