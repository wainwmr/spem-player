import config from "../ts/config";

describe("config", () => {
  it("has expected structure", () => {
    expect(config.parts).toEqual([
      "Soprano",
      "Alto",
      "Tenor",
      "Baritone",
      "Bass",
    ]);
    expect(config.scores).toEqual(["modern", "early"]);
    expect(config.audio_prefix).toBe("/audio/");
    expect(config.svg_prefix).toBe("/svg/");
    expect(config.recording).toEqual(["ALC", "CotE"]);
    expect(config.recording_label).toEqual([
      "Andrew Leslie Cooper",
      "Choir of the Earth",
    ]);
    expect(config.choirs.length).toBe(2);
    expect(config.choirs[0].length).toBe(8);
    expect(config.intro_beats).toEqual([2, 4]);
  });

  it("has matching bar arrays for each recording", () => {
    expect(config.barno.length).toBe(config.recording.length);
    expect(config.bartime.length).toBe(config.recording.length);
    config.barno.forEach((arr, i) => {
      expect(arr.length).toBe(config.bartime[i].length);
    });
  });

  it("exposes version from package.json", () => {
    expect(config.version).toMatch(/^\d+\.\d+\.\d+/);
  });
});
