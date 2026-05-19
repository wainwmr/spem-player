import { waitForEvent } from "./helpers";

describe("test helpers", () => {
  it("waitForEvent resolves when the event fires", async () => {
    const elem = document.createElement("div");
    const promise = waitForEvent(elem, "test-event", async () => "handled");
    elem.dispatchEvent(new Event("test-event", { bubbles: true }));
    const result = await promise;
    expect(result).toBe("handled");
  });
});
