// Hand-written ambient types for buildScores.mjs so the Vitest suite in
// src/test/ can import it from TypeScript. Keep in sync with the exports
// at the bottom of buildScores.mjs.

export function parseArgs(args?: string[]): {
  version: string;
  notation: string | null;
  choir?: string;
  "skip-if-missing"?: boolean;
  [key: string]: string | boolean | null | undefined;
};

export function buildPattern(lyDir: string, choir?: string): string;

export function canaryCheck(
  version: string,
  root?: string
): { ok: true } | { ok: false; missing: string };
