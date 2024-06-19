import { MusicCanvas } from '../ts/MusicCanvas';
import { MusicScore } from '../ts/MusicScore';
import { MusicControls } from '../ts/MusicControls';
import config from '../ts/config';

describe("index.js", () => {

  beforeAll(() => {
    MusicCanvas.define("music-canvas");
    MusicControls.define("music-controls");
    MusicScore.define("music-score");

    // vi.spyOn(HTMLElement.prototype, "scrollTo").mockReturnValue();

  });

  afterAll(() => {
    vi.clearAllMocks();
  });

  var score: MusicScore | null;
  var controls: MusicControls | null;
  // var canvas: MusicCanvas | null;
  beforeEach(() => {
    document.body.innerHTML = `
      <music-score></music-score>
      <music-controls></music-controls>
      `;
    // <music-canvas></music-canvas>
    score = document.querySelector("music-score");
    controls = document.querySelector("music-controls");
    // canvas = document.querySelector("music-canvas");
  });

  it("Check that the score, canvas and controls are all there", async () => {
    expect(score).not.toBeNull();
    expect(controls).not.toBeNull();
    // expect(canvas).not.toBeNull();
    
    expect(document.querySelector("svg")).not.toBe(null);
    console.log(score?.innerHTML);
    expect(document.querySelector("div[id='playpausebutton']")).not.toBe(null);
    // expect(document.querySelector("music-canvas canvas")).not.toBe(null);
    
  });
  
  it("Selecting a bar in the score updates the bar in controls", () => {
    expect(score).not.toBeNull();
    // const eMock = vi.fn(() => ({
    //   clientX: 200,
    //   clientY: 30
    // }));
    // score?.scoreClicked(eMock as unknown as MouseEvent);

    // expect(score?.getAttribute("bar")).toBe("8");
  });


});