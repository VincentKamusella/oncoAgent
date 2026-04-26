/**
 * Stable FNV-1a hash. Used by the onboarding utilities to derive deterministic
 * positions, fact counts, and slug suffixes from filenames so the same input
 * always produces the same output across reloads.
 */
export function hash(s: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  return h >>> 0;
}
