import { MusicCanvas } from '../ts/MusicCanvas';
import config from '../ts/config';

describe("MusicCanvas custom element", () => {

  beforeAll(() => {
    MusicCanvas.define("music-canvas");

    // vi.spyOn(HTMLElement.prototype, "scrollTo").mockReturnValue();

  });

  afterAll(() => {
    vi.clearAllMocks();
  });

  var elem: MusicCanvas | null;
  beforeEach(() => {
    document.body.innerHTML = `<music-canvas></music-canvas>`
    elem = document.querySelector("music-canvas");
  });
  
  it("Check that the element contains a canvas", async () => {
    expect(elem).not.toBeNull();
    console.log(elem?.innerHTML);

    expect(elem?.querySelector("canvas")).not.toBe(null);

  });

});