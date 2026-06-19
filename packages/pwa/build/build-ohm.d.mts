// Types for build-ohm.mjs, so the TS test (and tsc --noEmit) can import the
// build-time normaliser without TS7016. Kept beside the .mjs; the two functions
// are stable.
export function toLf(text: string): string;
export function ensureLf(path: string): boolean;
