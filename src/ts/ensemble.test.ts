import { expect, test } from 'vitest'
import { Ensemble } from './ensemble'

const e = new Ensemble(1, ["s", "a", "t", "b"]);

test("choir name is choir 1", () => {
  expect(e.getChoirName(0)).toBe("Choir 1");
});

test("part name is s", () => {
  expect(e.getPartName(0)).toBe("s");
});

test("number of choirs is 1", () => {
  expect(e.choirs.length).toBe(1);
});

test("number of parts is 4", () => {
  expect(e.parts.length).toBe(4);
});
test("mp3 name is correct", () => {
  expect(e.getMP3filename(0, 0)).toBe("Choir 1-s.mp3");
  expect(e.getMP3filename(0, 0, "/audio/spem/")).toBe("/audio/spem/Choir 1-s.mp3");
  expect(e.getMP3filename(0, "all", "/audio/")).toBe("/audio/default.mp3");
  expect(e.getMP3filename(3, 1)).toBe("default.mp3");
  expect(e.getMP3filename(3, 1, "/audio/spem/")).toBe("/audio/spem/default.mp3");
});