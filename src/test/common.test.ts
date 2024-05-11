import { toNum } from '../ts/common';

describe("common", () => {
  it("toNum() converts string and numbers as expected", () => {
    var result = toNum(1);
    expect(result).toBeTypeOf('number');
    expect(result).toBe(1);

    result = toNum("1");
    expect(result).toBeTypeOf('number');
    expect(result).toBe(1);

    expect(toNum(0, true)).toBe(0);
    expect(toNum(0.2, true)).toBe(0);
    expect(toNum(0.2, false)).toBe(0.2);
    expect(toNum(-1, true)).toBe(-1);
    expect(toNum("1.2", false)).toBe(1.2);
    expect(toNum("1.2", true)).toBe(1);
    expect(toNum("1.2", true, 7)).toBe(1);
    expect(toNum("7.2", false, 7)).toBe(7);
    expect(toNum("7.2", true, 7)).toBe(7);
    expect(toNum("10.999999958333332", true)).toBe(11);
  })

})