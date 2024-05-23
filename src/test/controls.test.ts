import { MusicControls } from '../ts/MusicControls';
import config from '../ts/config'

var expectedBar: any;
var expectedChoir: any;
var expectedPart: any;

// A helper function that allows us to detect events on element
// of type eventName have been fired
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

describe("MusicControls custom element", () => {

  beforeAll(() => {
    MusicControls.define("music-controls");

    // mock the Media element so we know if it's being played
    vi.spyOn(HTMLMediaElement.prototype, "load").mockReturnThis()
    vi.spyOn(HTMLMediaElement.prototype, "play").mockReturnThis();
    vi.spyOn(HTMLMediaElement.prototype, "pause").mockReturnThis();
  });

  beforeEach(() => {
    document.body.innerHTML = `<music-controls></music-controls>`
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
  it("play and pause buttons starts/stop media and fires the correct events", async () => {
    const elem = document.querySelector('music-controls') as MusicControls;
    const spinner = document.getElementById("spinner");
    const play = document.getElementById("play");
    const pause = document.getElementById("pause");

    // set up the listeners for loading and playing
    const waitingforLoad = waitForEvent(elem, "music-controls-loading", handleAudioStarted);
    const waitingForPlay = waitForEvent(elem, "music-controls-playing", handleAudioStarted);
    // 'press' the play button
    elem?.playpause();
    // Wait for the loading and playing events to be fired
    const playResult = await Promise.all([waitingforLoad, waitingForPlay]);
    expect(playResult).toStrictEqual([true, true]); // Asserting the result
    // Media event functions should have been called
    expect(HTMLMediaElement.prototype.load).toHaveBeenCalledOnce();
    expect(HTMLMediaElement.prototype.play).toHaveBeenCalledOnce();
    // Correct icon should be shown
    expect(spinner?.style.display, document.body.innerHTML).toBe("none");
    expect(play?.style.display, document.body.innerHTML).toBe("none");
    expect(pause?.style.display, document.body.innerHTML).toBe("block");
    // Correct music should be playing
    expect(elem.isSameAudio("default.mp3")).toBe(true);


    // set up the listeners for paused event
    const waitingforPause = waitForEvent(elem, "music-controls-paused", handleAudioStarted);
    // 'press' the pause button
    elem?.playpause();
    // Wait for the loading and playing events to be fired
    const pauseResult = await waitingforPause;
    expect(pauseResult).toBe(true);
    // Media event function should have been called
    expect(HTMLMediaElement.prototype.pause).toHaveBeenCalledOnce();
    // Correct icon should be shown
    expect(spinner?.style.display, document.body.innerHTML).toBe("none");
    expect(play?.style.display, document.body.innerHTML).toBe("block");
    expect(pause?.style.display, document.body.innerHTML).toBe("none");

  });

  it("Changing choirs results in correct event being fired", async () => {
    const elem = document.querySelector('music-controls') as MusicControls;
    const choir = document.getElementById('choir-select') as HTMLSelectElement;
    expect(choir).not.toBeNull();

    // default choir is 1
    expect(elem.choir).toBe(0);

    // change the choir to choir 3
    var waitingforChange = waitForEvent(elem, "music-controls-changed", handleChange, 0);
    elem.setAttribute("choir", "2");
    expect(elem.choir).toBe(2);
    // Wait for the loading and playing events to be fired
    var changeResult = await waitingforChange;
    expect(changeResult).toBe(true);

    // change the choir to choir 5
    waitingforChange = waitForEvent(elem, "music-controls-changed", handleChange, 4);
    elem.setAttribute("choir", "4");
    expect(elem.choir).toBe(4);
    // Wait for the loading and playing events to be fired
    changeResult = await waitingforChange;
    expect(changeResult).toBe(true);
  });

  const handleChange = async (event: Event) => {
    // ... your logic ...
    return new Promise((resolve, reject) => {
      try {
        // Perform assertions
        const d = (event as CustomEvent).detail;
        expect(d).not.toBeNull();
        if (expectedChoir) expect(d.position.choir).toBe(expectedChoir);
        if (expectedPart) expect(d.position.part).toBe(expectedPart);
        if (expectedBar) expect(d.position.bar).toBe(expectedBar);

        resolve(true); // Resolve if assertions pass
      } catch (error) {
        reject(error); // Reject if an assertion fails
      }
    });
  };

  it("Changing parts results in correct event being fired", async () => {
    const elem = document.querySelector('music-controls') as MusicControls;
    const part = document.getElementById('part-select') as HTMLSelectElement;
    expect(part).not.toBeNull();

    // default part is all
    expect(elem.voicePart).toBe("all");

    // set up the listeners for paused event
    var waitingforChange = waitForEvent(elem, "music-controls-changed", handleChange, undefined, 1);

    // change the part to Alto
    elem.setAttribute("part", "1");

    expect(elem.voicePart).toBe(1);
    // Wait for the loading and playing events to be fired
    var changeResult = await waitingforChange;
    expect(changeResult).toBe(true);

    // change the part to All
    var waitingforChange = waitForEvent(elem, "music-controls-changed", handleChange, undefined, "all");
    elem.setAttribute("part", "all");
    expect(elem.voicePart).toBe("all");
    // Wait for the loading and playing events to be fired
    changeResult = await waitingforChange;
    expect(changeResult).toBe(true);
  });

  it("Changing bars results in correct event being fired", async () => {
    const elem = document.querySelector('music-controls') as MusicControls;
    const bar = document.getElementById('bar-field') as HTMLInputElement;
    expect(bar).not.toBeNull();

    // default bar is 0
    expect(elem.bar).toBe(0);

    // change to bar 40
    var waitingforChange = waitForEvent(elem, "music-controls-changed", handleChange, undefined, undefined, 40);
    elem.setAttribute("bar", "40");
    expect(elem.bar).toBe(40);
    var changeResult = await waitingforChange;
    expect(changeResult).toBe(true);

    // change the part to 120
    var waitingforChange = waitForEvent(elem, "music-controls-changed", handleChange, undefined, undefined, 120);
    elem.setAttribute("bar", "120");
    expect(elem.bar).toBe(120);
    // Wait for the loading and playing events to be fired
    changeResult = await waitingforChange;
    expect(changeResult).toBe(true);
  });

  it("getMP3filename works", () => {
    const elem = document.querySelector('music-controls') as MusicControls;
    expect(elem.getMP3filename()).toBe("/audio/default.mp3");
    elem.setChoir(2);
    elem.setPart(4);
    expect(elem.getMP3filename()).toBe("/audio/Choir 3-Bass.mp3");
  });

  it("play, change choirs, should still be playing", async () => {
    const elem = document.querySelector('music-controls') as MusicControls;
    const waitingForPlay = waitForEvent(elem, "music-controls-playing", handleAudioStarted);
    
    elem.setAttribute("playing", "true");
    // elem.play();
    var playResult = await waitingForPlay;
    expect(playResult).toStrictEqual(true);
    expect(elem.isPlaying()).toBe(true);
    
    elem.setChoir(3);
    expect(elem.isPlaying()).toBe(true);
  });

});

