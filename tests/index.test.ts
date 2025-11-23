import { describe, it, expect } from "bun:test";

import os from "node:os";
import ConcatStream from "~/lib/concat-stream";

import * as ndjson from "~/ndjson-node";

describe("tests", () => {
  it(".parse", () => {
    const parser = ndjson.parse();
    parser.on("data", function (obj) {
      expect(obj.hello).toBe("world");
    });

    parser.write('{"hello": "world"}\n');
  });

  it(".parse twice", () => {
    const parser = ndjson.parse();
    parser.once("data", function (obj) {
      expect(obj.hello).toBe("world");
      parser.once("data", function (obj) {
        expect(obj.hola).toBe("mundo");
      });
    });

    parser.write('{"hello": "world"}\n{"hola": "mundo"}\n');
  });

  it(".parse - strict:true error", () => {
    const parser = ndjson.parse({ strict: true });
    const errorPromise = new Promise((_, reject) => {
      parser.once("error", reject);
      parser.once("data", () => expect.unreachable("should throw"));
    });
    parser.write('{"no":"json"\n');

    expect(errorPromise).rejects.toThrow(/Could not parse row/);
  });

  it(".parse - strict:true error event", () => {
    const parser = ndjson.parse({ strict: true });
    parser.on("error", (err) => expect(err).toBeInstanceOf(Error));
    try {
      parser.write('{"no":"json"\n');
    } catch {
      expect.unreachable("should not throw");
    }
  });

  it(".parse - strict:false error", () => {
    const parser = ndjson.parse({ strict: false });
    parser.once("data", function (data) {
      expect(data.json).toBe(true);
    });
    try {
      parser.write('{"json":false\n{"json":true}\n');
    } catch {
      expect.unreachable("should not throw");
    }
  });

  it(".stringify", () => {
    const serializer = ndjson.stringify();
    serializer.pipe(
      new ConcatStream(function (data) {
        expect(data).toBe('{"hello":"world"}' + os.EOL);
      })
    );
    serializer.write({ hello: "world" });
    serializer.end();
  });

  it(".stringify circular", () => {
    const serializer = ndjson.stringify();
    serializer.pipe(
      new ConcatStream(function (data) {
        expect(data).toBe('{"obj":"[Circular ~]"}' + os.EOL);
      })
    );
    const obj: any = {};
    obj.obj = obj;
    serializer.write(obj);
    serializer.end();
  });
});
