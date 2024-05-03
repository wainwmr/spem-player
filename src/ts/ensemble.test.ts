import { expect, test } from 'vitest'
import { Ensemble } from './ensemble'

const e = new Ensemble(1, ["s", "a", "t", "b"]);

test("choir name", () => {
  expect(e.getChoirName(1)).toBe("Choir 1");
});

test("part name", () => {
  expect(e.getPartName(0)).toBe("s");
});

test("number of choirs", () => {
  expect(e.choirs.length).toBe(1);
});

test("number of parts", () => {
  expect(e.parts.length).toBe(4);
});