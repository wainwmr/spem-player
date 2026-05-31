// Hand-written ambient types for decideScoreCache.mjs so the Vitest suite in
// src/test/ can import it from TypeScript. Keep in sync with the export in
// decideScoreCache.mjs.

export function decideScoreCache(state: {
  restoredKey?: string;
  currentKey?: string;
  canaryPresent: boolean;
}): "hit" | "miss";
