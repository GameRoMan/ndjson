import { EOL } from "node:os";
import type Stream from "node:stream";

import { throughObj } from "~/lib/through2";
import SplitStream from "~/lib/split-stream";
import jsonstringify from "~/lib/json-stringify-safe";

export const stringify = (opts?: Stream.TransformOptions): Stream.Transform => {
  return throughObj(opts, (obj, _, callback) => {
    callback(null, jsonstringify(obj) + EOL);
  });
};

export const parse = (
  opts?: { strict?: boolean } & Stream.TransformOptions
): Stream.Transform => {
  function parseRow(row: string): unknown {
    try {
      if (row) return JSON.parse(row);
    } catch {
      if (opts?.strict) {
        throw new Error("Could not parse row " + row.slice(0, 50) + "...");
      }
    }
  }

  return new SplitStream(parseRow, opts);
};
