import { processLilypond, ranges, dict, exportedForTesting } from '../ts/lily';
const { semantics, romanise, setupLilypondParser } = exportedForTesting;
import * as ohm from 'ohm-js';
import lyGrammar from '../ohmjs/ly-grammar.ohm-bundle';

describe("lilypond parsing tests", () => {

  it("romanise", () => {
    expect(romanise(1)).toBe("I");
    expect(romanise(2)).toBe("II");
    expect(romanise(3)).toBe("III");
    expect(romanise(4)).toBe("IV");
    expect(romanise(5)).toBe("V");
    expect(romanise(6)).toBe("VI");
    expect(romanise(7)).toBe("VII");
    expect(romanise(8)).toBe("VIII");
    expect(romanise(984)).toBe("CMLXXXIV");
    expect(romanise(2024)).toBe("MMXXIV");
    expect(romanise(0)).toBe("");
    expect(romanise(-20)).toBe("");
    expect(romanise(9.2)).toBe("IX");

  });

  it("check lilypond parses OK", () => {
    var a: ohm.MatchResult;
    expect((a = lyGrammar.match("{ a b c d }")).succeeded(), a.message).toBe(true);
    expect(a.message).toBeUndefined();
    expect((a = lyGrammar.match("\\relative c { a b c d e f g }")).succeeded(), a.message).toBe(true);
    expect((a = lyGrammar.match("\\relative c'' { a2 b4. c1 d\\breve e\\longa f g }")).succeeded(), a.message).toBe(true);
    expect((a = lyGrammar.match("\\relative c' { aes'''4*9~ }")).succeeded(), a.message).toBe(true);
    expect((a = lyGrammar.match("sopOne = \\relative c'' { g2 f e d }")).succeeded(), a.message).toBe(true);
    // Cannot have digits in a lilypond variable name, so the next one should fail
    expect((a = lyGrammar.match("sop987 = \\relative c'' { g2 f \\ficta e dis }")).succeeded()).toBe(false);
    expect(a.message).contain("sop987");
  });

  it("setupLilypondParser", () => {
    var s = setupLilypondParser();
    expect(s).toBeTruthy();
    expect(dict.length).toBe(0);
    expect(ranges.length).toBe(0);
  });

  it("processLilypond", () => {

    //assert on the response
    processLilypond();
    expect(dict.length).toBe(139); // bars including bar zero
    expect(ranges.length).toBe(8); // choirs
    for (var c = 0; c < 8; c++) {
      expect(ranges[c].length).toBe(5);
      for (var p = 0; p < 1; p++) {
        const last = ranges[c][p][ranges[c][p].length - 1];
        expect(last.to).toBe(139);
      }
    }
  });


})

