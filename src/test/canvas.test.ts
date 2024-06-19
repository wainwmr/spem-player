import { MusicCanvas } from '../ts/MusicCanvas';
import config from '../ts/config';

MusicCanvas.define("music-canvas");

var canvas: MusicCanvas | null;
describe("MusicCanvas custom element", () => {

  beforeAll(() => {
    document.body.innerHTML = `<music-canvas></music-canvas>`
    canvas = document.querySelector("music-canvas");
  });

  afterAll(() => {
    vi.clearAllMocks();
  });

  
  it("Check that the canvasent contains a canvas", async () => {
    expect(canvas).not.toBeNull();
    console.log(canvas?.innerHTML);

    expect(canvas?.querySelector("canvas")).not.toBe(null);

  });

});