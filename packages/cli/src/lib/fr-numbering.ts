import { readFile } from 'node:fs/promises';
import { fileExists } from './change-discovery.js';

const FR_HEADING_RE = /^###\s+Requirement:\s+(FR-(\d+))\b/gm;

export interface FrScan {
  maxId: number;
  ids: string[];
}

/**
 * Scan a source-of-truth or delta spec file for FR-NNN heading IDs.
 * Returns max numeric value and all IDs found.
 */
export async function scanFrIds(specFilePath: string): Promise<FrScan> {
  if (!(await fileExists(specFilePath))) {
    return { maxId: 0, ids: [] };
  }
  const raw = await readFile(specFilePath, 'utf8');
  return scanFrIdsFromContents(raw);
}

export function scanFrIdsFromContents(raw: string): FrScan {
  const ids: string[] = [];
  let max = 0;
  for (const m of raw.matchAll(FR_HEADING_RE)) {
    ids.push(m[1]);
    const n = parseInt(m[2], 10);
    if (n > max) max = n;
  }
  return { maxId: max, ids };
}

export function nextFrId(currentMax: number): string {
  return `FR-${String(currentMax + 1).padStart(3, '0')}`;
}
