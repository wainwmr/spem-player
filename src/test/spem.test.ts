import { processLilypond } from "../ts/lily";

describe("Check that spem notes looks good", () => {
  const { notesByQuant, ranges } = processLilypond();

  it("8 choir of 5 parts", async () => {
    expect(ranges.size).toBe(40); // 8 choirs * 5 parts
    for (var c = 0; c < 8; c++) {
      for (var p = 0; p < 5; p++) {
        expect(ranges.get(`${c}-${p}`)).toBeDefined();
      }
    }
  });

  it("Everyone finishes at the end of bar 138", async () => {
    for (var c = 0; c < 8; c++) {
      for (var p = 0; p < 5; p++) {
        const list = ranges.get(`${c}-${p}`)!;
        const last = list[list.length - 1];
        expect(last.to).toBe(139);
      }
    }
    expect(notesByQuant.size).toBeGreaterThan(0);
  });

  it("Everyone is singing respice at bar 122", () => {
    for (var c = 0; c < 8; c++) {
      for (var p = 0; p < 5; p++) {
        const result =
          ranges.get(`${c}-${p}`)!.find((x) => x.from === 122) != null;
        expect(result, "choir/part " + c + "/" + p).toBe(true);
      }
    }
    expect(notesByQuant.get(122)!.length).toBe(40);
  });

  it("Nobody is singing in the third beat of bar 74", () => {
    for (var c = 0; c < 8; c++) {
      for (var p = 0; p < 5; p++) {
        const result = ranges
          .get(`${c}-${p}`)!
          .find((x) => x.from <= 74.5 && x.to >= 74.75);
        expect(
          result,
          "choir/part " + c + "/" + p + " = " + result
        ).toBeUndefined();
      }
    }
    expect(notesByQuant.get(74.5)).toBeUndefined();
  });

  it("Nobody is singing in the third beat of bar 108", () => {
    for (var c = 0; c < 8; c++) {
      for (var p = 0; p < 5; p++) {
        const result = ranges
          .get(`${c}-${p}`)!
          .find((x) => x.from <= 108.5 && x.to >= 108.75);
        expect(
          result,
          "choir/part " + c + "/" + p + " = " + result
        ).toBeUndefined();
      }
    }
    expect(notesByQuant.get(108.5)).toBeUndefined();
  });

  it("Nobody is singing in the last minim of 121", () => {
    for (var c = 0; c < 8; c++) {
      for (var p = 0; p < 5; p++) {
        const result = ranges
          .get(`${c}-${p}`)!
          .find((x) => x.from <= 121.75 && x.to >= 122);
        expect(
          result,
          "choir/part " + c + "/" + p + " = " + result
        ).toBeUndefined();
      }
    }
    expect(notesByQuant.get(121.75)).toBeUndefined();
  });
});
