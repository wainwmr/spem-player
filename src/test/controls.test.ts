import { MusicControls } from "../ts/MusicControls";
import config from "../ts/config";
import { processLilypond, barCount } from "../ts/lily";

var expectedBar: any;
var expectedChoir: any;
var expectedPart: any;

// A helper function that allows us to detect events on element
// of type eventName have been fired
function waitForEvent(
  element: HTMLElement,
  eventName: string,
  handler: (event: Event) => Promise<any>,
  c?: any,
  p?: any,
  b?: any
): Promise<any> {
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

function matchesWildcard(pattern: string, str: string): boolean {
  const regex = new RegExp("^" + pattern.replace(/\*/g, ".*") + "$");
  return regex.test(str);
}

describe("MusicControls custom element", () => {
  beforeAll(() => {
    MusicControls.define("music-controls");
    processLilypond();

    // mock the Media element so we know if it's being played
    vi.spyOn(HTMLMediaElement.prototype, "load").mockReturnThis();
    vi.spyOn(HTMLMediaElement.prototype, "play").mockReturnThis();
    vi.spyOn(HTMLMediaElement.prototype, "pause").mockReturnThis();
  });

  beforeEach(() => {
    document.body.innerHTML = `<music-controls></music-controls>`;
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
    expect(choirs?.querySelectorAll("option").length).toBe(
      config.choirs[0].length
    );

    const parts = document.getElementById("part-select");
    expect(parts).not.toBeNull();
    expect(parts?.getAttribute("name")).toBe("part");
    expect(parts?.querySelectorAll("option").length).toBe(
      config.parts.length + 1
    );

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
    const elem = document.querySelector("music-controls") as MusicControls;
    const spinner = document.getElementById("spinner");
    const play = document.getElementById("play");
    const pause = document.getElementById("pause");

    // set up the listeners for loading and playing
    const waitingforLoad = waitForEvent(
      elem,
      "music-controls-loading",
      handleAudioStarted
    );
    const waitingForPlay = waitForEvent(
      elem,
      "music-controls-playing",
      handleAudioStarted
    );
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
    expect(elem.isSameAudio("ALC/default.mp3")).toBe(true);

    // set up the listeners for paused event
    const waitingforPause = waitForEvent(
      elem,
      "music-controls-paused",
      handleAudioStarted
    );
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
    const elem = document.querySelector("music-controls") as MusicControls;
    const choir = document.getElementById("choir-select") as HTMLSelectElement;
    expect(choir).not.toBeNull();

    // default choir is 1
    expect(elem.choir).toBe(0);

    // change the choir to choir 3
    var waitingforChange = waitForEvent(
      elem,
      "music-controls-changed",
      handleChange,
      0
    );
    elem.setAttribute("choir", "2");
    expect(elem.choir).toBe(2);
    // Wait for the loading and playing events to be fired
    var changeResult = await waitingforChange;
    expect(changeResult).toBe(true);

    // change the choir to choir 5
    waitingforChange = waitForEvent(
      elem,
      "music-controls-changed",
      handleChange,
      4
    );
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
    const elem = document.querySelector("music-controls") as MusicControls;
    const part = document.getElementById("part-select") as HTMLSelectElement;
    expect(part).not.toBeNull();

    // default part is all
    expect(elem.voicePart).toBe("all");

    // set up the listeners for paused event
    var waitingforChange = waitForEvent(
      elem,
      "music-controls-changed",
      handleChange,
      undefined,
      1
    );

    // change the part to Alto
    elem.setAttribute("part", "1");

    expect(elem.voicePart).toBe(1);
    // Wait for the loading and playing events to be fired
    var changeResult = await waitingforChange;
    expect(changeResult).toBe(true);

    // change the part to All
    var waitingforChange = waitForEvent(
      elem,
      "music-controls-changed",
      handleChange,
      undefined,
      "all"
    );
    elem.setAttribute("part", "all");
    expect(elem.voicePart).toBe("all");
    // Wait for the loading and playing events to be fired
    changeResult = await waitingforChange;
    expect(changeResult).toBe(true);
  });

  it("Changing bars results in correct event being fired", async () => {
    const elem = document.querySelector("music-controls") as MusicControls;
    const bar = document.getElementById("bar-field") as HTMLInputElement;
    expect(bar).not.toBeNull();

    // default bar is 0
    expect(elem.bar).toBe(0);

    // change to bar 40
    var waitingforChange = waitForEvent(
      elem,
      "music-controls-changed",
      handleChange,
      undefined,
      undefined,
      40
    );
    elem.setAttribute("bar", "40");
    expect(elem.bar).toBe(40);
    var changeResult = await waitingforChange;
    expect(changeResult).toBe(true);

    // change the part to 120
    var waitingforChange = waitForEvent(
      elem,
      "music-controls-changed",
      handleChange,
      undefined,
      undefined,
      120
    );
    elem.setAttribute("bar", "120");
    expect(elem.bar).toBe(120);
    // Wait for the loading and playing events to be fired
    changeResult = await waitingforChange;
    expect(changeResult).toBe(true);
  });

  it("getMP3filename works", () => {
    const elem = document.querySelector("music-controls") as MusicControls;
    expect(matchesWildcard("/audio/*/default.mp3", elem.getMP3filename())).toBe(
      true
    );
    elem.setChoir(2);
    elem.setPart(4);
    expect(
      matchesWildcard("/audio/*/Choir 3-Bass.mp3", elem.getMP3filename())
    ).toBe(true);
  });

  it("play, change choirs, should still be playing", async () => {
    const elem = document.querySelector("music-controls") as MusicControls;
    const waitingForPlay = waitForEvent(
      elem,
      "music-controls-playing",
      handleAudioStarted
    );

    elem.setAttribute("playing", "true");
    // elem.play();
    var playResult = await waitingForPlay;
    expect(playResult).toStrictEqual(true);
    expect(elem.isPlaying()).toBe(true);

    elem.setChoir(3);
    expect(elem.isPlaying()).toBe(true);
  });

  it("setPlaying false pauses audio", async () => {
    const elem = document.querySelector("music-controls") as MusicControls;
    elem.playing = true;
    const waitingForPause = waitForEvent(
      elem,
      "music-controls-paused",
      handleAudioStarted
    );
    elem.setPlaying(false);
    const pauseResult = await waitingForPause;
    expect(pauseResult).toBe(true);
    expect(elem.isPlaying()).toBe(false);
  });

  it("changing select dropdowns fires change event", async () => {
    const elem = document.querySelector("music-controls") as MusicControls;
    const waitingforChange = waitForEvent(
      elem,
      "music-controls-changed",
      handleChange,
      2,
      1,
      10
    );
    const choir = document.getElementById("choir-select") as HTMLSelectElement;
    const part = document.getElementById("part-select") as HTMLSelectElement;
    const bar = document.getElementById("bar-field") as HTMLInputElement;
    choir.value = "2";
    part.value = "1";
    bar.value = "10";
    choir.dispatchEvent(new Event("change", { bubbles: true }));
    const changeResult = await waitingforChange;
    expect(changeResult).toBe(true);
  });

  it("adds control class to all interactive elements (#182)", () => {
    expect(
      document.getElementById("playpausebutton")?.classList.contains("control")
    ).toBe(true);
    expect(
      document.getElementById("choir-select")?.classList.contains("control")
    ).toBe(true);
    expect(
      document.getElementById("part-select")?.classList.contains("control")
    ).toBe(true);
    expect(
      document.getElementById("bar-field")?.classList.contains("control")
    ).toBe(true);
  });

  it("rejects letter keydown on bar input (#184)", () => {
    const bar = document.getElementById("bar-field") as HTMLInputElement;
    const event = new KeyboardEvent("keydown", { key: "d", bubbles: true });
    const preventDefaultSpy = vi.spyOn(event, "preventDefault");
    bar.dispatchEvent(event);
    expect(preventDefaultSpy).toHaveBeenCalled();
  });

  it("accepts digit keydown on bar input (#184)", () => {
    const bar = document.getElementById("bar-field") as HTMLInputElement;
    const event = new KeyboardEvent("keydown", { key: "5", bubbles: true });
    const preventDefaultSpy = vi.spyOn(event, "preventDefault");
    bar.dispatchEvent(event);
    expect(preventDefaultSpy).not.toHaveBeenCalled();
  });

  it("sanitises non-numeric bar input to 0 on change (#184)", async () => {
    const elem = document.querySelector("music-controls") as MusicControls;
    const bar = document.getElementById("bar-field") as HTMLInputElement;
    bar.value = "4d";
    bar.dispatchEvent(new Event("change", { bubbles: true }));
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(elem.bar).toBe(0);
    expect(bar.value).toBe("0");
  });

  it("clamps out-of-range bar input to max on change (#184)", async () => {
    const elem = document.querySelector("music-controls") as MusicControls;
    const bar = document.getElementById("bar-field") as HTMLInputElement;
    const maxBar = barCount > 0 ? barCount - 1 : 0;
    bar.value = "999";
    bar.dispatchEvent(new Event("change", { bubbles: true }));
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(elem.bar).toBe(maxBar);
    expect(bar.value).toBe(String(maxBar));
  });

  it("clamps negative bar input to 0 on change (#184)", async () => {
    const elem = document.querySelector("music-controls") as MusicControls;
    const bar = document.getElementById("bar-field") as HTMLInputElement;
    bar.value = "-5";
    bar.dispatchEvent(new Event("change", { bubbles: true }));
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(elem.bar).toBe(0);
    expect(bar.value).toBe("0");
  });

  it("handles empty bar input as 0 on change (#184)", async () => {
    const elem = document.querySelector("music-controls") as MusicControls;
    const bar = document.getElementById("bar-field") as HTMLInputElement;
    bar.value = "";
    bar.dispatchEvent(new Event("change", { bubbles: true }));
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(elem.bar).toBe(0);
    expect(bar.value).toBe("0");
  });

  it("calling play() while already playing does not start a duplicate rAF loop", async () => {
    const elem = document.querySelector("music-controls") as MusicControls;

    // Capture all requestAnimationFrame callbacks
    const rafCallbacks: Array<(time: number) => void> = [];
    const originalRAF = window.requestAnimationFrame;
    window.requestAnimationFrame = (callback: (time: number) => void) => {
      rafCallbacks.push(callback);
      return rafCallbacks.length;
    };

    // Start playback (schedules the first loop)
    const waitingForPlay = waitForEvent(
      elem,
      "music-controls-playing",
      handleAudioStarted
    );
    elem.setAttribute("playing", "true");
    await waitingForPlay;

    // Call play() again, as setChoir/setPart/setRecording would
    await elem.play();

    // Count music-controls-changed events when running captured callbacks
    let _eventCount = 0;
    const countListener = () => {
      _eventCount++;
    };
    elem.addEventListener("music-controls-changed", countListener);

    // Run each captured callback once
    rafCallbacks.forEach((cb) => cb(0));

    // Before the fix: two loops fire, so two events
    // After the fix: one loop fires, so one event
    expect(_eventCount).toBe(1);

    // Cleanup
    elem.removeEventListener("music-controls-changed", countListener);
    window.requestAnimationFrame = originalRAF;
  });

  it("pausing after duplicate play() clears all loops without zombies", async () => {
    const elem = document.querySelector("music-controls") as MusicControls;

    const rafCallbacks: Array<(time: number) => void> = [];
    const originalRAF = window.requestAnimationFrame;
    window.requestAnimationFrame = (callback: (time: number) => void) => {
      rafCallbacks.push(callback);
      return rafCallbacks.length;
    };

    // Start playback and duplicate the loop
    const waitingForPlay = waitForEvent(
      elem,
      "music-controls-playing",
      handleAudioStarted
    );
    elem.setAttribute("playing", "true");
    await waitingForPlay;
    await elem.play();

    // Pause
    const waitingForPause = waitForEvent(
      elem,
      "music-controls-paused",
      handleAudioStarted
    );
    elem.pause();
    await waitingForPause;

    // Run all captured callbacks that were scheduled before or during pause
    const callbacksBeforeRun = rafCallbacks.length;
    let _eventCount = 0;
    const countListener = () => {
      _eventCount++;
    };
    elem.addEventListener("music-controls-changed", countListener);
    rafCallbacks.forEach((cb) => cb(0));

    // After pause, no loop should reschedule itself, so the callback count
    // should not grow beyond what existed before the run
    expect(rafCallbacks.length).toBe(callbacksBeforeRun);
    expect(elem.isPlaying()).toBe(false);

    elem.removeEventListener("music-controls-changed", countListener);
    window.requestAnimationFrame = originalRAF;
  });

  it("play() rejection resets the button to the play icon", async () => {
    const elem = document.querySelector("music-controls") as MusicControls;
    const spinner = document.getElementById("spinner");
    const play = document.getElementById("play");
    const pause = document.getElementById("pause");

    // Override the play mock to reject (autoplay blocked)
    vi.mocked(HTMLMediaElement.prototype.play).mockRejectedValueOnce(
      new DOMException("NotAllowedError", "NotAllowedError")
    );

    // Call play() — the rejection is caught internally
    await elem.play();

    // After rejection: spinner hidden, play icon visible, pause hidden
    expect(spinner?.style.display, document.body.innerHTML).toBe("none");
    expect(play?.style.display, document.body.innerHTML).toBe("block");
    expect(pause?.style.display, document.body.innerHTML).toBe("none");

    // Internal state must be consistent
    expect(elem.isPlaying()).toBe(false);
  });

  it("audio ended event stops playback and fires paused event", async () => {
    const elem = document.querySelector("music-controls") as MusicControls;
    const rafCallbacks: Array<(time: number) => void> = [];
    const originalRAF = window.requestAnimationFrame;
    window.requestAnimationFrame = (callback: (time: number) => void) => {
      rafCallbacks.push(callback);
      return rafCallbacks.length;
    };

    // Start playback
    const waitingForPlay = waitForEvent(
      elem,
      "music-controls-playing",
      handleAudioStarted
    );
    elem.setAttribute("playing", "true");
    await waitingForPlay;

    // Dispatch ended event
    const waitingForPause = waitForEvent(
      elem,
      "music-controls-paused",
      handleAudioStarted
    );
    elem.audio.dispatchEvent(new Event("ended"));
    await waitingForPause;

    // Run all captured callbacks
    const callbacksBeforeRun = rafCallbacks.length;
    let _eventCount = 0;
    const countListener = () => {
      _eventCount++;
    };
    elem.addEventListener("music-controls-changed", countListener);
    rafCallbacks.forEach((cb) => cb(0));

    // After ended, no loop should reschedule itself
    expect(rafCallbacks.length).toBe(callbacksBeforeRun);
    expect(elem.isPlaying()).toBe(false);

    elem.removeEventListener("music-controls-changed", countListener);
    window.requestAnimationFrame = originalRAF;
  });
});
