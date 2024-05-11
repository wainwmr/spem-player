import { semantics, exportedForTesting } from '../ts/lily';
const { romanise, setupLilypondParser } = exportedForTesting;

const ly = "/lilypond/spem notes.ly";

describe("lily", () => {
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

  it("setupLilypondParser", async () => {
    await setupLilypondParser();
    console.log(semantics);
    expect(semantics).toBeTruthy();
    console.log();
    // const result = processLilypond(ly);
    // expect(result).toReturn();
  
  });
  

})

