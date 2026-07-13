import { MusicControls } from "../ts/MusicControls";
import config from "../ts/config";
import { barCount } from "../ts/lilyData";
import playSVG from "../icons/play.svg?raw";
import pauseSVG from "../icons/pause.svg?raw";
import {
  expectedBar,
  expectedChoir,
  expectedPart,
  waitForEvent,
} from "./helpers";

function matchesWildcard(pattern: string, str: string): boolean {
  const regex = new RegExp("^" + pattern.replace(/\*/g, ".*") + "$");
  return regex.test(str);
}

describe("MusicControls custom element", () => {
  beforeAll(() => {
    MusicControls.define("music-controls");

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
    expect(
      Array.from(choirs!.querySelectorAll("option")).map((o) => o.textContent)
    ).toEqual(config.choirs[0]);

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

  it("setRecording updates choir dropdown labels", () => {
    const elem = document.querySelector("music-controls") as MusicControls;
    const choir = document.getElementById("choir-select") as HTMLSelectElement;

    // Default recording is 0 (ALC)
    const options0 = Array.from(choir.querySelectorAll("option"));
    expect(options0.map((o) => o.textContent)).toEqual(config.choirs[0]);

    // Switch to recording 1 (CotE)
    elem.setRecording(1);

    const options1 = Array.from(choir.querySelectorAll("option"));
    expect(options1.map((o) => o.textContent)).toEqual(config.choirs[1]);
  });

  it("setRecording rebuilds choir dropdown labels when switching back (#398)", () => {
    const elem = document.querySelector("music-controls") as MusicControls;
    const choir = document.getElementById("choir-select") as HTMLSelectElement;

    // Switch away to recording 1 (CotE), then back to recording 0 (ALC)
    elem.setRecording(1);
    expect(
      Array.from(choir.querySelectorAll("option")).map((o) => o.textContent)
    ).toEqual(config.choirs[1]);

    elem.setRecording(0);

    // Labels must return to recording 0, not stay stale on recording 1
    expect(
      Array.from(choir.querySelectorAll("option")).map((o) => o.textContent)
    ).toEqual(config.choirs[0]);
  });

  it("setRecording preserves selected choir index", () => {
    const elem = document.querySelector("music-controls") as MusicControls;
    const choir = document.getElementById("choir-select") as HTMLSelectElement;

    // Set choir to 3
    elem.setAttribute("choir", "3");
    expect(choir.value).toBe("3");

    // Switch recording
    elem.setRecording(1);

    // Selection preserved
    expect(choir.value).toBe("3");
    // Label updated
    const options = Array.from(choir.querySelectorAll("option"));
    expect(options[3].textContent).toBe(config.choirs[1][3]);
  });

  it("MusicControls has the loading, play and pause SVGs", () => {
    const ppbutton = document.getElementById("playpausebutton");
    expect(ppbutton, document.body.innerHTML).not.toBeNull();
    expect(ppbutton?.tagName).toBe("BUTTON");
    expect(ppbutton?.getAttribute("aria-label")).toBe("Play or pause");

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

  it("play and pause icons are in-house, with no third-party attribution (#643)", () => {
    for (const [name, svg] of [
      ["play", playSVG],
      ["pause", pauseSVG],
    ] as const) {
      // Compliance: the source icons must not carry third-party (SVG Repo) provenance.
      expect(svg.toLowerCase(), `${name} attribution`).not.toContain("svgrepo");
      expect(svg.toLowerCase(), `${name} attribution`).not.toContain(
        "svg repo"
      );
      // The sibling DOM tests locate these via getElementById("play"/"pause"), so
      // the id must survive (MusicControls itself toggles the parsed <svg> refs).
      expect(svg, `${name} id`).toContain(`id="${name}"`);
    }
  });

  const handleAudioStarted = async (event: Event) => {
    // ... your logic ...
    return new Promise((resolve, reject) => {
      try {
        // Perform assertions
        expect((event as CustomEvent).detail).not.toBeNull();

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
    const maxBar = barCount > 0 ? barCount : 0;
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

  it("audio ended event pauses playback and resets UI (#402)", async () => {
    const elem = document.querySelector("music-controls") as MusicControls;
    const play = document.getElementById("play");
    const pause = document.getElementById("pause");

    const waitingForPlay = waitForEvent(
      elem,
      "music-controls-playing",
      handleAudioStarted
    );
    elem.setAttribute("playing", "true");
    await waitingForPlay;
    expect(elem.isPlaying()).toBe(true);
    expect(pause?.style.display).toBe("block");

    // Dispatch ended event
    elem.audio.dispatchEvent(new Event("ended"));

    expect(elem.isPlaying()).toBe(false);
    expect(play?.style.display).toBe("block");
    expect(pause?.style.display).toBe("none");
  });

  it("pause() cancels the active rAF loop (#402)", async () => {
    const elem = document.querySelector("music-controls") as MusicControls;
    const cancelSpy = vi.spyOn(window, "cancelAnimationFrame");

    const waitingForPlay = waitForEvent(
      elem,
      "music-controls-playing",
      handleAudioStarted
    );
    elem.setAttribute("playing", "true");
    await waitingForPlay;

    const waitingForPause = waitForEvent(
      elem,
      "music-controls-paused",
      handleAudioStarted
    );
    elem.pause();
    await waitingForPause;

    expect(cancelSpy).toHaveBeenCalled();

    cancelSpy.mockRestore();
  });

  // #764: while a new file is loading, play() holds playing=false across the
  // await, so a control change arriving mid-load sees isPlaying()===false and is
  // dropped; audio then resumes on the stale file. The fix adds an in-flight
  // signal (reload guards fire during a load) and a generation counter (a stale
  // play() resolution no-ops).
  describe("play() load-window race (#764)", () => {
    // A deferred play() mock we settle by hand, so the load window can be held
    // open across further control changes. In a real browser a play() promise
    // whose load is interrupted by a new load()/pause() REJECTS with AbortError,
    // so both a resolve and a reject handle are exposed per call.
    let playResolvers: Array<() => void>;
    let playRejecters: Array<(reason?: unknown) => void>;

    beforeEach(() => {
      playResolvers = [];
      playRejecters = [];
      vi.spyOn(HTMLMediaElement.prototype, "play").mockImplementation(
        () =>
          new Promise<void>((resolve, reject) => {
            playResolvers.push(resolve);
            playRejecters.push(reject);
          })
      );
    });

    afterEach(() => {
      // Re-apply the suite-wide immediate stub for later tests. mockRestore()
      // would expose the real (jsdom-unimplemented) play(), so re-stub instead.
      vi.spyOn(HTMLMediaElement.prototype, "play").mockReturnThis();
    });

    // Put the element in a loaded, playing choir-part state without opening a
    // load window (a choir-part file, not default.mp3, so a later change reloads).
    function loadedAndPlaying(elem: MusicControls): void {
      elem.setPart(0); // Soprano
      elem.setChoir(0); // Choir 1
      elem.audio.src = "http://localhost/audio/ALC/Choir%201-Soprano.mp3";
      elem.playing = true;
    }

    const last = <T>(a: T[]): T => a[a.length - 1];

    it("a control change during the load window reloads the latest selection", async () => {
      const elem = document.querySelector("music-controls") as MusicControls;
      loadedAndPlaying(elem);
      let playingEvents = 0;
      elem.addEventListener("music-controls-playing", () => playingEvents++);

      // Choir 2: a new file, so play() opens the load window and awaits.
      elem.setChoir(1);
      await Promise.resolve();
      expect(playResolvers.length).toBe(1);

      // Choir 3 arrives mid-load. Without the fix, playing===false drops it and
      // audio stays on Choir 2.
      elem.setChoir(2);
      await Promise.resolve();
      expect(decodeURIComponent(elem.audio.src)).toContain("Choir 3-Soprano");

      // Resolve the STALE load alone: the generation guard must swallow it, so
      // no state flip while the newer call is still pending. (Resolving both
      // would pass whether or not the guard exists, so this isolates it.)
      playResolvers[0]();
      await Promise.resolve();
      expect(elem.playing).toBe(false);
      expect(playingEvents).toBe(0);

      // The latest load resolving is the one that flips state.
      last(playResolvers)();
      await Promise.resolve();
      expect(elem.playing).toBe(true);
      expect(playingEvents).toBe(1);

      elem.pause();
    });

    it("a superseded load REJECTING (AbortError) does not disturb the newer call", async () => {
      const elem = document.querySelector("music-controls") as MusicControls;
      const spinner = document.getElementById("spinner");
      const play = document.getElementById("play");
      loadedAndPlaying(elem);

      elem.setChoir(1); // opens the load window (stale call)
      await Promise.resolve();
      elem.setChoir(2); // supersedes mid-load (newer call)
      await Promise.resolve();

      // The stale play() rejects, as the browser aborts it on the new load. The
      // catch's generation guard must leave the newer call's loading UI alone.
      playRejecters[0](new DOMException("aborted", "AbortError"));
      await Promise.resolve();
      expect(elem.playing).toBe(false);
      expect(spinner?.style.display).toBe("block");
      expect(play?.style.display).toBe("none");

      // The newer load then resolves and takes over cleanly.
      last(playResolvers)();
      await Promise.resolve();
      expect(elem.playing).toBe(true);

      elem.pause();
    });

    it("the current load REJECTING resets to the play icon", async () => {
      const elem = document.querySelector("music-controls") as MusicControls;
      const play = document.getElementById("play");
      loadedAndPlaying(elem);

      elem.setChoir(1); // opens the load window (no supersession)
      await Promise.resolve();

      // The one in-flight (current-generation) play rejects, e.g. autoplay
      // blocked: the UI resets to the play icon and playing stays false.
      last(playRejecters)(new DOMException("blocked", "NotAllowedError"));
      await Promise.resolve();
      expect(elem.playing).toBe(false);
      expect(play?.style.display).toBe("block");
    });

    it("rapid changes during the load window land on the latest selection", async () => {
      const elem = document.querySelector("music-controls") as MusicControls;
      loadedAndPlaying(elem);

      elem.setPart(1); // Alto: opens the load window
      await Promise.resolve();
      elem.setPart(2); // Tenor
      elem.setPart(3); // Baritone, in quick succession
      await Promise.resolve();

      expect(decodeURIComponent(elem.audio.src)).toContain("Choir 1-Baritone");

      last(playResolvers)();
      await Promise.resolve();
      expect(elem.playing).toBe(true);

      elem.pause();
    });

    it("a recording change during the load window reloads the latest selection", async () => {
      const elem = document.querySelector("music-controls") as MusicControls;
      loadedAndPlaying(elem);

      elem.setChoir(1); // opens the load window on ALC
      await Promise.resolve();
      elem.setRecording(1); // CotE arrives mid-load
      await Promise.resolve();

      expect(decodeURIComponent(elem.audio.src)).toContain("/CotE/");

      last(playResolvers)();
      await Promise.resolve();
      expect(elem.playing).toBe(true);

      elem.pause();
    });

    it("a control change while paused and idle does not start playback", async () => {
      const elem = document.querySelector("music-controls") as MusicControls;
      // Fresh element: not playing, not loading. #intendsToPlay() is false, so
      // the reload guard must not fire and no play() may run.
      elem.setChoir(1);
      await Promise.resolve();
      expect(playResolvers.length).toBe(0);
      expect(elem.playing).toBe(false);
    });

    it("shows the loading icon for the duration of the load window", async () => {
      const elem = document.querySelector("music-controls") as MusicControls;
      const spinner = document.getElementById("spinner");
      const play = document.getElementById("play");
      loadedAndPlaying(elem);

      elem.setChoir(1); // opens the load window
      await Promise.resolve();
      expect(spinner?.style.display).toBe("block");
      expect(play?.style.display).toBe("none");

      last(playResolvers)();
      await Promise.resolve();
      const pause = document.getElementById("pause");
      expect(pause?.style.display).toBe("block");

      elem.pause();
    });

    it("pause during the load window cancels the pending play", async () => {
      const elem = document.querySelector("music-controls") as MusicControls;
      const play = document.getElementById("play");
      loadedAndPlaying(elem);

      elem.setChoir(1); // opens the load window
      await Promise.resolve();

      elem.pause();
      // The in-flight play() resolving after pause must not resume playback.
      playResolvers[0]();
      await Promise.resolve();

      expect(elem.playing).toBe(false);
      expect(play?.style.display).toBe("block");
    });

    it("a control change after a mid-load pause does not restart playback", async () => {
      const elem = document.querySelector("music-controls") as MusicControls;
      loadedAndPlaying(elem);

      elem.setChoir(1); // opens the load window
      await Promise.resolve();
      elem.pause(); // clears #loading as well as bumping the generation

      // #intendsToPlay() must now be false, so a later control change starts no
      // new play(). If pause() left #loading true, this would silently restart
      // the playback the user just paused.
      elem.setChoir(2);
      await Promise.resolve();
      expect(playResolvers.length).toBe(1); // no second load window opened
      expect(elem.playing).toBe(false);
    });
  });
});
