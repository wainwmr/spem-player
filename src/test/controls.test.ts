import { MusicControls } from '../ts/MusicControls';
import config from '../ts/config'

// mock HTMLMediaElement
class MockHTMLMediaElement {
  playCalled: boolean;
  pauseCalled: boolean;
  constructor() {
    console.log('Micky mocky media constructor')
    this.playCalled = false;
    this.pauseCalled = false;
  }

  play() {
    this.playCalled = true;
  }

  pause() {
    this.pauseCalled = true;
  }
}

function waitForEvent(element: HTMLElement, eventName: string, handler: (event: Event) => Promise<any>): Promise<any> {
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

describe("MusicControls custom element", () => {

  beforeAll(() => {
    MusicControls.define("music-controls");
  });

  beforeEach(() => {
    // vi.spyOn(element, "get").mockResolvedValue({ data: MOCk_DATA });

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

  it("MusicControls has the loading, play and pause SVGs", () => {
    document.body.innerHTML = `<music-controls></music-controls>`

    const ppbutton = document.getElementById("playpausebutton");
    expect(ppbutton, document.body.innerHTML).not.toBeNull();
    expect(ppbutton?.getAttribute("tabindex")).toBe("0");

    const spinner = document.getElementById("spinner");
    expect(spinner, document.body.innerHTML).not.toBeNull();
    expect(spinner?.style.display, document.body.innerHTML).toBe("none");
    
    const play = document.getElementById("play");
    expect(play, document.body.innerHTML).not.toBeNull();
    expect(play?.style.display, document.body.innerHTML).toBe("block");
    
    const pause = document.getElementById("pause");
    expect(pause, document.body.innerHTML).not.toBeNull();
    expect(pause?.style.display, document.body.innerHTML).toBe("none");

  });

  const handleAudioStarted = async (event: Event) => {
    // ... your logic ...
    return new Promise((resolve, reject) => {
      try {
        // Perform assertions
        expect((event as CustomEvent).detail).not.toBeNull;
  
        resolve(true); // Resolve if assertions pass
      } catch (error) {
        reject(error); // Reject if an assertion fails
      }
    });
  };
  

  // // https://www.the-koi.com/projects/vitest-how-to-assert-events/
  // it("play and pause work", async () => {
  //   const mockAudioElement = new MockHTMLMediaElement();
  //   // @ts-ignore
  //   vi.spyOn(window, 'HTMLMediaElement').mockImplementation(() => mockAudioElement);

  //   document.body.innerHTML = `<music-controls></music-controls>`
  //   const elem = document.querySelector('music-controls') as MusicControls;
  //   elem.addEventListener("music-controls-loading", handleAudioStarted);
  //   const waitingForPlay = waitForEvent(elem, "music-controls-playing", handleAudioStarted);
  //   elem?.playpause();
  //   const result = await waitingForPlay;
  //   expect(result).toBe(true); // Asserting the result
  // });



});

