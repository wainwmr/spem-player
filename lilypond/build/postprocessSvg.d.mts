import { Document } from "@xmldom/xmldom";

export function deduplicatePaths(doc: Document): void;
export function postprocessSvg(
  svgPath: string,
  spemLyPath?: string,
  wordsLyPath?: string,
): void;
export function isMainModule(
  argv1: string | undefined,
  importMetaUrl: string,
): boolean;
