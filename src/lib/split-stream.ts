import type Stream from "node:stream";
import { Transform } from "node:stream";
import { StringDecoder } from "node:string_decoder";

const kLast = Symbol("last");
const kDecoder = Symbol("decoder");

interface SplitStreamOptions extends Stream.TransformOptions {
  maxLength?: number;
  skipOverflow?: boolean;
}

class SplitStream extends Transform {
  matcher: RegExp;
  mapper: (row: string) => unknown;
  overflow: boolean;
  skipOverflow: boolean;
  maxLength: number | undefined;
  [kLast]: string;
  [kDecoder]: StringDecoder;

  constructor(mapper: (row: string) => unknown, options?: SplitStreamOptions) {
    super();
    options = Object.assign({}, options);
    options.autoDestroy = true;
    options.transform = this.transform;
    options.flush = this.flush;
    options.readableObjectMode = true;

    const stream: SplitStream = new Transform(options);

    stream[kLast] = "";
    stream[kDecoder] = new StringDecoder("utf8");
    stream.matcher = /\r?\n/;
    stream.mapper = mapper;
    stream.maxLength = options.maxLength;
    stream.skipOverflow = options.skipOverflow || false;
    stream.overflow = false;
    stream._destroy = function (err, cb) {
      cb(err);
    };

    return stream;
  }

  flush(callback: Stream.TransformCallback): void {
    // Forward any gibberish left in there
    this[kLast] += this[kDecoder].end();

    if (this[kLast]) {
      try {
        const val = this.mapper(this[kLast]);
        if (val !== undefined) {
          this.push(val);
        }
      } catch (error) {
        return callback(error);
      }
    }

    callback();
  }

  transform(
    chunk: string,
    _encoding: BufferEncoding,
    callback: Stream.TransformCallback
  ): void {
    let list;
    if (this.overflow) {
      // Line buffer is full. Skip to start of next line.
      const buf = this[kDecoder].write(chunk);
      list = buf.split(this.matcher);

      if (list.length === 1) return callback(); // Line ending not found. Discard entire chunk.

      // Line ending found. Discard trailing fragment of previous line and reset overflow state.
      list.shift();
      this.overflow = false;
    } else {
      this[kLast] += this[kDecoder].write(chunk);
      list = this[kLast].split(this.matcher);
    }

    this[kLast] = list.pop()!;

    for (let i = 0; i < list.length; i++) {
      try {
        const val = this.mapper(list[i]!);
        if (val !== undefined) {
          this.push(val);
        }
      } catch (error) {
        return callback(error);
      }
    }

    this.overflow = this[kLast].length > this.maxLength;
    if (this.overflow && !this.skipOverflow) {
      callback(new Error("maximum buffer reached"));
      return;
    }

    callback();
  }
}

export default SplitStream;
