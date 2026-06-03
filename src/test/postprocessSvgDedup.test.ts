import { DOMParser } from "@xmldom/xmldom";
import { deduplicatePaths } from "../../lilypond/build/postprocessSvg.mjs";

const DUPLICATE_PATHS_SVG = `<svg xmlns="http://www.w3.org/2000/svg">
  <path d="M 0 0 L 10 10" transform="translate(10,20)" />
  <path d="M 0 0 L 10 10" transform="translate(30,20)" />
  <path d="M 0 0 L 10 10" transform="translate(50,20)" />
  <path d="M 5 5 L 15 15" />
</svg>`;

const ATTR_COLLISION_SVG = `<svg xmlns="http://www.w3.org/2000/svg">
  <path d="M 0 0 L 10 10" fill="red" />
  <path d="M 0 0 L 10 10" fill="blue" />
</svg>`;

const NO_DUPLICATES_SVG = `<svg xmlns="http://www.w3.org/2000/svg">
  <path d="M 0 0 L 10 10" />
  <path d="M 5 5 L 15 15" />
</svg>`;

function parseSvg(xml: string) {
  return new DOMParser().parseFromString(xml, "image/svg+xml");
}

describe("deduplicatePaths", () => {
  it("creates defs block for duplicate paths", () => {
    const doc = parseSvg(DUPLICATE_PATHS_SVG);
    deduplicatePaths(doc);
    const defs = doc.getElementsByTagName("defs");
    expect(defs.length).toBe(1);
  });

  it("defs contains one path per unique shape", () => {
    const doc = parseSvg(DUPLICATE_PATHS_SVG);
    deduplicatePaths(doc);
    const defsPaths = doc
      .getElementsByTagName("defs")[0]
      .getElementsByTagName("path");
    expect(defsPaths.length).toBe(1);
    expect(defsPaths[0].getAttribute("d")).toBe("M 0 0 L 10 10");
  });

  it("replaces duplicates with use elements", () => {
    const doc = parseSvg(DUPLICATE_PATHS_SVG);
    deduplicatePaths(doc);
    const uses = doc.getElementsByTagName("use");
    expect(uses.length).toBe(3);
  });

  it("use elements reference def id", () => {
    const doc = parseSvg(DUPLICATE_PATHS_SVG);
    deduplicatePaths(doc);
    const defsPath = doc
      .getElementsByTagName("defs")[0]
      .getElementsByTagName("path")[0];
    const defId = defsPath.getAttribute("id");
    const uses = Array.from(doc.getElementsByTagName("use"));
    expect(uses.every((u) => u.getAttribute("href") === `#${defId}`)).toBe(
      true
    );
  });

  it("use elements preserve transform", () => {
    const doc = parseSvg(DUPLICATE_PATHS_SVG);
    deduplicatePaths(doc);
    const uses = Array.from(doc.getElementsByTagName("use"));
    const transforms = uses.map((u) => u.getAttribute("transform"));
    expect(transforms).toContain("translate(10,20)");
    expect(transforms).toContain("translate(30,20)");
    expect(transforms).toContain("translate(50,20)");
  });

  it("unique paths are not touched", () => {
    const doc = parseSvg(DUPLICATE_PATHS_SVG);
    deduplicatePaths(doc);
    const paths = Array.from(doc.getElementsByTagName("path"));
    const unique = paths.find((p) => p.getAttribute("d") === "M 5 5 L 15 15");
    expect(unique).toBeDefined();
    expect(unique!.parentNode!.nodeName).not.toBe("defs");
  });

  it("attr collision leaves paths unchanged", () => {
    const doc = parseSvg(ATTR_COLLISION_SVG);
    deduplicatePaths(doc);
    expect(doc.getElementsByTagName("defs").length).toBe(0);
    expect(doc.getElementsByTagName("use").length).toBe(0);
    const paths = doc.getElementsByTagName("path");
    expect(paths.length).toBe(2);
  });

  it("no duplicates leaves document unchanged", () => {
    const doc = parseSvg(NO_DUPLICATES_SVG);
    deduplicatePaths(doc);
    expect(doc.getElementsByTagName("defs").length).toBe(0);
    expect(doc.getElementsByTagName("use").length).toBe(0);
    const paths = doc.getElementsByTagName("path");
    expect(paths.length).toBe(2);
  });
});
