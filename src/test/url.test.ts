import { describe, it, expect } from "vitest";
import { parseURLSearch } from "../ts/url";

describe("parseURLSearch", () => {
  it("preserves values containing '=' instead of truncating", () => {
    // With the bug (split("=")), "recording=alc=extra" would split into
    // ["recording", "alc", "extra"] and parm[1] === "alc", giving recording=0.
    // With the fix (indexOf/slice), val === "alc=extra", giving recording=1.
    const result = parseURLSearch("?recording=alc=extra");
    expect(result.recording).toBe(1);
  });

  it("handles normal parameters without '=' in value", () => {
    const result = parseURLSearch("?recording=alc&choir=3&bar=10");
    expect(result.recording).toBe(0);
    expect(result.choir).toBe(3);
    expect(result.bar).toBe(10);
  });
});
