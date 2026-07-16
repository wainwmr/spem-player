// Shared test utilities

import { vi } from "vitest";

export var expectedBar: any;
export var expectedChoir: any;
export var expectedPart: any;

const BASE_INTEGRATION_FIXTURE = `
  <div class="viewportDiv">
    <div id="backdrop"></div>
    <header class="header">
      <span class="title">Spem Player</span>
      <span id="info" class="tooltip"><span id="help-icon"></span></span>
      <div class="header-spacer"></div>
      <span id="recordinglabel"></span>
      <span id="recordingswitch"></span>
      <span id="scoreswitch"></span>
      <span id="darkswitch"></span>
    </header>
    <div id="help"></div>
    <div id="feedback-modal"></div>
    <div class="split-container">
      <music-score></music-score>
      <div class="splitter"></div>
      <music-canvas></music-canvas>
    </div>
    <div class="footer">
      <music-controls></music-controls>
      <music-canvas-watcher class="hide"></music-canvas-watcher>
    </div>
  </div>
`;

/**
 * Set up the shared jsdom fixture and bootstrap the app for integration tests.
 *
 * Importing `index.ts` IS the bootstrap: it registers the elements via their static
 * `define()` and calls `init()` at module scope, so nothing further needs to be
 * dispatched to start the app.
 *
 * The optional `configure` callback runs after the base fixture is injected and the
 * custom-element *modules* are imported, but before `index.ts` is imported. The
 * `<music-*>` elements are therefore not yet upgraded when `configure` runs, so
 * inject plain DOM here (the feedback modal, for example), not interactions with the
 * custom elements. Keeps the shared bootstrap in one place.
 */
export async function setupIntegrationFixture(
  configure?: () => void | Promise<void>
): Promise<void> {
  // Re-evaluate index.ts and the element modules fresh for this test file: their
  // top-level define() and app wiring must run again, not reuse a cached module
  // graph left by a prior file in the same worker.
  vi.resetModules();

  // jsdom implements neither a real requestAnimationFrame scheduler nor
  // scrollTo; stub both so app code that schedules a frame or scrolls during
  // bootstrap does not throw.
  vi.spyOn(window, "requestAnimationFrame").mockReturnValue(0);
  if (!HTMLElement.prototype.scrollTo) {
    HTMLElement.prototype.scrollTo = () => {};
  }

  document.body.innerHTML = BASE_INTEGRATION_FIXTURE;

  await import("../ts/MusicCanvas");
  await import("../ts/MusicScore");
  await import("../ts/MusicControls");
  await import("../ts/MusicCanvasWatcher");

  if (configure) {
    await configure();
  }

  // jsdom has no real media playback; stub play/pause before index.ts wires the
  // app, so app code and tests can drive playback without errors.
  vi.spyOn(HTMLMediaElement.prototype, "play").mockResolvedValue(undefined);
  vi.spyOn(HTMLMediaElement.prototype, "pause").mockReturnThis();

  await import("../../index.ts");
}

/**
 * Wait for a custom event on an element, run a handler, and resolve
 * with the handler's result.
 */
export function waitForEvent(
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
        resolve(result);
      } catch (error) {
        reject(error);
      } finally {
        element.removeEventListener(eventName, eventListener, false);
      }
    };
    element.addEventListener(eventName, eventListener, false);
  });
}
