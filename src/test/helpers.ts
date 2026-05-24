// Shared test utilities

export var expectedBar: any;
export var expectedChoir: any;
export var expectedPart: any;

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
