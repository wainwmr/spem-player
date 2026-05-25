import {
  toNum,
  getBarFromTime,
  getTimeFromBar,
  colors,
  HDSQTIME,
} from "../ts/common";
import config from "../ts/config";

describe("common", () => {
  it("HDSQTIME is derived from default recording tempo", () => {
    const lastIdx = config.barno[0].length - 1;
    const totalTime = config.bartime[0][lastIdx];
    const totalBars = config.barno[0][lastIdx];
    expect(HDSQTIME).toBeCloseTo(totalTime / totalBars / 64, 5);
  });

  it("toNum() converts string and numbers as expected", () => {
    var result = toNum(1);
    expect(result).toBeTypeOf("number");
    expect(result).toBe(1);

    result = toNum("1");
    expect(result).toBeTypeOf("number");
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
  });

  it("getBarFromTime() converts time to bar as expected for ALC audio", () => {
    var result = getBarFromTime(0, 0);
    expect(result).toBeTypeOf("number");
    expect(result).toBe(0);

    result = getBarFromTime(4.3, 0);
    expect(result).toBeTypeOf("number");
    expect(Math.floor(result)).toBe(1);

    result = getBarFromTime(200, 0);
    expect(Math.floor(result)).toBe(55);

    result = getBarFromTime(1000, 0);
    expect(result).toBeTypeOf("number");
    expect(result).toBeCloseTo(139);
  });

  it("getBarFromTime() returns final bar at ALC boundary", () => {
    const result = getBarFromTime(512, 0);
    expect(result).toBeCloseTo(139);
  });

  it("getBarFromTime() returns final bar at CotE boundary", () => {
    const result = getBarFromTime(540, 1);
    expect(result).toBeCloseTo(139);
  });

  it("getBarFromTime() converts time to bar as expected for CotE audio", () => {
    var result = getBarFromTime(0, 1);
    expect(result).toBeTypeOf("number");
    expect(result).toBe(0);

    result = getBarFromTime(4.3, 1);
    expect(result).toBeTypeOf("number");
    expect(Math.floor(result)).toBe(1);

    result = getBarFromTime(200, 1);
    expect(Math.floor(result)).toBe(51);

    result = getBarFromTime(1000, 1);
    expect(result).toBeTypeOf("number");
    expect(result).toBeCloseTo(139);
  });

  it("getTimeFromBar() converts bar to time as expected for ALC", () => {
    var result = getTimeFromBar(0, 0);
    expect(result).toBeTypeOf("number");
    expect(result).toBe(0);

    result = getTimeFromBar(1, 0);
    expect(result).toBeTypeOf("number");
    expect(result).toBeCloseTo(2.2); // ALC

    result = getTimeFromBar(65, 0);
    expect(result).toBeTypeOf("number");
    expect(result).toBeCloseTo(234.3); // ALC

    result = getTimeFromBar(140, 0);
    expect(result).toBeCloseTo(512);
  });

  it("getTimeFromBar() returns final time at ALC boundary", () => {
    const result = getTimeFromBar(139, 0);
    expect(result).toBeCloseTo(512);
  });

  it("getTimeFromBar() returns final time at CotE boundary", () => {
    const result = getTimeFromBar(139, 1);
    expect(result).toBeCloseTo(540);
  });

  it("getTimeFromBar() converts bar to time as expected for CotE", () => {
    var result = getTimeFromBar(0, 1);
    expect(result).toBeTypeOf("number");
    expect(result).toBe(0);

    result = getTimeFromBar(1, 1);
    expect(result).toBeTypeOf("number");
    expect(result).toBeCloseTo(3.9); // CotE

    result = getTimeFromBar(65, 1);
    expect(result).toBeTypeOf("number");
    expect(result).toBeCloseTo(251.631); // CotE

    result = getTimeFromBar(140, 1);
    expect(result).toBeCloseTo(540);
  });

  it("colors() reads from CSS custom properties when available", () => {
    document.body.style.setProperty("--color-background", "#123456");
    document.body.style.setProperty("--color-highlight", "#abcdef");
    document.body.style.setProperty("--color-score-highlight", "#ffffff");
    for (let i = 1; i <= 8; i++) {
      document.body.style.setProperty("--color-c" + i, String(i * 10));
    }
    const result = colors(true);
    expect(result.background).toBe("#123456");
    expect(result.highlight).toBe("#abcdef");
    expect(result.choir[0]).toBe(10);
    expect(result.choir[7]).toBe(80);
  });

  it("colors() returns cached value when reload is false", () => {
    colors(true);
    const result = colors(false);
    expect(result).toBeTypeOf("object");
  });
});
