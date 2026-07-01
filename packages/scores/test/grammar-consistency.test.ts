import { readFileSync } from "fs";
import { describe, expect, it } from "vitest";

/**
 * Guards the implicit, manual coupling between the Ohm grammar's `duration`
 * rule and the `switch` in the `Duration` constructor (see #170). If a
 * developer adds a duration literal to one and forgets the other, the parser
 * produces a string the switch does not handle, the constructor throws
 * "Unknown duration" at runtime — and this test fails first, at CI, naming the
 * offending literal so the divergence never reaches production.
 *
 * Both sides are extracted from source *text* (not by importing and exercising
 * the code), so the comparison is between the literals as written. Backslash
 * escaping matches: the grammar writes `"\\longa"` and the switch writes
 * `case "\\longa":`, so each yields the same `\\longa` source string after the
 * quotes are stripped (the test never resolves the escape to a single `\`).
 *
 * The text extraction makes two formatting assumptions, both true today and
 * both fail-loud if broken except where noted:
 *   - the grammar's `duration` rule stays on one line with no `)` inside the
 *     alternation (the `[^)]+` capture stops at the first `)`);
 *   - no `case` body in the Duration switch contains a `{` (the slice ends at
 *     the first `}` after the switch head). A future braced case would
 *     truncate the scan and silently drop later cases — the one drift this
 *     guard would not catch — so keep the switch cases single-statement.
 */
describe("grammar / Duration switch consistency", () => {
  it("the Duration switch handles exactly the grammar's duration literals", () => {
    const grammar = readFileSync("src/lily/ly-grammar.ohm", "utf-8");
    const grammarMatch = grammar.match(/duration = \(([^)]+)\)/);
    expect(
      grammarMatch,
      "could not locate the `duration = (...)` rule in ly-grammar.ohm"
    ).not.toBeNull();
    const grammarDurations = grammarMatch![1]
      .split("|")
      .map((s) => s.trim().replace(/"/g, ""))
      .sort();

    // Scope the case-label scan to the Duration switch block only, so a future
    // unrelated `switch` elsewhere in the file cannot inject spurious labels.
    const source = readFileSync("src/lily/music-classes.ts", "utf-8");
    const switchStart = source.indexOf("switch (this.duration)");
    expect(
      switchStart,
      "could not locate the Duration switch in music-classes.ts"
    ).toBeGreaterThan(-1);
    const switchBody = source.slice(
      switchStart,
      source.indexOf("}", switchStart)
    );
    const switchDurations = [...switchBody.matchAll(/case "([^"]+)":/g)]
      .map((m) => m[1])
      .sort();

    const missingFromSwitch = grammarDurations.filter(
      (d) => !switchDurations.includes(d)
    );
    const missingFromGrammar = switchDurations.filter(
      (d) => !grammarDurations.includes(d)
    );

    expect(
      missingFromSwitch,
      "grammar durations with no matching case in the Duration switch"
    ).toEqual([]);
    expect(
      missingFromGrammar,
      "Duration switch cases with no matching literal in the grammar"
    ).toEqual([]);
  });
});
