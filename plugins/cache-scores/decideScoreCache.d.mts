// Hand-written ambient types for decideScoreCache.mjs so the Vitest suite in
// src/test/ can import it from TypeScript. Keep in sync with the export in
// decideScoreCache.mjs.

export function decideScoreCache(state: {
  // A restore that yields nothing is a nullable "no key"; tolerated as a miss.
  restoredKey?: string | null;
  // Optional only for the defensive empty/absent MISS; production always supplies
  // a 64-char digest from computeScoreCacheKey().
  currentKey?: string;
  canaryPresent: boolean;
}): "hit" | "miss";
