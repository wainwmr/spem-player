import { MusicControls } from '../ts/MusicControls';
import config from '../ts/config'

describe("MusicControls custom element", () => {
  var element: MusicControls;

  beforeAll(() => {
    MusicControls.define("music-controls");
  });

  beforeEach(() => {
    element = new MusicControls();
  });

  // <music-controls>
  //   <label>Choir
  //     <select name="choir" id="choir-select">
  //       <option value="0">1</option>
  //       ...
  //     </select>
  //   </label>
  //   <label>Part
  //     <select name="part" id="part-select">
  //       <option value="all">All</option>
  //       <option value="0">Soprano</option>
  //       ...
  //     </select>
  //   </label>
  //   <label>Bar
  //   <input name="bar" type="number" id="bar-field" value="0" min="0" max="138">
  //   </label>
  // </music-controls>
  it("connectedCallback builds a list of choirs and parts per the config", () => {
    document.body.innerHTML = `<music-controls></music-controls>`
    expect(document.getElementById("choir-select")).not.toBeNull();
    expect(document.getElementById("part-select")).not.toBeNull();

    const choirs = document.getElementById("choir-select");
    expect(choirs).not.toBeNull();
    expect(choirs?.getAttribute("name")).toBe("choir");
    expect(choirs?.querySelectorAll('option').length).toBe(config.choirs);

    const parts = document.getElementById("part-select");
    expect(parts).not.toBeNull();
    expect(parts?.getAttribute("name")).toBe("part");
    expect(parts?.querySelectorAll('option').length).toBe(config.parts.length + 1);

    const bar = document.getElementById("bar-field");
    expect(bar).not.toBeNull();
    expect(bar?.getAttribute("name")).toBe("bar");
    expect(bar?.getAttribute("value")).toBe("0");
    expect(bar?.getAttribute("min")).toBe("0");
  });
})