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
    expect(result).toBeTypeOf("number");
    expect(Math.floor(result)).toBe(55);

    result = getBarFromTime(1000, 0);
    expect(result).toBeTypeOf("number");
    expect(result).toBeCloseTo(139);
  });

  it("getBarFromTime() returns correct bar at every ALC boundary", () => {
    for (let i = 0; i < config.bartime[0].length; i++) {
      const t = config.bartime[0][i];
      const expectedBar = config.barno[0][i];
      expect(getBarFromTime(t, 0)).toBeCloseTo(expectedBar, 5);
    }
  });

  it("getBarFromTime() returns correct bar at every CotE boundary", () => {
    for (let i = 0; i < config.bartime[1].length; i++) {
      const t = config.bartime[1][i];
      const expectedBar = config.barno[1][i];
      expect(getBarFromTime(t, 1)).toBeCloseTo(expectedBar, 5);
    }
  });

  it("getBarFromTime() interpolates strictly between internal boundaries", () => {
    // Probe the midpoint between two internal boundaries to pin the
    // linear-interpolation arithmetic (regressions in the tempo formula
    // would fail this even when the boundary-sweep tests above pass).
    // The `>=` vs `>` change in the loop predicate is pinned by the
    // boundary-sweep tests directly: under `>`, an exact internal
    // boundary value falls through every interval and hits the
    // unreachable throw. Test both ALC and CotE.
    for (const v of [0, 1] as const) {
      const i = 2; // interior index
      const t0 = config.bartime[v][i];
      const t1 = config.bartime[v][i + 1];
      const tMid = (t0 + t1) / 2;
      const expected =
        config.barno[v][i] +
        0.5 * (config.barno[v][i + 1] - config.barno[v][i]);
      expect(getBarFromTime(tMid, v)).toBeCloseTo(expected, 5);
    }
  });

  it("getBarFromTime() interpolates just below the final boundary, not snapping to clamp", () => {
    // Pin the seam between the loop's last interval and the upper clamp.
    // A t value at bartime[last] - epsilon must interpolate within the
    // final interval, not snap to barno[last] via the clamp.
    for (const v of [0, 1] as const) {
      const lastIdx = config.bartime[v].length - 1;
      const tLast = config.bartime[v][lastIdx];
      const t = tLast - 0.5;
      const prevIdx = lastIdx - 1;
      const expected =
        config.barno[v][prevIdx] +
        ((t - config.bartime[v][prevIdx]) /
          (tLast - config.bartime[v][prevIdx])) *
          (config.barno[v][lastIdx] - config.barno[v][prevIdx]);
      const result = getBarFromTime(t, v);
      expect(result).toBeCloseTo(expected, 5);
      // And it must NOT equal the clamp value (would indicate snapping).
      expect(result).not.toBe(config.barno[v][lastIdx]);
    }
  });

  it("getBarFromTime() clamps non-finite inputs (NaN, +/-Infinity) to first bar", () => {
    // HTMLMediaElement.currentTime can be NaN before metadata loads.
    // Without this guard the function would fall through to the unreachable
    // throw, terminating the requestAnimationFrame loop in MusicControls.
    for (const v of [0, 1] as const) {
      expect(getBarFromTime(NaN, v)).toBe(config.barno[v][0]);
      expect(getBarFromTime(Infinity, v)).toBe(config.barno[v][0]);
      expect(getBarFromTime(-Infinity, v)).toBe(config.barno[v][0]);
    }
  });

  it("getTimeFromBar() clamps non-finite inputs (NaN, +/-Infinity) to first time", () => {
    // Reachable from MusicControls.setBar when a user enters a
    // non-numeric value into the bar input box.
    for (const v of [0, 1] as const) {
      expect(getTimeFromBar(NaN, v)).toBe(config.bartime[v][0]);
      expect(getTimeFromBar(Infinity, v)).toBe(config.bartime[v][0]);
      expect(getTimeFromBar(-Infinity, v)).toBe(config.bartime[v][0]);
    }
  });

  it("getBarFromTime() clamps out-of-range time values", () => {
    expect(getBarFromTime(-1, 0)).toBeCloseTo(config.barno[0][0], 5);
    expect(getBarFromTime(600, 0)).toBeCloseTo(
      config.barno[0][config.barno[0].length - 1],
      5
    );
    expect(getBarFromTime(-1, 1)).toBeCloseTo(config.barno[1][0], 5);
    expect(getBarFromTime(600, 1)).toBeCloseTo(
      config.barno[1][config.barno[1].length - 1],
      5
    );
  });

  it("getBarFromTime() converts time to bar as expected for CotE audio", () => {
    var result = getBarFromTime(0, 1);
    expect(result).toBeTypeOf("number");
    expect(result).toBe(0);

    result = getBarFromTime(4.3, 1);
    expect(result).toBeTypeOf("number");
    expect(Math.floor(result)).toBe(1);

    result = getBarFromTime(200, 1);
    expect(result).toBeTypeOf("number");
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

  it("getTimeFromBar() returns correct time at every ALC boundary", () => {
    for (let i = 0; i < config.barno[0].length; i++) {
      const b = config.barno[0][i];
      const expectedTime = config.bartime[0][i];
      expect(getTimeFromBar(b, 0)).toBeCloseTo(expectedTime, 5);
    }
  });

  it("getTimeFromBar() returns correct time at every CotE boundary", () => {
    for (let i = 0; i < config.barno[1].length; i++) {
      const b = config.barno[1][i];
      const expectedTime = config.bartime[1][i];
      expect(getTimeFromBar(b, 1)).toBeCloseTo(expectedTime, 5);
    }
  });

  it("getTimeFromBar() clamps out-of-range bar values", () => {
    expect(getTimeFromBar(-1, 0)).toBeCloseTo(config.bartime[0][0], 5);
    expect(getTimeFromBar(200, 0)).toBeCloseTo(
      config.bartime[0][config.bartime[0].length - 1],
      5
    );
    expect(getTimeFromBar(-1, 1)).toBeCloseTo(config.bartime[1][0], 5);
    expect(getTimeFromBar(200, 1)).toBeCloseTo(
      config.bartime[1][config.bartime[1].length - 1],
      5
    );
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

  it("config.choirHues defines 8 hue values in the 0–360 range (#101)", () => {
    expect(Array.isArray(config.choirHues)).toBe(true);
    expect(config.choirHues).toHaveLength(8);
    for (const hue of config.choirHues) {
      expect(hue).toBeTypeOf("number");
      expect(hue).toBeGreaterThanOrEqual(0);
      expect(hue).toBeLessThanOrEqual(360);
    }
  });

  it("colors() falls back to config.choirHues when CSS properties are absent (#101)", () => {
    // Strip everything that the CSS-present branch would read so colors()
    // takes the defaults path.
    document.body.style.removeProperty("--color-background");
    document.body.style.removeProperty("--color-highlight");
    document.body.style.removeProperty("--color-score-highlight");
    for (let i = 1; i <= 8; i++) {
      document.body.style.removeProperty("--color-c" + i);
    }
    const result = colors(true);
    expect(result.choir).toEqual(config.choirHues);
  });

  it("colors() fallback returns a copy, not the live config.choirHues array", () => {
    // Guards against accidental reference aliasing: any caller that mutates
    // colors().choir must not corrupt the config singleton.
    document.body.style.removeProperty("--color-background");
    document.body.style.removeProperty("--color-highlight");
    document.body.style.removeProperty("--color-score-highlight");
    for (let i = 1; i <= 8; i++) {
      document.body.style.removeProperty("--color-c" + i);
    }
    const result = colors(true);
    expect(result.choir).toEqual(config.choirHues);
    expect(result.choir).not.toBe(config.choirHues);
  });

  it("colors() fallback returns a fresh choir array on every call", () => {
    // Each fallback call must yield an independent array, so that a caller
    // mutating colors().choir cannot corrupt a later fallback caller's view.
    document.body.style.removeProperty("--color-background");
    document.body.style.removeProperty("--color-highlight");
    document.body.style.removeProperty("--color-score-highlight");
    for (let i = 1; i <= 8; i++) {
      document.body.style.removeProperty("--color-c" + i);
    }
    const a = colors(true);
    const b = colors(true);
    expect(a.choir).not.toBe(b.choir);
  });
});
