import { MusicScore } from '../ts/MusicScore';

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

  });

  // it("Another", () => {
  //   const elem = document.querySelector("music-score");
  //   expect(elem).not.toBeNull();
  // });



  // it("Check highlighted bar has been created but is not visible", () => {
  //   const elem = document.querySelector("music-score");
  //   expect(elem).not.toBeNull();

  //   const hPos = document.getElementById("hPos");
  //   expect(hPos).not.toBeNull();
  // });
});


