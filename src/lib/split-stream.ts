import type Stream from "node:stream";
import { Transform } from "node:stream";
import { StringDecoder } from "node:string_decoder";

const kLast = Symbol("last");
const kDecoder = Symbol("decoder");

function push(self: SplitStream, val: unknown): void {
  if (val !== undefined) {
    self.push(val);
  }
}

function transform(
  this: SplitStream,
  chunk: unknown,
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

  this[kLast] = list.pop();

  for (let i = 0; i < list.length; i++) {
    try {
      push(this, this.mapper(list[i]));
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

function flush(this: SplitStream, callback: Stream.TransformCallback) {
  // forward any gibberish left in there
  this[kLast] += this[kDecoder].end();

  if (this[kLast]) {
    try {
      push(this, this.mapper(this[kLast]));
    } catch (error) {
      return callback(error);
    }
  }

  callback();
}

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
    options.transform = transform;
    options.flush = flush;
    options.readableObjectMode = true;

    const stream: this = new Transform(options);

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
}

export default SplitStream;
