export function parseArgs(argv?: string[]): {
  version?: string;
  notation?: string | null;
  choir?: string;
  [key: string]: string | boolean | null | undefined;
};

export function buildPattern(lyDir: string, choir?: string): string;
