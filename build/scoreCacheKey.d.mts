// Hand-written ambient types for scoreCacheKey.mjs so the Vitest suite in
// src/test/ can import it from TypeScript. Keep in sync with the exports
// at the bottom of scoreCacheKey.mjs.

export const SCORE_CACHE_INPUTS: string[];

export function computeScoreCacheKey(opts?: { root?: string }): string;
