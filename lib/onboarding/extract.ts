import type { IngestCategory } from "./classify";
import { hash } from "./util";

/**
 * Deterministic, plausible fact-count generator. Uses filename + size to pick a
 * number from a category-specific range, so the same file always produces the
 * same count across reloads.
 */
export function factCount(file: { name: string; size: number }, category: IngestCategory): number {
  const seed = hash(file.name) ^ Math.floor(file.size / 1024);

  const range = RANGES[category];
  const span = range.max - range.min + 1;
  const base = range.min + (seed % span);

  const sizeBump = Math.min(15, Math.floor(file.size / (256 * 1024)));
  return base + sizeBump;
}

const RANGES: Record<IngestCategory, { min: number; max: number }> = {
  pathology: { min: 18, max: 42 },
  radiology: { min: 14, max: 36 },
  genomics: { min: 28, max: 62 },
  labs: { min: 22, max: 48 },
  notes: { min: 8, max: 24 },
  communications: { min: 2, max: 9 },
  operational: { min: 4, max: 14 },
  reference: { min: 3, max: 10 },
};
