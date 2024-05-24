import { MusicScore } from '../ts/MusicScore';
import config from '../ts/config';

// A helper function that allows us to detect events on element
// of type eventName have been fired
// HACK: duplicated with controls.test.ts
var expectedBar: any;
var expectedChoir: any;
var expectedPart: any;
function waitForEvent(element: HTMLElement, eventName: string, handler: (event: Event) => Promise<any>, c?: any, p?: any, b?: any): Promise<any> {
  expectedChoir = c;
  expectedPart = p;
  expectedBar = b;
  return new Promise<any>((resolve, reject) => {
    const eventListener = async (event: Event) => {
      try {
        const result = await handler(event);
        resolve(result); // Resolve with handler's result
      } catch (error) {
        reject(error); // Reject on error
      } finally {
        element.removeEventListener(eventName, eventListener, false);
      }
    };
    element.addEventListener(eventName, eventListener, false);
  });
}



describe("MusicScore custom element", () => {

  beforeAll(() => {
    MusicScore.define("music-score");

    // vi.spyOn(HTMLElement.prototype, "scrollTo").mockReturnValue();

  });

  afterAll(() => {
    vi.clearAllMocks();
  });

  beforeEach(() => {
    document.body.innerHTML = `<music-score></music-score>`
  });

  const handleScoreLoaded = async (event: Event) => {
    // ... your logic ...
    return new Promise((resolve, reject) => {
      try {
        // Perform assertions
        const d = (event as CustomEvent).detail;
        expect(d).not.toBeNull();
        if (expectedChoir) expect(d.position.choir).toBe(expectedChoir);
        if (expectedPart) expect(d.position.part).toBe(expectedPart);
        if (expectedBar) expect(d.position.choir).toBe(expectedBar);

        resolve(true); // Resolve if assertions pass
      } catch (error) {
        reject(error); // Reject if an assertion fails
      }
    });
  };


  it("Check that we can load the score correctly", async () => {
    const elem = document.querySelector("music-score") as MusicScore;

    // @ts-ignore
    elem.scrollTo = vi.fn();  // jsdom doesn't seem to implement HTMLElement.scrollTo()

    // wait for score to be loaded
    const waitingForLoaded = waitForEvent(elem, "music-score-loaded", handleScoreLoaded, 0, null, 0);
    elem?.setAttribute("choir", "0");
    const loadResult = await waitingForLoaded;
    expect(loadResult).toStrictEqual(true);

    const svg = document.querySelector("svg");
    expect(svg).not.toBeNull();

    const hPos = document.querySelector("svg rect[id='hPos']") as SVGRectElement;
    expect(hPos).not.toBeNull();  // highlight has been added
    expect(hPos?.style.fillOpacity).toBe("0"); // but currently invisible

    const hBar = document.querySelector("svg rect[id='hBar']") as SVGRectElement;
    expect(hBar).not.toBeNull();  // highlight has been added
    expect(hBar?.getAttribute("width")).toBe("0"); // but currently invisible

  });

  it("Check all scores have the same number of bars", async () => {
    const elem = document.querySelector("music-score") as MusicScore;

    // @ts-ignore
    elem.scrollTo = vi.fn();  // jsdom doesn't seem to implement HTMLElement.scrollTo()

    for (var c = 0; c < config.choirs; c++) {
      // wait for score to be loaded
      const waitingForLoaded = waitForEvent(elem, "music-score-loaded", handleScoreLoaded, 0, null, 0);
      elem?.setAttribute("choir", String(c));
      const loadResult = await waitingForLoaded;
      expect(loadResult).toStrictEqual(true);
      
      const svg = document.querySelector("svg");
      expect(svg).not.toBeNull();

      expect(elem.bars.length).toBe(139);
      expect(elem.bars[0]).toBe(0);
      expect(elem.bars[138]).toBe(elem.svgWidth);
    }

  });

  it("Changing bar sets the highlight correctly", async () => {
    const elem = document.querySelector("music-score") as MusicScore;

    // @ts-ignore
    elem.scrollTo = vi.fn();  // jsdom doesn't seem to implement HTMLElement.scrollTo()

    // wait for score to be loaded
    const waitingForLoaded = waitForEvent(elem, "music-score-loaded", handleScoreLoaded, 0, null, 0);
    elem?.setAttribute("choir", "0");
    const loadResult = await waitingForLoaded;
    expect(loadResult).toStrictEqual(true);

    const svg = document.querySelector("svg");
    expect(svg).not.toBeNull();

    elem.setAttribute("bar", "40");
    expect(elem.highlightBar.getAttribute("width")).not.toBe("0");
    expect(elem.highlightBar.style.fillOpacity).not.toBe("0");
    expect(elem.highlightBar.getAttribute("x")).toBe(String(elem.bars[39]));
  });

  it("Changing score type works", async () => {
    const elem = document.querySelector("music-score") as MusicScore;

    // @ts-ignore
    elem.scrollTo = vi.fn();  // jsdom doesn't seem to implement HTMLElement.scrollTo()

    // wait for score to be loaded
    elem?.setAttribute("choir", "0");
    const waitingForLoaded = waitForEvent(elem, "music-score-loaded", handleScoreLoaded, 0, null, 0);
    elem.setAttribute("score-type", "early");
    const loadResult = await waitingForLoaded;
    expect(loadResult).toStrictEqual(true);

    const svg = document.querySelector("svg");
    expect(svg).not.toBeNull();

  });

  it("Changing score type to a bad one works", async () => {
    const elem = document.querySelector("music-score") as MusicScore;

    // @ts-ignore
    elem.scrollTo = vi.fn();  // jsdom doesn't seem to implement HTMLElement.scrollTo()

    // wait for score to be loaded
    elem?.setAttribute("choir", "0");
    const waitingForLoaded = waitForEvent(elem, "music-score-loaded", handleScoreLoaded, 0, null, 0);
    elem.setAttribute("score-type", "frog");
    const loadResult = await waitingForLoaded;
    expect(loadResult).toStrictEqual(true);

    const svg = document.querySelector("svg");
    expect(svg).not.toBeNull();

  });



  // it("Check highlighted bar has been created but is not visible", () => {
  //   const elem = document.querySelector("music-score");
  //   expect(elem).not.toBeNull();

  //   const hPos = document.getElementById("hPos");
  //   expect(hPos).not.toBeNull();
  // });
});


