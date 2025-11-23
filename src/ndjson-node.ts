import { EOL } from "node:os";
import Stream from "node:stream";

import SplitStream from "~/lib/split-stream";
import jsonstringify from "~/lib/json-stringify-safe";

const throughObj = (
  options?: Stream.TransformOptions,
  transform?: Stream.TransformOptions["transform"]
): Stream.Transform =>
  new Stream.Transform({
    objectMode: true,
    highWaterMark: 16,
    ...options,
    transform,
  });

export const stringify = (opts?: Stream.TransformOptions): Stream.Transform => {
  return throughObj(opts, (obj, _, callback) => {
    callback(null, jsonstringify(obj) + EOL);
  });
};

export const parse = (
  options?: { strict?: boolean } & Stream.TransformOptions
): Stream.Transform => {
  function parseRow(row: string): unknown {
    try {
      if (row) return JSON.parse(row);
    } catch {
      if (options?.strict) {
        throw new Error("Could not parse row " + row.slice(0, 50) + "...");
      }
    }
  }

  return new SplitStream(parseRow, options);
};
