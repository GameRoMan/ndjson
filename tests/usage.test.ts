import { describe, it, expect } from "bun:test";

import { readStream } from "~/ndjson";

describe("tests", () => {
  it("should work", async () => {
    const received: any[] = [];

    const response = await fetch("https://lichess.org/api/tv/feed");

    let resolveDone: () => void;
    const done = new Promise<void>((res) => (resolveDone = res));

    const onMessage = (obj: unknown) => {
      received.push(obj);

      if (received.length >= 2) {
        resolveDone();
      }
    };

    readStream(onMessage)(response);

    await done;

    expect(received.length).toBeGreaterThanOrEqual(2);
    expect(received[0].t).toBe("featured");
  }, 5_000);
});
